import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAdminUser, withCommunityErrors } from '@/lib/communityAuth'
import { decodeSlug } from '@/lib/community'

// Publishes a draft: one-way flip of is_draft. created_at moves to now so
// the post lands at the top of the feed, dated on publish day. The filter
// on is_draft makes a repeat request a 404 instead of a second publish.
export const POST = withCommunityErrors(async function POST(request, { params }) {
  const admin = await requireAdminUser(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const slug = decodeSlug((await params).slug)
  const { data, error } = await supabaseAdmin
    .from('community_posts')
    .update({ is_draft: false, created_at: new Date().toISOString() })
    .eq('slug', slug)
    .eq('is_draft', true)
    .is('deleted_at', null)
    .select('slug')
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: '초안을 찾을 수 없습니다.' }, { status: 404 })
  return NextResponse.json({ slug: data.slug })
})
