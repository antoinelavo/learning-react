// pages/profile/[name].js

import Head from 'next/head';
import { useRouter } from 'next/router';
import ContactButton from './ContactButton';
import { supabase } from '@/lib/supabase';

// 1) Build‐time: pre-render every approved teacher
export async function getStaticPaths() {
  const { data: teachers = [] } = await supabase
    .from('teachers')
    .select('name')
    .eq('status', 'approved');

  const paths = teachers.map((t) => ({
    params: { name: encodeURIComponent(t.name) },
  }));

  return {
    paths,
    fallback: 'blocking',
  };
}

// 2) SSG + ISR: fetch profile data
export async function getStaticProps({ params }) {
  const decodedName = decodeURIComponent(params.name);
  const { data: teacher, error } = await supabase
    .from('teachers')
    .select('*')
    .eq('name', decodedName)
    .single();

  if (error || !teacher) {
    return { notFound: true };
  }

  return {
    props: { teacher },
    revalidate: 60,
  };
}

export default function ProfilePage({ teacher }) {
  const router = useRouter();
  if (router.isFallback) {
    return <p className="text-center p-6">로딩 중…</p>;
  }

  const description =
    teacher.shortintroduction || '이 선생님의 프로필을 확인하세요.';

  return (
    <>
      <Head>
        <title>{`${teacher.name} | IB 과외 선생님`}</title>
        <meta name="description" content={description} />
        <meta
          property="og:title"
          content={`${teacher.name} | IB 과외 선생님`}
        />
        <meta property="og:description" content={description} />
        <link rel="icon" href="/images/favicon.svg" />
      </Head>

      <main className="max-w-3xl mx-auto px-4 py-10 space-y-8">
        {/* Profile header */}
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 bg-white rounded-xl shadow p-6 flex flex-col items-center">
            <div className="w-32 h-32 mb-4">
              <img
                src={teacher.profile_picture || '/default-profile.png'}
                alt={`${teacher.name} 프로필 사진`}
                className="object-cover rounded-xl w-full h-full"
              />
            </div>
            <h1 className="text-2xl font-bold m-0 mb-1">{teacher.name}</h1>
            <h2 className="text-lg text-blue-500 text-center m-0 mb-1 text-balance">{teacher.school}</h2>
            <div className="flex flex-wrap gap-2 mt-3">
              {teacher.gender && (
                <span className="m-0 bg-gray-100 rounded-xl px-[8px] py-[2px]">{teacher.gender}</span>
              )}
              {teacher.age && <span className="m-0 bg-gray-100 rounded-xl px-[8px] py-[2px]">{teacher.age}세</span>}
              {teacher.lesson_type?.map((type) => (
                <span key={type} className="m-0 bg-gray-100 rounded-xl px-[8px] py-[2px]">
                  {type}
                </span>
              ))}
            </div>
          </div>

          <div className="flex-1 bg-white rounded-xl shadow p-6">
            <div className="mb-4 flex items-center w-fit gap-2 bg-gray-100 rounded-xl px-[8px] py-[2px]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M8 2v4" />
                <path d="M16 2v4" />
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M3 10h18" />
              </svg>
              {teacher.preferred_lesson_time}
            </div>
            <div className="flex flex-wrap gap-2">
              {teacher.subjects?.map((subj) => (
                <span key={subj} className="bg-gray-100 rounded-full px-[8px] py-[2px]">
                  {subj}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Introduction & Experience */}
        <div className="space-y-8 bg-white rounded-xl shadow p-6">
          <section>
            <h2 className="text-xl font-bold mb-2">소개</h2>
            <div
              className="text-gray-700 w-fit"
              dangerouslySetInnerHTML={{
                __html: teacher.longintroduction || '<p>소개글이 없습니다.</p>',
              }}
            />
          </section>
          <section>
            <h2 className="text-xl font-bold mb-2">경력</h2>
            <div
              className="text-gray-700"
              dangerouslySetInnerHTML={{
                __html: teacher.experience || '<p>경력 정보가 없습니다.</p>',
              }}
            />
          </section>

          <ContactButton teacherName={teacher.name} />
        </div>
      </main>
    </>
  );
}