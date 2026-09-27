import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getCommunityUser, getClientIp, withCommunityErrors } from '@/lib/communityAuth'

const CATEGORIES = ['자유게시판', '질문답변', 'IB', 'SAT', '특례입학', '정보공유']

export const GET = withCommunityErrors(async function GET(request, { params }) {
  const { slug } = params

  const { data: post, error } = await supabase
    .from('community_posts_public')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !post) {
    return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 })
  }

  const viewer = await getCommunityUser(request)

  // Fire-and-forget, deduped to one view per visitor per post per day
  // (visitor = logged-in user id, or best-effort IP when logged out).
  const viewerKey = viewer ? `user:${viewer.id}` : `ip:${getClientIp(request)}`
  supabase.rpc('record_community_post_view', { p_post_id: post.id, p_viewer_key: viewerKey }).then(() => {})

  const { data: ownerRow } = await supabaseAdmin
    .from('community_posts')
    .select('id, user_id')
    .eq('slug', slug)
    .single()

  const isMine = !!(viewer && ownerRow && ownerRow.user_id === viewer.id)

  let liked = false
  if (viewer && ownerRow) {
    const { data: likeRow } = await supabaseAdmin
      .from('community_post_likes')
      .select('post_id')
      .eq('post_id', ownerRow.id)
      .eq('user_id', viewer.id)
      .maybeSingle()
    liked = !!likeRow
  }

  const isTeacher = !post.is_anonymous && !!post.teacher_name

  return NextResponse.json({
    ...post,
    author_display_name: post.is_anonymous ? '익명' : (post.teacher_name || post.author_username || '이름없는 회원'),
    is_teacher: isTeacher,
    author_profile_picture: isTeacher ? (post.teacher_profile_picture || null) : null,
    author_profile_link: isTeacher ? `/profile/${encodeURIComponent(post.teacher_name)}` : null,
    is_mine: isMine,
    liked,
  })
})

export const PATCH = withCommunityErrors(async function PATCH(request, { params }) {
  const user = await getCommunityUser(request)
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const { data: existing } = await supabaseAdmin
    .from('community_posts')
    .select('id, user_id, deleted_at')
    .eq('slug', params.slug)
    .single()

  if (!existing || existing.deleted_at) {
    return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 })
  }
  if (existing.user_id !== user.id) {
    return NextResponse.json({ error: '수정 권한이 없습니다.' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })

  const updates = {}
  if (body.title !== undefined) {
    if (!body.title.trim()) return NextResponse.json({ error: '제목을 입력해주세요.' }, { status: 400 })
    updates.title = body.title.trim()
  }
  if (body.content !== undefined) {
    if (!body.content.trim()) return NextResponse.json({ error: '내용을 입력해주세요.' }, { status: 400 })
    updates.content = body.content.trim()
  }
  if (body.category !== undefined) {
    if (!CATEGORIES.includes(body.category)) {
      return NextResponse.json({ error: '올바른 카테고리를 선택해주세요.' }, { status: 400 })
    }
    updates.category = body.category
  }
  if (body.is_anonymous !== undefined) updates.is_anonymous = !!body.is_anonymous
  if (Array.isArray(body.image_urls)) {
    if (body.image_urls.length > 5) {
      return NextResponse.json({ error: '이미지는 최대 5개까지 첨부할 수 있습니다.' }, { status: 400 })
    }
    updates.image_urls = body.image_urls.filter(u => typeof u === 'string')
  }

  const { data, error } = await supabaseAdmin
    .from('community_posts')
    .update(updates)
    .eq('id', existing.id)
    .select('slug')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
})

export const DELETE = withCommunityErrors(async function DELETE(request, { params }) {
  const user = await getCommunityUser(request)
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const { data: existing } = await supabaseAdmin
    .from('community_posts')
    .select('id, user_id, deleted_at')
    .eq('slug', params.slug)
    .single()

  if (!existing || existing.deleted_at) {
    return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 })
  }

  let isAdmin = false
  if (existing.user_id !== user.id) {
    const { data: userRow } = await supabaseAdmin.from('users').select('role').eq('id', user.id).single()
    isAdmin = userRow?.role === 'admin'
    if (!isAdmin) return NextResponse.json({ error: '삭제 권한이 없습니다.' }, { status: 403 })
  }

  const { error } = await supabaseAdmin
    .from('community_posts')
    .update({ deleted_at: new Date().toISOString(), content: '[삭제된 게시글]', image_urls: [] })
    .eq('id', existing.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
})
