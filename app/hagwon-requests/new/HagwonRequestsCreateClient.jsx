'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

const INITIAL_FORM = {
  programType: [],
  ibSubjects: '',
  satSubjects: '',
  format: 'online',
  region: '',
  level: '',
  title: '',
  description: '',
  email: '',
  kakaoContact: '',
  password: '',
  passwordConfirm: '',
};

export default function HagwonRequestsCreateClient() {
  const router = useRouter();

  const [form, setForm] = useState(INITIAL_FORM);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [selectedIBSubjects, setSelectedIBSubjects] = useState([]);
  const [selectedSATSubjects, setSelectedSATSubjects] = useState([]);
  const [selectedLevelOption, setSelectedLevelOption] = useState('');
  const [showScrollGradient, setShowScrollGradient] = useState(true);
  const [selectedTitleOptions, setSelectedTitleOptions] = useState([]);
  const [hourlyRate, setHourlyRate] = useState([60, 200]); // [min, max] in 만원

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

    // Validation
    if (form.programType.length === 0) {
      setError('프로그램 타입을 선택해 주세요.');
      return;
    }

    const needsIB = form.programType.includes('IB') || form.programType.includes('both');
    const needsSAT = form.programType.includes('SAT') || form.programType.includes('both');

    const hasIBSubjects = selectedIBSubjects.length > 0 || form.ibSubjects.trim();
    const hasSATSubjects = selectedSATSubjects.length > 0;

    if (needsIB && !hasIBSubjects) {
      setError('IB 과목을 선택해 주세요.');
      return;
    }

    if (needsSAT && !hasSATSubjects) {
      setError('SAT 과목을 선택해 주세요.');
      return;
    }

    const hasTitles = selectedTitleOptions.length > 0;
    if (!hasTitles || !form.description.trim()) {
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

    try {
      const passwordHash = await hashPassword(form.password.trim());

      const combinedIBSubject = [...selectedIBSubjects, form.ibSubjects.trim()]
        .filter(Boolean)
        .join(', ');

      const combinedSATSubject = selectedSATSubjects.join(', ');

      const { data, error: insertError } = await supabase
        .from('hagwon_requests')
        .insert({
          program_type: form.programType,
          ib_subjects: combinedIBSubject || null,
          sat_subjects: combinedSATSubject || null,
          title: selectedTitleOptions,
          level: form.level.trim() || null,
          description: form.description.trim(),
          format: form.format,
          region: form.region.trim() || null,
          email: form.email.trim(),
          kakao_contact: form.kakaoContact.trim() || null,
          hourly_rate_min: hourlyRate[0],
          hourly_rate_max: hourlyRate[1],
          status: 'OPEN',
          edit_password_hash: passwordHash,
        })
        .select('*')
        .single();

      if (insertError) {
        console.error('Error creating hagwon request:', insertError);
        setError('오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        setSubmitting(false);
        return;
      }

      router.push('/hagwon-requests');
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      setSubmitting(false);
    }
  }

  // Calculate total steps dynamically
  function getTotalSteps() {
    const needsIB = form.programType.includes('IB') || form.programType.includes('both');
    const needsSAT = form.programType.includes('SAT') || form.programType.includes('both');

    let total = 8; // Base steps: 1(program), 4(format), 5(level), 6(title), 7(description), 8(rate), 9(contact), 10(password)
    if (needsIB) total++; // Step for IB subjects
    if (needsSAT) total++; // Step for SAT subjects

    return total;
  }

  const totalSteps = getTotalSteps();

  const IB_SUBJECT_OPTIONS = [
    'Biology HL', 'Biology SL',
    'Math AA HL', 'Math AA SL', 'Math AI HL', 'Math AI SL',
    'Physics HL', 'Physics SL',
    'Chemistry HL', 'Chemistry SL',
    'Business HL', 'Business SL',
    'Chinese A HL', 'Chinese A SL', 'Chinese B HL', 'Chinese B SL',
    'Computer Science HL', 'Computer Science SL',
    'DT HL',
    'EE',
    'ESS HL', 'ESS SL',
    'Economics HL', 'Economics SL',
    'English B HL', 'English B SL',
    'English: Lang&Lit HL', 'English: Lang&Lit SL',
    'English: Literature HL', 'English: Literature SL',
    'French B',
    'Geography HL', 'Geography SL',
    'Global Politics HL', 'Global Politics SL',
    'History HL', 'History SL',
    'Japanese B HL', 'Japanese B SL',
    'Korean A HL', 'Korean A SL', 'Korean SL',
    'Psychology HL', 'Psychology SL',
    'TOK',
  ];

  const SAT_SUBJECT_OPTIONS = ['Math', 'Reading & Writing'];

  function toggleIBSubject(option) {
    setSelectedIBSubjects(prev =>
      prev.includes(option) ? prev.filter(s => s !== option) : [...prev, option],
    );
  }

  function toggleSATSubject(option) {
    setSelectedSATSubjects(prev =>
      prev.includes(option) ? prev.filter(s => s !== option) : [...prev, option],
    );
  }

  function handleSubjectScroll(e) {
    const element = e.target;
    const isAtBottom = Math.abs(element.scrollHeight - element.clientHeight - element.scrollTop) < 5;
    setShowScrollGradient(!isAtBottom);
  }

  function toggleTitleOption(option) {
    setSelectedTitleOptions(prev => {
      if (prev.includes(option)) {
        return prev.filter(item => item !== option);
      } else if (prev.length < 3) {
        return [...prev, option];
      }
      return prev;
    });
  }

  function toggleProgramType(type) {
    setForm(prev => {
      // Simple single-choice selection - just set to the clicked type
      return { ...prev, programType: [type] };
    });
  }

  function canGoNext(currentStep) {
    if (currentStep === 1) {
      if (form.programType.length === 0) {
        setError('학원 종류를 선택해 주세요.');
        return false;
      }
    }

    // IB subjects step
    const needsIB = form.programType.includes('IB') || form.programType.includes('both');
    if (needsIB && currentStep === 2) {
      const hasIBSubjects = selectedIBSubjects.length > 0 || form.ibSubjects.trim();
      if (!hasIBSubjects) {
        setError('IB 과목을 한 개 이상 선택하거나 직접 입력해 주세요.');
        return false;
      }
    }

    // SAT subjects step (step 2 if no IB, step 3 if IB)
    const needsSAT = form.programType.includes('SAT') || form.programType.includes('both');
    const satStepNumber = needsIB ? 3 : 2;
    if (needsSAT && currentStep === satStepNumber) {
      if (selectedSATSubjects.length === 0) {
        setError('SAT 과목을 한 개 이상 선택해 주세요.');
        return false;
      }
    }

    // Format step
    const formatStepNumber = needsIB && needsSAT ? 4 : needsIB || needsSAT ? 3 : 2;
    if (currentStep === formatStepNumber) {
      if ((form.format === 'offline' || form.format === 'either') && !form.region.trim()) {
        setError('대면 수업을 위해 희망 지역을 입력해 주세요.');
        return false;
      }
    }

    // Title step
    const titleStepNumber = formatStepNumber + 2;
    if (currentStep === titleStepNumber) {
      if (selectedTitleOptions.length === 0) {
        setError('원하는 수업 종류를 한 개 이상 선택해 주세요.');
        return false;
      }
    }

    // Description step
    const descStepNumber = titleStepNumber + 1;
    if (currentStep === descStepNumber) {
      if (!form.description.trim()) {
        setError('어떤 도움이 필요한지 간단히 적어 주세요.');
        return false;
      }
    }

    // Contact step
    const contactStepNumber = descStepNumber + 2;
    if (currentStep === contactStepNumber) {
      if (!form.email.trim() && !form.kakaoContact.trim()) {
        setError('이메일 또는 카카오톡 중 하나는 반드시 입력해 주세요.');
        return false;
      }
    }

    setError('');
    return true;
  }

  function getCurrentStepComponent() {
    const needsIB = form.programType.includes('IB') || form.programType.includes('both');
    const needsSAT = form.programType.includes('SAT') || form.programType.includes('both');

    let adjustedStep = step;

    // Step 1: Program type
    if (step === 1) {
      return (
        <>
          <p className="text-sm font-medium text-gray-800 mb-2">
            어떤 학원을 찾고 계신가요?
          </p>
          <div className="space-y-2 text-sm">
            <button
              type="button"
              onClick={() => toggleProgramType('IB')}
              className={`w-full text-left px-3 py-2 rounded-lg border ${
                form.programType.includes('IB') && !form.programType.includes('both')
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              IB 학원
            </button>
            <button
              type="button"
              onClick={() => toggleProgramType('SAT')}
              className={`w-full text-left px-3 py-2 rounded-lg border ${
                form.programType.includes('SAT') && !form.programType.includes('both')
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              SAT 학원
            </button>
            <button
              type="button"
              onClick={() => toggleProgramType('both')}
              className={`w-full text-left px-3 py-2 rounded-lg border ${
                form.programType.includes('both')
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              둘 다
            </button>
          </div>
        </>
      );
    }

    // Step 2: IB subjects (if needed)
    if (needsIB && step === 2) {
      return (
        <>
          <p className="text-sm font-medium text-gray-800 mb-2">
            IB: 어떤 과목에 도움이 필요하신가요?
          </p>
          <div className="relative mb-3">
            <div
              className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto"
              onScroll={handleSubjectScroll}
            >
              {IB_SUBJECT_OPTIONS.map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => toggleIBSubject(option)}
                  className={`text-left px-3 py-2 rounded-lg border text-xs ${
                    selectedIBSubjects.includes(option)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
            {showScrollGradient && (
              <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none transition-opacity duration-300" />
            )}
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-1">위 목록에 없는 과목이 있다면 직접 입력해 주세요.</p>
            <input
              type="text"
              name="ibSubjects"
              value={form.ibSubjects}
              onChange={handleChange}
              placeholder="기타 과목 입력"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </>
      );
    }

    // Adjust step for SAT
    adjustedStep = needsIB ? step - 1 : step;

    // Step 2 or 3: SAT subjects (if needed)
    if (needsSAT && adjustedStep === 2) {
      return (
        <>
          <p className="text-sm font-medium text-gray-800 mb-2">
            SAT: 어떤 과목에 도움이 필요하신가요? (중복 선택 가능)
          </p>
          <div className="space-y-2 text-sm">
            {SAT_SUBJECT_OPTIONS.map(option => (
              <button
                key={option}
                type="button"
                onClick={() => toggleSATSubject(option)}
                className={`w-full text-left px-3 py-2 rounded-lg border ${
                  selectedSATSubjects.includes(option)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </>
      );
    }

    // Adjust step for format
    adjustedStep = needsSAT ? adjustedStep - 1 : adjustedStep;

    // Format step
    if (adjustedStep === 2) {
      return (
        <>
          <p className="text-sm font-medium text-gray-800 mb-2">
            어떤 방식의 수업을 원하시나요?
          </p>
          <div className="space-y-2 text-sm">
            <button
              type="button"
              onClick={() => setForm(prev => ({ ...prev, format: 'online' }))}
              className={`w-full text-left px-3 py-2 rounded-lg border ${
                form.format === 'online'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              온라인
            </button>
            <button
              type="button"
              onClick={() => setForm(prev => ({ ...prev, format: 'offline' }))}
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
              onClick={() => setForm(prev => ({ ...prev, format: 'either' }))}
              className={`w-full text-left px-3 py-2 rounded-lg border ${
                form.format === 'either'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              온라인 + 대면
            </button>
          </div>
          {(form.format === 'offline' || form.format === 'either') && (
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-800 mb-1">
                희망 지역을 입력해주세요
              </label>
              <input
                type="text"
                name="region"
                value={form.region}
                onChange={handleChange}
                placeholder="예: 서울시 강남구, 성남시 분당구 등"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}
        </>
      );
    }

    // Level step
    if (adjustedStep === 3) {
      return (
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
              placeholder="예: Grade 10, 대학생, Primary 등"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          )}
        </>
      );
    }

    // Title step
    if (adjustedStep === 4) {
      return (
        <>
          <p className="text-sm font-medium text-gray-800 mb-2">
            어떤 수업을 원하시나요? (최대 3개)
          </p>
          <div className="space-y-2 text-sm">
            {[
              '개념 다지기',
              '시험 대비 수업',
              '문제 풀이 위주 수업',
              '방학 속성 과외',
              '오랫동안 꾸준히 하는 수업',
              '소수 집중 케어',
              '대규모 강의'
            ].map(option => (
              <button
                key={option}
                type="button"
                onClick={() => toggleTitleOption(option)}
                disabled={!selectedTitleOptions.includes(option) && selectedTitleOptions.length >= 3}
                className={`w-full text-left px-3 py-2 rounded-lg border transition-colors ${
                  selectedTitleOptions.includes(option)
                    ? 'border-blue-500 bg-blue-50'
                    : selectedTitleOptions.length >= 3
                    ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                    : 'border-gray-200 bg-white hover:border-blue-300'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
          {selectedTitleOptions.length > 0 && (
            <p className="text-xs text-gray-500 mt-2">
              선택됨: {selectedTitleOptions.length}/3
            </p>
          )}
        </>
      );
    }

    // Description step
    if (adjustedStep === 5) {
      return (
        <>
          <p className="text-sm font-medium text-gray-800 mb-2">
            어떤 도움이 필요하신지 적어 주세요. (자세할수록 좋습니다!)
          </p>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={4}
            placeholder="예: IB Math AA HL과 SAT Math를 함께 가르쳐 줄 수 있는 학원을 찾고 있습니다. 주 2-3회 수업 희망합니다. 현재 학생은 중국에서 공부하고 있으며, 영어는 조금 서툰 편입니다"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
          />
        </>
      );
    }

    // Hourly rate step
    if (adjustedStep === 6) {
      return (
        <>
          <p className="text-sm font-medium text-gray-800 mb-2">
            희망하는 수업료 범위를 알려주세요
          </p>
          <div className="px-2 py-6">
            <Slider
              range
              min={30}
              max={400}
              step={10}
              value={hourlyRate}
              onChange={setHourlyRate}
              trackStyle={[{ backgroundColor: '#3b82f6' }]}
              handleStyle={[
                { borderColor: '#3b82f6', backgroundColor: '#fff' },
                { borderColor: '#3b82f6', backgroundColor: '#fff' },
              ]}
              railStyle={{ backgroundColor: '#e5e7eb' }}
            />
          </div>
          <div className="flex justify-center items-center gap-4 sm:gap-8 mt-4">
            <div className="flex items-baseline gap-1">
              <span className="text-xs text-gray-500">최소</span>
              <span className="text-xl sm:text-xl font-bold text-blue-600">{hourlyRate[0]}만원</span>
              <span className="text-xs text-gray-400"><span className="text-[10px]">/1달</span></span>
            </div>
            <div className="text-gray-300">~</div>
            <div className="flex items-baseline gap-1">
              <span className="text-xs text-gray-500">최대</span>
              <span className="text-xl sm:text-xl font-bold text-blue-600">{hourlyRate[1]}만원</span>
              <span className="text-xs text-gray-400"><span className="text-[10px]">/1달</span></span>
            </div>
          </div>
          <p className="text-[11px] text-gray-500 mt-3 text-center">
            슬라이더를 드래그하여 조정해주세요
          </p>
        </>
      );
    }

    // Contact step
    if (adjustedStep === 7) {
      return (
        <>
          <p className="text-sm font-medium text-gray-800 mb-2">
            학원이 어디로 연락하면 될까요?
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
            placeholder="카카오톡 ID / 오픈채팅 링크"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-[11px] text-gray-500 mt-2">
            *연락처는 검증된 학원 계정으로 로그인한 사용자에게만 공개됩니다.
          </p>
        </>
      );
    }

    // Password step
    if (adjustedStep === 8) {
      return (
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
      );
    }

    return null;
  }

  return (
    <main className="max-w-xl mx-auto px-4 py-10 min-h-[100dvh]">
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
          질문 {step} / {totalSteps}
        </p>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 space-y-4">
          {getCurrentStepComponent()}
        </div>

        <div className="flex items-center justify-between pt-2 mt-4">
          <button
            type="button"
            onClick={() => {
              setError('');
              setStep(prev => Math.max(1, prev - 1));
            }}
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
                setError('');
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
              {submitting ? '작성 중...' : '요청 글 올리기'}
            </button>
          )}
        </div>
      </form>
    </main>
  );
}
