// app/api/toss/resource-webhook/route.js
//
// Reliability backstop for the resource purchase successUrl flow — same
// pattern as app/api/toss/webhook/route.js. Never trusts the webhook
// payload's status directly; re-fetches the real payment status from Toss
// before acting. activatePurchase() is idempotent, so it's safe for this
// and the resource-success handler to race for the same order.
import { getPaymentByOrderId } from '@/lib/toss';
import { activatePurchase } from '@/lib/purchaseActivation';

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

    const result = await activatePurchase({
      orderId,
      paymentKey: payment.paymentKey,
      paidAmount: payment.totalAmount,
    });

    if (!result.ok) {
      console.error('Toss resource-webhook: activatePurchase failed', result);
    }
  } catch (err) {
    console.error('Toss resource-webhook: unhandled error', err);
  }

  return ack();
}
