'use client';

import { useEffect, useState } from 'react';
import { supabase, getUserRole, getTeacherStatus } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function StudentDetailClient({ studentId }) {
  const router = useRouter();

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);
  const [teacherStatus, setTeacherStatus] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function init() {
      setLoading(true);
      setError('');

      const { data: studentData, error: studentError } = await supabase
        .from('student_jobs')
        .select('*')
        .eq('id', studentId)
        .single();

      if (studentError) {
        console.error('Error loading student:', studentError);
        setError('학생 요청을 불러오는 중 오류가 발생했습니다.');
        setLoading(false);
        return;
      }

      if (!studentData) {
        setError('해당 학생 요청을 찾을 수 없습니다.');
        setLoading(false);
        return;
      }

      setStudent(studentData);
      setLoading(false);
    }

    if (studentId) {
      init();
    }
  }, [studentId]);

  useEffect(() => {
    async function loadRole() {
      try {
        const userRole = await getUserRole();
        setRole(userRole);

        // If user is a teacher, also get their status
        if (userRole === 'teacher') {
          const status = await getTeacherStatus();
          setTeacherStatus(status);
        }
      } catch (err) {
        console.error('Error checking user role:', err);
        setRole(null);
        setTeacherStatus(null);
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
          onClick={() => router.push('/students')}
          className="text-sm text-blue-600 hover:underline"
        >
          학생 게시판으로 돌아가기
        </button>
      </main>
    );
  }

  if (!student) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-10">
        <p className="text-center text-sm text-gray-600">해당 학생 요청을 찾을 수 없습니다.</p>
        <div className="mt-4 text-center">
          <Link href="/students" className="text-sm text-blue-600 hover:underline">
            학생 게시판으로 돌아가기
          </Link>
        </div>
      </main>
    );
  }

  const isApprovedTeacher = role === 'teacher' && teacherStatus === 'approved';
  const canViewContact = isApprovedTeacher && student.status === 'OPEN';

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 mb-[15dvh]">
      <div className="mb-4">
        <Link href="/students" className="text-xs text-blue-600 hover:underline">
          ← 학생 게시판으로 돌아가기
        </Link>
      </div>

      <section className="bg-white border border-gray-200 rounded-xl shadow-md p-4 sm:p-6 mb-6">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h1 className="text-lg sm:text-xl font-semibold break-words mb-1">
              {Array.isArray(student.title) ? student.title.join(' · ') : student.title}
            </h1>
            <p className="text-xs text-gray-600">
              {student.subject || '과목 미기재'}
              {student.level ? ` · ${student.level}` : ''}
            </p>
          </div>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
              student.status === 'OPEN'
                ? 'bg-green-50 text-green-700 border border-green-100'
                : 'bg-gray-100 text-gray-500 border border-gray-200'
            }`}
          >
            {student.status === 'OPEN' ? '모집중' : '마감'}
          </span>
        </div>

        <p className="text-xs text-gray-400 mb-4">
          {student.created_at
            ? new Date(student.created_at).toLocaleString('ko-KR', {
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
            {student.description}
          </p>
        </div>

        <div className="mb-4">
          <h2 className="text-sm font-semibold mb-1">수업 방식</h2>
          <p className="text-sm text-gray-700">
            {student.format === 'online'
              ? '비대면(온라인)'
              : student.format === 'offline'
              ? '대면'
              : '대면/비대면 모두 가능'}
            {student.region && (student.format === 'offline' || student.format === 'either') && (
              <span className="text-gray-500"> · {student.region}</span>
            )}
          </p>
        </div>

        {student.hourly_rate_min && student.hourly_rate_max && (
          <div className="mb-4">
            <h2 className="text-sm font-semibold mb-1">희망 시급</h2>
            <p className="text-sm text-gray-700">
              {student.hourly_rate_min}만원 ~ {student.hourly_rate_max}만원/시간
            </p>
          </div>
        )}

        <div className="border-t border-gray-100 pt-4 mt-2">
          <h2 className="text-sm font-semibold mb-2">학생 연락처</h2>
          {!canViewContact ? (
            <div className="text-xs text-gray-600 bg-gray-50 border border-dashed border-gray-200 rounded-md px-3 py-2">
              {student.status === 'CLOSED' ? (
                <p>
                  이 요청은 <span className="font-semibold">마감되었습니다</span>. 마감된 요청의 연락처는 확인할 수 없습니다.
                </p>
              ) : !isApprovedTeacher ? (
                <>
                  <p className="mb-1">
                    학생의 이메일 및 카카오톡 정보는{' '}
                    <span className="font-semibold">프로필이 검증된 선생님만</span> 확인할 수 있습니다.
                  </p>
                  <p>
                    선생님이시라면 상단 메뉴의 로그인 버튼을 통해 로그인 후 다시 시도해 주세요.
                  </p>
                </>
              ) : null}
            </div>
          ) : (
            <div className="space-y-1 text-sm text-gray-800">
              <p>
                <span className="font-medium">이메일:</span>{' '}
                <a href={`mailto:${student.email}`} className="text-blue-600 hover:underline">
                  {student.email}
                </a>
              </p>
              {student.kakao_contact && (
                <p>
                  <span className="font-medium">카카오톡:</span>{' '}
                  <a
                    href={student.kakao_contact.startsWith('http') ? student.kakao_contact : undefined}
                    className="text-blue-600 hover:underline break-all"
                  >
                    {student.kakao_contact}
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

