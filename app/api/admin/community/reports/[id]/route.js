import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAdminUser, withCommunityErrors } from '@/lib/communityAuth'

// body: { status: 'resolved' | 'dismissed', deleteContent?: boolean }
export const PATCH = withCommunityErrors(async function PATCH(request, { params }) {
  const admin = await requireAdminUser(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const body = await request.json().catch(() => null)
  if (!['resolved', 'dismissed'].includes(body?.status)) {
    return NextResponse.json({ error: 'status must be resolved or dismissed' }, { status: 400 })
  }

  const { data: report, error: reportError } = await supabaseAdmin
    .from('community_reports')
    .update({ status: body.status, resolved_by: admin.id, resolved_at: new Date().toISOString() })
    .eq('id', id)
    .select('id, post_id, comment_id')
    .single()

  if (reportError) return NextResponse.json({ error: reportError.message }, { status: 500 })

  if (body.deleteContent) {
    if (report.post_id) {
      await supabaseAdmin
        .from('community_posts')
        .update({ deleted_at: new Date().toISOString(), deleted_by_admin: true, is_pinned: false })
        .eq('id', report.post_id)
        .is('deleted_at', null)
    } else if (report.comment_id) {
      await supabaseAdmin
        .from('community_comments')
        .update({ deleted_at: new Date().toISOString(), deleted_by_admin: true })
        .eq('id', report.comment_id)
        .is('deleted_at', null)
    }
  }

  return NextResponse.json({ success: true })
})
