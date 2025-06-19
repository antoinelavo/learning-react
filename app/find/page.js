// app/find/page.js
import TeacherList from './TeacherList';
import { supabase } from '@/lib/supabase';

export default async function FindPage() {
  const { data: initialTeachers, error } = await supabase
    .from('teachers')
    .select('*')
    .eq('status', 'approved')
    .order('created_date', { ascending: false })
    .limit(30);

  if (error) {
    console.error(error);
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="bg-white text-center border w-full h-fit mx-auto mb-6 py-6 px-4 border-gray-200 rounded-xl shadow-md">
        <h1 className="text-2xl font-bold mb-4">IB 과외 선생님 찾기</h1>
        <p className="text-md font-normal text-gray-500">
          과외 글 게시, 열람 비용 없이 원하는 IB 과외 선생님을 찾아보세요.
        </p>
      </div>

      {/* Flex wrapper: <aside> and <section> come from TeacherList */}
      <div className="flex flex-col md:flex-row">
        <TeacherList initialTeachers={initialTeachers || []} />
      </div>
    </main>
  );
}
