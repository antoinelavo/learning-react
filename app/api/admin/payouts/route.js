import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAuthedUser } from '@/lib/apiAuth';

async function requireAdmin(request) {
  const authed = await getAuthedUser(request);
  return authed?.role === 'admin' ? authed : null;
}

function monthKey(dateStr) {
  return dateStr.slice(0, 7); // 'YYYY-MM'
}

// All paid-but-not-yet-paid-out purchases, grouped by teacher + calendar
// month, so the admin can see exactly what's owed before manually
// bank-transferring it once a month.
export async function GET(request) {
  const admin = await requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: purchases, error } = await supabase
    .from('purchases')
    .select('id, teacher_id, teacher_earning_krw, platform_fee_krw, price_krw, paid_at, teachers(name, bank_name, bank_account_number, bank_account_holder)')
    .eq('status', 'paid')
    .is('payout_id', null)
    .order('paid_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: 'Failed to load payouts' }, { status: 500 });
  }

  const groups = new Map();
  for (const p of purchases) {
    const key = `${p.teacher_id}_${monthKey(p.paid_at)}`;
    if (!groups.has(key)) {
      groups.set(key, {
        teacher_id: p.teacher_id,
        teacher: p.teachers,
        period_month: `${monthKey(p.paid_at)}-01`,
        total_sales_krw: 0,
        platform_fee_krw: 0,
        teacher_earning_krw: 0,
        purchase_count: 0,
      });
    }
    const g = groups.get(key);
    g.total_sales_krw += p.price_krw;
    g.platform_fee_krw += p.platform_fee_krw;
    g.teacher_earning_krw += p.teacher_earning_krw;
    g.purchase_count += 1;
  }

  return NextResponse.json({ pending: Array.from(groups.values()) });
}

// Marks one teacher's earnings for one calendar month as paid: records a
// payouts row and attaches every matching purchase to it so it drops off
// the pending list. Purely a bookkeeping action — the actual bank transfer
// happens outside the app.
export async function POST(request) {
  const admin = await requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { teacher_id, period_month, note } = await request.json();
  if (!teacher_id || !period_month) {
    return NextResponse.json({ error: 'teacher_id and period_month are required' }, { status: 400 });
  }

  const start = new Date(period_month);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);

  const { data: purchases, error: lookupError } = await supabase
    .from('purchases')
    .select('id, price_krw, platform_fee_krw, teacher_earning_krw')
    .eq('teacher_id', teacher_id)
    .eq('status', 'paid')
    .is('payout_id', null)
    .gte('paid_at', start.toISOString())
    .lt('paid_at', end.toISOString());

  if (lookupError) {
    return NextResponse.json({ error: 'Lookup failed' }, { status: 500 });
  }
  if (!purchases?.length) {
    return NextResponse.json({ error: 'Nothing pending for this teacher/month' }, { status: 400 });
  }

  const totals = purchases.reduce((acc, p) => ({
    total_sales_krw: acc.total_sales_krw + p.price_krw,
    platform_fee_krw: acc.platform_fee_krw + p.platform_fee_krw,
    teacher_earning_krw: acc.teacher_earning_krw + p.teacher_earning_krw,
  }), { total_sales_krw: 0, platform_fee_krw: 0, teacher_earning_krw: 0 });

  const { data: payout, error: insertError } = await supabase
    .from('payouts')
    .insert([{
      teacher_id,
      period_month: start.toISOString().slice(0, 10),
      ...totals,
      note: note || null,
    }])
    .select()
    .single();

  if (insertError) {
    if (insertError.code === '23505') {
      return NextResponse.json({ error: 'This teacher was already marked paid for that month' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to record payout' }, { status: 500 });
  }

  const { error: updateError } = await supabase
    .from('purchases')
    .update({ payout_id: payout.id })
    .in('id', purchases.map((p) => p.id));

  if (updateError) {
    return NextResponse.json({ error: 'Payout recorded but failed to attach purchases', payout }, { status: 500 });
  }

  return NextResponse.json({ payout });
}
