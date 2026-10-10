// lib/refunds.js
// Server-only full refunds for PortOne card purchases, triggered from the
// admin payment pages via app/api/portone/refund.
//
// Order of operations: claim the row first (a guarded paid → refunded
// update, so a double click refunds only once), then cancel at PortOne,
// then remove what the purchase granted. If PortOne refuses, the claim is
// rolled back so the admin can retry.
import { supabase } from '@/lib/supabase';
import { cancelPayment } from '@/lib/portone';
import { deactivatePayment } from '@/lib/premiumActivation';

const REFUND_REASON = '관리자 환불';

export async function refundPremiumPayment(paymentRequestId) {
  const { data: claimed, error: claimError } = await supabase
    .from('payment_request')
    .update({ refunded_at: new Date().toISOString() })
    .eq('id', paymentRequestId)
    .eq('admin_confirmed', true)
    .not('portone_payment_id', 'is', null)
    .is('refunded_at', null)
    .select('id, portone_payment_id');

  if (claimError) return { ok: false, status: 500, error: 'claim_failed' };
  if (!claimed || claimed.length === 0) return { ok: false, status: 409, error: 'not_refundable' };

  const cancel = await cancelPayment(claimed[0].portone_payment_id, REFUND_REASON);
  if (!cancel.ok) {
    await supabase.from('payment_request').update({ refunded_at: null }).eq('id', paymentRequestId);
    return { ok: false, status: 502, error: cancel.error };
  }

  // Money is back with the buyer at this point; a failure below only
  // leaves the listing active, which the admin can still remove by hand.
  const removed = await deactivatePayment({ paymentRequestId });
  if (!removed.ok) return { ok: true, warning: removed.error };

  return { ok: true };
}

export async function refundPlusPayment(paymentId) {
  const { data: claimed, error: claimError } = await supabase
    .from('payments')
    .update({ status: 'refunded' })
    .eq('id', paymentId)
    .eq('provider', 'portone')
    .eq('status', 'paid')
    .not('portone_payment_id', 'is', null)
    .select('id, teacher_id, portone_payment_id');

  if (claimError) return { ok: false, status: 500, error: 'claim_failed' };
  if (!claimed || claimed.length === 0) return { ok: false, status: 409, error: 'not_refundable' };

  const row = claimed[0];
  const cancel = await cancelPayment(row.portone_payment_id, REFUND_REASON);
  if (!cancel.ok) {
    await supabase.from('payments').update({ status: 'paid' }).eq('id', paymentId).eq('status', 'refunded');
    return { ok: false, status: 502, error: cancel.error };
  }

  // Same rule as undoPlusBankTransfer: stay 플러스 if another paid payment
  // still backs it.
  const { data: otherPaid, error: lookupError } = await supabase
    .from('payments')
    .select('id')
    .eq('teacher_id', row.teacher_id)
    .eq('status', 'paid')
    .limit(1);
  if (lookupError) return { ok: true, warning: 'deactivate_tier_failed' };
  if (otherPaid && otherPaid.length > 0) return { ok: true, tierKept: true };

  const { data: updated, error: tierError } = await supabase
    .from('teachers')
    .update({ tier: 'free' })
    .eq('id', row.teacher_id)
    .select('id');
  if (tierError || !updated || updated.length === 0) return { ok: true, warning: 'deactivate_tier_failed' };

  return { ok: true };
}
