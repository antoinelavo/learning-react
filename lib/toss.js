// lib/toss.js
// Server-side helpers for Toss Payments' "payment window" model.
// Docs: https://docs.tosspayments.com/en/api-guide
//
// Auth: Authorization: Basic base64(secretKey + ":") — only the secret key
// is used (with a trailing colon, no password), unlike NicePay's
// clientKey:secretKey pair.
const TOSS_API_BASE = 'https://api.tosspayments.com';

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

function basicAuthHeader() {
  const secretKey = requireEnv('TOSS_SECRET_KEY');
  const token = Buffer.from(`${secretKey}:`).toString('base64');
  return `Basic ${token}`;
}

// Confirms (actually charges) a payment the buyer authorized in the
// payment window. Nothing is charged until this call succeeds with
// status "DONE".
export async function confirmPayment({ paymentKey, orderId, amount }) {
  const res = await fetch(`${TOSS_API_BASE}/v1/payments/confirm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: basicAuthHeader(),
    },
    body: JSON.stringify({ paymentKey, orderId, amount }),
  });
  const data = await res.json();
  return { ok: res.ok && data.status === 'DONE', data };
}

// Looks up a payment's current status directly from Toss by orderId.
// Toss's PAYMENT_STATUS_CHANGED webhook carries no signature to verify
// (unlike NicePay's), so the webhook handler treats its payload only as a
// prompt to re-check here — it never trusts the webhook body's status
// field directly.
export async function getPaymentByOrderId(orderId) {
  const res = await fetch(`${TOSS_API_BASE}/v1/payments/orders/${encodeURIComponent(orderId)}`, {
    headers: { Authorization: basicAuthHeader() },
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

// Cancels/refunds a previously confirmed payment (full or partial).
// For future admin/refund tooling.
export async function cancelPayment(paymentKey, { cancelReason, cancelAmount } = {}) {
  const res = await fetch(`${TOSS_API_BASE}/v1/payments/${paymentKey}/cancel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: basicAuthHeader(),
    },
    body: JSON.stringify({
      cancelReason: cancelReason || '고객 요청',
      ...(cancelAmount ? { cancelAmount } : {}),
    }),
  });
  const data = await res.json();
  return { ok: res.ok, data };
}
