// lib/expediteActivation.js
// Idempotent confirmation logic for the "expedite profile review" payment.
// Unlike premium listing, there's no limited-slot check here — a
// successful payment just marks the pending expedite_requests row as
// paid so an admin knows to prioritize that teacher's review.
import { supabase } from '@/lib/supabase';

export async function activateExpediteRequest({ orderId, paymentId }) {
  const { data: existing, error: lookupError } = await supabase
    .from('expedite_requests')
    .select('*')
    .eq('order_id', orderId)
    .maybeSingle();

  if (lookupError || !existing) {
    return { ok: false, status: 404, error: 'order_not_found' };
  }

  if (existing.paid_at) {
    return { ok: true, alreadyProcessed: true };
  }

  // .is('paid_at', null) guards against the returnUrl handler and the
  // webhook racing to confirm the same order.
  const { error: updateError } = await supabase
    .from('expedite_requests')
    .update({ paid_at: new Date().toISOString(), payment_id: paymentId })
    .eq('order_id', orderId)
    .is('paid_at', null);

  if (updateError) {
    return { ok: false, status: 500, error: 'activation_failed' };
  }

  return { ok: true, alreadyProcessed: false };
}

export async function getExpediteRequestByOrderId(orderId) {
  return supabase.from('expedite_requests').select('*').eq('order_id', orderId).maybeSingle();
}
