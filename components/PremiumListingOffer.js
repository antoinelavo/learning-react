'use client';
import Script from 'next/script';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const tiers = [
  {
    name: '기본 프로필',
    id: 'tier-basic',
    priceMonthly: '\₩ 0',
    description: '수수료 0원인 기본 프로필입니다.',
    features: [
      '프로필 순서 무작위',
      '기본 색상',
      '추천 뱃지 없음'
    ],
    featured: false,
  },
  {
    name: '프리미엄 과목 3개',
    id: 'tier-top',
    priceMonthly: '\₩ 12,000',
    description: '선택한 3개 과목으로 상단 노출됩니다.',
    features: [
      '프로필 상단 고정',
      '강조 색상 · 추천 뱃지',
      '과목당 \₩ 4,000'
    ],
    featured: true,
  },
  {
    name: '프리미엄 과목 1개',
    id: 'tier-medium',
    priceMonthly: '\₩ 5,000',
    description: '선택한 1과목으로 상단 노출됩니다.',
    features: [
      '프로필 상단 고정',
      '강조 색상 · 추천 뱃지',
      '과목당 \₩ 5,000'
    ],
    featured: false,
  }
];

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

// Small inline counter used for the "n=7,315" stat in the card subtitle —
// same technique as the rest of this codebase's scroll/mount-triggered
// animations (plain state + requestAnimationFrame, no animation library).
function CountUp({ target, duration = 1200 }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const startTime = performance.now();
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [target, duration]);

  return <span>{count.toLocaleString()}</span>;
}

// Generate a random order ID to hand to Toss's payment window.
function randomId() {
  return [...crypto.getRandomValues(new Uint32Array(2))]
    .map((word) => word.toString(16).padStart(8, "0"))
    .join("")
}

// Check premium spot availability
async function checkPremiumSpotAvailability(subjects, supabase) {
  const SPOTS_PER_SUBJECT = 5;

  try {
    // Get all currently active premium subscriptions
    const { data: activePremium, error } = await supabase
      .from('teacher_premium')
      .select('subject')
      .gt('end_date', new Date().toISOString()); // Only active subscriptions

    if (error) {
      throw error;
    }

    // Count how many teachers have premium for each subject
    const subjectCounts = {};

    // Initialize counts for requested subjects
    subjects.forEach(subject => {
      subjectCounts[subject] = 0;
    });

    // Count active subscriptions per subject
    activePremium.forEach(record => {
      record.subject.forEach(subject => {
        if (subjects.includes(subject)) {
          subjectCounts[subject] = (subjectCounts[subject] || 0) + 1;
        }
      });
    });

    // Calculate availability for each subject
    const availability = {};
    subjects.forEach(subject => {
      const used = subjectCounts[subject] || 0;
      availability[subject] = {
        used: used,
        remaining: Math.max(0, SPOTS_PER_SUBJECT - used),
        isFull: used >= SPOTS_PER_SUBJECT,
        total: SPOTS_PER_SUBJECT
      };
    });

    return {
      success: true,
      availability,
      allAvailable: subjects.every(subject => !availability[subject].isFull)
    };

  } catch (error) {
    return {
      success: false,
      error: error.message,
      availability: {},
      allAvailable: false
    };
  }
}

async function countTeachersPerSubject(subjects, supabase) {
  try {
    const { data: allTeachers, error } = await supabase
      .from('teachers')
      .select('subjects');

    if (error) {
      throw error;
    }

    const subjectCounts = {};

    // Initialize counts for requested subjects
    subjects.forEach(subject => {
      subjectCounts[subject] = 0;
    });

    // Count teachers per subject
    allTeachers.forEach(teacher => {
      teacher.subjects?.forEach(subject => {
        if (subjects.includes(subject)) {
          subjectCounts[subject] = (subjectCounts[subject] || 0) + 1;
        }
      });
    });

    return {
      success: true,
      counts: subjectCounts
    };

  } catch (error) {
    return {
      success: false,
      error: error.message,
      counts: {}
    };
  }
}

