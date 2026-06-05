import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

function generateSlug(title) {
  const base = title
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 50)
  return `${base}-${Date.now().toString(36)}`
}

export async function POST(request) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const body = await request.json()
    const { title, category, content } = body

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json({ error: '제목과 내용을 입력해주세요.' }, { status: 400 })
    }

    const validCategories = ['IB', 'SAT', '특례입학', '일반']
    if (!validCategories.includes(category)) {
      return NextResponse.json({ error: '올바른 카테고리를 선택해주세요.' }, { status: 400 })
    }

    const slug = generateSlug(title.trim())
    const description = content.trim().replace(/[#*\[\]`>]/g, '').slice(0, 150)

    const { data, error } = await supabase
      .from('posts')
      .insert({
        slug,
        title: title.trim(),
        description,
        content: content.trim(),
        category,
        type: 'user',
        published: true,
        user_id: user.id,
        date: new Date().toISOString().slice(0, 10),
      })
      .select('slug')
      .single()

    if (error) throw error

    return NextResponse.json({ slug: data.slug })
  } catch (err) {
    console.error('community post create error:', err)
    return NextResponse.json({ error: '게시 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
