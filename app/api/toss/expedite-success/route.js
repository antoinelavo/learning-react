// app/api/toss/expedite-success/route.js
//
// Toss's successUrl callback for the "expedite profile review" payment.
// Same model as app/api/toss/success/route.js (see that file for the full
// explanation) — order context is looked up by orderId (==
// expedite_payments.id) instead of payment_request.
import { NextResponse } from 'next/server';
import { confirmPayment } from '@/lib/toss';
import { activateExpediteRequest, getExpediteRequestByOrderId } from '@/lib/expediteActivation';

function siteUrl(request) {
  return process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
}

function failRedirect(request, reason) {
  return NextResponse.redirect(
    `${siteUrl(request)}/dashboard?expedite=failed&reason=${encodeURIComponent(reason)}`,
    303
  );
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const paymentKey = searchParams.get('paymentKey');
  const orderId = searchParams.get('orderId');
  const amount = searchParams.get('amount');

  if (!paymentKey || !orderId || !amount) {
    return failRedirect(request, 'missing_params');
  }

  const { data: order, error: lookupError } = await getExpediteRequestByOrderId(orderId);
  if (lookupError || !order) {
    return failRedirect(request, 'order_not_found');
  }

  if (Number(amount) !== Number(order.amount)) {
    return failRedirect(request, 'amount_mismatch');
  }

  const { ok: confirmed, data: confirmData } = await confirmPayment({
    paymentKey,
    orderId,
    amount: Number(amount),
  });

  if (!confirmed) {
    console.error('Toss expedite-success: confirm failed', confirmData);
    return failRedirect(request, 'confirm_failed');
  }

  const result = await activateExpediteRequest({ orderId, paymentId: paymentKey });
  if (!result.ok) {
    return failRedirect(request, result.error || 'activation_failed');
  }

  return NextResponse.redirect(`${siteUrl(request)}/dashboard?expedite=success`, 303);
}
