import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireCommunityWriter, checkRateLimit, withCommunityErrors } from '@/lib/communityAuth'
import { getCommunityFeed } from '@/lib/communityFeed'
import { CATEGORY_LIST, isCommunityImageUrl } from '@/lib/community'

function generateSlug(title) {
  const base = title.trim().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '').slice(0, 50)
  return `${base || 'post'}-${Date.now().toString(36)}`
}

export const GET = withCommunityErrors(async function GET(request) {
  const { searchParams } = new URL(request.url)
  const feed = await getCommunityFeed({
    tab: searchParams.get('tab') === 'best' ? 'best' : 'all',
    category: searchParams.get('category'),
    q: searchParams.get('q'),
    page: searchParams.get('page'),
  })
  return NextResponse.json(feed)
})

export const POST = withCommunityErrors(async function POST(request) {
  const { user, response } = await requireCommunityWriter(request)
  if (response) return response

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })

  const { title, category, content, is_anonymous, image_urls } = body

  if (typeof title !== 'string' || typeof content !== 'string' || !title.trim() || !content.trim()) {
    return NextResponse.json({ error: '제목과 내용을 입력해주세요.' }, { status: 400 })
  }
  if (title.trim().length > 100) {
    return NextResponse.json({ error: '제목은 100자 이하로 입력해주세요.' }, { status: 400 })
  }
  if (content.length > 20000) {
    return NextResponse.json({ error: '내용은 20,000자 이하로 입력해주세요.' }, { status: 400 })
  }
  if (!CATEGORY_LIST.includes(category)) {
    return NextResponse.json({ error: '올바른 카테고리를 선택해주세요.' }, { status: 400 })
  }
  const images = Array.isArray(image_urls) ? image_urls.filter(isCommunityImageUrl) : []
  if (images.length > 5) {
    return NextResponse.json({ error: '이미지는 최대 5개까지 첨부할 수 있습니다.' }, { status: 400 })
  }

  const withinLimit = await checkRateLimit('community_posts', 'user_id', user.id, 5, 60)
  if (!withinLimit) {
    return NextResponse.json({ error: '너무 빠르게 게시하고 있어요. 잠시 후 다시 시도해주세요.' }, { status: 429 })
  }

  const { data, error } = await supabaseAdmin
    .from('community_posts')
    .insert({
      slug: generateSlug(title),
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
})
