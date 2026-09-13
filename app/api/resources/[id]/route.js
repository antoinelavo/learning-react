import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAuthedUser } from '@/lib/apiAuth';

// Single resource lookup (used by the resource detail page). Only returns
// active resources to anonymous/other users; the owning teacher or an
// admin can fetch it regardless of status.
export async function GET(request, { params }) {
  const { id } = await params;

  const { data: resource, error } = await supabase
    .from('resources')
    .select('id, teacher_id, title, description, subject, resource_type, session_month, session_year, score, price_krw, status, created_at, teachers(name, profile_picture)')
    .eq('id', id)
    .single();

  if (error || !resource) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (resource.status !== 'active') {
    const authed = await getAuthedUser(request);
    const isOwner = authed?.teacherId === resource.teacher_id;
    const isAdmin = authed?.role === 'admin';
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
  }

  return NextResponse.json({ resource });
}

// Owning teacher (or admin) can edit price/description/title or unpublish.
export async function PATCH(request, { params }) {
  const { id } = await params;
  const authed = await getAuthedUser(request);
  if (!authed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: resource, error: lookupError } = await supabase
    .from('resources')
    .select('id, teacher_id')
    .eq('id', id)
    .single();

  if (lookupError || !resource) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const isOwner = authed.teacherId === resource.teacher_id;
  const isAdmin = authed.role === 'admin';
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const updates = {};
  if (typeof body.title === 'string' && body.title.trim()) updates.title = body.title.trim();
  if (typeof body.description === 'string') updates.description = body.description.trim() || null;
  if (Number.isFinite(body.price_krw) && body.price_krw >= 0) updates.price_krw = body.price_krw;
  if (body.status === 'active' || body.status === 'unpublished') updates.status = body.status;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const { data: updated, error: updateError } = await supabase
    .from('resources')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }

  return NextResponse.json({ resource: updated });
}
