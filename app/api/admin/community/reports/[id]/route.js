import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAdminUser } from '@/lib/communityAuth'

// body: { status: 'resolved' | 'dismissed', deleteContent?: boolean }
export async function PATCH(request, { params }) {
  const admin = await requireAdminUser(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!['resolved', 'dismissed'].includes(body?.status)) {
    return NextResponse.json({ error: 'status must be resolved or dismissed' }, { status: 400 })
  }

  const { data: report, error: reportError } = await supabaseAdmin
    .from('community_reports')
    .update({ status: body.status, resolved_by: admin.id, resolved_at: new Date().toISOString() })
    .eq('id', params.id)
    .select('id, post_id, comment_id')
    .single()

  if (reportError) return NextResponse.json({ error: reportError.message }, { status: 500 })

  if (body.deleteContent) {
    if (report.post_id) {
      await supabaseAdmin
        .from('community_posts')
        .update({ deleted_at: new Date().toISOString(), content: '[삭제된 게시글]', image_urls: [] })
        .eq('id', report.post_id)
    } else if (report.comment_id) {
      await supabaseAdmin
        .from('community_comments')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', report.comment_id)
    }
  }

  return NextResponse.json({ success: true })
}
