// lib/supabaseAdmin.js
// Server-only Supabase client using the service-role key. It bypasses RLS,
// so use it only in API routes, webhooks and cron jobs that run without a
// user session. Never import this from a client component.
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

// Resolves the user behind an `Authorization: Bearer <access token>` header
// and returns them only if users.role is 'admin'. Returns null otherwise.
export async function getAdminFromRequest(request) {
  const header = request.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;

  const db = getSupabaseAdmin();
  const { data: { user } = {}, error } = await db.auth.getUser(token);
  if (error || !user) return null;

  const { data } = await db.from('users').select('role').eq('id', user.id).single();
  return data?.role === 'admin' ? user : null;
}
