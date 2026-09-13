// app/api/toss/expedite-webhook/route.js
//
// Reliability backstop for the expedite-review payment, mirroring
// app/api/toss/webhook/route.js. Register this URL (event
// PAYMENT_STATUS_CHANGED) in Toss's developer center alongside the
// premium listing webhook, once you have an account.
import { getPaymentByOrderId } from '@/lib/toss';
import { activateExpediteRequest, getExpediteRequestByOrderId } from '@/lib/expediteActivation';

function ack() {
  return new Response('OK', { status: 200 });
}

export async function POST(request) {
  try {
    const payload = await request.json();
    const orderId = payload?.data?.orderId;

    if (!orderId) {
      return ack();
    }

    const { ok, data: payment } = await getPaymentByOrderId(orderId);
    if (!ok || payment.status !== 'DONE') {
      return ack();
    }

    const { data: order, error } = await getExpediteRequestByOrderId(orderId);
    if (error || !order) {
      console.error('Toss expedite webhook: order not found for orderId', orderId);
      return ack();
    }

    const result = await activateExpediteRequest({ orderId, paymentId: payment.paymentKey });
    if (!result.ok) {
      console.error('Toss expedite webhook: activation failed', result);
    }
  } catch (err) {
    console.error('Toss expedite webhook: unhandled error', err);
  }

  return ack();
}
