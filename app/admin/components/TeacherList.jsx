'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

const batchSize = 10;

export default function TeacherList() {
  const [teachers, setTeachers] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    async function loadTeachers() {
      const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .eq('status', 'pending');

      if (!error && data) {
        setTeachers(shuffleArray(data));
        setCurrentIndex(0);
      }
    }

    loadTeachers();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  function shuffleArray(array) {
    return array.sort(() => Math.random() - 0.5);
  }

  async function approveTeacher(id) {
    const today = new Date().toISOString().split('T')[0];
    const { error } = await supabase
      .from('teachers')
      .update({ status: 'approved', last_updated: today })
      .eq('id', id);

    if (!error) {
      setTeachers((prev) => prev.filter((t) => t.id !== id));
    } else {
      alert('❌ 승인 중 오류가 발생했습니다.');
      console.error(error);
    }
  }

  function handleScroll() {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100) {
      setCurrentIndex((prev) => prev + batchSize);
    }
  }

  const visibleTeachers = teachers.slice(0, currentIndex + batchSize);

  return (
    <div className="max-w-xl mx-auto mt-10 space-y-6">
      {visibleTeachers.map((teacher) => {
        const profilePicture =
          teacher.profile_picture || 'https://.../default.png';
        const truncatedSchool = teacher.school?.slice(0, 20) + (teacher.school?.length > 20 ? '...' : '');
        const profileURL = `/profile/${encodeURIComponent(teacher.name)}`;

        return (
          <div key={teacher.id} className="bg-white p-4 rounded-xl shadow space-y-2">
            <a href={profileURL} target="_blank" className="flex gap-4 items-center">
              <img
                src={profilePicture}
                alt="Profile"
                width={80}
                className="rounded-full object-cover"
              />
              <div className="flex-1">
                <div className="font-bold">{teacher.name}</div>
                <div className="text-gray-500 text-sm">{truncatedSchool}</div>
                <div className="text-sm mt-1">{teacher.shortintroduction}</div>
              </div>
            </a>
            <div className="text-sm text-gray-700">
              <strong>추가 과목:</strong> {teacher.extra_subject || '없음'}<br />
              <strong>연락처:</strong> {teacher.contact_information || '없음'}
            </div>
            <button
              onClick={() => approveTeacher(teacher.id)}
              className="mt-2 px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
            >
              승인
            </button>
          </div>
        );
      })}
    </div>
  );
}
