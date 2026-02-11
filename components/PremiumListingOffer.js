'use client';
import dynamic from 'next/dynamic';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import TeacherCard from '@/components/TeacherCard';
import ScrollFadeIn from '@/components/ScrollFadeIn';
import { supabase } from '@/lib/supabase';
import PortOne from "@portone/browser-sdk/v2";

const Scroll = dynamic(() => import('quill/blots/scroll'), { ssr: false });

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
    description: '선생님 프로필이 선택한 3개 과목으로 상단 노출됩니다.',
    features: [
      '프로필 상단 고정',
      '강조 색상',
      '추천 뱃지 적용',
      '과목당  \₩ 4,000'
    ],
    featured: true,
  },
  {
    name: '프리미엄 과목 1개',
    id: 'tier-medium',
    priceMonthly: '\₩ 5,000',
    description: '선생님 프로필이 선택한 1과목으로 상단 노출됩니다.',
    features: [
      '프로필 상단 고정',
      '강조 색상',
      '추천 뱃지 적용',
      '과목당  \₩ 5,000'
    ],
    featured: false,
  }
];

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

function PremiumCount(){
  const [count, setCount] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchCount() {
      const { data, error } = await supabase
        .from('teacher_premium')
        .select('subject')
      if (error) {
        setError(error.message)
        return
      }
      const total = data.reduce((sum, row) => sum + row.subject.length, 0)
      setCount(total)
    }
    fetchCount()
  }, [])

  if (error) return <p>오류 발생: {error}</p>
  if (count === null) return <p>로딩 중…</p>

  return(
    <span>{count}</span>
  )
}

function CountUp({ target, duration = 1500 }) {
    const ref = useRef();
    const [count, setCount] = useState(0);

    useEffect(() => {
    const observer = new IntersectionObserver(
        ([entry]) => {
        if (entry.isIntersecting) {
            const startTime = performance.now();

            const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const current = Math.floor(progress * target);
            setCount(current);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
            };

            requestAnimationFrame(animate);
            observer.disconnect();
        }
        },
        { threshold: 0.5 }
    );

    if (ref.current) observer.observe(ref.current);

    return () => observer.disconnect();
    }, [target, duration]);

  return <span ref={ref}>{count.toLocaleString()}</span>;
}

