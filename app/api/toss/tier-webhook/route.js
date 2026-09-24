// app/api/toss/tier-webhook/route.js
//
// Reliability backstop for the 플러스 tier upgrade, mirroring
// app/api/toss/webhook/route.js. Register this URL (event
// PAYMENT_STATUS_CHANGED) in Toss's developer center alongside the
// premium-listing webhook, once you have an account. Toss's webhook
// carries no signature to verify, so this never trusts the payload
// directly — it re-fetches the real payment status from Toss's API
// before acting on it.
import { supabase } from '@/lib/supabase';
import { getPaymentByOrderId } from '@/lib/toss';
import { activatePlusTier } from '@/lib/tierActivation';

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

    const { data: order, error } = await supabase
      .from('payments')
      .select('teacher_id, amount')
      .eq('toss_order_id', orderId)
      .single();

    if (error || !order) {
      console.error('Toss tier webhook: order not found for orderId', orderId);
      return ack();
    }

    const result = await activatePlusTier({
      orderId,
      paymentKey: payment.paymentKey,
      teacherId: order.teacher_id,
      amount: order.amount,
    });

    if (!result.ok) {
      console.error('Toss tier webhook: activation failed', result);
    }
  } catch (err) {
    console.error('Toss tier webhook: unhandled error', err);
  }

  return ack();
}
