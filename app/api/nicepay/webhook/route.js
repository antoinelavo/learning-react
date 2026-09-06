// app/api/nicepay/webhook/route.js
//
// Reliability backstop for the returnUrl flow: register this URL in
// NicePay's merchant admin console. It fires independently of the buyer's
// browser (payment approval, cancellation, virtual account events), so it
// still confirms a payment even if the browser closes/loses connection
// right after paying. activatePremium() is idempotent, so it's safe for
// this and the returnUrl handler to race for the same payment.
//
// Per NicePay's contract, this must always respond 200 with body exactly
// "OK" — even when we internally fail to process it — so log failures
// server-side instead of surfacing them in the response.
import { supabase } from '@/lib/supabase';
import { verifyWebhookSignature } from '@/lib/nicepay';
import { activatePremium } from '@/lib/premiumActivation';

function ack() {
  return new Response('OK', { status: 200, headers: { 'Content-Type': 'text/html' } });
}

export async function POST(request) {
  try {
    const payload = await request.json();
    const { tid, orderId, status, amount, ediDate, signature } = payload;

    if (!tid || !orderId || !verifyWebhookSignature({ tid, amount, ediDate, signature })) {
      console.error('NicePay webhook: invalid signature or missing fields', payload);
      return ack();
    }

    if (status !== 'paid') {
      return ack();
    }

    const { data: order, error } = await supabase
      .from('payment_request')
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (error || !order) {
      console.error('NicePay webhook: order not found for orderId', orderId);
      return ack();
    }

    const result = await activatePremium({
      paymentId: tid,
      teacherId: order.teacher_id,
      teacherName: order.name,
      subjects: order.subjects,
      durationMonths: order.duration_months,
      expectedAmount: order.amount,
    });

    if (!result.ok) {
      console.error('NicePay webhook: activatePremium failed', result);
    }
  } catch (err) {
    console.error('NicePay webhook: unhandled error', err);
  }

  return ack();
}
