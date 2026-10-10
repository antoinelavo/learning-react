import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getCommunityUser, requireCommunityWriter, withCommunityErrors } from '@/lib/communityAuth'

export const PATCH = withCommunityErrors(async function PATCH(request, { params }) {
  const { id } = await params
  const { user, response } = await requireCommunityWriter(request)
  if (response) return response

  const { data: existing } = await supabaseAdmin
    .from('community_comments')
    .select('id, user_id, deleted_at')
    .eq('id', id)
    .maybeSingle()

  if (!existing || existing.deleted_at) {
    return NextResponse.json({ error: '댓글을 찾을 수 없습니다.' }, { status: 404 })
  }
  if (existing.user_id !== user.id) {
    return NextResponse.json({ error: '수정 권한이 없습니다.' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  if (typeof body?.content !== 'string' || !body.content.trim()) {
    return NextResponse.json({ error: '댓글 내용을 입력해주세요.' }, { status: 400 })
  }
  if (body.content.length > 1000) {
    return NextResponse.json({ error: '댓글은 1000자 이하로 입력해주세요.' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('community_comments')
    .update({ content: body.content.trim() })
    .eq('id', existing.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
})

export const DELETE = withCommunityErrors(async function DELETE(request, { params }) {
  const { id } = await params
  const user = await getCommunityUser(request)
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const { data: existing } = await supabaseAdmin
    .from('community_comments')
    .select('id, user_id, deleted_at')
    .eq('id', id)
    .maybeSingle()

  if (!existing || existing.deleted_at) {
    return NextResponse.json({ error: '댓글을 찾을 수 없습니다.' }, { status: 404 })
  }

  // Soft delete; an admin deleting someone else's comment marks it so the
  // thread shows "관리자에 의해 삭제된 댓글입니다."
  let byAdmin = false
  if (existing.user_id !== user.id) {
    const { data: userRow } = await supabaseAdmin.from('users').select('role').eq('id', user.id).single()
    if (userRow?.role !== 'admin') {
      return NextResponse.json({ error: '삭제 권한이 없습니다.' }, { status: 403 })
    }
    byAdmin = true
  }

  const { error } = await supabaseAdmin
    .from('community_comments')
    .update({ deleted_at: new Date().toISOString(), deleted_by_admin: byAdmin })
    .eq('id', existing.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
})
