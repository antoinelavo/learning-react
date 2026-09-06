'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function DashboardCards() {
  const [stats, setStats] = useState({
    // Teacher profiles
    pendingProfiles: 0,

    // Student requests
    studentJobs: 0,
    studentJobViews: 0,
    studentNewsletterSubs: 0,
    avgStudentViews: 0,
    studentNewThisWeek: 0,
    studentOpen: 0,
    studentClosed: 0,

    // Hagwon requests
    hagwonRequests: 0,
    hagwonRequestViews: 0,
    hagwonNewsletterSubs: 0,
    avgHagwonViews: 0,
    hagwonNewThisWeek: 0,
    hagwonOpen: 0,
    hagwonClosed: 0,
  });

  useEffect(() => {
    async function fetchData() {
      const [
        pendingCount,
        studentJobsData,
        studentViewsData,
        studentNewsData,
        hagwonRequestsData,
        hagwonViewsData,
        hagwonNewsData,
        studentNewThisWeek,
        studentOpen,
        studentClosed,
        hagwonNewThisWeek,
        hagwonOpen,
        hagwonClosed,
      ] = await Promise.all([
        getPendingProfileCount(),
        getStudentJobsCount(),
        getStudentJobViewsCount(),
        getStudentNewsletterCount(),
        getHagwonRequestsCount(),
        getHagwonRequestViewsCount(),
        getHagwonNewsletterCount(),
        getStudentNewThisWeek(),
        getStudentStatusCount('OPEN'),
        getStudentStatusCount('CLOSED'),
        getHagwonNewThisWeek(),
        getHagwonStatusCount('OPEN'),
        getHagwonStatusCount('CLOSED'),
      ]);

      const avgStudentViews = studentJobsData > 0
        ? (studentViewsData / studentJobsData).toFixed(1)
        : 0;

      const avgHagwonViews = hagwonRequestsData > 0
        ? (hagwonViewsData / hagwonRequestsData).toFixed(1)
        : 0;

      setStats({
        pendingProfiles: pendingCount,
        studentJobs: studentJobsData,
        studentJobViews: studentViewsData,
        studentNewsletterSubs: studentNewsData,
        avgStudentViews: avgStudentViews,
        studentNewThisWeek,
        studentOpen,
        studentClosed,
        hagwonRequests: hagwonRequestsData,
        hagwonRequestViews: hagwonViewsData,
        hagwonNewsletterSubs: hagwonNewsData,
        avgHagwonViews: avgHagwonViews,
        hagwonNewThisWeek,
        hagwonOpen,
        hagwonClosed,
      });
    }

    fetchData();
  }, []);

  const rows = [
    { label: '전체 요청', student: stats.studentJobs, hagwon: stats.hagwonRequests },
    { label: '이번 주 신규', student: stats.studentNewThisWeek, hagwon: stats.hagwonNewThisWeek },
    { label: '모집중', student: stats.studentOpen, hagwon: stats.hagwonOpen },
    { label: '마감', student: stats.studentClosed, hagwon: stats.hagwonClosed },
    { label: '조회수', student: stats.studentJobViews, hagwon: stats.hagwonRequestViews },
    { label: '평균 조회수', student: stats.avgStudentViews, hagwon: stats.avgHagwonViews },
    { label: '뉴스레터 구독자', student: stats.studentNewsletterSubs, hagwon: stats.hagwonNewsletterSubs },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b text-xs font-medium text-gray-500">
            <th className="text-left px-3 py-2">요청 현황</th>
            <th className="text-right px-3 py-2 text-blue-700">학생</th>
            <th className="text-right px-3 py-2 text-purple-700">학원</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.label} className={i !== rows.length - 1 ? 'border-b border-gray-100' : ''}>
              <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{row.label}</td>
              <td className="px-3 py-2 text-right font-semibold text-blue-900">
                {Number(row.student).toLocaleString()}
              </td>
              <td className="px-3 py-2 text-right font-semibold text-purple-900">
                {Number(row.hagwon).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Teacher profiles
async function getPendingProfileCount() {
  const { count, error } = await supabase
    .from('teachers')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending');
  if (error) return 0;
  return count ?? 0;
}

// Student requests functions
async function getStudentJobsCount() {
  const { count, error } = await supabase
    .from('student_jobs')
    .select('id', { count: 'exact', head: true });
  if (error) return 0;
  return count ?? 0;
}

async function getStudentJobViewsCount() {
  const { count, error } = await supabase
    .from('student_job_views')
    .select('id', { count: 'exact', head: true });
  if (error) return 0;
  return count ?? 0;
}

async function getStudentNewsletterCount() {
  const { count, error } = await supabase
    .from('newsletter_subscriptions')
    .select('id', { count: 'exact', head: true });
  if (error) return 0;
  return count ?? 0;
}

// Hagwon requests functions
async function getHagwonRequestsCount() {
  const { count, error } = await supabase
    .from('hagwon_requests')
    .select('id', { count: 'exact', head: true });
  if (error) return 0;
  return count ?? 0;
}

async function getHagwonRequestViewsCount() {
  const { count, error } = await supabase
    .from('hagwon_request_views')
    .select('*', { count: 'exact', head: true });
  if (error) return 0;
  return count ?? 0;
}

async function getHagwonNewsletterCount() {
  const { count, error } = await supabase
    .from('hagwon_newsletter_subscriptions')
    .select('id', { count: 'exact', head: true });
  if (error) return 0;
  return count ?? 0;
}

async function getStudentNewThisWeek() {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const { count, error } = await supabase
    .from('student_jobs')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', oneWeekAgo.toISOString());
  if (error) return 0;
  return count ?? 0;
}

async function getStudentStatusCount(status) {
  const { count, error } = await supabase
    .from('student_jobs')
    .select('id', { count: 'exact', head: true })
    .eq('status', status);
  if (error) return 0;
  return count ?? 0;
}

async function getHagwonNewThisWeek() {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const { count, error } = await supabase
    .from('hagwon_requests')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', oneWeekAgo.toISOString());
  if (error) return 0;
  return count ?? 0;
}

async function getHagwonStatusCount(status) {
  const { count, error } = await supabase
    .from('hagwon_requests')
    .select('id', { count: 'exact', head: true })
    .eq('status', status);
  if (error) return 0;
  return count ?? 0;
}
