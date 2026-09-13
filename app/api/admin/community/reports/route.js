import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAdminUser } from '@/lib/communityAuth'

export async function GET(request) {
  const admin = await requireAdminUser(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') || 'pending'

  const { data: reports, error } = await supabaseAdmin
    .from('community_reports')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Attach a preview of the reported content.
  const postIds = [...new Set(reports.filter(r => r.post_id).map(r => r.post_id))]
  const commentIds = [...new Set(reports.filter(r => r.comment_id).map(r => r.comment_id))]

  const [{ data: posts }, { data: comments }] = await Promise.all([
    postIds.length
      ? supabaseAdmin.from('community_posts').select('id, slug, title, deleted_at').in('id', postIds)
      : Promise.resolve({ data: [] }),
    commentIds.length
      ? supabaseAdmin.from('community_comments').select('id, post_id, content, deleted_at').in('id', commentIds)
      : Promise.resolve({ data: [] }),
  ])

  const postById = Object.fromEntries((posts || []).map(p => [p.id, p]))
  const commentById = Object.fromEntries((comments || []).map(c => [c.id, c]))

  const enriched = reports.map(r => ({
    ...r,
    post: r.post_id ? postById[r.post_id] || null : null,
    comment: r.comment_id ? commentById[r.comment_id] || null : null,
  }))

  return NextResponse.json({ reports: enriched })
}
