import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Public marketplace listing with optional filters. Only 'active' resources
// are ever returned here — teachers manage their own (including
// unpublished) resources via GET /api/resources/mine on the dashboard.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const subject = searchParams.get('subject');
  const resourceType = searchParams.get('resource_type');
  const sessionMonth = searchParams.get('session_month');
  const sessionYear = searchParams.get('session_year');
  const score = searchParams.get('score');
  const q = searchParams.get('q');

  let query = supabase
    .from('resources')
    .select('id, teacher_id, title, description, subject, resource_type, session_month, session_year, score, price_krw, created_at, teachers(name, profile_picture)')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (subject) query = query.eq('subject', subject);
  if (resourceType) query = query.eq('resource_type', resourceType);
  if (sessionMonth) query = query.eq('session_month', sessionMonth);
  if (sessionYear) query = query.eq('session_year', Number(sessionYear));
  if (score) query = query.eq('score', score);
  if (q) query = query.ilike('title', `%${q}%`);

  const { data, error } = await query;
  if (error) {
    console.error('GET /api/resources', error);
    return NextResponse.json({ error: 'Failed to load resources' }, { status: 500 });
  }

  return NextResponse.json({ resources: data });
}
