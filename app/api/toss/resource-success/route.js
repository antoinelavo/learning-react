// app/api/toss/resource-success/route.js
//
// Toss's payment-window "successUrl" callback for marketplace resource
// purchases. Same shape as app/api/toss/success/route.js: Toss does a
// top-level browser GET redirect with paymentKey/orderId/amount as query
// params, so purchase context is looked up from the `purchases` row the
// client inserted (keyed by order_id) before calling requestPayment.
import { NextResponse } from 'next/server';
import { confirmPayment } from '@/lib/toss';
import { activatePurchase } from '@/lib/purchaseActivation';

function siteUrl(request) {
  return process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
}

function failRedirect(request, reason) {
  return NextResponse.redirect(
    `${siteUrl(request)}/marketplace?payment=failed&reason=${encodeURIComponent(reason)}`,
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

  const { ok: confirmed, data: confirmData } = await confirmPayment({
    paymentKey,
    orderId,
    amount: Number(amount),
  });

  if (!confirmed) {
    console.error('Toss resource-success: confirm failed', confirmData);
    return failRedirect(request, 'confirm_failed');
  }

  const result = await activatePurchase({
    orderId,
    paymentKey,
    paidAmount: Number(amount),
  });

  if (!result.ok) {
    return failRedirect(request, result.error || 'activation_failed');
  }

  return NextResponse.redirect(
    `${siteUrl(request)}/dashboard?payment=success&resource=${result.purchase.resource_id}`,
    303
  );
}
