// app/api/portone/tier-complete/route.js
//
// Where the 플러스 checkout ends — same model as ../complete/route.js,
// landing back on the dashboard's pricing tab.
import { NextResponse } from 'next/server';
import { completePlusOrder } from '@/lib/portoneOrders';

function redirectTo(request, path) {
  return NextResponse.redirect(`${new URL(request.url).origin}${path}`, 303);
}

function failRedirect(request, reason) {
  return redirectTo(request, `/dashboard?tab=pricing&tier=failed&reason=${encodeURIComponent(reason)}`);
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const paymentId = searchParams.get('paymentId');
  const code = searchParams.get('code');

  if (code) return failRedirect(request, code);
  if (!paymentId) return failRedirect(request, 'missing_params');

  const result = await completePlusOrder(paymentId);
  if (!result.ok) {
    console.error('PortOne tier-complete: activation failed', paymentId, result);
    return failRedirect(request, result.error || 'activation_failed');
  }

  return redirectTo(request, '/dashboard?tab=pricing&tier=success');
}
