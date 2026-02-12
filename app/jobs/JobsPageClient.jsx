'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function JobsPageClient() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadJobs() {
      setLoading(true);
      setError('');

      const { data, error: dbError } = await supabase
        .from('student_jobs')
        .select('*')
        .order('created_at', { ascending: false });

      if (dbError) {
        console.error('Error loading jobs:', dbError);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/a043678d-a737-45f3-96e4-d25e57b0c2af', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            runId: 'jobs_run1',
            hypothesisId: 'H1',
            location: 'app/jobs/JobsPageClient.jsx:loadJobs',
            message: 'Supabase loadJobs error',
            data: {
              hasError: true,
              errorMessage: dbError?.message ?? null,
              errorCode: dbError?.code ?? null,
            },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
        // #endregion
        setError('구인 글을 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        setLoading(false);
        return;
      }

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a043678d-a737-45f3-96e4-d25e57b0c2af', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          runId: 'jobs_run1',
          hypothesisId: 'H2',
          location: 'app/jobs/JobsPageClient.jsx:loadJobs',
          message: 'Supabase loadJobs success',
          data: {
            count: Array.isArray(data) ? data.length : null,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion

      setJobs(data || []);
      setLoading(false);
    }

    loadJobs();
  }, []);

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 mb-[15dvh]">
      <section className="bg-white border border-gray-200 rounded-xl shadow-md p-4 sm:p-6 mb-8 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold mb-1">학생 구인 게시판</h1>
          <p className="text-sm text-gray-600">
            학생들이 올린 과외/수업 요청 글을 확인하고, 관심 있는 학생에게 직접 연락해 보세요.
          </p>
        </div>
        <div className="shrink-0">
          <Link
            href="/jobs/new"
            className="inline-flex items-center px-4 py-2 rounded-md text-xs sm:text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            요청하기
          </Link>
        </div>
      </section>

      <section>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-lg font-semibold">최근 구인 글</h2>
          <span className="text-xs text-gray-500">총 {jobs.length}건</span>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2 mb-3">
            {error}
          </p>
        )}

        {loading ? (
          <p className="text-sm text-gray-600">구인 글을 불러오는 중입니다…</p>
        ) : jobs.length === 0 ? (
          <p className="text-sm text-gray-600">
            아직 등록된 구인 글이 없습니다. 상단의 &quot;요청하기&quot; 버튼을 눌러 첫 번째 글을 올려보세요!
          </p>
        ) : (
          <div className="space-y-3">
            {jobs.map(job => (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                className="block bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-blue-200 transition"
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h3 className="text-sm sm:text-base font-semibold line-clamp-1">
                    {job.title}
                  </h3>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                      job.status === 'OPEN'
                        ? 'bg-green-50 text-green-700 border border-green-100'
                        : 'bg-gray-100 text-gray-500 border border-gray-200'
                    }`}
                  >
                    {job.status === 'OPEN' ? '모집중' : '마감'}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mb-1">
                  {job.subject || '과목 미기재'} {job.level && `· ${job.level}`}
                </p>
                <p className="text-xs text-gray-600 line-clamp-2">{job.description}</p>
                <p className="mt-2 text-[11px] text-gray-400">
                  {job.format === 'online'
                    ? '비대면(온라인)'
                    : job.format === 'offline'
                    ? '대면'
                    : '대면/비대면 모두 가능'}
                  {' · '}
                  {job.created_at
                    ? new Date(job.created_at).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                    : ''}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

