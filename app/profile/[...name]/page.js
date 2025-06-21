// app/profile/[name]/page.js
import { notFound } from 'next/navigation';
import ContactButton from './ContactButton.client';
import { supabase } from '@/lib/supabase';

/**
 * Pre-generate paths for approved teachers
 */
export async function generateStaticParams() {
  const { data, error } = await supabase
    .from('teachers')
    .select('name')
    .eq('status', 'approved');
  if (error || !data) return [];
  return data.map((t) => ({ name: [encodeURIComponent(t.name)] }));
}

/**
 * Dynamic metadata based on teacher's short introduction
 */
export async function generateMetadata({ params }) {
  const p = await params;
  const rawName = p.name[0];
  const name    = decodeURIComponent(rawName);
  const { data: teacher } = await supabase
    .from('teachers')
    .select('shortintroduction')
    .eq('name', name)
    .single();
  const description = teacher?.shortintroduction || '이 선생님의 프로필을 확인하세요.';
  return {
    title: `${name} | IB 과외`,
    description,
    openGraph: { title: `${name} | IB 과외`, description },
  };
}

/**
 * Server Component for displaying profile
 */
export default async function ProfilePage({ params }) {
  const p = await params;
  const rawName = p.name[0];
  const name    = decodeURIComponent(rawName);
  const { data: teacher, error } = await supabase
    .from('teachers')
    .select('*')
    .eq('name', name)
    .single();
  if (error || !teacher) notFound();

  return (
    <main className="max-w-3xl mx-auto px-4 py-10 space-y-8">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Profile Header */}
        <div className="flex flex-col bg-white rounded-xl shadow p-6 gap-6 md:basis-1/2">

          {/* Image */}
          <div className="w-32 h-32 flex-shrink-0 mx-auto">
            <img
              src={teacher.profile_picture || '/default-profile.png'}
              alt={`${teacher.name} 프로필 사진`}
              className="object-cover rounded-xl w-full h-full"
            />
          </div>

          {/* Name, School, Gender, Age, Lesson Type Container */}
          <div className="flex-1 flex flex-col my-auto mx-auto w-max text-center items-center">
            <h1 className="text-2xl font-bold m-0 leading-relaxed">{teacher.name}</h1>
            <h2 className="text-lg text-blue-500 m-0 leading-relaxed text-balance max-w-[15em]">{teacher.school}</h2>
            <div className="flex flex-wrap gap-2 mt-3">
              {teacher.gender && (
                <span className="text-sm inline-block px-3 py-1 bg-gray-100 text-gray-800 rounded-full">
                  {teacher.gender}
                </span>
              )}
              {teacher.age && (
                <span className="text-sm inline-block px-3 py-1 bg-gray-100 text-gray-800 rounded-full">
                  {teacher.age}세
                </span>
              )}
              {teacher.lesson_type?.length > 0 && (
                teacher.lesson_type.map((type) => (
                  <span
                    key={type}
                    className="text-sm inline-block px-3 py-1 bg-gray-100 text-gray-800 rounded-full"
                  >
                    {type}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row bg-white rounded-xl shadow p-6 gap-6 md:basis-1/2">
          {/* Schedule and Subjects */}
          <div className="flex-1 flex flex-col my-auto">
            <span className="text-sm inline-block px-3 py-1 bg-gray-100 text-gray-800 rounded-full w-fit mb-4 flex flex-row gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-calendar-icon lucide-calendar my-auto"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>
              {teacher.preferred_lesson_time}
            </span>

            <div className="flex flex-wrap gap-2 mt-3">
              {teacher.subjects?.length > 0 && (
                teacher.subjects.map((type) => (
                  <span
                    key={type}
                    className="text-sm inline-block px-3 py-1 bg-gray-100 text-gray-800 rounded-full"
                  >
                    {type}
                  </span>
                ))
              )}
            </div>
            
          </div>

        </div>
      </div>


      {/* Description & Experience */}
      <div className="space-y-8 bg-white rounded-xl shadow p-[1.5em] md:p-[2em]">
        <section>
          <h2 className="text-lg font-bold text-xl leading-relaxed">소개</h2>
          <div
            className="text-gray-700"
            dangerouslySetInnerHTML={{ __html: teacher.longintroduction || '<p>소개글이 없습니다.</p>' }}
          />
        </section>
        <section>
          <h2 className="text-lg font-bold text-xl leading-relaxed">경력</h2>
          <div
            className="text-gray-700"
            dangerouslySetInnerHTML={{ __html: teacher.experience || '<p>경력 정보가 없습니다.</p>' }}
          />
        </section>
        
        {/* Contact button and count */}
        <ContactButton
          teacherName={teacher.name}
          contact={teacher.contact_info}
        />
      </div>


    </main>
  );
}