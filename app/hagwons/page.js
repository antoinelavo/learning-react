import HagwonCard from '@/components/HagwonCard';
import allHagwonsData from '@/data/hagwons';
import FilterLinksClient from './FilterLogic.client';
import FeedbackPopup from './components/FeedbackPopup';

export const metadata = {
  title: 'IB 학원 29곳 추천 및 비교 [2025년 최신]',
  description: 'IB 학원 추천, 비교, 선택 가이드 – 2025년 최신 업데이트',
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
    title: 'IB 학원 29곳 추천 및 비교 [2025년 최신]',
    description: 'IB 학원 추천, 비교, 선택 가이드 – 2025년 최신 업데이트',
    url: 'https://ibmaster.net/hagwons',
    siteName: 'IB Master',
    locale: 'ko-KR',
    type: 'website',
  },
}

export default function HagwonsPage() {
  return (
    <main className="min-h-screen max-w-4xl mx-[5dvw] lg:mx-auto mb-[10em]">
      <h1>IB 학원 29곳 추천 및 비교 [2025년 최신]</h1>

      <article>
        <p><strong>최신 업데이트:</strong> 2025년 7월 3일</p>
        <p>IB 학원은 IB 과정을 이수 중이거나 준비 중인 학생들에게 집중적인 도움을 제공합니다. 본 페이지는 학부모와 학생들이 신뢰할 수 있는 IB 학원을 선택할 수 있도록 도움을 주는 것을 목적으로 하며, 학원 선택 시 고려해야 할 요소, 수업 구성, 과외와의 차이점 등을 상세히 안내합니다.</p>
      </article>

      <FilterLinksClient />

      <div className="space-y-5 flex flex-col mt-6" id="hagwon-list">
        {allHagwonsData.map((card, i) => (
          <div
            key={`${card.id ?? 'hagwon'}-${i}`}
            data-hagwon
            data-region={card.region}
            data-lessontype={card.lessonType}
            data-format={card.format}
            data-service={card.ia_ee_tok ? 'IA,EE,TOK' : ''}
          >
            <HagwonCard {...card} priority={i === 0} />
          </div>
        ))}
      </div>
      <FeedbackPopup />
    </main>
  );
}