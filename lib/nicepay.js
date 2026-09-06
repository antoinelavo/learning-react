// lib/nicepay.js
// Server-side helper for NicePay's "server authorization" payment model.
// Docs: https://github.com/nicepayments/nicepay-manual
//
// Auth: Authorization: Basic base64(clientKey:secretKey)
// clientKey is public (used client-side as `clientId` in the JS SDK too);
// secretKey must stay server-only.
import crypto from 'crypto';

const NICEPAY_API_BASE = 'https://api.nicepay.co.kr';

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

function basicAuthHeader() {
  const clientKey = requireEnv('NEXT_PUBLIC_NICEPAY_CLIENT_KEY');
  const secretKey = requireEnv('NICEPAY_SECRET_KEY');
  const token = Buffer.from(`${clientKey}:${secretKey}`).toString('base64');
  return `Basic ${token}`;
}

function sha256Hex(input) {
  return crypto.createHash('sha256').update(input, 'utf8').digest('hex');
}

// yyyyMMddHHmmss, as NicePay's examples use for ediDate.
function ediDateNow() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

// Verifies the signature NicePay POSTs to returnUrl after the buyer
// authenticates: sha256(authToken + clientId + amount + secretKey).
export function verifyAuthResultSignature({ authToken, amount, signature }) {
  const clientKey = requireEnv('NEXT_PUBLIC_NICEPAY_CLIENT_KEY');
  const secretKey = requireEnv('NICEPAY_SECRET_KEY');
  const expected = sha256Hex(`${authToken}${clientKey}${amount}${secretKey}`);
  return expected === signature;
}

// Verifies a webhook payload: sha256(tid + amount + ediDate + secretKey).
export function verifyWebhookSignature({ tid, amount, ediDate, signature }) {
  const secretKey = requireEnv('NICEPAY_SECRET_KEY');
  const expected = sha256Hex(`${tid}${amount}${ediDate}${secretKey}`);
  return expected === signature;
}

// Approves (actually charges) an authenticated payment. Nothing is charged
// until this call succeeds with resultCode "0000".
export async function approvePayment(tid, amount) {
  const ediDate = ediDateNow();
  const secretKey = requireEnv('NICEPAY_SECRET_KEY');
  const signData = sha256Hex(`${tid}${amount}${ediDate}${secretKey}`);

  const res = await fetch(`${NICEPAY_API_BASE}/v1/payments/${tid}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json;charset=utf-8',
      Authorization: basicAuthHeader(),
    },
    body: JSON.stringify({ amount, ediDate, signData }),
  });
  const data = await res.json();
  return { ok: res.ok && data.resultCode === '0000', data };
}

// Cancels/refunds a previously approved payment (full or partial).
// For future admin/refund tooling.
export async function cancelPayment(tid, { reason, orderId, cancelAmt } = {}) {
  const ediDate = ediDateNow();
  const secretKey = requireEnv('NICEPAY_SECRET_KEY');
  const signData = sha256Hex(`${tid}${ediDate}${secretKey}`);

  const res = await fetch(`${NICEPAY_API_BASE}/v1/payments/${tid}/cancel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json;charset=utf-8',
      Authorization: basicAuthHeader(),
    },
    body: JSON.stringify({
      reason,
      orderId,
      ediDate,
      signData,
      ...(cancelAmt ? { cancelAmt } : {}),
    }),
  });
  const data = await res.json();
  return { ok: res.ok && data.resultCode === '0000', data };
}
