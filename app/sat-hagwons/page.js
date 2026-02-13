import SATHagwonCard from '@/components/SATHagwonCard';
import allHagwonsData from '@/data/sat-hagwons';
import FeedbackPopup from './components/FeedbackPopup';
import FilterLinksClient from './FilterLogic.client';

export const metadata = {
  title: 'SAT 학원 29곳 추천 및 비교 [2026년 최신]',
  description: 'SAT 학원 추천, 비교, 선택 가이드 – 2026년 최신 업데이트',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/images/favicon.ico'
  },

  openGraph: {
    title: 'SAT 학원 29곳 추천 및 비교 [2026년 최신]',
    description: 'SAT 학원 추천, 비교, 선택 가이드 – 2026년 최신 업데이트',
    url: 'https://ibmaster.net/sat-hagwons',
    siteName: 'IB Master',
    locale: 'ko-KR',
    type: 'website',
  },
}

export default function HagwonsPage() {
  return (
    <main className="min-h-screen max-w-4xl mx-[5dvw] lg:mx-auto mb-[10em]">
      <h1>SAT 학원 29곳 추천 및 비교 [2026년 최신]</h1>

      <article>
        <p className="mb-0"><strong>최신 업데이트:</strong> 2026년 2월 12일</p>
        <p className="mt-1 text-gray-400 text-sm">지난달 조회수: {process.env.NEXT_PUBLIC_SAT_HAGWONS_MONTHLY_VIEWS || '0'}회</p>
        <p>SAT 학원은 SAT 시험을 준비 중인 학생들에게 집중적인 도움을 제공합니다. 본 페이지는 학부모와 학생들이 신뢰할 수 있는 SAT 학원을 선택할 수 있도록 도움을 주는 것을 목적으로 하며, 학원 선택 시 고려해야 할 요소, 수업 구성, 과외와의 차이점 등을 상세히 안내합니다.</p>
      </article>

      <FilterLinksClient />

      {/* CTA Banner */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-md p-4 sm:p-6 my-6">
        <div className="text-center">
          <p className="text-sm sm:text-base text-gray-700 mb-3">
            간단한 질문 몇 개만 답하면, 학원 관계자가 직접 연락드립니다. (약 30초 소요)
          </p>
          <a
            href="/hagwon-requests/new"
            className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            질문 보기
          </a>
        </div>
      </div>

      <div className="space-y-5 flex flex-col mt-6" id="hagwon-list">
        {allHagwonsData.map((card, i) => (
          <div
            key={`${card.id ?? 'hagwon'}-${i}`}
            data-hagwon
            data-region={card.region}
            data-lessontype={card.lessonType}
            data-format={card.format}
            data-service={Array.isArray(card.services) ? card.services.join(',') : ''}
          >
            <SATHagwonCard {...card} priority={i === 0} />
          </div>
        ))}
      </div>

      <FeedbackPopup />
    </main>
  );
}