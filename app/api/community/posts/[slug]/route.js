import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import {
  getCommunityUser, requireCommunityWriter, getClientIp, withCommunityErrors,
} from '@/lib/communityAuth'
import { CATEGORY_LIST, isCommunityImageUrl, toPublicPost } from '@/lib/community'

export const GET = withCommunityErrors(async function GET(request, { params }) {
  const { slug } = await params

  const { data: post, error } = await supabase
    .from('community_posts_public')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()

  if (error || !post) {
    return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 })
  }

  const viewer = await getCommunityUser(request)

  // Deduped to one view per visitor per post per day (visitor = user id, or
  // best-effort IP when logged out). Awaited so the serverless function
  // doesn't freeze before the RPC is sent.
  const viewerKey = viewer ? `user:${viewer.id}` : `ip:${getClientIp(request)}`
  await supabaseAdmin.rpc('record_community_post_view', { p_post_id: post.id, p_viewer_key: viewerKey })

  let isMine = false
  let liked = false
  let scrapped = false
  if (viewer) {
    const [{ data: ownerRow }, { data: likeRow }, { data: scrapRow }] = await Promise.all([
      supabaseAdmin.from('community_posts').select('user_id').eq('id', post.id).single(),
      supabaseAdmin.from('community_post_likes').select('post_id').eq('post_id', post.id).eq('user_id', viewer.id).maybeSingle(),
      supabaseAdmin.from('community_post_scraps').select('post_id').eq('post_id', post.id).eq('user_id', viewer.id).maybeSingle(),
    ])
    isMine = ownerRow?.user_id === viewer.id
    liked = !!likeRow
    scrapped = !!scrapRow
  }

  return NextResponse.json({ ...toPublicPost(post), is_mine: isMine, liked, scrapped })
})

export const PATCH = withCommunityErrors(async function PATCH(request, { params }) {
  const { slug } = await params
  const { user, response } = await requireCommunityWriter(request)
  if (response) return response

  const { data: existing } = await supabaseAdmin
    .from('community_posts')
    .select('id, user_id, deleted_at')
    .eq('slug', slug)
    .maybeSingle()

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
    if (typeof body.title !== 'string' || !body.title.trim()) {
      return NextResponse.json({ error: '제목을 입력해주세요.' }, { status: 400 })
    }
    if (body.title.trim().length > 100) {
      return NextResponse.json({ error: '제목은 100자 이하로 입력해주세요.' }, { status: 400 })
    }
    updates.title = body.title.trim()
  }
  if (body.content !== undefined) {
    if (typeof body.content !== 'string' || !body.content.trim()) {
      return NextResponse.json({ error: '내용을 입력해주세요.' }, { status: 400 })
    }
    if (body.content.length > 20000) {
      return NextResponse.json({ error: '내용은 20,000자 이하로 입력해주세요.' }, { status: 400 })
    }
    updates.content = body.content.trim()
  }
  if (body.category !== undefined) {
    if (!CATEGORY_LIST.includes(body.category)) {
      return NextResponse.json({ error: '올바른 카테고리를 선택해주세요.' }, { status: 400 })
    }
    updates.category = body.category
  }
  if (body.is_anonymous !== undefined) updates.is_anonymous = !!body.is_anonymous
  if (Array.isArray(body.image_urls)) {
    const images = body.image_urls.filter(isCommunityImageUrl)
    if (images.length > 5) {
      return NextResponse.json({ error: '이미지는 최대 5개까지 첨부할 수 있습니다.' }, { status: 400 })
    }
    updates.image_urls = images
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

// Owners and admins can delete. Soft delete; an admin deleting someone
// else's post marks it so the page shows "관리자에 의해 삭제된 게시글입니다."
export const DELETE = withCommunityErrors(async function DELETE(request, { params }) {
  const { slug } = await params
  const user = await getCommunityUser(request)
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const { data: existing } = await supabaseAdmin
    .from('community_posts')
    .select('id, user_id, deleted_at')
    .eq('slug', slug)
    .maybeSingle()

  if (!existing || existing.deleted_at) {
    return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 })
  }

  let byAdmin = false
  if (existing.user_id !== user.id) {
    const { data: userRow } = await supabaseAdmin.from('users').select('role').eq('id', user.id).single()
    if (userRow?.role !== 'admin') return NextResponse.json({ error: '삭제 권한이 없습니다.' }, { status: 403 })
    byAdmin = true
  }

  const { error } = await supabaseAdmin
    .from('community_posts')
    .update({ deleted_at: new Date().toISOString(), deleted_by_admin: byAdmin, is_pinned: false })
    .eq('id', existing.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
})
