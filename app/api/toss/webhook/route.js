// app/api/toss/webhook/route.js
//
// Reliability backstop for the successUrl flow: register this URL (event
// PAYMENT_STATUS_CHANGED) in Toss's developer center once you have an
// account. It fires independently of the buyer's browser, so it still
// confirms a payment even if the browser closes/loses connection right
// after paying. activatePremium() is idempotent, so it's safe for this and
// the successUrl handler to race for the same payment.
//
// Unlike NicePay's webhook, Toss's PAYMENT_STATUS_CHANGED event carries no
// signature to verify — so this never trusts the payload's status field
// directly. It only uses the payload as a prompt to re-fetch the real
// payment status from Toss's API with our secret key before acting on it.
import { supabase } from '@/lib/supabase';
import { getPaymentByOrderId } from '@/lib/toss';
import { activatePremium } from '@/lib/premiumActivation';

function ack() {
  return new Response('OK', { status: 200 });
}

export async function POST(request) {
  try {
    const payload = await request.json();
    const orderId = payload?.data?.orderId;

    if (!orderId) {
      return ack();
    }

    const { ok, data: payment } = await getPaymentByOrderId(orderId);
    if (!ok || payment.status !== 'DONE') {
      return ack();
    }

    const { data: order, error } = await supabase
      .from('payment_request')
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (error || !order) {
      console.error('Toss webhook: order not found for orderId', orderId);
      return ack();
    }

    const result = await activatePremium({
      paymentId: payment.paymentKey,
      teacherId: order.teacher_id,
      teacherName: order.name,
      subjects: order.subjects,
      durationMonths: order.duration_months,
      expectedAmount: order.amount,
    });

    if (!result.ok) {
      console.error('Toss webhook: activatePremium failed', result);
    }
  } catch (err) {
    console.error('Toss webhook: unhandled error', err);
  }

  return ack();
}
