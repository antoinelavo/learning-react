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

export async function PUT(request, { params }) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { title, content, description, category, featured, published, date } = body

  const desc = description?.trim() ||
    (content ? content.trim().replace(/[#*\[\]`>]/g, '').slice(0, 150) : undefined)

  const updates = {}
  if (title !== undefined)     updates.title = title.trim()
  if (content !== undefined)   updates.content = content.trim()
  if (desc !== undefined)      updates.description = desc
  if (category !== undefined)  updates.category = category
  if (featured !== undefined)  updates.featured = featured
  if (published !== undefined) updates.published = published
  if (date !== undefined)      updates.date = date

  const { data, error } = await supabase
    .from('posts')
    .update(updates)
    .eq('id', params.id)
    .eq('type', 'admin')
    .select('id, slug')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(request, { params }) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', params.id)
    .eq('type', 'admin')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
