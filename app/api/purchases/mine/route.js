import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAuthedUser } from '@/lib/apiAuth';

// The signed-in user's own paid purchases — powers "My Purchases" on the
// student dashboard.
export async function GET(request) {
  const authed = await getAuthedUser(request);
  if (!authed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: purchases, error } = await supabase
    .from('purchases')
    .select('id, resource_id, price_krw, paid_at, resources(title, subject, session_month, session_year, score)')
    .eq('buyer_id', authed.id)
    .eq('status', 'paid')
    .order('paid_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'Failed to load purchases' }, { status: 500 });
  }

  return NextResponse.json({ purchases });
}
