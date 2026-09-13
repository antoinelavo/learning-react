// app/api/toss/expedite-fail/route.js
//
// Toss's failUrl callback for the "expedite profile review" payment — see
// app/api/toss/fail/route.js for the premium-listing equivalent.
import { NextResponse } from 'next/server';

function siteUrl(request) {
  return process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code') || 'unknown';
  return NextResponse.redirect(
    `${siteUrl(request)}/dashboard?expedite=failed&reason=${encodeURIComponent(code)}`,
    303
  );
}
