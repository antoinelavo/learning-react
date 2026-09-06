// app/api/nicepay/return/route.js
//
// NicePay's "returnUrl" callback. After the buyer authenticates with their
// card issuer, NicePay does a top-level browser POST straight to this
// endpoint (application/x-www-form-urlencoded) — NOT back into the page's
// JS. So there's no React state left by the time we get here; order
// context (teacher/subjects/duration/amount) is looked up from the
// payment_request row the client inserted (keyed by order_id) before
// calling AUTHNICE.requestPay.
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyAuthResultSignature, approvePayment } from '@/lib/nicepay';
import { activatePremium } from '@/lib/premiumActivation';

function siteUrl(request) {
  return process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
}

function failRedirect(request, reason) {
  return NextResponse.redirect(
    `${siteUrl(request)}/dashboard?payment=failed&reason=${encodeURIComponent(reason)}`,
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

  const { data: order, error: lookupError } = await supabase
    .from('payment_request')
    .select('*')
    .eq('order_id', orderId)
    .single();

  if (lookupError || !order) {
    return failRedirect(request, 'order_not_found');
  }

  const expectedAmount = order.amount;
  if (Number(amount) !== Number(expectedAmount)) {
    return failRedirect(request, 'amount_mismatch');
  }

  const { ok: approved, data: approvalData } = await approvePayment(tid, amount);
  if (
    !approved ||
    approvalData.orderId !== orderId ||
    Number(approvalData.amount) !== Number(expectedAmount)
  ) {
    return failRedirect(request, 'approve_failed');
  }

  const result = await activatePremium({
    paymentId: tid,
    teacherId: order.teacher_id,
    teacherName: order.name,
    subjects: order.subjects,
    durationMonths: order.duration_months,
    expectedAmount,
  });

  if (!result.ok) {
    return failRedirect(request, result.error || 'activation_failed');
  }

  return NextResponse.redirect(`${siteUrl(request)}/dashboard?payment=success`, 303);
}

// NicePay's payment window may also hit this with GET in some flows
// (e.g. a user navigating back). Just send them somewhere sane.
export async function GET(request) {
  return NextResponse.redirect(siteUrl(request));
}
