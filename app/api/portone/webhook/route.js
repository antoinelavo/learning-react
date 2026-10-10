// app/api/portone/webhook/route.js
//
// Reliability backstop for the complete routes: it still activates a
// purchase if the buyer's browser closes right after paying. Register
// https://www.ibmaster.net/api/portone/webhook in the PortOne console
// (V2 webhook) and put its secret in PORTONE_WEBHOOK_SECRET.
//
// The signature is checked against the raw body. Even then the body is
// only a prompt: completeOrderByPaymentId re-fetches the payment from
// PortOne before acting, and activation is idempotent, so racing the
// complete route is safe.
import { verifyWebhook } from '@/lib/portone';
import { completeOrderByPaymentId } from '@/lib/portoneOrders';

export async function POST(request) {
  const rawBody = await request.text();
  const headers = Object.fromEntries(request.headers.entries());

  let webhook;
  try {
    webhook = await verifyWebhook(rawBody, headers);
  } catch (err) {
    console.error('PortOne webhook: verification error', err);
    return new Response('Server error', { status: 500 });
  }

  if (!webhook) {
    return new Response('Invalid signature', { status: 400 });
  }

  // 200 for everything except a transient lookup failure, which gets a 500
  // so PortOne retries. Other failures are final (and auto-refunded), so
  // they are only logged.
  try {
    if (webhook.type === 'Transaction.Paid') {
      const result = await completeOrderByPaymentId(webhook.data.paymentId);
      if (!result.ok) {
        console.error('PortOne webhook: activation failed', webhook.data.paymentId, result);
        if (result.retryable) return new Response('Retry', { status: 500 });
      }
    }
  } catch (err) {
    console.error('PortOne webhook: unhandled error', err);
    return new Response('Retry', { status: 500 });
  }

  return new Response('OK', { status: 200 });
}
