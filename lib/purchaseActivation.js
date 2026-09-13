// lib/purchaseActivation.js
// Shared, idempotent business logic for activating a resource purchase
// after a Toss payment is confirmed. Called from both the toss/resource-
// success returnUrl handler and the toss/resource-webhook handler, so a
// payment can only ever grant access once no matter which path confirms
// it first. Mirrors lib/premiumActivation.js.
import { supabase } from '@/lib/supabase';

// Marks a pending purchase row as paid. Idempotent: safe to call more than
// once for the same paymentKey (the returnUrl handler and the webhook can
// both race to call this for the same order).
export async function activatePurchase({ orderId, paymentKey, paidAmount }) {
  const { data: purchase, error: lookupError } = await supabase
    .from('purchases')
    .select('*')
    .eq('order_id', orderId)
    .single();

  if (lookupError || !purchase) {
    return { ok: false, status: 404, error: 'order_not_found' };
  }

  if (purchase.status === 'paid') {
    return { ok: true, alreadyProcessed: true, purchase };
  }

  if (Number(paidAmount) !== Number(purchase.price_krw)) {
    return { ok: false, status: 400, error: 'amount_mismatch' };
  }

  const { data: updated, error: updateError } = await supabase
    .from('purchases')
    .update({
      status: 'paid',
      payment_key: paymentKey,
      paid_at: new Date().toISOString(),
    })
    // Only flip it if it's still pending — guards the race between the
    // returnUrl handler and the webhook (whichever gets here first wins,
    // the other sees 0 rows updated and treats it as already processed).
    .eq('order_id', orderId)
    .eq('status', 'pending')
    .select()
    .maybeSingle();

  if (updateError) {
    return { ok: false, status: 500, error: 'activate_purchase_failed' };
  }

  if (!updated) {
    // Someone else won the race in between our lookup and update.
    return { ok: true, alreadyProcessed: true, purchase };
  }

  return { ok: true, alreadyProcessed: false, purchase: updated };
}
