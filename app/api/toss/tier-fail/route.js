// app/api/toss/tier-fail/route.js
//
// Toss's failUrl callback for the 플러스 tier upgrade — the buyer cancelled
// or their card issuer declined before any charge happened. See
// app/api/toss/fail/route.js for the premium-listing equivalent.
import { NextResponse } from 'next/server';

function siteUrl(request) {
  return process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code') || 'unknown';
  return NextResponse.redirect(
    `${siteUrl(request)}/dashboard?tab=pricing&tier=failed&reason=${encodeURIComponent(code)}`,
    303
  );
}
