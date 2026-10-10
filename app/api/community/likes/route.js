import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireCommunityWriter, withCommunityErrors } from '@/lib/communityAuth'

export const POST = withCommunityErrors(async function POST(request) {
  const { user, response } = await requireCommunityWriter(request)
  if (response) return response

  const body = await request.json().catch(() => null)
  const postId = body?.postId
  const commentId = body?.commentId

  if ((!postId && !commentId) || (postId && commentId)) {
    return NextResponse.json({ error: 'postId 또는 commentId 중 하나만 지정해주세요.' }, { status: 400 })
  }

  const isPost = !!postId
  const likesTable = isPost ? 'community_post_likes' : 'community_comment_likes'
  const idColumn = isPost ? 'post_id' : 'comment_id'
  const targetId = postId || commentId
  const targetTable = isPost ? 'community_posts' : 'community_comments'

  const { data: target } = await supabaseAdmin
    .from(targetTable)
    .select('id, deleted_at')
    .eq('id', targetId)
    .maybeSingle()
  if (!target || target.deleted_at) {
    return NextResponse.json({ error: '대상을 찾을 수 없습니다.' }, { status: 404 })
  }

  const { data: existingLike } = await supabaseAdmin
    .from(likesTable)
    .select('*')
    .eq(idColumn, targetId)
    .eq('user_id', user.id)
    .maybeSingle()

  let liked
  if (existingLike) {
    const { error } = await supabaseAdmin
      .from(likesTable)
      .delete()
      .eq(idColumn, targetId)
      .eq('user_id', user.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    liked = false
  } else {
    const { error } = await supabaseAdmin
      .from(likesTable)
      .insert({ [idColumn]: targetId, user_id: user.id })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    liked = true
  }

  const { data: updated } = await supabaseAdmin
    .from(targetTable)
    .select('like_count')
    .eq('id', targetId)
    .single()

  return NextResponse.json({ liked, likeCount: updated?.like_count ?? 0 })
})
