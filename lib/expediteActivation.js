// lib/expediteActivation.js
// Idempotent confirmation logic for the "expedite profile review" payment,
// backed by the existing expedite_payments table (id uuid, payment_id,
// teacher_id, method, amount, status, requested_at, completed_at).
//
// expedite_payments has no dedicated order_id column, so the row's own
// `id` (a client-supplied uuid, generated when the payment is initiated)
// doubles as the NicePay `orderId` — that's how the server-side
// returnUrl/webhook handlers look up which request a payment belongs to.
import { supabase } from '@/lib/supabase';

export async function activateExpediteRequest({ orderId, paymentId }) {
  const { data: existing, error: lookupError } = await supabase
    .from('expedite_payments')
    .select('*')
    .eq('id', orderId)
    .maybeSingle();

  if (lookupError || !existing) {
    return { ok: false, status: 404, error: 'order_not_found' };
  }

  if (existing.status === 'completed') {
    return { ok: true, alreadyProcessed: true };
  }

  // .neq('status', 'completed') guards against the returnUrl handler and
  // the webhook racing to confirm the same payment.
  const { error: updateError } = await supabase
    .from('expedite_payments')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      payment_id: paymentId,
    })
    .eq('id', orderId)
    .neq('status', 'completed');

  if (updateError) {
    return { ok: false, status: 500, error: 'activation_failed' };
  }

  return { ok: true, alreadyProcessed: false };
}

export async function getExpediteRequestByOrderId(orderId) {
  return supabase.from('expedite_payments').select('*').eq('id', orderId).maybeSingle();
}
