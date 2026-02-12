'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

const INITIAL_FORM = {
  format: 'online',
  subject: '',
  level: '',
  title: '',
  description: '',
  email: '',
  kakaoContact: '',
  password: '',
  passwordConfirm: '',
};

export default function JobsCreateClient() {
  const router = useRouter();

  const [form, setForm] = useState(INITIAL_FORM);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [selectedLevelOption, setSelectedLevelOption] = useState('');

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const hasSubjects = selectedSubjects.length > 0 || form.subject.trim();
    if (!hasSubjects || !form.title.trim() || !form.description.trim()) {
      setError('필수 질문에 모두 답해 주세요.');
      return;
    }

    if (!form.email.trim() && !form.kakaoContact.trim()) {
      setError('이메일 또는 카카오톡 중 하나는 반드시 입력해 주세요.');
      return;
    }

    if (!form.password.trim() || !form.passwordConfirm.trim()) {
      setError('수정용 비밀번호를 두 번 모두 입력해 주세요.');
      return;
    }

    if (form.password.trim() !== form.passwordConfirm.trim()) {
      setError('비밀번호와 비밀번호 확인이 일치하지 않습니다.');
      return;
    }

    setSubmitting(true);

    const passwordHash = await hashPassword(form.password.trim());
    const combinedSubject = [...selectedSubjects, form.subject.trim()]
      .filter(Boolean)
      .join(', ');

    const { data, error: insertError } = await supabase
      .from('student_jobs')
      .insert({
        title: form.title.trim(),
        subject: combinedSubject,
        level: form.level.trim() || null,
        description: form.description.trim(),
        format: form.format,
        email: form.email.trim(),
        kakao_contact: form.kakaoContact.trim() || null,
        status: 'OPEN',
        edit_password_hash: passwordHash,
      })
      .select('*')
      .single();

    if (insertError) {
      console.error('Error creating job:', insertError);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a043678d-a737-45f3-96e4-d25e57b0c2af', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          runId: 'jobs_create_run1',
          hypothesisId: 'H_insert',
          location: 'app/jobs/new/JobsCreateClient.jsx:handleSubmit',
          message: 'Supabase job insert error',
          data: {
            hasError: true,
            errorMessage: insertError?.message ?? null,
            errorCode: insertError?.code ?? null,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      setError('구인 글을 저장하는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      setSubmitting(false);
      return;
    }

    router.push(`/jobs/${data.id}`);
  }

  const totalSteps = 7;

  const SUBJECT_OPTIONS = [
    'Biology HL',
    'Biology SL',
    'Math AA HL',
    'Math AA SL',
    'Math AI HL',
    'Math AI SL',
    'Physics HL',
    'Physics SL',
    'Chemistry HL',
    'Chemistry SL',
    'Business HL',
    'Business SL',
    'Chinese A HL',
    'Chinese A SL',
    'Chinese B HL',
    'Chinese B SL',
    'Computer Science HL',
    'Computer Science SL',
    'DT HL',
    'EE',
    'ESS HL',
    'ESS SL',
    'Economics HL',
    'Economics SL',
    'English B HL',
    'English B SL',
    'English: Lang&Lit HL',
    'English: Lang&Lit SL',
    'English: Literature HL',
    'English: Literature SL',
    'French B',
    'Geography HL',
    'Geography SL',
    'Global Politics HL',
    'Global Politics SL',
    'History HL',
    'History SL',
    'Japanese B HL',
    'Japanese B SL',
    'Korean A HL',
    'Korean A SL',
    'Korean SL',
    'Psychology HL',
    'Psychology SL',
    'TOK',
  ];

  function toggleSubject(option) {
    setSelectedSubjects(prev =>
      prev.includes(option) ? prev.filter(s => s !== option) : [...prev, option],
    );
  }

  function canGoNext(currentStep) {
    // Step-based validation for Next button
    if (currentStep === 2) {
      const hasSubjects = selectedSubjects.length > 0 || form.subject.trim();
      if (!hasSubjects) {
        setError('도움을 받고 싶은 과목을 한 개 이상 선택하거나 직접 입력해 주세요.');
        return false;
      }
    }
    if (currentStep === 4) {
      if (!form.title.trim()) {
        setError('제목을 입력해 주세요.');
        return false;
      }
    }
    if (currentStep === 5) {
      if (!form.description.trim()) {
        setError('어떤 도움이 필요한지 간단히 적어 주세요.');
        return false;
      }
    }
    if (currentStep === 6) {
      if (!form.email.trim() && !form.kakaoContact.trim()) {
        setError('이메일 또는 카카오톡 중 하나는 반드시 입력해 주세요.');
        return false;
      }
    }
    setError('');
    return true;
  }

  return (
    <main className="max-w-xl mx-auto px-4 py-10 min-h-[100dvh]">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold mb-1">학생 구인 글 작성</h1>
        <p className="text-xs text-gray-500">
          간단한 질문에 하나씩 답하면서 과외/수업 요청 글을 만들어 보세요.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2">
            {error}
          </p>
        )}

        <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2">
          <div
            className="bg-blue-500 h-1.5 rounded-full transition-all"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>
        <p className="text-[11px] text-gray-500 mb-1">
          Step {step} / {totalSteps}
        </p>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 space-y-4">
          {step === 1 && (
            <>
              <p className="text-sm font-medium text-gray-800 mb-2">
                어떤 방식의 수업을 원하시나요?
              </p>
              <div className="space-y-2 text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setForm(prev => ({ ...prev, format: 'online' }));
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg border ${
                    form.format === 'online'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  비대면(온라인)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setForm(prev => ({ ...prev, format: 'offline' }));
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg border ${
                    form.format === 'offline'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  대면
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setForm(prev => ({ ...prev, format: 'either' }));
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg border ${
                    form.format === 'either'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  상관없음
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <p className="text-sm font-medium text-gray-800 mb-2">
                어떤 과목 도움을 받고 싶으신가요? <span className="text-red-500">*</span>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto mb-3">
                {SUBJECT_OPTIONS.map(option => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => toggleSubject(option)}
                    className={`text-left px-3 py-2 rounded-lg border text-xs ${
                      selectedSubjects.includes(option)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">위 목록에 없는 과목이 있다면 직접 입력해 주세요.</p>
                <input
                  type="text"
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  placeholder="기타 과목 입력"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <p className="text-sm font-medium text-gray-800 mb-2">
                현재 학년/레벨은 어떻게 되나요?
              </p>
              <div className="space-y-2 text-sm mb-3">
                {['IB 1학년', 'IB 2학년', 'Pre-IB 과정', 'MYP 과정', '기타'].map(option => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      setSelectedLevelOption(option);
                      if (option === '기타') {
                        setForm(prev => ({ ...prev, level: '' }));
                      } else {
                        setForm(prev => ({ ...prev, level: option }));
                      }
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg border ${
                      selectedLevelOption === option
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
              {selectedLevelOption === '기타' && (
                <input
                  type="text"
                  name="level"
                  value={form.level}
                  onChange={handleChange}
                  placeholder="예: Grade 10, 대학생, 성인 등"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              )}
            </>
          )}

          {step === 4 && (
            <>
              <p className="text-sm font-medium text-gray-800 mb-2">
                한 줄로 어떤 과외를 원하시는지 적어 주세요. <span className="text-red-500">*</span>
              </p>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="예: 온라인 IB Math AA HL 과외 선생님을 찾습니다"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </>
          )}

          {step === 5 && (
            <>
              <p className="text-sm font-medium text-gray-800 mb-2">
                어떤 도움이 필요하신지 간단히 적어 주세요. <span className="text-red-500">*</span>
              </p>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                placeholder="예: IB Math AA HL 내신 5점, 최종 목표 7점. 주 2회, 평일 저녁 온라인 수업 희망 등"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
              />
            </>
          )}

          {step === 6 && (
            <>
              <p className="text-sm font-medium text-gray-800 mb-2">
                선생님이 어디로 연락하면 될까요? <span className="text-red-500">*</span>
              </p>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="이메일 주소"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-3"
              />
              <input
                type="text"
                name="kakaoContact"
                value={form.kakaoContact}
                onChange={handleChange}
                placeholder="카카오톡 ID / 오픈채팅 링크 (선택)"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-[11px] text-gray-500 mt-2">
                *연락처는 선생님 계정으로 로그인한 사용자에게만 공개됩니다.
              </p>
            </>
          )}

          {step === 7 && (
            <>
              <p className="text-sm font-medium text-gray-800 mb-2">
                나중에 이 글을 수정/삭제할 때 사용할 비밀번호를 정해 주세요. <span className="text-red-500">*</span>
              </p>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="비밀번호"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-3"
              />
              <input
                type="password"
                name="passwordConfirm"
                value={form.passwordConfirm}
                onChange={handleChange}
                placeholder="비밀번호 확인"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-[11px] text-gray-500 mt-2">
                비밀번호는 암호화되어 저장되며, 잊어버리면 되찾을 수 없습니다. 잊은 경우 새 글을 작성해 주세요.
              </p>
            </>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 mt-4">
          <button
            type="button"
            onClick={() => setStep(prev => Math.max(1, prev - 1))}
            disabled={step === 1 || submitting}
            className="px-3 py-2 rounded-md text-xs sm:text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            이전
          </button>

          {step < totalSteps ? (
            <button
              type="button"
              onClick={() => {
                if (!canGoNext(step)) return;
                setStep(prev => Math.min(totalSteps, prev + 1));
              }}
              disabled={submitting}
              className="px-4 py-2 rounded-md text-xs sm:text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              다음
            </button>
          ) : (
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-md text-xs sm:text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? '작성 중...' : '구인 글 올리기'}
            </button>
          )}
        </div>
      </form>
    </main>
  );
}

