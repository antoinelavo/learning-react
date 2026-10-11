import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireCommunityWriter, withCommunityErrors } from '@/lib/communityAuth'

// Toggles a scrap (bookmark) on a post. body: { postId }
export const POST = withCommunityErrors(async function POST(request) {
  const { user, response } = await requireCommunityWriter(request)
  if (response) return response

  const body = await request.json().catch(() => null)
  const postId = body?.postId
  if (typeof postId !== 'string') {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })
  }

  const { data: post } = await supabaseAdmin
    .from('community_posts')
    .select('id, deleted_at')
    .eq('id', postId)
    .maybeSingle()
  if (!post || post.deleted_at) {
    return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 })
  }

  const { data: existing } = await supabaseAdmin
    .from('community_post_scraps')
    .select('post_id')
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .maybeSingle()

  const { error } = existing
    ? await supabaseAdmin.from('community_post_scraps').delete().eq('post_id', postId).eq('user_id', user.id)
    : await supabaseAdmin.from('community_post_scraps').insert({ post_id: postId, user_id: user.id })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ scrapped: !existing })
})
