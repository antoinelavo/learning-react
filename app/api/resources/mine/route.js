import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAuthedUser } from '@/lib/apiAuth';

// The signed-in teacher's own resources, any status (active + unpublished),
// plus this-month sales totals for the dashboard resources page.
export async function GET(request) {
  const authed = await getAuthedUser(request);
  if (!authed?.teacherId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: resources, error } = await supabase
    .from('resources')
    .select('id, title, subject, resource_type, session_month, session_year, score, price_krw, status, created_at')
    .eq('teacher_id', authed.teacherId)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'Failed to load resources' }, { status: 500 });
  }

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data: sales } = await supabase
    .from('purchases')
    .select('teacher_earning_krw, paid_at')
    .eq('teacher_id', authed.teacherId)
    .eq('status', 'paid')
    .gte('paid_at', startOfMonth.toISOString());

  const monthEarningsKrw = (sales || []).reduce((sum, s) => sum + s.teacher_earning_krw, 0);

  return NextResponse.json({ resources, monthEarningsKrw, monthSalesCount: sales?.length || 0 });
}
