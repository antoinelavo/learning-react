// app/api/portone/refund/route.js
//
// Admin-only full refund of a PortOne card payment.
// POST { kind: 'premium' | 'plus', id } with the admin's Supabase access
// token in `Authorization: Bearer <token>` (the shared server client has no
// user session of its own, so the token is how we know who is asking).
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { refundPremiumPayment, refundPlusPayment } from '@/lib/refunds';

async function isAdmin(request) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return { status: 401 };

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !user) return { status: 401 };

  const { data } = await supabase.from('users').select('role').eq('id', user.id).maybeSingle();
  return data?.role === 'admin' ? { ok: true } : { status: 403 };
}

export async function POST(request) {
  const auth = await isAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: auth.status });
  }

  const { kind, id } = await request.json().catch(() => ({}));
  if (!id || (kind !== 'premium' && kind !== 'plus')) {
    return NextResponse.json({ ok: false, error: 'invalid_request' }, { status: 400 });
  }

  const result = kind === 'premium' ? await refundPremiumPayment(id) : await refundPlusPayment(id);
  const { status, ...body } = result;
  return NextResponse.json(body, { status: result.ok ? 200 : status || 500 });
}
