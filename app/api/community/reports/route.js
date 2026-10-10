import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireCommunityWriter, withCommunityErrors } from '@/lib/communityAuth'

const REASONS = ['spam', 'abuse', 'harassment', 'off_topic', 'other']

export const POST = withCommunityErrors(async function POST(request) {
  const { user, response } = await requireCommunityWriter(request)
  if (response) return response

  const body = await request.json().catch(() => null)
  const postId = body?.postId
  const commentId = body?.commentId

  if ((!postId && !commentId) || (postId && commentId)) {
    return NextResponse.json({ error: 'postId 또는 commentId 중 하나만 지정해주세요.' }, { status: 400 })
  }
  if (!REASONS.includes(body?.reason)) {
    return NextResponse.json({ error: '신고 사유를 선택해주세요.' }, { status: 400 })
  }

  // One pending report per reporter per target.
  let existing = supabaseAdmin
    .from('community_reports')
    .select('id')
    .eq('reporter_user_id', user.id)
    .eq('status', 'pending')
  existing = postId ? existing.eq('post_id', postId) : existing.eq('comment_id', commentId)
  const { data: already } = await existing.limit(1)
  if (already?.length) return NextResponse.json({ success: true })

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
})
