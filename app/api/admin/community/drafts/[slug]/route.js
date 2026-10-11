import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAdminUser, withCommunityErrors } from '@/lib/communityAuth'
import { communityMarkdownToHtml } from '@/lib/communityMarkdown'
import { decodeSlug } from '@/lib/community'

// One draft, with its body rendered exactly as the post page renders it.
export const GET = withCommunityErrors(async function GET(request, { params }) {
  const admin = await requireAdminUser(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const slug = decodeSlug((await params).slug)
  const { data: draft, error } = await supabaseAdmin
    .from('community_posts')
    .select('slug, title, content, category, categories, is_pinned, image_urls, created_at, updated_at, user_id')
    .eq('slug', slug)
    .eq('is_draft', true)
    .is('deleted_at', null)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!draft) return NextResponse.json({ error: '초안을 찾을 수 없습니다.' }, { status: 404 })

  // user_id references auth.users, so the author is a separate lookup.
  const { data: author } = await supabaseAdmin
    .from('users')
    .select('username, role')
    .eq('id', draft.user_id)
    .maybeSingle()

  const { content, user_id: _userId, ...rest } = draft
  return NextResponse.json({
    draft: { ...rest, author: author || null, html: await communityMarkdownToHtml(content) },
  })
})

// Discards a draft (soft delete, like every other community delete).
export const DELETE = withCommunityErrors(async function DELETE(request, { params }) {
  const admin = await requireAdminUser(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const slug = decodeSlug((await params).slug)
  const { data, error } = await supabaseAdmin
    .from('community_posts')
    .update({ deleted_at: new Date().toISOString(), deleted_by_admin: true, is_pinned: false })
    .eq('slug', slug)
    .eq('is_draft', true)
    .is('deleted_at', null)
    .select('slug')
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: '초안을 찾을 수 없습니다.' }, { status: 404 })
  return NextResponse.json({ success: true })
})
