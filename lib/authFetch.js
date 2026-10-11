// lib/authFetch.js
// fetch() wrapper for the browser that forwards the current Supabase
// session as a Bearer token, for API routes that check who is calling
// (e.g. admin-only routes via getAdminFromRequest in lib/supabaseAdmin.js).
import { supabase } from '@/lib/supabase';

export async function authFetch(url, options = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const headers = new Headers(options.headers || {});
  if (session?.access_token) {
    headers.set('Authorization', `Bearer ${session.access_token}`);
  }
  return fetch(url, { ...options, headers });
}
