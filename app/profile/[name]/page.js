// app/profile/[name]/page.js
import { notFound } from 'next/navigation';
import ContactButton from './ContactButton.client';
import { supabase } from '@/lib/supabase';

// 1) ISR: re‐generate pages in the background every 60s
export const revalidate = 60;

// 2) Build‐time: pre-render every approved teacher
export async function generateStaticParams() {
  const { data, error } = await supabase
    .from('teachers')
    .select('name')
    .eq('status', 'approved');

  if (error || !data) return [];

  // Return [{ name: '홍길동' }, { name: '김정연' }, …]
  return data.map((t) => ({
    // Next handles encoding the segment for you
    name: t.name
  }));
}

// 3) Dynamic metadata per profile
export async function generateMetadata({ params }) {
  const decodedName = decodeURIComponent(params.name);

  const { data: teacher, error } = await supabase
    .from('teachers')
    .select('shortintroduction')
    .eq('name', decodedName)
    .single();

  const description =
    teacher?.shortintroduction ??
    '이 선생님의 프로필을 확인하세요.';

  return {
    title: `${decodedName} | IB 과외 선생님`,
    description,
    openGraph: {
      title: `${decodedName} | IB 과외 선생님`,
      description,
    },
    icons: {
      icon: '/images/favicon.svg',
    },
  };
}

// 4) Page component: SSR-only, with decoded param
export default async function ProfilePage({ params }) {
  const decodedName = decodeURIComponent(params.name);

  const { data: teacher, error } = await supabase
    .from('teachers')
    .select('*')
    .eq('name', decodedName)
    .single();

  if (error || !teacher) {
    notFound();
  }

  return (
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
          <h1 className="text-2xl font-bold">{teacher.name}</h1>
          <h2 className="text-lg text-blue-500">{teacher.school}</h2>
          <div className="flex flex-wrap gap-2 mt-3">
            {teacher.gender && (
              <span className="badge">{teacher.gender}</span>
            )}
            {teacher.age && (
              <span className="badge">{teacher.age}세</span>
            )}
            {teacher.lesson_type?.map((type) => (
              <span key={type} className="badge">
                {type}
              </span>
            ))}
          </div>
        </div>

        <div className="flex-1 bg-white rounded-xl shadow p-6">
          <div className="badge mb-4 flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16" height="16"
              viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round"
            >
              <path d="M8 2v4"/>
              <path d="M16 2v4"/>
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <path d="M3 10h18"/>
            </svg>
            {teacher.preferred_lesson_time}
          </div>
          <div className="flex flex-wrap gap-2">
            {teacher.subjects?.map((subj) => (
              <span key={subj} className="badge">{subj}</span>
            ))}
          </div>
        </div>
      </div>

      {/* 소개 & 경력 */}
      <div className="space-y-8 bg-white rounded-xl shadow p-6">
        <section>
          <h2 className="text-xl font-bold mb-2">소개</h2>
          <div
            className="prose text-gray-700"
            dangerouslySetInnerHTML={{
              __html:
                teacher.longintroduction ||
                '<p>소개글이 없습니다.</p>',
            }}
          />
        </section>
        <section>
          <h2 className="text-xl font-bold mb-2">경력</h2>
          <div
            className="prose text-gray-700"
            dangerouslySetInnerHTML={{
              __html: teacher.experience || '<p>경력 정보가 없습니다.</p>',
            }}
          />
        </section>

        <ContactButton
          teacherName={teacher.name}
          contact={teacher.contact_info}
        />
      </div>
    </main>
  );
}