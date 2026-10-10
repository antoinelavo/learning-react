import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAdminUser, loadAuthors, withCommunityErrors } from '@/lib/communityAuth'

export const GET = withCommunityErrors(async function GET(request) {
  const admin = await requireAdminUser(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const status = ['pending', 'resolved', 'dismissed'].includes(searchParams.get('status'))
    ? searchParams.get('status')
    : 'pending'

  const { data: reports, error } = await supabaseAdmin
    .from('community_reports')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Attach a preview of the reported content.
  const postIds = [...new Set(reports.filter(r => r.post_id).map(r => r.post_id))]
  const commentIds = [...new Set(reports.filter(r => r.comment_id).map(r => r.comment_id))]

  const [{ data: posts }, { data: comments }] = await Promise.all([
    postIds.length
      ? supabaseAdmin.from('community_posts').select('id, slug, title, user_id, is_anonymous, deleted_at').in('id', postIds)
      : Promise.resolve({ data: [] }),
    commentIds.length
      ? supabaseAdmin.from('community_comments').select('id, post_id, user_id, is_anonymous, content, deleted_at, post:community_posts(slug)').in('id', commentIds)
      : Promise.resolve({ data: [] }),
  ])

  const postById = Object.fromEntries((posts || []).map(p => [p.id, p]))
  const commentById = Object.fromEntries((comments || []).map(c => [c.id, c]))

  // Real authors (including anonymous ones) so admins can ban from here.
  const authorById = await loadAuthors([...(posts || []), ...(comments || [])].map(x => x.user_id))

  const enriched = reports.map(r => {
    const post = r.post_id ? postById[r.post_id] || null : null
    const comment = r.comment_id ? commentById[r.comment_id] || null : null
    const authorId = post?.user_id || comment?.user_id
    return { ...r, post, comment, author: authorId ? authorById[authorId] || null : null }
  })

  return NextResponse.json({ reports: enriched })
})
