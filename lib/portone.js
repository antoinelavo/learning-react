// lib/portone.js
// Server-side helpers for PortOne V2 (KG이니시스 card, later 카카오페이).
// Never import this from a client component — it reads PORTONE_API_SECRET.
//
// Flow: the client inserts a pending row keyed by its own paymentId, opens
// the PortOne window, and then (popup or mobile redirect) lands on a
// complete route. That route and the webhook never trust what the browser
// or webhook body says: they re-fetch the payment here and compare its
// status and amount against the DB row before activating anything.
import { PaymentClient, Webhook } from '@portone/server-sdk';

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

function client() {
  return PaymentClient({ secret: requireEnv('PORTONE_API_SECRET') });
}

// Returns { ok: true, status, amount } or { ok: false, error }.
export async function getPayment(paymentId) {
  try {
    const payment = await client().getPayment({ paymentId });
    return { ok: true, status: payment.status, amount: payment.amount?.total };
  } catch (err) {
    return { ok: false, error: err?.data?.type || err?.message || 'get_payment_failed' };
  }
}

// Full refund. A payment that is already cancelled counts as success, so a
// retry after a half-finished refund can still complete.
export async function cancelPayment(paymentId, reason) {
  try {
    await client().cancelPayment({ paymentId, reason });
    return { ok: true };
  } catch (err) {
    const type = err?.data?.type;
    if (type === 'PAYMENT_ALREADY_CANCELLED') return { ok: true, alreadyCancelled: true };
    return { ok: false, error: type || err?.message || 'cancel_failed' };
  }
}

// Verifies a webhook signature against the raw (unparsed) body. Returns the
// parsed webhook, or null if the signature is invalid.
export async function verifyWebhook(rawBody, headers) {
  try {
    return await Webhook.verify(requireEnv('PORTONE_WEBHOOK_SECRET'), rawBody, headers);
  } catch (err) {
    if (err instanceof Webhook.WebhookVerificationError || err instanceof Webhook.InvalidInputError) {
      return null;
    }
    throw err;
  }
}
