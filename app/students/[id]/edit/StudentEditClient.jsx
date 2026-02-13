'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const INITIAL_EDIT_FORM = {
  title: [],
  subject: '',
  level: '',
  description: '',
  format: 'online',
  email: '',
  kakaoContact: '',
};

export default function StudentEditClient({ studentId }) {
  const router = useRouter();

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'password' | 'form'>('password');
  const [passwordInput, setPasswordInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [form, setForm] = useState(INITIAL_EDIT_FORM);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    async function loadStudent() {
      setLoading(true);
      setError('');

      const { data, error: studentError } = await supabase
        .from('student_jobs')
        .select('*')
        .eq('id', studentId)
        .single();

      if (studentError) {
        console.error('Error loading student for edit:', studentError);
        setError('학생 요청 정보를 불러오는 중 오류가 발생했습니다.');
        setLoading(false);
        return;
      }

      if (!data) {
        setError('해당 학생 요청을 찾을 수 없습니다.');
        setLoading(false);
        return;
      }

      setStudent(data);
      setLoading(false);
    }

    if (studentId) {
      loadStudent();
    }
  }, [studentId]);

  function handleFieldChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  function toggleTitleOption(option) {
    setForm(prev => {
      const currentTitles = prev.title || [];
      if (currentTitles.includes(option)) {
        return { ...prev, title: currentTitles.filter(item => item !== option) };
      } else if (currentTitles.length < 3) {
        return { ...prev, title: [...currentTitles, option] };
      }
      return prev;
    });
  }

  async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async function handleVerifyPassword(e) {
    e.preventDefault();
    if (!student) return;
    setError('');

    if (!passwordInput.trim()) {
      setError('비밀번호를 입력해 주세요.');
      return;
    }

    if (!student.edit_password_hash) {
      setError('이 학생 요청에는 비밀번호가 설정되어 있지 않습니다. 새 글을 작성해 주세요.');
      return;
    }

    setVerifying(true);
    const enteredHash = await hashPassword(passwordInput.trim());

    if (enteredHash !== student.edit_password_hash) {
      setError('비밀번호가 올바르지 않습니다.');
      setVerifying(false);
      return;
    }

    // Password OK – hydrate edit form
    setForm({
      title: Array.isArray(student.title) ? student.title : (student.title ? [student.title] : []),
      subject: student.subject ?? '',
      level: student.level ?? '',
      description: student.description ?? '',
      format: student.format ?? 'online',
      email: student.email ?? '',
      kakaoContact: student.kakao_contact ?? '',
    });
    setStep('form');
    setVerifying(false);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!student) return;
    setError('');
    setSaveMessage('');

    if (!Array.isArray(form.title) || form.title.length === 0 || !form.subject.trim() || !form.description.trim() || !form.email.trim()) {
      setError('과외 종류, 과목, 상세 내용, 이메일은 필수 항목입니다.');
      return;
    }

    setSaving(true);

    const { error: updateError } = await supabase
      .from('student_jobs')
      .update({
        title: form.title.trim(),
        subject: form.subject.trim(),
        level: form.level.trim() || null,
        description: form.description.trim(),
        format: form.format,
        email: form.email.trim(),
        kakao_contact: form.kakaoContact.trim() || null,
      })
      .eq('id', student.id);

    if (updateError) {
      console.error('Error updating student:', updateError);
      setError('학생 요청을 저장하는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      setSaving(false);
      return;
    }

    setSaveMessage('학생 요청이 수정되었습니다.');
    setSaving(false);
  }

  if (loading) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-10">
        <p className="text-center text-sm text-gray-600">불러오는 중입니다…</p>
      </main>
    );
  }

  if (error && !student) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-10">
        <div className="bg-white border border-red-100 text-red-700 rounded-lg p-4 text-sm mb-4">
          {error}
        </div>
        <div className="mt-4 text-center">
          <Link href="/students" className="text-sm text-blue-600 hover:underline">
            학생 게시판으로 돌아가기
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 mb-[15dvh]">
      <div className="mb-4">
        <Link href={`/students/${studentId}`} className="text-xs text-blue-600 hover:underline">
          ← 학생 요청 상세 페이지로 돌아가기
        </Link>
      </div>

      <section className="bg-white border border-gray-200 rounded-xl shadow-md p-4 sm:p-6">
        <h1 className="text-lg sm:text-xl font-semibold mb-3">학생 요청 수정</h1>
        {student && (
          <p className="text-xs text-gray-500 mb-4">
            과외 종류: <span className="font-medium">{Array.isArray(student.title) ? student.title.join(' · ') : student.title}</span>
          </p>
        )}

        {error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2 mb-3">
            {error}
          </p>
        )}
        {saveMessage && (
          <p className="text-xs text-green-700 bg-green-50 border border-green-100 rounded px-3 py-2 mb-3">
            {saveMessage}
          </p>
        )}

        {step === 'password' && (
          <form onSubmit={handleVerifyPassword} className="space-y-3">
            <p className="text-xs text-gray-600">
              이 학생 요청을 수정하려면, 글을 작성할 때 설정하신 <span className="font-semibold">수정용 비밀번호</span>를 입력해 주세요.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                비밀번호
              </label>
              <input
                type="password"
                value={passwordInput}
                onChange={e => setPasswordInput(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="작성 시 설정한 비밀번호"
              />
            </div>
            <div className="pt-1">
              <button
                type="submit"
                disabled={verifying}
                className="px-4 py-2 rounded-md text-xs sm:text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {verifying ? '확인 중...' : '다음'}
              </button>
            </div>
          </form>
        )}

        {step === 'form' && (
          <form onSubmit={handleSave} className="space-y-4 mt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  과목<span className="text-red-500 ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  name="subject"
                  value={form.subject}
                  onChange={handleFieldChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  학년/레벨
                </label>
                <input
                  type="text"
                  name="level"
                  value={form.level}
                  onChange={handleFieldChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                어떤 과외를 원하시나요? (최대 3개)<span className="text-red-500 ml-0.5">*</span>
              </label>
              <div className="space-y-2 text-sm">
                {[
                  '기초 개념 다지기',
                  'Final 집중 수업',
                  '문제 풀이 위주 수업',
                  '단기 속성 과외',
                  '오랫동안 함께하실 분',
                  'IA·EE·TOK 첨삭',
                  '7점 만점 공략',
                ].map(option => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => toggleTitleOption(option)}
                    disabled={!form.title?.includes(option) && (form.title?.length || 0) >= 3}
                    className={`w-full text-left px-3 py-2 rounded-lg border transition-colors ${
                      form.title?.includes(option)
                        ? 'border-blue-500 bg-blue-50'
                        : (form.title?.length || 0) >= 3
                        ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                        : 'border-gray-200 bg-white hover:border-blue-300'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
              {form.title && form.title.length > 0 && (
                <p className="text-xs text-gray-500 mt-2">
                  선택됨: {form.title.length}/3
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                상세 내용<span className="text-red-500 ml-0.5">*</span>
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleFieldChange}
                rows={5}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                수업 방식
              </label>
              <div className="flex flex-wrap gap-4 text-sm">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="format"
                    value="online"
                    checked={form.format === 'online'}
                    onChange={handleFieldChange}
                    className="mr-1"
                  />
                  <span>비대면(온라인)</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="format"
                    value="offline"
                    checked={form.format === 'offline'}
                    onChange={handleFieldChange}
                    className="mr-1"
                  />
                  <span>대면</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="format"
                    value="either"
                    checked={form.format === 'either'}
                    onChange={handleFieldChange}
                    className="mr-1"
                  />
                  <span>상관없음</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  이메일<span className="text-red-500 ml-0.5">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleFieldChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  카카오톡 ID / 오픈채팅 링크 (선택)
                </label>
                <input
                  type="text"
                  name="kakaoContact"
                  value={form.kakaoContact}
                  onChange={handleFieldChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => router.push(`/students/${studentId}`)}
                className="px-3 py-2 rounded-md text-xs sm:text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-md text-xs sm:text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? '저장 중...' : '변경 내용 저장'}
              </button>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}

