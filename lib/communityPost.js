// lib/communityPost.js
//
// Server-side loader for the post page. Shared by generateMetadata and the
// page via React cache so the post is fetched once per request.
import { cache } from 'react'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { toPublicPost } from '@/lib/community'

// Returns { post } for a live post, { deleted: { byAdmin } } for a
// soft-deleted one, or null when the slug doesn't exist or is an admin draft.
// Query errors throw (a 500), so an outage never looks like a missing post
// (a 404 tells search engines to drop the URL).
export const getCommunityPostPage = cache(async slug => {
  const { data: post, error } = await supabase
    .from('community_posts_public')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()
  if (error) throw new Error(`community post lookup failed: ${error.message}`)

  if (post) return { post: toPublicPost(post) }

  const { data: row, error: rowError } = await supabaseAdmin
    .from('community_posts')
    .select('deleted_at, deleted_by_admin, is_draft')
    .eq('slug', slug)
    .maybeSingle()
  if (rowError) throw new Error(`community post lookup failed: ${rowError.message}`)

  if (row?.deleted_at && !row.is_draft) return { deleted: { byAdmin: !!row.deleted_by_admin } }
  return null
})
