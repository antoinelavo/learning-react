// app/api/toss/resource-fail/route.js
//
// Toss's payment-window "failUrl" callback for marketplace purchases — the
// buyer cancelled or their card issuer declined before any charge
// happened. Nothing to confirm or activate here; just relay the reason
// back to the marketplace.
import { NextResponse } from 'next/server';

function siteUrl(request) {
  return process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code') || 'unknown';
  return NextResponse.redirect(
    `${siteUrl(request)}/marketplace?payment=failed&reason=${encodeURIComponent(code)}`,
    303
  );
}
