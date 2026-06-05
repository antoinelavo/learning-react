import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

async function requireAdmin() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  return data?.role === 'admin' ? user : null
}

function generateSlug(title) {
  const base = title
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60)
  return `${base}-${Date.now().toString(36)}`
}

export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('posts')
    .select('id, slug, title, category, featured, published, type, date, created_at, views')
    .eq('type', 'admin')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { title, content, description, category, featured, published, slug: customSlug, date } = body

  if (!title?.trim() || !content?.trim()) {
    return NextResponse.json({ error: '제목과 내용을 입력해주세요.' }, { status: 400 })
  }

  const slug = customSlug?.trim() || generateSlug(title.trim())
  const desc = description?.trim() || content.trim().replace(/[#*\[\]`>]/g, '').slice(0, 150)

  const { data, error } = await supabase
    .from('posts')
    .insert({
      slug,
      title: title.trim(),
      description: desc,
      content: content.trim(),
      category: category || '일반',
      type: 'admin',
      featured: featured || false,
      published: published || false,
      user_id: admin.id,
      date: date || new Date().toISOString().slice(0, 10),
    })
    .select('id, slug')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
