// app/api/toss/success/route.js
//
// Toss's payment-window "successUrl" callback. Unlike NicePay's server-to-
// server POST, Toss does a top-level browser GET redirect here with
// paymentKey/orderId/amount as query params — there's no React state left
// by the time we get here, so order context (teacher/subjects/duration/
// amount) is looked up from the payment_request row the client inserted
// (keyed by order_id) before calling requestPayment.
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { confirmPayment } from '@/lib/toss';
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

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const paymentKey = searchParams.get('paymentKey');
  const orderId = searchParams.get('orderId');
  const amount = searchParams.get('amount');

  if (!paymentKey || !orderId || !amount) {
    return failRedirect(request, 'missing_params');
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

  const { ok: confirmed, data: confirmData } = await confirmPayment({
    paymentKey,
    orderId,
    amount: Number(amount),
  });

  if (!confirmed) {
    console.error('Toss success: confirm failed', confirmData);
    return failRedirect(request, 'confirm_failed');
  }

  const result = await activatePremium({
    paymentId: paymentKey,
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
