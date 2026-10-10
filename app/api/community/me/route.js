import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getCommunityUser, getActiveBan, withCommunityErrors } from '@/lib/communityAuth'
import { PAGE_SIZE } from '@/lib/community'

// 내 활동. GET ?tab=posts|comments|scraps|status&page=N
// Read-only, so banned users can still see their own activity.
export const GET = withCommunityErrors(async function GET(request) {
  const user = await getCommunityUser(request)
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const tab = searchParams.get('tab')
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  if (tab === 'status') {
    return NextResponse.json({ banned_until: await getActiveBan(user.id) })
  }

  let query
  if (tab === 'comments') {
    query = supabaseAdmin
      .from('community_comments')
      .select('id, content, is_anonymous, created_at, deleted_at, deleted_by_admin, post:community_posts(slug, title, deleted_at)', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
  } else if (tab === 'scraps') {
    query = supabaseAdmin
      .from('community_post_scraps')
      .select('created_at, post:community_posts!inner(id, slug, title, category, created_at, deleted_at, like_count, comment_count, view_count)', { count: 'exact' })
      .eq('user_id', user.id)
      .is('post.deleted_at', null)
      .order('created_at', { ascending: false })
  } else {
    query = supabaseAdmin
      .from('community_posts')
      .select('id, slug, title, category, is_anonymous, created_at, deleted_at, deleted_by_admin, like_count, comment_count, view_count', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
  }

  const { data, error, count } = await query.range(from, to)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    items: data || [],
    page,
    totalPages: Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE)),
  })
})
