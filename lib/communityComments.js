// lib/communityComments.js
//
// Builds a post's comment tree as the public sees it. Shared by
// GET /api/community/posts/[slug]/comments (per viewer) and the post page,
// which server-renders the logged-out tree so comments are in the HTML.
// Server-only (service-role client). Output never contains user_id.
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { labelComments } from '@/lib/communityAnon'

// `post` needs { id, user_id, is_anonymous }. `viewer` is the logged-in user
// or null. Returns top-level comments, each with a `replies` array.
export async function buildCommentTree(post, viewer = null) {
  const { data: rawComments, error } = await supabaseAdmin
    .from('community_comments')
    .select('id, post_id, parent_comment_id, depth, user_id, content, is_anonymous, image_url, like_count, deleted_at, deleted_by_admin, created_at')
    .eq('post_id', post.id)
    .order('created_at', { ascending: true })

  if (error) throw error

  // Batch-fetch usernames + approved-teacher identity for non-anonymous
  // authors only.
  const nonAnonUserIds = [...new Set(
    (rawComments || []).filter(c => !c.is_anonymous && c.user_id).map(c => c.user_id)
  )]
  let usernameById = {}
  let roleById = {}
  let teacherByUserId = {}
  if (nonAnonUserIds.length > 0) {
    const [{ data: users }, { data: teachers }] = await Promise.all([
      supabaseAdmin.from('users').select('id, username, role').in('id', nonAnonUserIds),
      supabaseAdmin.from('teachers').select('user_id, name, profile_picture').eq('status', 'approved').eq('is_test', false).in('user_id', nonAnonUserIds),
    ])
    usernameById = Object.fromEntries((users || []).map(u => [u.id, u.username]))
    roleById = Object.fromEntries((users || []).map(u => [u.id, u.role]))
    teacherByUserId = Object.fromEntries((teachers || []).map(t => [t.user_id, t]))
  }

  const withUsername = (rawComments || []).map(c => ({
    ...c,
    username: usernameById[c.user_id],
    role: roleById[c.user_id] || null,
    teacher: teacherByUserId[c.user_id] || null,
  }))
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
    ? {
        ...c,
        content: c.deleted_by_admin ? '관리자에 의해 삭제된 댓글입니다.' : '삭제된 댓글입니다.',
        image_url: null,
        author_display_name: '[삭제됨]',
        is_teacher: false,
        author_role: null,
        author_profile_picture: null,
        author_profile_link: null,
      }
    : c
  )

  // Nest one level: top-level comments (depth 0) each carry a `replies` array.
  const topLevel = masked.filter(c => c.depth === 0)
  const replies = masked.filter(c => c.depth === 1)
  return topLevel.map(c => ({
    ...c,
    replies: replies.filter(r => r.parent_comment_id === c.id),
  }))
}

// The logged-out tree for a live post (by id), for server rendering.
export async function getPublicCommentTree(postId) {
  const { data: post, error } = await supabaseAdmin
    .from('community_posts')
    .select('id, user_id, is_anonymous')
    .eq('id', postId)
    .single()
  if (error) throw error
  return buildCommentTree(post, null)
}
