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

  // Security-definer RPC rather than a plain client update — this route
  // runs as the anon role with no forwarded user session, so a direct
  // update would depend on whatever RLS policy happens to exist on
  // teachers (unverified for this write path) and could silently affect 0
  // rows instead of erroring.
  const { error: tierError } = await supabase.rpc('activate_plus_tier', {
    p_teacher_id: teacherId,
  });

  if (tierError) {
    return { ok: false, status: 500, error: 'activate_tier_failed' };
  }

  return { ok: true, alreadyProcessed: false };
}

// Admin-side confirm for a 플러스 bank transfer (/admin/plus-payments).
// Bank-transfer rows never touch Toss, so there's no order/payment key to
// verify — the admin checking the bank account is the confirmation. The
// `.eq('status', 'pending')` guard keeps a double-click from processing
// the same row twice.
export async function confirmPlusBankTransfer({ paymentId, teacherId }) {
  const { data: updatedRows, error: paymentError } = await supabase
    .from('payments')
    .update({ status: 'paid' })
    .eq('id', paymentId)
    .eq('status', 'pending')
    .select('id');

  if (paymentError) {
    return { ok: false, error: 'record_payment_failed' };
  }

  if (!updatedRows || updatedRows.length === 0) {
    return { ok: true, alreadyProcessed: true };
  }

  const { error: tierError } = await supabase.rpc('activate_plus_tier', {
    p_teacher_id: teacherId,
  });

  if (tierError) {
    // Don't leave the row marked paid for a teacher who isn't 플러스.
    await supabase.from('payments').update({ status: 'pending' }).eq('id', paymentId);
    return { ok: false, error: 'activate_tier_failed' };
  }

  return { ok: true, alreadyProcessed: false };
}

// Undo of confirmPlusBankTransfer. Puts the row back to pending and drops
// the teacher to free — unless another paid payment still backs their 플러스
// tier. The teachers update runs from the admin's authenticated browser
// session, same as /admin/tiers' manual toggle.
export async function undoPlusBankTransfer({ paymentId, teacherId }) {
  const { data: resetRows, error: paymentError } = await supabase
    .from('payments')
    .update({ status: 'pending' })
    .eq('id', paymentId)
    .eq('status', 'paid')
    .select('id');

  if (paymentError) {
    return { ok: false, error: 'reset_payment_failed' };
  }

  if (!resetRows || resetRows.length === 0) {
    return { ok: true, alreadyProcessed: true };
  }

  // Only roll back a row this call itself reset.
  const restorePaid = () =>
    supabase.from('payments').update({ status: 'paid' }).eq('id', paymentId).eq('status', 'pending');

  const { data: otherPaid, error: lookupError } = await supabase
    .from('payments')
    .select('id')
    .eq('teacher_id', teacherId)
    .eq('status', 'paid')
    .limit(1);

  if (lookupError) {
    await restorePaid();
    return { ok: false, error: 'reset_payment_failed' };
  }

  if (otherPaid && otherPaid.length > 0) {
    return { ok: true, tierKept: true };
  }

  const { data: updatedTeachers, error: tierError } = await supabase
    .from('teachers')
    .update({ tier: 'free' })
    .eq('id', teacherId)
    .select('id');

  if (tierError || !updatedTeachers || updatedTeachers.length === 0) {
    await restorePaid();
    return { ok: false, error: 'deactivate_tier_failed' };
  }

  return { ok: true, tierKept: false };
}
