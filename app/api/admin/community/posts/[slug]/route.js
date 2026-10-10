import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAdminUser, loadAuthors, withCommunityErrors } from '@/lib/communityAuth'

// Real authors of a post and its comments, including anonymous ones.
// Returns { post: { id, is_pinned, author }, commentAuthors: { [commentId]: author } }
export const GET = withCommunityErrors(async function GET(request, { params }) {
  const admin = await requireAdminUser(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { slug } = await params
  const { data: post } = await supabaseAdmin
    .from('community_posts')
    .select('id, user_id, is_pinned')
    .eq('slug', slug)
    .maybeSingle()
  if (!post) return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 })

  const { data: comments } = await supabaseAdmin
    .from('community_comments')
    .select('id, user_id')
    .eq('post_id', post.id)

  const authors = await loadAuthors([post.user_id, ...(comments || []).map(c => c.user_id)])

  return NextResponse.json({
    post: { id: post.id, is_pinned: post.is_pinned, author: authors[post.user_id] || null },
    commentAuthors: Object.fromEntries((comments || []).map(c => [c.id, authors[c.user_id] || null])),
  })
})

// Pin or unpin as 공지. body: { is_pinned: boolean }
export const PATCH = withCommunityErrors(async function PATCH(request, { params }) {
  const admin = await requireAdminUser(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { slug } = await params
  const body = await request.json().catch(() => null)
  if (typeof body?.is_pinned !== 'boolean') {
    return NextResponse.json({ error: 'is_pinned must be a boolean' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('community_posts')
    .update({ is_pinned: body.is_pinned })
    .eq('slug', slug)
    .is('deleted_at', null)
    .select('is_pinned')
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 })
  return NextResponse.json(data)
})
