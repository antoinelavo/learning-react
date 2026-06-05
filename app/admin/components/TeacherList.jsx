'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

const batchSize = 10;

const THREE_WEEKS_MS = 21 * 24 * 60 * 60 * 1000;

export default function TeacherList() {
  const [teachers, setTeachers] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('recent');

  useEffect(() => {
    async function loadTeachers() {
      const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .eq('status', 'pending')
        .order('created_date', { ascending: false });

      if (!error && data) {
        setTeachers(data);
        setCurrentIndex(0);
      }
    }

    loadTeachers();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  const now = Date.now();
  const recentTeachers = teachers.filter(t => {
    const created = new Date(t.created_date).getTime();
    return now - created < THREE_WEEKS_MS;
  });
  const olderTeachers = teachers.filter(t => {
    const created = new Date(t.created_date).getTime();
    return now - created >= THREE_WEEKS_MS;
  });

  const filteredTeachers = activeTab === 'recent' ? recentTeachers : olderTeachers;
  const visibleTeachers = filteredTeachers.slice(0, currentIndex + batchSize);

  return (
    <div className="max-w-xl mx-auto mt-10 space-y-6">
      <div className="text-sm font-medium text-gray-600">대기 중인 프로필: {teachers.length}개</div>

      <div className="flex gap-2">
        <button
          onClick={() => { setActiveTab('recent'); setCurrentIndex(0); }}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
            activeTab === 'recent'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          3주 미만 ({recentTeachers.length})
        </button>
        <button
          onClick={() => { setActiveTab('older'); setCurrentIndex(0); }}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
            activeTab === 'older'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          3주 이상 ({olderTeachers.length})
        </button>
      </div>

      {visibleTeachers.map((teacher) => {
        const profilePicture =
          teacher.profile_picture || 'https://ibmaster.antoinelavo.com/teachers/default.jpg';
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
              <strong>연락처:</strong> {teacher.contact_information || '없음'}<br />
              <strong>가입일:</strong> {teacher.created_date ? (() => {
                const date = new Date(teacher.created_date);
                const dateStr = date.toISOString().split('T')[0];
                const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
                const timeAgo = days === 0 ? '오늘' : days < 7 ? `${days}일 전` : `${Math.floor(days / 7)}주 전`;
                return `${dateStr} (${timeAgo})`;
              })() : '없음'}
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
