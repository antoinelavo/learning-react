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

    // Hagwon requests
    hagwonRequests: 0,
    hagwonRequestViews: 0,
    hagwonNewsletterSubs: 0,
    avgHagwonViews: 0,
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
      ] = await Promise.all([
        getPendingProfileCount(),
        getStudentJobsCount(),
        getStudentJobViewsCount(),
        getStudentNewsletterCount(),
        getHagwonRequestsCount(),
        getHagwonRequestViewsCount(),
        getHagwonNewsletterCount(),
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
        hagwonRequests: hagwonRequestsData,
        hagwonRequestViews: hagwonViewsData,
        hagwonNewsletterSubs: hagwonNewsData,
        avgHagwonViews: avgHagwonViews,
      });
    }

    fetchData();
  }, []);

  return (
    <div className="space-y-8">
      {/* Student Requests Section */}
      <div>
        <h2 className="text-lg font-semibold mb-3 text-gray-800">Student Requests</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl shadow p-5 bg-blue-50 border border-blue-200">
            <div className="text-3xl font-bold text-blue-900">{stats.studentJobs.toLocaleString()}</div>
            <div className="text-sm mt-1 text-blue-800">Total Student Requests</div>
          </div>
          <div className="rounded-xl shadow p-5 bg-blue-100 border border-blue-200">
            <div className="text-3xl font-bold text-blue-900">{stats.studentJobViews.toLocaleString()}</div>
            <div className="text-sm mt-1 text-blue-800">Unique Views</div>
          </div>
          <div className="rounded-xl shadow p-5 bg-blue-100 border border-blue-200">
            <div className="text-3xl font-bold text-blue-900">{stats.avgStudentViews}</div>
            <div className="text-sm mt-1 text-blue-800">Avg Views per Request</div>
          </div>
          <div className="rounded-xl shadow p-5 bg-blue-50 border border-blue-200">
            <div className="text-3xl font-bold text-blue-900">{stats.studentNewsletterSubs.toLocaleString()}</div>
            <div className="text-sm mt-1 text-blue-800">Newsletter Subscribers</div>
          </div>
        </div>
      </div>

      {/* Hagwon Requests Section */}
      <div>
        <h2 className="text-lg font-semibold mb-3 text-gray-800">Hagwon Requests</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl shadow p-5 bg-purple-50 border border-purple-200">
            <div className="text-3xl font-bold text-purple-900">{stats.hagwonRequests.toLocaleString()}</div>
            <div className="text-sm mt-1 text-purple-800">Total Hagwon Requests</div>
          </div>
          <div className="rounded-xl shadow p-5 bg-purple-100 border border-purple-200">
            <div className="text-3xl font-bold text-purple-900">{stats.hagwonRequestViews.toLocaleString()}</div>
            <div className="text-sm mt-1 text-purple-800">Unique Views</div>
          </div>
          <div className="rounded-xl shadow p-5 bg-purple-100 border border-purple-200">
            <div className="text-3xl font-bold text-purple-900">{stats.avgHagwonViews}</div>
            <div className="text-sm mt-1 text-purple-800">Avg Views per Request</div>
          </div>
          <div className="rounded-xl shadow p-5 bg-purple-50 border border-purple-200">
            <div className="text-3xl font-bold text-purple-900">{stats.hagwonNewsletterSubs.toLocaleString()}</div>
            <div className="text-sm mt-1 text-purple-800">Newsletter Subscribers</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Teacher profiles
async function getPendingProfileCount() {
  const { data, error } = await supabase
    .from('teachers')
    .select('id', { count: 'exact' })
    .eq('status', 'pending');
  if (error) return 0;
  return data.length;
}

// Student requests functions
async function getStudentJobsCount() {
  const { data, error } = await supabase
    .from('student_jobs')
    .select('id', { count: 'exact' });
  if (error) return 0;
  return data.length;
}

async function getStudentJobViewsCount() {
  const { data, error } = await supabase
    .from('student_job_views')
    .select('id', { count: 'exact' });
  if (error) return 0;
  return data.length;
}

async function getStudentNewsletterCount() {
  const { data, error } = await supabase
    .from('newsletter_subscriptions')
    .select('id', { count: 'exact' });
  if (error) return 0;
  return data.length;
}

// Hagwon requests functions
async function getHagwonRequestsCount() {
  const { data, error } = await supabase
    .from('hagwon_requests')
    .select('id', { count: 'exact' });
  if (error) return 0;
  return data.length;
}

async function getHagwonRequestViewsCount() {
  const { data, error } = await supabase
    .from('hagwon_request_views')
    .select('id', { count: 'exact' });
  if (error) return 0;
  return data.length;
}

async function getHagwonNewsletterCount() {
  const { data, error } = await supabase
    .from('hagwon_newsletter_subscriptions')
    .select('id', { count: 'exact' });
  if (error) return 0;
  return data.length;
}
