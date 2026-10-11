// lib/communityFeed.js
//
// Server-side feed query shared by /community and GET /api/community/posts.
// Reads only the community_posts_public view (anon key; the view strips
// user_id and hides deleted posts).
import { supabase } from '@/lib/supabase'
import {
  CATEGORY_LIST, PAGE_SIZE, BEST_DAYS, BEST_LIMIT,
  bestScore, sanitizeSearch, toPublicPost,
} from '@/lib/community'

function baseQuery(options) {
  return supabase.from('community_posts_public').select('*', options)
}

function applyFilters(query, { category, search }) {
  if (category) query = query.contains('categories', [category])
  if (search) query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`)
  return query
}

// tab: 'all' | 'best'. Returns { pinned, posts, page, totalPages, total }.
export async function getCommunityFeed({ tab = 'all', category, q, page } = {}) {
  const filters = {
    category: CATEGORY_LIST.includes(category) ? category : null,
    search: sanitizeSearch(q),
  }

  if (tab === 'best') {
    const since = new Date(Date.now() - BEST_DAYS * 24 * 60 * 60 * 1000).toISOString()
    const { data, error } = await applyFilters(baseQuery(), filters)
      .gte('created_at', since)
      .eq('is_pinned', false)
      .order('created_at', { ascending: false })
      .limit(1000)
    if (error) throw error

    const posts = (data || [])
      .sort((a, b) => bestScore(b) - bestScore(a))
      .slice(0, BEST_LIMIT)
      .map(toPublicPost)
    return { pinned: [], posts, page: 1, totalPages: 1, total: posts.length }
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1)
  const from = (pageNum - 1) * PAGE_SIZE

  // Notices sit above the first page of a board (or of 전체), not in search.
  // Both queries run in parallel to save a round trip.
  const wantPinned = pageNum === 1 && !filters.search
  const [postsResult, pinnedResult] = await Promise.all([
    applyFilters(baseQuery({ count: 'exact' }), filters)
      .eq('is_pinned', false)
      .order('created_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1),
    wantPinned
      ? applyFilters(baseQuery(), { category: filters.category })
          .eq('is_pinned', true)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [] }),
  ])
  if (postsResult.error) throw postsResult.error
  if (pinnedResult.error) throw pinnedResult.error

  const { data, count } = postsResult
  const pinned = (pinnedResult.data || []).map(toPublicPost)

  const total = count ?? 0
  return {
    pinned,
    posts: (data || []).map(toPublicPost),
    page: pageNum,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    total,
  }
}
