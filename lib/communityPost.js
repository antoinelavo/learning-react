// lib/communityPost.js
//
// Server-side loader for the post page. Shared by generateMetadata and the
// page via React cache so the post is fetched once per request.
import { cache } from 'react'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { toPublicPost } from '@/lib/community'

// Returns { post } for a live post, { deleted: { byAdmin } } for a
// soft-deleted one, or null when the slug doesn't exist.
export const getCommunityPostPage = cache(async slug => {
  const { data: post } = await supabase
    .from('community_posts_public')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()

  if (post) return { post: toPublicPost(post) }

  try {
    const { data: row } = await supabaseAdmin
      .from('community_posts')
      .select('deleted_at, deleted_by_admin')
      .eq('slug', slug)
      .maybeSingle()
    if (row?.deleted_at) return { deleted: { byAdmin: !!row.deleted_by_admin } }
  } catch (err) {
    console.error('community post lookup error:', err)
  }
  return null
})
