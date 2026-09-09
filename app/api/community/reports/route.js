import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getCommunityUser } from '@/lib/communityAuth'

const REASONS = ['spam', 'abuse', 'harassment', 'off_topic', 'other']

export async function POST(request) {
  const user = await getCommunityUser(request)
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const postId = body?.postId
  const commentId = body?.commentId

  if ((!postId && !commentId) || (postId && commentId)) {
    return NextResponse.json({ error: 'postId 또는 commentId 중 하나만 지정해주세요.' }, { status: 400 })
  }
  if (!REASONS.includes(body?.reason)) {
    return NextResponse.json({ error: '신고 사유를 선택해주세요.' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('community_reports')
    .insert({
      reporter_user_id: user.id,
      post_id: postId || null,
      comment_id: commentId || null,
      reason: body.reason,
      detail: body.detail?.trim()?.slice(0, 500) || null,
    })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
