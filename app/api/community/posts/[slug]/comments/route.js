import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getCommunityUser, requireCommunityWriter, checkRateLimit, withCommunityErrors } from '@/lib/communityAuth'
import { isCommunityImageUrl, decodeSlug } from '@/lib/community'
import { labelComments } from '@/lib/communityAnon'
import { buildCommentTree } from '@/lib/communityComments'

async function getPost(slug) {
  const { data } = await supabaseAdmin
    .from('community_posts')
    .select('id, user_id, is_anonymous, deleted_at, is_draft')
    .eq('slug', slug)
    .maybeSingle()
  return data
}

export const GET = withCommunityErrors(async function GET(request, { params }) {
  const slug = decodeSlug((await params).slug)
  const post = await getPost(slug)
  if (!post || post.deleted_at || post.is_draft) {
    return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 })
  }

  const viewer = await getCommunityUser(request)
  const tree = await buildCommentTree(post, viewer)
  return NextResponse.json({ comments: tree })
})

export const POST = withCommunityErrors(async function POST(request, { params }) {
  const slug = decodeSlug((await params).slug)
  const { user, profile, response } = await requireCommunityWriter(request)
  if (response) return response

  const post = await getPost(slug)
  if (!post || post.deleted_at || post.is_draft) {
    return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 })
  }

  const body = await request.json().catch(() => null)
  if (typeof body?.content !== 'string' || !body.content.trim()) {
    return NextResponse.json({ error: '댓글 내용을 입력해주세요.' }, { status: 400 })
  }
  if (body.content.length > 1000) {
    return NextResponse.json({ error: '댓글은 1000자 이하로 입력해주세요.' }, { status: 400 })
  }

  const withinLimit = await checkRateLimit('community_comments', 'user_id', user.id, 15, 60)
  if (!withinLimit) {
    return NextResponse.json({ error: '너무 빠르게 댓글을 작성하고 있어요. 잠시 후 다시 시도해주세요.' }, { status: 429 })
  }

  // Depth-1 cap: replying to a reply re-parents to that reply's top-level
  // ancestor, enforced here (not just in the UI) so a direct API call can't
  // create depth-2+ rows.
  let parentCommentId = null
  let depth = 0
  if (body.parent_comment_id) {
    const { data: parent } = await supabaseAdmin
      .from('community_comments')
      .select('id, parent_comment_id, depth, post_id')
      .eq('id', body.parent_comment_id)
      .maybeSingle()

    if (!parent || parent.post_id !== post.id) {
      return NextResponse.json({ error: '원본 댓글을 찾을 수 없습니다.' }, { status: 404 })
    }
    parentCommentId = parent.depth === 0 ? parent.id : parent.parent_comment_id
    depth = 1
  }

  const { data: created, error } = await supabaseAdmin
    .from('community_comments')
    .insert({
      post_id: post.id,
      parent_comment_id: parentCommentId,
      depth,
      user_id: user.id,
      content: body.content.trim(),
      is_anonymous: !!body.is_anonymous,
      image_url: isCommunityImageUrl(body.image_url) ? body.image_url : null,
    })
    .select('id, post_id, parent_comment_id, depth, user_id, content, is_anonymous, image_url, like_count, created_at')
    .single()

  if (error) {
    console.error('community comment create error:', error)
    return NextResponse.json({ error: '댓글 작성 중 오류가 발생했습니다.' }, { status: 500 })
  }

  let username = null
  let teacher = null
  if (!created.is_anonymous) {
    const { data: teacherRow } = await supabaseAdmin
      .from('teachers')
      .select('user_id, name, profile_picture')
      .eq('status', 'approved')
      .eq('is_test', false)
      .eq('user_id', user.id)
      .maybeSingle()
    username = profile.username
    teacher = teacherRow || null
  }

  const [labeledComment] = labelComments(post, [{ ...created, username, role: profile.role, teacher }], user.id)
  return NextResponse.json({ comment: labeledComment })
})
