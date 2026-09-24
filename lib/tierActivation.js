// lib/tierActivation.js
// Shared, idempotent business logic for activating a teacher's 플러스 tier
// (unlimited student_jobs contact reveals) after a Toss payment is
// confirmed. Mirrors lib/premiumActivation.js's shape for this repo's
// other Toss-backed purchase — called from both the success route and the
// webhook backstop, so a payment can only ever activate the tier once no
// matter which path confirms it first.
import { supabase } from '@/lib/supabase';

const PLUS_TIER_AMOUNT = 9000;

export async function activatePlusTier({ orderId, paymentKey, teacherId, amount }) {
  const { data: order, error: lookupError } = await supabase
    .from('payments')
    .select('id, status, amount')
    .eq('toss_order_id', orderId)
    .maybeSingle();

  if (lookupError || !order) {
    return { ok: false, status: 404, error: 'order_not_found' };
  }

  // Already processed? (covers the webhook firing after/alongside the
  // success redirect)
  if (order.status === 'paid') {
    return { ok: true, alreadyProcessed: true };
  }

  if (Number(amount) !== Number(PLUS_TIER_AMOUNT) || Number(amount) !== Number(order.amount)) {
    return { ok: false, status: 400, error: 'amount_mismatch' };
  }

  // `.eq('status', 'pending')` guards against a concurrent caller (success
  // route vs. webhook) already having flipped this row to 'paid' — if so,
  // this update simply matches zero rows rather than double-processing.
  const { data: updatedRows, error: paymentError } = await supabase
    .from('payments')
    .update({ status: 'paid', toss_payment_key: paymentKey })
    .eq('id', order.id)
    .eq('status', 'pending')
    .select('id');

  if (paymentError) {
    return { ok: false, status: 500, error: 'record_payment_failed' };
  }

  if (!updatedRows || updatedRows.length === 0) {
    // Lost the race to a concurrent caller — treat as a successful no-op.
    return { ok: true, alreadyProcessed: true };
  }

  const { error: tierError } = await supabase
    .from('teachers')
    .update({ tier: 'premium' })
    .eq('id', teacherId);

  if (tierError) {
    return { ok: false, status: 500, error: 'activate_tier_failed' };
  }

  return { ok: true, alreadyProcessed: false };
}
