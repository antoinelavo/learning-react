import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getCommunityUser, withCommunityErrors } from '@/lib/communityAuth'

// Korean, English letters/digits, and underscore; 2-20 chars — matches the
// character set already used by the signup form's username field.
const USERNAME_REGEX = /^[a-zA-Z0-9가-힣_]{2,20}$/

export const POST = withCommunityErrors(async function POST(request) {
  const user = await getCommunityUser(request)
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const username = body?.username?.trim()

  if (!username || !USERNAME_REGEX.test(username)) {
    return NextResponse.json(
      { error: '닉네임은 한글/영문/숫자/_ 를 사용해 2~20자로 입력해주세요.' },
      { status: 400 }
    )
  }

  const { data: existing } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('username', username)
    .maybeSingle()

  if (existing && existing.id !== user.id) {
    return NextResponse.json({ error: '이미 사용 중인 닉네임입니다.' }, { status: 409 })
  }

  const { error } = await supabaseAdmin
    .from('users')
    .update({ username })
    .eq('id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ username })
})
