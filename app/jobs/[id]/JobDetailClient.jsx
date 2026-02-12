'use client';

import { useEffect, useState } from 'react';
import { supabase, getUserRole } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function JobDetailClient({ jobId }) {
  const router = useRouter();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function init() {
      setLoading(true);
      setError('');

      const { data: jobData, error: jobError } = await supabase
        .from('student_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (jobError) {
        console.error('Error loading job:', jobError);
        setError('구인 글을 불러오는 중 오류가 발생했습니다.');
        setLoading(false);
        return;
      }

      if (!jobData) {
        setError('해당 구인 글을 찾을 수 없습니다.');
        setLoading(false);
        return;
      }

      setJob(jobData);
      setLoading(false);
    }

    if (jobId) {
      init();
    }
  }, [jobId]);

  useEffect(() => {
    async function loadRole() {
      try {
        const userRole = await getUserRole();
        setRole(userRole);
      } catch (err) {
        console.error('Error checking user role:', err);
        setRole(null);
      }
    }

    loadRole();
  }, []);

  if (loading) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-10">
        <p className="text-center text-sm text-gray-600">불러오는 중입니다…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-10">
        <div className="bg-white border border-red-100 text-red-700 rounded-lg p-4 text-sm mb-4">
          {error}
        </div>
        <button
          onClick={() => router.push('/jobs')}
          className="text-sm text-blue-600 hover:underline"
        >
          구인 게시판으로 돌아가기
        </button>
      </main>
    );
  }

  if (!job) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-10">
        <p className="text-center text-sm text-gray-600">해당 구인 글을 찾을 수 없습니다.</p>
        <div className="mt-4 text-center">
          <Link href="/jobs" className="text-sm text-blue-600 hover:underline">
            구인 게시판으로 돌아가기
          </Link>
        </div>
      </main>
    );
  }

  const isTeacher = role === 'teacher';

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 mb-[15dvh]">
      <div className="mb-4">
        <Link href="/jobs" className="text-xs text-blue-600 hover:underline">
          ← 구인 게시판으로 돌아가기
        </Link>
      </div>

      <section className="bg-white border border-gray-200 rounded-xl shadow-md p-4 sm:p-6 mb-6">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h1 className="text-lg sm:text-xl font-semibold break-words mb-1">
              {job.title}
            </h1>
            <p className="text-xs text-gray-600">
              {job.subject || '과목 미기재'}
              {job.level ? ` · ${job.level}` : ''}
            </p>
          </div>
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

        <p className="text-xs text-gray-400 mb-4">
          {job.created_at
            ? new Date(job.created_at).toLocaleString('ko-KR', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
            : null}
        </p>

        <div className="mb-4">
          <h2 className="text-sm font-semibold mb-1">요청 내용</h2>
          <p className="whitespace-pre-wrap text-sm text-gray-800">
            {job.description}
          </p>
        </div>

        <div className="mb-4">
          <h2 className="text-sm font-semibold mb-1">수업 방식</h2>
          <p className="text-sm text-gray-700">
            {job.format === 'online'
              ? '비대면(온라인)'
              : job.format === 'offline'
              ? '대면'
              : '대면/비대면 모두 가능'}
          </p>
        </div>

        <div className="border-t border-gray-100 pt-4 mt-2">
          <h2 className="text-sm font-semibold mb-2">학생 연락처</h2>
          {!isTeacher ? (
            <div className="text-xs text-gray-600 bg-gray-50 border border-dashed border-gray-200 rounded-md px-3 py-2">
              <p className="mb-1">
                학생의 이메일 및 카카오톡 정보는{' '}
                <span className="font-semibold">선생님 계정으로 로그인한 사용자만</span> 확인할 수 있습니다.
              </p>
              <p>
                선생님이시라면 상단 메뉴의 로그인 버튼을 통해 로그인 후 다시 시도해 주세요.
              </p>
            </div>
          ) : (
            <div className="space-y-1 text-sm text-gray-800">
              <p>
                <span className="font-medium">이메일:</span>{' '}
                <a href={`mailto:${job.email}`} className="text-blue-600 hover:underline">
                  {job.email}
                </a>
              </p>
              {job.kakao_contact && (
                <p>
                  <span className="font-medium">카카오톡:</span>{' '}
                  <a
                    href={job.kakao_contact.startsWith('http') ? job.kakao_contact : undefined}
                    className="text-blue-600 hover:underline break-all"
                  >
                    {job.kakao_contact}
                  </a>
                </p>
              )}
              <p className="text-xs text-gray-500 pt-1">
                위 연락처는 학생이 직접 입력한 정보이며, 연락 시 예의를 지켜주시고 스팸/광고성 메시지는 자제해 주세요.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

