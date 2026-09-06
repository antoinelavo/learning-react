// app/api/nicepay/expedite-webhook/route.js
//
// Reliability backstop for the expedite-review payment, mirroring
// app/api/nicepay/webhook/route.js. Register this URL in NicePay's
// merchant admin console alongside the premium listing webhook.
import { verifyWebhookSignature } from '@/lib/nicepay';
import { activateExpediteRequest, getExpediteRequestByOrderId } from '@/lib/expediteActivation';

function ack() {
  return new Response('OK', { status: 200, headers: { 'Content-Type': 'text/html' } });
}

export async function POST(request) {
  try {
    const payload = await request.json();
    const { tid, orderId, status, amount, ediDate, signature } = payload;

    if (!tid || !orderId || !verifyWebhookSignature({ tid, amount, ediDate, signature })) {
      console.error('NicePay expedite webhook: invalid signature or missing fields', payload);
      return ack();
    }

    if (status !== 'paid') {
      return ack();
    }

    const { data: order, error } = await getExpediteRequestByOrderId(orderId);
    if (error || !order) {
      console.error('NicePay expedite webhook: order not found for orderId', orderId);
      return ack();
    }

    const result = await activateExpediteRequest({ orderId, paymentId: tid });
    if (!result.ok) {
      console.error('NicePay expedite webhook: activation failed', result);
    }
  } catch (err) {
    console.error('NicePay expedite webhook: unhandled error', err);
  }

  return ack();
}
