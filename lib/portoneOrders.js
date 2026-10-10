// lib/portoneOrders.js
// Server-only: turns a PortOne paymentId into an activated purchase. Shared
// by the complete routes (buyer's browser) and the webhook (PortOne's
// server), so both paths run the exact same checks:
// 1. find our pending row by portone_payment_id,
// 2. re-fetch the payment from PortOne and require status PAID,
// 3. require PortOne's amount to equal the price we derive ourselves,
// 4. hand off to the idempotent activation function,
// 5. refund automatically if money was captured but step 3 or 4 failed.
import { supabase } from '@/lib/supabase';
import { getPayment, cancelPayment } from '@/lib/portone';
import { activatePremium, deactivatePayment, premiumPrice } from '@/lib/premiumActivation';
import { activatePlusTier, PLUS_TIER_AMOUNT } from '@/lib/tierActivation';

const AUTO_REFUND_REASON = '결제 처리 실패 자동 환불';

// Re-fetches the payment from PortOne. `charged` means money was actually
// captured, so any failure after this point must be refunded.
async function verifyPaid(paymentId, expectedAmount) {
  const payment = await getPayment(paymentId);
  if (!payment.ok) return { ok: false, error: 'payment_lookup_failed', retryable: true };
  if (payment.status !== 'PAID') return { ok: false, error: 'not_paid' };
  if (Number(payment.amount) !== Number(expectedAmount)) {
    return { ok: false, error: 'amount_mismatch', charged: true };
  }
  return { ok: true };
}

// PortOne captures before our checks run, so a buyer who was charged but
// didn't get the purchase is refunded right away. The guarded claim only
// matches if no other path (complete route vs. webhook) activated it.
async function autoRefundPremium(order, paymentId) {
  const { data: claimed } = await supabase
    .from('payment_request')
    .update({ refunded_at: new Date().toISOString() })
    .eq('id', order.id)
    .is('refunded_at', null)
    .or('admin_confirmed.is.null,admin_confirmed.eq.false')
    .select('id');
  if (!claimed || claimed.length === 0) return;

  const cancel = await cancelPayment(paymentId, AUTO_REFUND_REASON);
  if (!cancel.ok) {
    await supabase.from('payment_request').update({ refunded_at: null }).eq('id', order.id);
    console.error('PortOne auto-refund failed (premium)', paymentId, cancel);
    return;
  }
  // Clean up anything a half-finished activation left behind.
  await deactivatePayment({ paymentRequestId: order.id });
}

async function autoRefundPlus(paymentId) {
  const { data: claimed } = await supabase
    .from('payments')
    .update({ status: 'refunded' })
    .eq('portone_payment_id', paymentId)
    .eq('status', 'pending')
    .select('id');
  if (!claimed || claimed.length === 0) return;

  const cancel = await cancelPayment(paymentId, AUTO_REFUND_REASON);
  if (!cancel.ok) {
    await supabase.from('payments').update({ status: 'pending' }).eq('id', claimed[0].id).eq('status', 'refunded');
    console.error('PortOne auto-refund failed (plus)', paymentId, cancel);
  }
}

export async function completePremiumOrder(paymentId) {
  const { data: order, error } = await supabase
    .from('payment_request')
    .select('*')
    .eq('portone_payment_id', paymentId)
    .maybeSingle();
  if (error) return { ok: false, error: 'order_lookup_failed', retryable: true };
  if (!order) return { ok: false, error: 'order_not_found' };

  const subjects = order.subjects || [];
  const expectedAmount = premiumPrice(subjects.length, order.duration_months);
  if (!expectedAmount || Number(order.amount) !== expectedAmount) {
    // The row itself was tampered with; whatever PortOne charged is wrong.
    const verified = await verifyPaid(paymentId, order.amount);
    if (verified.ok || verified.charged) await autoRefundPremium(order, paymentId);
    return { ok: false, error: 'amount_mismatch' };
  }

  const verified = await verifyPaid(paymentId, expectedAmount);
  if (!verified.ok) {
    if (verified.charged) await autoRefundPremium(order, paymentId);
    return verified;
  }

  const result = await activatePremium({
    paymentId,
    teacherId: order.teacher_id,
    teacherName: order.name,
    subjects,
    durationMonths: order.duration_months,
    expectedAmount,
    paymentRequestId: order.id,
  });
  if (!result.ok) await autoRefundPremium(order, paymentId);
  return result;
}

export async function completePlusOrder(paymentId) {
  const { data: order, error } = await supabase
    .from('payments')
    .select('teacher_id, amount')
    .eq('portone_payment_id', paymentId)
    .maybeSingle();
  if (error) return { ok: false, error: 'order_lookup_failed', retryable: true };
  if (!order) return { ok: false, error: 'order_not_found' };

  const verified = await verifyPaid(paymentId, PLUS_TIER_AMOUNT);
  if (!verified.ok) {
    if (verified.charged) await autoRefundPlus(paymentId);
    return verified;
  }

  const result = await activatePlusTier({ paymentId, teacherId: order.teacher_id, amount: PLUS_TIER_AMOUNT });
  if (!result.ok) await autoRefundPlus(paymentId);
  return result;
}

// Webhook entry point: the paymentId alone says nothing about which
// purchase it was, so check which table holds it.
export async function completeOrderByPaymentId(paymentId) {
  const { data: premiumRow, error } = await supabase
    .from('payment_request')
    .select('id')
    .eq('portone_payment_id', paymentId)
    .maybeSingle();
  if (error) return { ok: false, error: 'order_lookup_failed', retryable: true };
  if (premiumRow) return completePremiumOrder(paymentId);
  return completePlusOrder(paymentId);
}
