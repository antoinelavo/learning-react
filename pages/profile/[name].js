// pages/profile/[name].js

import Head from 'next/head';
import { useState } from 'react';
import { useRouter } from 'next/router';
import ContactButton from './ContactButton';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';

const MOBILE_SUBJECT_LIMIT = 6;

// 1) Build‐time: pre-render every approved teacher
export async function getStaticPaths() {
  // Supabase returns data: null (not undefined) on a query error, so a
  // `= []` default in the destructure never kicks in — guard explicitly,
  // or a transient query error crashes the entire production build.
  const { data, error } = await supabase
    .from('teachers')
    .select('name')
    .eq('status', 'approved');

  if (error) {
    console.error('getStaticPaths: failed to fetch approved teachers', error);
  }

  const paths = (data || []).map((t) => ({
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
  const { user, role } = useAuth();
  const { openChatWithTeacher } = useChat();
  const [showAllSubjects, setShowAllSubjects] = useState(false);

  if (router.isFallback) {
    return <p className="text-center p-6">로딩 중…</p>;
  }

  const isOwnProfile = user?.id === teacher.user_id;
  const canMessage = !isOwnProfile && role !== 'teacher';
  const subjects = teacher.subjects || [];
  const visibleMobileSubjects = showAllSubjects ? subjects : subjects.slice(0, MOBILE_SUBJECT_LIMIT);
  const hiddenSubjectCount = subjects.length - visibleMobileSubjects.length;

  const handleMessage = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    try {
      await openChatWithTeacher(teacher.user_id);
    } catch (err) {
      console.error(err);
      alert('메시지를 시작할 수 없습니다. 잠시 후 다시 시도해주세요.');
    }
  };

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
        <link rel="icon" href="/images/favicon.ico" />
      </Head>

      <main className="max-w-3xl mx-auto px-4 pt-6 md:pt-10 pb-24 md:pb-10 space-y-6 md:space-y-8">
        {/* Profile header — one merged card on mobile, two side-by-side cards on desktop */}
        <div className="flex flex-col md:flex-row gap-0 md:gap-6 bg-white md:bg-transparent rounded-xl md:rounded-none shadow md:shadow-none">
          <div className="flex-1 p-4 md:p-6 md:bg-white md:rounded-xl md:shadow flex flex-row md:flex-col items-center gap-4 md:gap-0">
            <div className="w-20 h-20 md:w-32 md:h-32 md:mb-4 flex-shrink-0">
              <img
                src={teacher.profile_picture || 'https://ibmaster.antoinelavo.com/teachers/default.jpg'}
                alt={`${teacher.name} 프로필 사진`}
                className="object-cover rounded-xl w-full h-full"
              />
            </div>
            <div className="flex flex-col items-start md:items-center min-w-0 flex-1">
              <h1 className="text-lg md:text-2xl font-bold m-0 mb-1 truncate max-w-full">{teacher.name}</h1>
              <h2 className="text-sm md:text-lg text-blue-500 md:text-center m-0 mb-1 text-balance">{teacher.school}</h2>
              <div className="flex flex-wrap gap-1.5 md:gap-2 mt-2 md:mt-3">
                {teacher.gender && (
                  <span className="m-0 bg-gray-100 rounded-xl px-[8px] py-[2px] text-xs md:text-sm">{teacher.gender}</span>
                )}
                {teacher.age && <span className="m-0 bg-gray-100 rounded-xl px-[8px] py-[2px] text-xs md:text-sm">{teacher.age}세</span>}
                {teacher.lesson_type?.map((type) => (
                  <span key={type} className="m-0 bg-gray-100 rounded-xl px-[8px] py-[2px] text-xs md:text-sm">
                    {type}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-1 p-4 md:p-6 md:bg-white md:rounded-xl md:shadow border-t border-gray-100 md:border-0">
            <div className="mb-2 md:mb-4 flex items-center w-fit gap-2 bg-gray-100 rounded-xl px-[8px] py-[2px] text-sm">
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

            {/* Mobile: capped list with a show-more toggle so long subject lists don't push the buttons down */}
            <div className="md:hidden flex flex-wrap gap-1.5">
              {visibleMobileSubjects.map((subj) => (
                <span key={subj} className="bg-gray-100 rounded-full px-[8px] py-[2px] text-sm">
                  {subj}
                </span>
              ))}
              {hiddenSubjectCount > 0 && (
                <button
                  onClick={() => setShowAllSubjects(true)}
                  className="text-blue-600 font-medium text-sm px-[8px] py-[2px]"
                >
                  +{hiddenSubjectCount}개 더보기
                </button>
              )}
            </div>
            {/* Desktop: full list, no collapsing */}
            <div className="hidden md:flex flex-wrap gap-2">
              {subjects.map((subj) => (
                <span key={subj} className="bg-gray-100 rounded-full px-[8px] py-[2px]">
                  {subj}
                </span>
              ))}
            </div>

            <div className="mt-4 md:mt-10 flex flex-col sm:flex-row gap-2">
              <ContactButton teacherName={teacher.name} contactInfo={teacher.contact_information} />
              {canMessage && (
                <button
                  onClick={handleMessage}
                  className="hidden md:inline-block self-start px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors"
                >
                  메시지 보내기
                </button>
              )}
            </div>

          </div>
        </div>

        {/* Introduction & Experience */}
        <div className="richtext-mobile-tight space-y-6 md:space-y-8 bg-white rounded-xl shadow p-4 md:p-6">
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
        </div>
      </main>

      {/* Mobile-only sticky message CTA — the inline button above is hidden on mobile in favor of this */}
      {canMessage && (
        <div
          className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200 p-3"
          style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
        >
          <button
            onClick={handleMessage}
            className="w-full px-4 py-3 rounded-lg bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition-colors"
          >
            메시지 보내기
          </button>
        </div>
      )}
    </>
  );
}