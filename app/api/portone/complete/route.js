// app/api/portone/complete/route.js
//
// Where the premium-listing checkout ends, on PC (the client navigates
// here after the popup resolves) and on mobile (PortOne's redirectUrl).
// Query: ?paymentId=...[&code=...&message=...]. A `code` means PortOne
// reported a failure or cancellation before any charge.
import { NextResponse } from 'next/server';
import { completePremiumOrder } from '@/lib/portoneOrders';

// Redirect within whatever deployment served this request (prod or a
// preview URL), never a configured site URL.
function redirectTo(request, path) {
  return NextResponse.redirect(`${new URL(request.url).origin}${path}`, 303);
}

// TEMP DEBUG: `detail` (PortOne's message or our check's detail) is shown
// in the failure alert while the checkout is being tested.
function failRedirect(request, reason, detail) {
  const detailParam = detail ? `&detail=${encodeURIComponent(String(detail).slice(0, 300))}` : '';
  return redirectTo(request, `/dashboard?payment=failed&reason=${encodeURIComponent(reason)}${detailParam}`);
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const paymentId = searchParams.get('paymentId');
  const code = searchParams.get('code');

  if (code) return failRedirect(request, code, searchParams.get('message'));
  if (!paymentId) return failRedirect(request, 'missing_params');

  const result = await completePremiumOrder(paymentId);
  if (!result.ok) {
    console.error('PortOne complete: premium activation failed', paymentId, result);
    return failRedirect(request, result.error || 'activation_failed', result.detail);
  }

  return redirectTo(request, '/dashboard?payment=success');
}