// Generate random payment ID (from PortOne docs)
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
    // TODO: Update table name and column name based on your schema
    const { data: allTeachers, error } = await supabase
      .from('teachers') // ← Update this table name
      .select('subjects'); // ← Update this column name

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

    setPaymentProcessing(true);

    try {
      // Generate unique payment ID
      const paymentId = randomId();
      const totalAmount = calculateTotal();

      const { error: logError } = await supabase.from('payment_request').insert([
        {
          teacher_id: teacher.id,  // Changed from 'id' to 'teacher_id'
          name: teacher.name,
          subjects: selectedSubjects,
          duration_months: duration,
          amount: totalAmount,
          requested_at: new Date().toISOString(),
        },
      ]);

      if (logError) {
        // payment request logging failed — non-blocking
      }

      // Request payment using PortOne
      const payment = await PortOne.requestPayment({
        storeId: process.env.NEXT_PUBLIC_PORTONE_STORE_ID,
        channelKey: process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY,
        paymentId: paymentId,
        orderName: `프리미엄 프로필 ${selectedSubjects.join(', ')} (${duration}개월)`,
        totalAmount: totalAmount,
        currency: "KRW",
        payMethod: "CARD",
        
        // Customer info (from teacher)
        customer: {
          customerId: teacher.id.toString(),
          fullName: teacher.name,
          email: `teacher${teacher.id}@payments.yoursite.com`, // Generate valid dummy email
          phoneNumber: '010-0000-0000', // Valid Korean phone format for KG Inicis
        },
        
        // Custom data for verification (no Korean characters allowed)
        customData: JSON.stringify({
          teacherId: teacher.id,
          subjectCount: selectedSubjects.length, // Use count instead of names
          durationMonths: duration,
          expectedAmount: totalAmount
        }),

        // Redirect URL for mobile
        redirectUrl: `${window.location.origin}/dashboard`,
      });

      // Check if payment failed
      if (payment.code !== undefined) {
        alert(`결제 실패: ${payment.message}`);
        return;
      }

      // Payment succeeded - now verify on server
      const verificationResponse = await fetch('/api/premium/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentId: payment.paymentId,
          teacherId: teacher.id,
          teacherName: teacher.name,
          subjects: selectedSubjects,
          durationMonths: duration,
          expectedAmount: totalAmount
        }),
      });

      const verificationResult = await verificationResponse.json();

      if (verificationResponse.ok) {
        // Payment verified successfully
        alert('결제가 완료되었습니다! 프리미엄 기능이 활성화되었습니다.');
        
        // Redirect to dashboard
        router.push('/dashboard');
      } else {
        throw new Error(verificationResult.error || 'Payment verification failed');
      }

    } catch (error) {
      alert('결제 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
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
    <div className="bg-white border border-solid border-gray-200 shadow rounded-2xl relative isolate px-6 py-[5dvh] lg:px-8">

        <h2 className="text-base font-semibold text-center bg-gradient-to-r from-blue-800 to-blue-400 bg-clip-text text-transparent">프리미엄 프로필</h2>
        <p className="mt-2 text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl text-center mb-[2em]">
          9배 더 많은 학생들과 만나보세요. 
        </p>

        {teacher && (
            <>
            <div>
                <ScrollFadeIn>
                    <div className="mb-12 mt-12 max-w-[40em] mx-auto">
                        <p className="m-0 text-gray-500">일반 프로필</p>
                        <div className="pointer-events-none">
                                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
                                <TeacherCard
                                    name={teacher.name}
                                    school={teacher.school}
                                    shortintroduction={teacher.shortintroduction}
                                    profile_picture={teacher.profile_picture || 'https://ibmaster.antoinelavo.com/teachers/default.jpg'}
                                />
                            </div>
                        </div>
                    </div>
                </ScrollFadeIn>
                <ScrollFadeIn>
                    <div className="mb-12 max-w-[40em] mx-auto ">
                        <p className="m-0 text-gray-500">프리미엄 프로필</p>
                        <div className="pointer-events-none border border-2 border-yellow-400 rounded-2xl overflow-hidden shadow-sm w-full h-full">
                            <TeacherCard
                                name={teacher.name}
                                school={teacher.school}
                                shortintroduction={teacher.shortintroduction}
                                profile_picture={teacher.profile_picture || 'https://ibmaster.antoinelavo.com/teachers/default.jpg'}
                                badge="추천"
                                className="w-full h-full"
                            />
                        </div>
                    </div>
                </ScrollFadeIn>
            </div>
            </>
        )}

        <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-600">
            프리미엄 프로필은 과목별 검색 결과에서 <span className="font-bold text-blue-500">상단 노출</span>됩니다. 
            각 과목별로 프리미엄 프로필 서비스는 <span className="font-bold text-blue-500">단 5명</span>에게만 제공되며, 선착순으로 마감됩니다.
        </p>

        <ScrollFadeIn>
            <div className="max-w-xl mx-auto my-[15em] text-center space-y-4">
                <div className="text-sm text-gray-500 font-medium mb-0">일반 프로필 대비</div>
                <div className="text-5xl font-extrabold bg-gradient-to-r from-black to-blue-400 bg-clip-text text-transparent">예상 프로필 클릭 수 9배</div>
                <div className="text-lg text-gray-700 font-medium">노출 수 약 3배 × CTR(클릭율) 약 3배</div>
                <div className="text-sm text-gray-500 font-medium">n = <CountUp target={7315} />의 실험 결과</div>
            </div>
        </ScrollFadeIn>

        <ScrollFadeIn>
      <div className="mx-auto mt-16 grid max-w-lg grid-cols-1 gap-y-6 sm:mt-20 lg:max-w-4xl lg:grid-cols-3">
        {tiers.map((tier, tierIdx) => (
          <div
            key={tier.id}
            className={classNames(
              tier.featured ? 'relative bg-gray-900 shadow-2xl' : 'bg-white/60 sm:mx-8 lg:mx-0',
              tier.featured
                ? ''
                : tierIdx === 0
                ? 'rounded-t-3xl sm:rounded-b-none lg:rounded-tr-none lg:rounded-bl-3xl'
                : 'sm:rounded-t-none lg:rounded-tr-3xl lg:rounded-bl-none',
              'rounded-3xl p-8 ring-1 ring-gray-900/10 sm:p-10'
            )}
          >
            <div className="flex flex-row">
                <h3
                id={tier.id}
                className={classNames(tier.featured ? 'text-blue-400' : 'text-blue-600', 'text-base font-semibold')}
                >
                {tier.name}
                </h3>
                <span className={classNames(!tier.featured ? 'hidden' : 'block', 'text-white', 'text-xs', 'px-[0.5em]', 'py-[0.25em]', 'border', 'border-white', 'rounded-full', 'ml-[1em]')}>
                    추천
                </span>
            </div>
            <p className="mt-4 flex items-baseline gap-x-2">
              <span
                className={classNames(
                  tier.featured ? 'text-white' : 'text-gray-900',
                  'text-5xl font-semibold tracking-tight'
                )}
              >
                {tier.priceMonthly}
              </span>
              <span className={classNames(tier.featured ? 'text-gray-400' : 'text-gray-500', 'text-base')}>
                /월
              </span>
            </p>
            <p className={classNames(tier.featured ? 'text-gray-300' : 'text-gray-600', 'mt-6 text-base')}>
              {tier.description}
            </p>
            <ul
              role="list"
              className={classNames(
                tier.featured ? 'text-gray-300' : 'text-gray-600',
                'mt-8 space-y-3 text-sm sm:mt-10'
              )}
            >
              {tier.features.map((feature) => (
                <li key={feature} className="flex gap-x-3">
                  {feature}
                </li>
              ))}
            </ul>            
          </div>
        ))}
      </div>
      </ScrollFadeIn>

              {/* Subject Selector */}
                <div className="mx-auto mt-24 w-fill border rounded-3xl bg-white p-8 shadow-inner">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">프리미엄 과목 선택</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {subjects.map((subject) => {
                        const availability = subjectAvailability[subject];
                        const isFull = availability?.isFull || false;
                        const remaining = availability?.remaining || 0;
                        const isSelected = selectedSubjects.includes(subject);
                        const teacherCount = teacherCounts[subject] || 0;

                        
                        return (
                        <div key={subject} className="relative">
                            {/* Availability indicator */}
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
                              <div className={classNames(
                                  "font-medium",
                                  isSelected && !isFull ? "text-white" : "text-gray-800"
                              )}>
                                  {subject}
                              </div>
                              <div className="flex flex-col sm:flex-row gap-2 sm:gap-0 justify-between items-left mt-1 text-xs">
                                  <span className={classNames(
                                      isSelected && !isFull ? "text-blue-100" : "text-gray-500"
                                  )}>
                                      {availabilityLoading ? "로딩중..." : `총 선생님 수: ${teacherCount}`}
                                  </span>
                                  <span>
                                      {availabilityLoading ? (
                                          <span className={classNames(
                                              isSelected && !isFull ? "text-blue-100" : "text-gray-400"
                                          )}>
                                              확인중...
                                          </span>
                                      ) : isFull ? (
                                          <span className="text-red-500 font-medium">마감</span>
                                      ) : availability ? (
                                          <span className={classNames(
                                              "font-medium",
                                              isSelected && !isFull ? "text-white" : 
                                              remaining === 5 ? "text-green-600" : "text-yellow-600"
                                          )}>
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
                        {paymentProcessing ? '결제 진행 중...' : '결제하기 (카드)'}
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
                                {showAccountNumber ? '입금 확인 후 연락드리겠습니다' : '결제하기 (계좌이체)'}
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
                            <div className="text-sm text-gray-500 mt-1">
                                예금주: {process.env.NEXT_PUBLIC_BANK_HOLDER || ''}
                            </div>
                        </div>
                    )}
                </div>
    </div>
  );
}