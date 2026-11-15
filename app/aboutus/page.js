import { Button, Notice, cardClasses } from '@/components/ui';

const DESCRIPTION =
  'IB Master는 수수료 없이 IB 학생과 과외 선생님을 연결하는 IB 전문 과외 플랫폼입니다. IB Master가 추구하는 가치와 서비스를 소개합니다.';

export const metadata = {
  title: 'IB Master 소개 | 수수료 없는 IB 과외 플랫폼',
  description: DESCRIPTION,
  alternates: {
    canonical: '/aboutus',
  },
  openGraph: {
    url: '/aboutus',
    title: 'IB Master 소개 | 수수료 없는 IB 과외 플랫폼',
    description: DESCRIPTION,
  },
};

const VALUES = [
  {
    title: '무료',
    body: '수수료를 받지 않습니다. 학생과 선생님이 부담 없이 만날 수 있습니다.',
  },
  {
    title: '편리',
    body: 'IB 과목, 수업 방식, 수업료 등 꼭 필요한 정보만 담아 쉽게 비교할 수 있습니다.',
  },
  {
    title: '자유',
    body: '학생과 선생님이 직접 연락하고, 수업 조건도 자유롭게 정합니다.',
  },
];

export default function AboutPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-4">
      <h1 className="text-lg sm:text-xl font-bold text-gray-900 leading-snug">IB Master 소개</h1>
      <p className="mt-2 text-gray-700 leading-relaxed">
        IB Master는 IB 학생과 과외 선생님을 연결하는 IB 전문 과외 플랫폼입니다. 수수료 없이 누구나 쉽게
        원하는 선생님을 찾을 수 있습니다.
      </p>

      <section className="mt-8">
        <h2 className="text-base font-semibold text-gray-900">IB Master가 지키는 가치</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {VALUES.map((value) => (
            <div key={value.title} className={cardClasses({ className: 'p-4' })}>
              <h3 className="font-semibold text-blue-600">{value.title}</h3>
              <p className="mt-1 text-sm text-gray-700 leading-relaxed">{value.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={cardClasses({ className: 'mt-8 p-5' })}>
        <h2 className="text-base font-semibold text-gray-900">선생님 찾기</h2>
        <p className="mt-2 text-gray-700 leading-relaxed">
          과목, 수업 방식, 수업료로 IB 과외 선생님을 찾아보세요. 프로필에서 경력과 수업 정보를 확인하고 바로
          연락할 수 있습니다.
        </p>
        <Button href="/find" className="mt-4">
          선생님 찾기
        </Button>
      </section>

      <Notice color="gray" className="mt-8">
        선생님의 신원과 경력은 학생·학부모님께서 직접 확인해 주세요.
      </Notice>
    </main>
  );
}
