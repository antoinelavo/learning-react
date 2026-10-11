// lib/supabaseAdmin.js
// Server-only Supabase client using the service-role key. It bypasses RLS,
// so use it only in API routes, webhooks and cron jobs, and only after the
// caller is verified where a user is involved. Never import this from a
// client component.
import { createClient } from '@supabase/supabase-js';

let client = null;

// Created lazily so builds and pages that never call it don't need the key.
export function getSupabaseAdmin() {
  if (typeof window !== 'undefined') {
    throw new Error('lib/supabaseAdmin.js must not be used in the browser');
  }
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  }

  client = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

// Same client as a lazy proxy, for call sites written as
// `supabaseAdmin.from(...)` (the community routes).
export const supabaseAdmin = new Proxy({}, {
  get(_target, prop) {
    return getSupabaseAdmin()[prop];
  },
});

// Resolves the user behind an `Authorization: Bearer <access token>` header
// (sent by lib/authFetch.js). Returns null if missing or invalid.
export async function getUserFromRequest(request) {
  const header = request.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;

  const { data: { user } = {}, error } = await getSupabaseAdmin().auth.getUser(token);
  return error || !user ? null : user;
}

// Same, but only if users.role is 'admin'.
export async function getAdminFromRequest(request) {
  const user = await getUserFromRequest(request);
  if (!user) return null;

  const { data } = await getSupabaseAdmin().from('users').select('role').eq('id', user.id).single();
  return data?.role === 'admin' ? user : null;
}
