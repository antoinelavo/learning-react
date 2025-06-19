import { useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'

export default function ProfilePage({ teacher }) {
  const [showContact, setShowContact] = useState(false)
  const router = useRouter()

  const handleContactClick = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    if (!showContact) {
      setShowContact(true)

      // bump click_count
      const { data: updated, error: fetchErr } = await supabase
        .from('teachers')
        .select('click_count')
        .eq('name', teacher.name)
        .single()

      if (!fetchErr && updated) {
        const newCount = (updated.click_count || 0) + 1
        const { error: updateErr } = await supabase
          .from('teachers')
          .update({ click_count: newCount })
          .eq('name', teacher.name)

        if (updateErr) console.error(updateErr)
      }
    } else {
      setShowContact(false)
    }
  }

  return (
    <>
      <Head>
        <title>{teacher.name} | IB 과외</title>
        <meta
          name="description"
          content={teacher.shortintroduction || '이 선생님의 프로필을 확인하세요.'}
        />
        <meta property="og:title" content={`${teacher.name} | IB 과외`} />
        <meta
          property="og:description"
          content={teacher.shortintroduction || ''}
        />
      </Head>

      <main className="max-w-3xl mx-auto px-4 py-10 space-y-8">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row bg-white rounded-xl shadow p-6 gap-6">
          <div className="w-32 h-32 relative flex-shrink-0">
            <img
              src={teacher.profile_picture || '/default-profile.png'}
              alt={`${teacher.name} 프로필 사진`}
              fill = "true"
              className="object-cover rounded-full"
            />
          </div>

          <div className="flex-1 flex flex-col md:flex-row">
            {/* Basic Info */}
            <div className="flex-1 space-y-2">
              <h1 className="text-2xl font-bold">{teacher.name}</h1>
              <h2 className="text-lg text-gray-500">{teacher.school}</h2>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                {teacher.gender && <span>{teacher.gender}</span>}
                {teacher.age && <span>{teacher.age}세</span>}
                {teacher.lesson_type && (
                  <span>{teacher.lesson_type.join(', ')}</span>
                )}
              </div>
            </div>

            {/* Lesson time & Subjects */}
            <div className="mt-4 md:mt-0 md:ml-6 flex-1 space-y-4">
              <div className="flex items-center text-gray-600 space-x-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5 flex-shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6h4" />
                </svg>
                <span>
                  {teacher.preferred_lesson_time || '시간 정보 없음'}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {teacher.subjects && teacher.subjects.length > 0
                  ? teacher.subjects.map((s) => (
                      <span
                        key={s}
                        className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {s}
                      </span>
                    ))
                  : <span className="text-gray-500">과목 정보 없음</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Description Sections */}
        <div className="space-y-8 bg-white rounded-xl shadow p-6 gap-6">
            <section>
            <h3 className="text-lg font-semibold mb-2">소개</h3>
            <div
                className="text-gray-700"
                dangerouslySetInnerHTML={{
                __html:
                    teacher.longintroduction ||
                    '<p>소개글이 없습니다.</p>',
                }}
            ></div>
            </section>

            <section>
            <h3 className="text-lg font-semibold mb-2">경력</h3>
            <div
                className="text-gray-700"
                dangerouslySetInnerHTML={{
                __html:
                    teacher.experience ||
                    '<p>경력 정보가 없습니다.</p>',
                }}
            ></div>
            </section>
        </div>
      </main>
    </>
  )
}

export async function getStaticPaths() {
  // fetch all approved teacher names
  const { data, error } = await supabase
    .from('teachers')
    .select('name')
    .eq('status', 'approved')

  if (error) throw error

  return {
    paths: data.map((t) => ({
      params: { name: t.name }
    })),
    fallback: 'blocking'
  }
}

export async function getStaticProps({ params }) {
  const { name } = params

  const { data: teacher, error } = await supabase
    .from('teachers')
    .select('*')
    .eq('name', name)
    .single()

  if (error || !teacher) {
    return { notFound: true }
  }

  return {
    props: { teacher },
    revalidate: 60
  }
}