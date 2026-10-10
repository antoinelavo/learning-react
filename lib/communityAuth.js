// lib/communityAuth.js
//
// Auth helper for community API routes. The browser Supabase session lives
// in the client only (no middleware/cookie bridge in this app), so route
// handlers can't call supabase.auth.getUser() with no args and expect it to
// see the caller — that always returns null server-side. Instead the client
// must send its access token explicitly, and we validate it here.
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { banMessage } from '@/lib/community'

// Wraps a route handler so any uncaught throw (most commonly supabaseAdmin
// accessing a missing SUPABASE_SERVICE_ROLE_KEY, since it only validates
// lazily on first use — see lib/supabaseAdmin.js) turns into a clear JSON
// 500 instead of Next.js's generic, non-JSON error response. Without this,
// `res.json()` on the client throws its own opaque parse error, which is
// how a misconfigured env var on the server surfaces as a confusing
// client-side crash instead of an actionable message.
export function withCommunityErrors(handler) {
  return async (request, context) => {
    try {
      return await handler(request, context)
    } catch (err) {
      console.error('[community] unhandled error:', err)
      return NextResponse.json(
        { error: '서버 오류가 발생했습니다.', detail: err?.message || String(err) },
        { status: 500 }
      )
    }
  }
}

// Best-effort client IP for deduping anonymous (logged-out) view counts —
// not abuse-proof (trivially spoofable/shared behind NAT), good enough for
// "don't recount a refresh" at this scale.
export function getClientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return request.headers.get('x-real-ip') || 'unknown'
}

// Extracts the bearer token and returns the authenticated user, or null.
export async function getCommunityUser(request) {
  const authHeader = request.headers.get('authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return null

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !user) return null
  return user
}

// Gate for every community write (post, comment, like, scrap, report,
// image upload). Returns { user, profile } or { response } with the 401/403
// to send back. Admins are never blocked by a ban.
export async function requireCommunityWriter(request) {
  const user = await getCommunityUser(request)
  if (!user) {
    return { response: NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 }) }
  }

  const { data: profile } = await supabaseAdmin
    .from('users')
    .select('username, role, community_banned_until')
    .eq('id', user.id)
    .single()

  const bannedUntil = profile?.community_banned_until
  if (profile?.role !== 'admin' && bannedUntil && new Date(bannedUntil) > new Date()) {
    return {
      response: NextResponse.json(
        { error: banMessage(bannedUntil), banned_until: bannedUntil },
        { status: 403 }
      ),
    }
  }
  if (!profile?.username) {
    return { response: NextResponse.json({ error: '닉네임을 먼저 설정해주세요.' }, { status: 403 }) }
  }

  return { user, profile }
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
