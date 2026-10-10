import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAdminUser, withCommunityErrors } from '@/lib/communityAuth'
import { PERMANENT_BAN_UNTIL } from '@/lib/community'

const DURATIONS = { '7': 7, '30': 30 }

// body: { userId, duration: '7' | '30' | 'permanent' | 'none' }
// 'none' lifts the ban.
export const POST = withCommunityErrors(async function POST(request) {
  const admin = await requireAdminUser(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const { userId, duration } = body || {}
  if (typeof userId !== 'string' || !(duration in DURATIONS || duration === 'permanent' || duration === 'none')) {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })
  }
  if (userId === admin.id) {
    return NextResponse.json({ error: '본인은 차단할 수 없습니다.' }, { status: 400 })
  }

  const bannedUntil = duration === 'none'
    ? null
    : duration === 'permanent'
      ? PERMANENT_BAN_UNTIL
      : new Date(Date.now() + DURATIONS[duration] * 24 * 60 * 60 * 1000).toISOString()

  const { data: target } = await supabaseAdmin.from('users').select('id').eq('id', userId).maybeSingle()
  if (!target) return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 })

  const { error } = bannedUntil
    ? await supabaseAdmin
        .from('community_bans')
        .upsert({ user_id: userId, banned_until: bannedUntil, banned_by: admin.id, created_at: new Date().toISOString() })
    : await supabaseAdmin.from('community_bans').delete().eq('user_id', userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ user_id: userId, banned_until: bannedUntil })
})
