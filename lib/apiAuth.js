// lib/apiAuth.js
// Verifies the caller's Supabase access token on server API routes.
//
// The rest of this codebase's API routes call `supabase.auth.getUser()`
// with no token, which only works if a session happens to be attached to
// the shared anon client already — unreliable in a stateless Route
// Handler. The marketplace's purchase/download routes need a real
// per-request identity check, so the client explicitly sends its access
// token (`supabase.auth.getSession()`) as `Authorization: Bearer <token>`
// and this verifies it directly against Supabase.
import { supabase } from '@/lib/supabase';

export async function getAuthedUser(request) {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return null;

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;

  const [{ data: userRow }, { data: teacher }] = await Promise.all([
    supabase.from('users').select('role').eq('id', user.id).single(),
    supabase.from('teachers').select('id, status').eq('user_id', user.id).maybeSingle(),
  ]);

  return {
    id: user.id,
    role: userRow?.role ?? null,
    teacherId: teacher?.id ?? null,
    teacherStatus: teacher?.status ?? null,
  };
}