export default function PremiumListingOffer({teacher}) {
  const router = useRouter();
  const [teacherCounts, setTeacherCounts] = useState({});
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [subjectAvailability, setSubjectAvailability] = useState({});
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [showAccountNumber, setShowAccountNumber] = useState(false);
  const [bankTransferRequested, setBankTransferRequested] = useState(false);



  const subjects = teacher?.subjects || [];

  // Check premium spot availability
const checkAvailability = async (subjectsToCheck) => {
  if (subjectsToCheck.length === 0) return;

  setAvailabilityLoading(true);
  try {
    const [availabilityResult, teacherCountResult] = await Promise.all([
      checkPremiumSpotAvailability(subjectsToCheck, supabase),
      countTeachersPerSubject(subjectsToCheck, supabase)
    ]);

    if (availabilityResult.success) {
      setSubjectAvailability(availabilityResult.availability);
    }

    if (teacherCountResult.success) {
      setTeacherCounts(teacherCountResult.counts);
    }
  } catch (error) {
    // availability check failed
  } finally {
    setAvailabilityLoading(false);
  }
};

  // Check availability when component loads
  useEffect(() => {
    if (subjects.length > 0) {
      checkAvailability(subjects);
    }
  }, [subjects]);

  // Toss confirms payment via a server-side redirect back to this page
  // (?payment=success|failed), not a JS callback — surface the result here.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get('payment');
    if (!payment) return;

    if (payment === 'success') {
      alert('결제가 완료되었습니다! 프리미엄 기능이 활성화되었습니다.');
    } else if (payment === 'failed') {
      alert('결제에 실패했습니다. 다시 시도해주세요.');
    }

    // Strip the query params so a refresh doesn't re-trigger the alert.
    router.replace(window.location.pathname);
  }, []);

  const handleToggleSubject = (subject) => {
    // Don't allow selecting full subjects
    if (subjectAvailability[subject]?.isFull) {
      alert(`${subject}의 프리미엄 자리가 모두 찼습니다.`);
      return;
    }

    setSelectedSubjects((prev) =>
      prev.includes(subject)
        ? prev.filter((s) => s !== subject)
        : [...prev, subject]
    );
  };

  const [duration, setDuration] = useState(1); // in months

  const calculateTotal = () => {
    const count = selectedSubjects.length;
    if (count === 0) return 0;

    let base;
    if (count === 1) base = 5000;
    else if (count === 2) base = 10000;
    else if (count === 3) base = 12000;
    else base = count * 4000;

    return base * duration;
  };

  const handlePayment = async () => {
    // Validation
    if (selectedSubjects.length === 0) {
      alert('과목을 선택해주세요.');
      return;
    }

    if (!teacher?.id || !teacher?.name) {
      alert('로그인이 필요합니다.');
      router.push('/login');
      return;
    }

    if (paymentProcessing) {
      return;
    }

    if (typeof window === 'undefined' || typeof window.TossPayments === 'undefined') {
      alert('결제 모듈을 불러오지 못했습니다. 새로고침 후 다시 시도해주세요.');
      return;
    }

    setPaymentProcessing(true);

    try {
      // Generate unique order ID
      const orderId = randomId();
      const totalAmount = calculateTotal();

      const { error: logError } = await supabase.from('payment_request').insert([
        {
          teacher_id: teacher.id,
          name: teacher.name,
          subjects: selectedSubjects,
          duration_months: duration,
          amount: totalAmount,
          requested_at: new Date().toISOString(),
          order_id: orderId,
        },
      ]);

      if (logError) {
        // Without this row the successUrl callback can't look up who paid —
        // don't send the buyer into Toss's payment window for nothing.
        alert('결제 준비 중 오류가 발생했습니다. 다시 시도해주세요.');
        setPaymentProcessing(false);
        return;
      }

      // Hand off to Toss's payment window. There is no success callback
      // here — Toss redirects the browser straight to successUrl/failUrl,
      // which confirm/activate premium server-side before landing on
      // /dashboard?payment=success|failed. The promise below only rejects
      // for failures that happen before that handoff (e.g. the buyer
      // closing the window).
      const tossPayments = window.TossPayments(process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY);
      tossPayments
        .requestPayment('CARD', {
          amount: totalAmount,
          orderId,
          orderName: `프리미엄 프로필 ${selectedSubjects.join(', ')} (${duration}개월)`,
          customerName: teacher.name,
          successUrl: `${window.location.origin}/api/toss/success`,
          failUrl: `${window.location.origin}/api/toss/fail`,
        })
        .catch((result) => {
          if (result?.code === 'USER_CANCEL') {
            setPaymentProcessing(false);
            return;
          }
          alert(`결제 실패: ${result?.message || '알 수 없는 오류'}`);
          setPaymentProcessing(false);
        });
    } catch (error) {
      alert('결제 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
      setPaymentProcessing(false);
    }
  };

  const handleBankTransfer = async () => {
    // Validation
    if (selectedSubjects.length === 0) {
        alert('과목을 선택해주세요.');
        return;
    }

    if (!teacher?.id || !teacher?.name) {
        alert('로그인이 필요합니다.');
        router.push('/login');
        return;
    }

    if (bankTransferRequested) {
        return; // Already requested
    }

    try {
        // Show account number permanently
        setShowAccountNumber(true);
        setBankTransferRequested(true);

        const totalAmount = calculateTotal();

        const { error: logError } = await supabase.from('payment_request').insert([
            {
                teacher_id: teacher.id,
                name: teacher.name,
                subjects: selectedSubjects,
                duration_months: duration,
                amount: totalAmount,
                requested_at: new Date().toISOString(),
            },
        ]);

        if (logError) {
            alert('요청 기록 중 오류가 발생했습니다.');
        }

    } catch (error) {
        alert('요청 처리 중 오류가 발생했습니다.');
    }
};

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow p-6 sm:p-8">
      <Script src="https://js.tosspayments.com/v1/payment" strategy="afterInteractive" />

      <h2 className="text-lg font-bold mb-1">프리미엄 프로필</h2>
      <p className="text-sm text-gray-500 mb-6">
        과목별 검색 결과에서 <span className="font-semibold text-blue-600">상단 노출</span> · 평균 클릭 수{' '}
        <span className="font-semibold text-blue-600">9배</span> 증가 (n=<CountUp target={7315} /> 실험 기준). 각 과목별{' '}
        <span className="font-semibold text-blue-600">5명 한정</span>, 선착순 마감.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {tiers.map((tier) => (
          <div
            key={tier.id}
            className={classNames(
              tier.featured ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900',
              'rounded-xl p-4'
            )}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className={classNames(tier.featured ? 'text-blue-300' : 'text-blue-600', 'text-xs font-semibold')}>
                {tier.name}
              </span>
              {tier.featured && (
                <span className="text-[10px] px-1.5 py-0.5 border border-white rounded-full">추천</span>
              )}
            </div>
            <p className="text-2xl font-bold leading-tight">
              {tier.priceMonthly}
              <span className={classNames(tier.featured ? 'text-gray-400' : 'text-gray-500', 'text-xs font-normal ml-1')}>
                /월
              </span>
            </p>
            <ul className={classNames(tier.featured ? 'text-gray-300' : 'text-gray-600', 'text-xs mt-2 space-y-1')}>
              {tier.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Subject Selector */}
      <div className="border-t border-gray-100 pt-6">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">프리미엄 과목 선택</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {subjects.map((subject) => {
            const availability = subjectAvailability[subject];
            const isFull = availability?.isFull || false;
            const remaining = availability?.remaining || 0;
            const isSelected = selectedSubjects.includes(subject);
            const teacherCount = teacherCounts[subject] || 0;

            return (
              <div key={subject} className="relative">
                <button
                  onClick={() => handleToggleSubject(subject)}
                  disabled={paymentProcessing || isFull}
                  className={classNames(
                    'px-4 py-3 rounded-lg border transition w-full text-left',
                    isSelected && !isFull
                      ? 'bg-blue-600 text-white border-blue-600'
                      : isFull
                      ? 'bg-gray-300 text-gray-400 border-gray-300 cursor-not-allowed'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50',
                    paymentProcessing ? 'opacity-50 cursor-not-allowed' : ''
                  )}
                >
                  <div className={classNames('font-medium', isSelected && !isFull ? 'text-white' : 'text-gray-800')}>
                    {subject}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-0 justify-between items-left mt-1 text-xs">
                    <span className={classNames(isSelected && !isFull ? 'text-blue-100' : 'text-gray-500')}>
                      {availabilityLoading ? '로딩중...' : `총 선생님 수: ${teacherCount}`}
                    </span>
                    <span>
                      {availabilityLoading ? (
                        <span className={classNames(isSelected && !isFull ? 'text-blue-100' : 'text-gray-400')}>
                          확인중...
                        </span>
                      ) : isFull ? (
                        <span className="text-red-500 font-medium">마감</span>
                      ) : availability ? (
                        <span
                          className={classNames(
                            'font-medium',
                            isSelected && !isFull ? 'text-white' : remaining === 5 ? 'text-green-600' : 'text-yellow-600'
                          )}
                        >
                          남은 자리: {remaining}
                        </span>
                      ) : null}
                    </span>
                  </div>
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-6 text-center">
          <label className="block mb-2 text-sm font-medium text-gray-700">원하는 기간 선택 (개월)</label>
          <select
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            disabled={paymentProcessing}
            className="px-4 py-2 border rounded-md text-sm font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
              <option key={month} value={month}>
                {month}개월
              </option>
            ))}
          </select>
        </div>

        <div className="mt-6 text-center text-lg font-semibold text-gray-800">
          총 결제 금액: <span className="text-blue-600">₩ {calculateTotal().toLocaleString()}</span>
        </div>

        <div className="mx-auto text-center flex flex-col sm:flex-row justify-center gap-2">
          <button
            onClick={handlePayment}
            disabled={paymentProcessing || selectedSubjects.length === 0}
            className={classNames(
              'mt-6 px-6 py-3 rounded-xl font-semibold transition',
              paymentProcessing || selectedSubjects.length === 0
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            )}
          >
            {paymentProcessing
              ? '결제 진행 중...'
              : '결제하기 (카드 - 현재 테스트 중입니다. 실결제로 이어지지 않습니다)'}
          </button>

          <div className="text-center">
            <button
              onClick={handleBankTransfer}
              disabled={bankTransferRequested || selectedSubjects.length === 0}
              className={classNames(
                'mt-6 px-6 py-3 rounded-xl font-semibold transition w-full',
                bankTransferRequested || selectedSubjects.length === 0
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              )}
            >
              {showAccountNumber ? '입금 후 1일 내 프리미엄 프로필이 적용됩니다.' : '결제하기 (계좌이체)'}
            </button>
          </div>
        </div>
        {/* Account number text that appears/disappears */}
        {showAccountNumber && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border text-center">
            <div className="text-sm text-gray-600 mb-1">입금 계좌</div>
            <div className="text-lg font-mono font-semibold text-gray-900">
              {process.env.NEXT_PUBLIC_BANK_ACCOUNT || '계좌 정보를 불러올 수 없습니다'}
            </div>
            <div className="text-sm text-gray-500 mt-1">예금주: {process.env.NEXT_PUBLIC_BANK_HOLDER || ''}</div>
          </div>
        )}
      </div>
    </div>
  );
}
