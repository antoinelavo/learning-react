// app/api/toss/tier-success/route.js
//
// Toss's successUrl callback for the 플러스 tier upgrade (₩9,000, one-time,
// permanent). Same GET-redirect model as app/api/toss/success/route.js
// (the premium-listing checkout) — see that file for why this is a GET
// handler rather than a POST like the old NicePay flow. Order context
// (which teacher this payment belongs to) is looked up from the payments
// row the client inserted (keyed by toss_order_id) before calling
// requestPayment, same as payment_request does for the premium listing.
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { confirmPayment } from '@/lib/toss';
import { activatePlusTier } from '@/lib/tierActivation';

function siteUrl(request) {
  return process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
}

function failRedirect(request, reason) {
  return NextResponse.redirect(
    `${siteUrl(request)}/dashboard?tab=pricing&tier=failed&reason=${encodeURIComponent(reason)}`,
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
    .from('payments')
    .select('teacher_id, amount')
    .eq('toss_order_id', orderId)
    .single();

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
    console.error('Toss tier-success: confirm failed', confirmData);
    return failRedirect(request, 'confirm_failed');
  }

  const result = await activatePlusTier({
    orderId,
    paymentKey,
    teacherId: order.teacher_id,
    amount: Number(amount),
  });

  if (!result.ok) {
    return failRedirect(request, result.error || 'activation_failed');
  }

  return NextResponse.redirect(`${siteUrl(request)}/dashboard?tab=pricing&tier=success`, 303);
}
