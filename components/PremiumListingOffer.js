import { useState, useEffect, useRef } from 'react';
import TeacherCard from '@/components/TeacherCard';
import ScrollFadeIn from '@/components/ScrollFadeIn';
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
    featured: true,
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
    featured: false,
  }

];

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
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
            observer.disconnect(); // only animate once
        }
        },
        { threshold: 0.5 }
    );

    if (ref.current) observer.observe(ref.current);

    return () => observer.disconnect();
    }, [target, duration]);


  return <span ref={ref}>{count.toLocaleString()}</span>;
}


export default function PremiumListingOffer({teacher}) {
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [showReceipt, setShowReceipt] = useState(false);

  const subjects = teacher?.subjects || [];


  const handleToggleSubject = (subject) => {
    setSelectedSubjects((prev) =>
      prev.includes(subject)
        ? prev.filter((s) => s !== subject)
        : [...prev, subject]
    );
  };

  const calculateTotal = () => {
    const count = selectedSubjects.length;
    if (count === 0) return 0;
    if (count === 1) return 5000;
    if (count === 2) return 10000;
    if (count === 3) return 12000;
    return count * 4000;
  };

    const handlePaymentRequest = async () => {
        const { error } = await supabase.from('payment_request').insert([
            {
            id: teacher.id,
            name: teacher.name,
            subjects: selectedSubjects,
            amount: calculateTotal(),
            requested_at: new Date().toISOString(),
            },
        ]);

        if (error) {
            console.error('결제 요청 실패:', error);
            alert('결제 요청에 실패했습니다.');
        } else {
            alert(`₩${calculateTotal().toLocaleString()}원을 "신한은행 110 591 381671 박유진"으로 이체하시면 결제가 진행됩니다. 서비스는 결제 확인 후 진행됩니다.`);
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
            <ScrollFadeIn>
                <div className="mb-12 max-w-[40em] mx-auto">
                    <p className="m-0 text-gray-500">일반 프로필</p>
                    <div className="pointer-events-none">
                            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
                            <TeacherCard
                                name={teacher.name}
                                school={teacher.school}
                                shortintroduction={teacher.shortintroduction}
                                profile_picture={teacher.profile_picture || 'https://.../default.png'}
                            />
                        </div>
                    </div>
                </div>
            </ScrollFadeIn>
            <ScrollFadeIn>
                <div className="mb-12 max-w-[40em] mx-auto">
                    <p className="m-0 text-gray-500">프리미엄 프로필</p>
                    <div className="pointer-events-none">
                        <div className="bg-white border-2 border-yellow-400 rounded-2xl shadow-[0_0_12px_1px_rgba(250,204,21,0.4)] rounded-xl shadow-sm">
                        <TeacherCard
                            name={teacher.name}
                            school={teacher.school}
                            shortintroduction={teacher.shortintroduction}
                            profile_picture={teacher.profile_picture || 'https://.../default.png'}
                            badge="추천"
                        />
                        </div>
                    </div>
                </div>
            </ScrollFadeIn>
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
                <div className="text-sm text-gray-500 font-medium">n = <CountUp target={7315} />+의 실험 결과</div>
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
                    {subjects.map((subject) => (
                        <button
                        key={subject}
                        onClick={() => handleToggleSubject(subject)}
                        className={classNames(
                            'px-4 py-2 rounded-full text-sm font-medium border transition',
                            selectedSubjects.includes(subject)
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        )}
                        >
                        {subject}
                        </button>
                    ))}
                    </div>
                    <div className="mt-6 text-center text-lg font-semibold text-gray-800">
                    총 결제 금액: <span className="text-blue-600">₩ {calculateTotal().toLocaleString()}</span>
                    </div>
                    <div className="mx-auto w-fill text-center">
                        <button
                        onClick={() => setShowReceipt(true)}
                        className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition"
                        >
                        결제하기
                        </button>
                    </div>

                    {showReceipt && (
                        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
                            <div className="bg-white rounded-xl p-6 w-[90%] max-w-md shadow-lg relative">
                            <h2 className="text-xl font-bold mb-4">최종 결제 내역</h2>
                            <ul className="mb-4 text-gray-700 list-disc list-inside">
                                {selectedSubjects.map((subj) => (
                                <li key={subj}>{subj}</li>
                                ))}
                            </ul>
                            <p className="text-right text-lg font-semibold">
                                총 결제 금액: <span className="text-blue-600">₩{calculateTotal().toLocaleString()}</span>
                            </p>
                            <div className="mt-6 flex justify-end gap-2">
                                <button
                                onClick={() => setShowReceipt(false)}
                                className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
                                >
                                닫기
                                </button>
                                <button
                                onClick={handlePaymentRequest}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                >
                                결제 진행
                                </button>
                            </div>
                            </div>
                        </div>
                        )}

                </div>
    </div>
  );
}
