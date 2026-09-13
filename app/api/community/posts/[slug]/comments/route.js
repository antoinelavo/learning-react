import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getCommunityUser, checkRateLimit } from '@/lib/communityAuth'
import { labelComments } from '@/lib/communityAnon'

async function getPost(slug) {
  const { data } = await supabaseAdmin
    .from('community_posts')
    .select('id, user_id, is_anonymous, deleted_at')
    .eq('slug', slug)
    .single()
  return data
}

export async function GET(request, { params }) {
  const post = await getPost(params.slug)
  if (!post || post.deleted_at) {
    return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 })
  }

  const { data: rawComments, error } = await supabaseAdmin
    .from('community_comments')
    .select('id, post_id, parent_comment_id, depth, user_id, content, is_anonymous, image_url, like_count, deleted_at, created_at')
    .eq('post_id', post.id)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Batch-fetch usernames for non-anonymous authors only.
  const nonAnonUserIds = [...new Set(
    (rawComments || []).filter(c => !c.is_anonymous && c.user_id).map(c => c.user_id)
  )]
  let usernameById = {}
  if (nonAnonUserIds.length > 0) {
    const { data: users } = await supabaseAdmin
      .from('users')
      .select('id, username')
      .in('id', nonAnonUserIds)
    usernameById = Object.fromEntries((users || []).map(u => [u.id, u.username]))
  }

  const viewer = await getCommunityUser(request)
  const withUsername = (rawComments || []).map(c => ({ ...c, username: usernameById[c.user_id] }))
  const labeled = labelComments(post, withUsername, viewer?.id ?? null)

  // Batch-fetch which of these comments the viewer has liked.
  let likedIds = new Set()
  if (viewer && rawComments?.length) {
    const { data: likeRows } = await supabaseAdmin
      .from('community_comment_likes')
      .select('comment_id')
      .eq('user_id', viewer.id)
      .in('comment_id', rawComments.map(c => c.id))
    likedIds = new Set((likeRows || []).map(r => r.comment_id))
  }
  const withLiked = labeled.map(c => ({ ...c, liked: likedIds.has(c.id) }))

  // Mask deleted comments' content but keep them in the tree so replies
  // aren't orphaned.
  const masked = withLiked.map(c => c.deleted_at
    ? { ...c, content: '[삭제된 댓글]', image_url: null, author_display_name: '[삭제됨]' }
    : c
  )

  // Nest one level: top-level comments (depth 0) each carry a `replies` array.
  const topLevel = masked.filter(c => c.depth === 0)
  const replies = masked.filter(c => c.depth === 1)
  const tree = topLevel.map(c => ({
    ...c,
    replies: replies.filter(r => r.parent_comment_id === c.id),
  }))

  return NextResponse.json({ comments: tree })
}

export async function POST(request, { params }) {
  const user = await getCommunityUser(request)
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const post = await getPost(params.slug)
  if (!post || post.deleted_at) {
    return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 })
  }

  const body = await request.json().catch(() => null)
  if (!body?.content?.trim()) {
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
      .single()

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
      image_url: typeof body.image_url === 'string' ? body.image_url : null,
    })
    .select('id, post_id, parent_comment_id, depth, user_id, content, is_anonymous, image_url, like_count, created_at')
    .single()

  if (error) {
    console.error('community comment create error:', error)
    return NextResponse.json({ error: '댓글 작성 중 오류가 발생했습니다.' }, { status: 500 })
  }

  let username = null
  if (!created.is_anonymous) {
    const { data: userRow } = await supabaseAdmin.from('users').select('username').eq('id', user.id).single()
    username = userRow?.username ?? null
  }

  const [labeledComment] = labelComments(post, [{ ...created, username }], user.id)
  return NextResponse.json({ comment: labeledComment })
}
