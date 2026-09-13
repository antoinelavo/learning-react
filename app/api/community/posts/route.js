import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getCommunityUser, checkRateLimit } from '@/lib/communityAuth'
import { generateAnonNickname } from '@/lib/communityAnon'

const CATEGORIES = ['자유게시판', '질문답변', 'IB', 'SAT', '특례입학', '정보공유']
const PAGE_SIZE = 20
const HOT_THRESHOLD = { likes: 10, views: 200 } // used by the client to show a "HOT" badge

function generateSlug(title) {
  const base = title.trim().replace(/\s+/g, '-').slice(0, 50)
  return `${base}-${Date.now().toString(36)}`
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const q = searchParams.get('q')?.trim()
  const sort = searchParams.get('sort') === 'popular' ? 'popular' : 'latest'
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let query = supabase
    .from('community_posts_public')
    .select('*', { count: 'exact' })

  if (category && CATEGORIES.includes(category)) {
    query = query.eq('category', category)
  }
  if (q) {
    query = query.or(`title.ilike.%${q}%,content.ilike.%${q}%`)
  }

  query = sort === 'popular'
    ? query.order('like_count', { ascending: false }).order('created_at', { ascending: false })
    : query.order('created_at', { ascending: false })

  const { data, error, count } = await query.range(from, to)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // The public view strips user_id, so anonymous posts need a separate
  // service-role lookup to generate their nickname (never exposed as-is).
  const anonSlugs = (data || []).filter(p => p.is_anonymous).map(p => p.slug)
  let userIdBySlug = {}
  if (anonSlugs.length > 0) {
    const { data: rows } = await supabaseAdmin
      .from('community_posts')
      .select('slug, user_id')
      .in('slug', anonSlugs)
    userIdBySlug = Object.fromEntries((rows || []).map(r => [r.slug, r.user_id]))
  }

  const posts = (data || []).map(p => ({
    ...p,
    author_display_name: p.is_anonymous
      ? generateAnonNickname(p.id, userIdBySlug[p.slug])
      : (p.author_username || '알 수 없음'),
    is_hot: p.like_count >= HOT_THRESHOLD.likes || p.view_count >= HOT_THRESHOLD.views,
  }))

  return NextResponse.json({
    posts,
    page,
    pageSize: PAGE_SIZE,
    total: count ?? 0,
    hasMore: count != null ? to + 1 < count : false,
  })
}

export async function POST(request) {
  const user = await getCommunityUser(request)
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })

  const { title, category, content, is_anonymous, image_urls } = body

  if (!title?.trim() || !content?.trim()) {
    return NextResponse.json({ error: '제목과 내용을 입력해주세요.' }, { status: 400 })
  }
  if (title.trim().length > 100) {
    return NextResponse.json({ error: '제목은 100자 이하로 입력해주세요.' }, { status: 400 })
  }
  if (!CATEGORIES.includes(category)) {
    return NextResponse.json({ error: '올바른 카테고리를 선택해주세요.' }, { status: 400 })
  }
  const images = Array.isArray(image_urls) ? image_urls.filter(u => typeof u === 'string') : []
  if (images.length > 5) {
    return NextResponse.json({ error: '이미지는 최대 5개까지 첨부할 수 있습니다.' }, { status: 400 })
  }

  const withinLimit = await checkRateLimit('community_posts', 'user_id', user.id, 5, 60)
  if (!withinLimit) {
    return NextResponse.json({ error: '너무 빠르게 게시하고 있어요. 잠시 후 다시 시도해주세요.' }, { status: 429 })
  }

  const slug = generateSlug(title)

  const { data, error } = await supabaseAdmin
    .from('community_posts')
    .insert({
      slug,
      user_id: user.id,
      category,
      title: title.trim(),
      content: content.trim(),
      is_anonymous: !!is_anonymous,
      image_urls: images,
    })
    .select('slug')
    .single()

  if (error) {
    console.error('community post create error:', error)
    return NextResponse.json({ error: '게시 중 오류가 발생했습니다.' }, { status: 500 })
  }

  return NextResponse.json({ slug: data.slug })
}
