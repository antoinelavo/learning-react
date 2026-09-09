// lib/communityAuth.js
//
// Auth helper for community API routes. The browser Supabase session lives
// in the client only (no middleware/cookie bridge in this app), so route
// handlers can't call supabase.auth.getUser() with no args and expect it to
// see the caller — that always returns null server-side. Instead the client
// must send its access token explicitly, and we validate it here.
import { supabaseAdmin } from '@/lib/supabaseAdmin'

// Extracts the bearer token and returns the authenticated user, or null.
export async function getCommunityUser(request) {
  const authHeader = request.headers.get('authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return null

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !user) return null
  return user
}

export async function requireAdminUser(request) {
  const user = await getCommunityUser(request)
  if (!user) return null

  const { data } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  return data?.role === 'admin' ? user : null
}

// Lightweight per-user rate limit: counts rows created by this user in the
// last `windowSeconds` and rejects if over `limit`. Not abuse-proof (no
// Redis in this stack) but stops accidental double-submits/basic spam.
export async function checkRateLimit(table, userColumn, userId, limit, windowSeconds) {
  const since = new Date(Date.now() - windowSeconds * 1000).toISOString()
  const { count } = await supabaseAdmin
    .from(table)
    .select('id', { count: 'exact', head: true })
    .eq(userColumn, userId)
    .gte('created_at', since)

  return (count ?? 0) < limit
}
