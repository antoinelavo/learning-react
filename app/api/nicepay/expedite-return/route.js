// app/api/nicepay/expedite-return/route.js
//
// NicePay's returnUrl callback for the "expedite profile review" payment.
// Same server-POST/redirect model as app/api/nicepay/return/route.js
// (see that file for the full explanation) — order context is looked up
// by orderId from expedite_requests instead of payment_request.
import { NextResponse } from 'next/server';
import { verifyAuthResultSignature, approvePayment } from '@/lib/nicepay';
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

export async function POST(request) {
  const form = await request.formData();
  const authResultCode = form.get('authResultCode');
  const tid = form.get('tid');
  const orderId = form.get('orderId');
  const amount = form.get('amount');
  const authToken = form.get('authToken');
  const signature = form.get('signature');

  if (!tid || !orderId || !amount) {
    return failRedirect(request, 'missing_params');
  }

  if (authResultCode !== '0000') {
    return failRedirect(request, 'auth_failed');
  }

  if (!verifyAuthResultSignature({ authToken, amount, signature })) {
    return failRedirect(request, 'bad_signature');
  }

  const { data: order, error: lookupError } = await getExpediteRequestByOrderId(orderId);
  if (lookupError || !order) {
    return failRedirect(request, 'order_not_found');
  }

  if (Number(amount) !== Number(order.amount)) {
    return failRedirect(request, 'amount_mismatch');
  }

  const { ok: approved, data: approvalData } = await approvePayment(tid, amount);
  if (
    !approved ||
    approvalData.orderId !== orderId ||
    Number(approvalData.amount) !== Number(order.amount)
  ) {
    return failRedirect(request, 'approve_failed');
  }

  const result = await activateExpediteRequest({ orderId, paymentId: tid });
  if (!result.ok) {
    return failRedirect(request, result.error || 'activation_failed');
  }

  return NextResponse.redirect(`${siteUrl(request)}/dashboard?expedite=success`, 303);
}

export async function GET(request) {
  return NextResponse.redirect(siteUrl(request));
}
