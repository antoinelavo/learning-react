'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function DashboardCards() {
  const [stats, setStats] = useState({
    teachers: 0,
    students: 0,
    profileClicks: 0,
    blogClicks: 0,
    approvedProfiles: 0,
    findViews: 0,
    findSessions: 0,
    hagwonViews: 0,
    hagwonSessions: 0,
    satClicks: 0,
  });

  useEffect(() => {
    async function fetchData() {
      const [
        users,
        profileClicks,
        blogClicks,
        pageEvents,
        approvedCount,
        satClicks,
      ] = await Promise.all([
        getUserCounts(),
        getTeacherClicks(),
        getBlogClicks(),
        getPageViewCounts(),
        getApprovedProfileCount(),
        getSATClickCount(),
      ]);

      const getCount = (page, type) =>
        pageEvents.find((p) => p.page === page && p.event_type === type)?.count || 0;

      setStats({
        teachers: users.teachers,
        students: users.students,
        profileClicks,
        blogClicks,
        approvedProfiles: approvedCount,
        findViews: getCount('find', 'page_view'),
        findSessions: getCount('find', 'unique_page_view'),
        hagwonViews: getCount('hagwons', 'page_view'),
        hagwonSessions: getCount('hagwons', 'unique_page_view'),
        satClicks,
      });
    }

    fetchData();
  }, []);

  const cards = [
    { label: '선생님 계정 수', value: stats.teachers, color: 'bg-indigo-100' },
    { label: '학생 계정 수', value: stats.students, color: 'bg-sky-100' },
    // { label: '프로필 클릭 수', value: stats.profileClicks, color: 'bg-amber-100' },
    // { label: '블로그 버튼 클릭 수', value: stats.blogClicks, color: 'bg-rose-100' },
    { label: '프로필 개수', value: stats.approvedProfiles, color: 'bg-amber-100' }
    // { label: "'과외 찾기' 조회수", value: stats.findViews, color: 'bg-green-100' },
    // { label: "'과외 찾기' 세션 수", value: stats.findSessions, color: 'bg-green-100' },
    // { label: "'학원 추천' 조회수", value: stats.hagwonViews, color: 'bg-fuchsia-100' },
    // { label: "'학원 추천' 세션 수", value: stats.hagwonSessions, color: 'bg-fuchsia-100' },
    // { label: '학원 CTA 클릭 수', value: stats.satClicks, color: 'bg-amber-100' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {cards.map((card, i) => (
        <div
          key={i}
          className={`rounded-xl shadow p-4 ${card.color} text-center`}
        >
          <div className="text-xl font-bold">{card.value.toLocaleString()}</div>
          <div className="text-sm mt-1 text-gray-700">{card.label}</div>
        </div>
      ))}
    </div>
  );
}

async function getUserCounts() {
  const { data, error } = await supabase.from('users').select('role');
  if (error) return { teachers: 0, students: 0 };
  const teachers = data.filter((u) => u.role === 'teacher').length;
  const students = data.filter((u) => u.role === 'student').length;
  return { teachers, students };
}

async function getTeacherClicks() {
  const { data, error } = await supabase.from('teachers').select('profile_clicks');
  if (error) return 0;
  return data.reduce((sum, row) => sum + (row.profile_clicks || 0), 0);
}

async function getApprovedProfileCount() {
  const { data, error } = await supabase
    .from('teachers')
    .select('id', { count: 'exact' })
    .eq('status', 'approved');
  if (error) return 0;
  return data.length;
}

async function getBlogClicks() {
  const { data, error } = await supabase.from('blog_posts').select('find_page_clicks');
  if (error) return 0;
  return data.reduce((sum, row) => sum + (row.find_page_clicks || 0), 0);
}

async function getPageViewCounts() {
  const { data, error } = await supabase.from('page_events').select('page, event_type');
  if (error) return [];
  const counts = {};
  data.forEach((row) => {
    const key = `${row.page}-${row.event_type}`;
    counts[key] = (counts[key] || 0) + 1;
  });
  return Object.entries(counts).map(([key, count]) => {
    const [page, event_type] = key.split('-');
    return { page, event_type, count };
  });
}

async function getSATClickCount() {
  const { data, error } = await supabase
    .from('page_events')
    .select('id')
    .eq('event_type', 'cta_click');
  if (error) return 0;
  return data.length;
}
