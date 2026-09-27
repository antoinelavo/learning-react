// lib/communityClient.js
//
// Client-side helper: the browser Supabase session is never visible to a
// Next.js Route Handler by default (no middleware/cookie bridge in this
// app), so every mutating community API call must attach the current
// access token explicitly. Use this on the fetch() calls in client
// components that hit /api/community/*.
'use client';

import { supabase } from '@/lib/supabase'

export async function communityAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) return {}
  return { Authorization: `Bearer ${session.access_token}` }
}
