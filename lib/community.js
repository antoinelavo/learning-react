// lib/community.js
//
// Shared community constants and helpers, safe to import from both server
// and client code (no Supabase or Node imports).

export const CATEGORY_LIST = ['자유게시판', '질문답변', 'IB', 'SAT', '특례입학', '정보공유']
export const PAGE_SIZE = 20
export const MAX_CATEGORIES = 3

// Validates a post's boards: unique, known, 1–MAX_CATEGORIES. Returns the
// cleaned list, or null if invalid. Accepts a single legacy `category`.
export function normalizeCategories(categories, category) {
  const list = Array.isArray(categories) ? categories : category ? [category] : []
  const unique = [...new Set(list)].filter(c => CATEGORY_LIST.includes(c))
  if (unique.length !== list.length || unique.length < 1 || unique.length > MAX_CATEGORIES) return null
  return unique
}

// A post's boards, falling back to the legacy single category.
export function postCategories(post) {
  return post?.categories?.length ? post.categories : post?.category ? [post.category] : []
}

export const BEST_DAYS = 7
export const BEST_LIMIT = 20
export const PERMANENT_BAN_UNTIL = '9999-12-31T00:00:00Z'

// Builds a /community URL from feed state, dropping defaults.
export function communityHref({ tab, category, q, page } = {}) {
  const params = new URLSearchParams()
  if (tab === 'best') params.set('tab', 'best')
  if (category) params.set('category', category)
  if (q) params.set('q', q)
  if (page && page > 1) params.set('page', String(page))
  const qs = params.toString()
  return qs ? `/community?${qs}` : '/community'
}

// 인기글 ranking: likes weigh most, then comments, then views.
export function bestScore(p) {
  return (p.like_count || 0) * 3 + (p.comment_count || 0) * 2 + (p.view_count || 0) / 10
}

// Adds display fields to a row from community_posts_public.
export function toPublicPost(p) {
  const isTeacher = !p.is_anonymous && !!p.teacher_name
  return {
    ...p,
    author_display_name: p.is_anonymous ? '익명' : (p.teacher_name || p.author_username || '이름없는 회원'),
    is_teacher: isTeacher,
    author_profile_picture: isTeacher ? (p.teacher_profile_picture || null) : null,
    author_profile_link: isTeacher ? `/profile/${encodeURIComponent(p.teacher_name)}` : null,
  }
}

// Strips characters that would break a PostgREST `or=(...)` filter or act
// as ilike wildcards, so user search text is matched literally.
export function sanitizeSearch(q) {
  return (q || '').replace(/[,()\\%_*"'.:]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 50)
}

export function stripMarkdown(text, length = 100) {
  return (text || '').replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/[#*_`>\[\]]/g, '').replace(/\s+/g, ' ').trim().slice(0, length)
}

// YYYY-MM-DD in Korea time.
export function formatKstDate(value) {
  return new Date(value).toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' })
}

export function banMessage(bannedUntil) {
  return `커뮤니티 이용이 제한되었습니다 (${formatKstDate(bannedUntil)}까지)`
}

// Only images uploaded through /api/community/images may be attached.
export function isCommunityImageUrl(url) {
  const base = process.env.NEXT_PUBLIC_R2_PUBLIC_URL
  return typeof url === 'string' && !!base && url.startsWith(`${base}/community/`)
}

// Route params for non-ASCII slugs (e.g. 안녕하세요-xxxx) can arrive still
// percent-encoded on Vercel. Slugs never contain '%' (generateSlug keeps
// only letters, digits and '-'), so decoding is safe; fall back to the raw
// value if it isn't valid encoding.
export function decodeSlug(slug) {
  try {
    return decodeURIComponent(slug)
  } catch {
    return slug
  }
}
