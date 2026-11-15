const DESCRIPTION =
  'IB Master는 수수료 없이 IB 학생과 과외 선생님을 이어주는 IB 전문 과외 사이트입니다.';

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

export default function AboutPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-4">
      <h1 className="text-lg sm:text-xl font-bold text-gray-900 leading-snug">소개</h1>
      <div className="mt-4 space-y-4 text-gray-700 leading-relaxed">
        <p>
          IB 과외 선생님을 찾는 일이 생각보다 쉽지 않습니다. 일반 과외 사이트에는 IB를 제대로 아는 선생님이
          드물고, 수수료 때문에 학생도 선생님도 부담이 커지곤 하죠. IB Master는 이런 불편을 줄이고 싶어서
          만든 IB 전문 과외 사이트입니다.
        </p>
        <p>
          수수료는 받지 않습니다. 선생님 프로필에서 과목과 경력, 수업 방식을 살펴보고 마음에 드는 분께 직접
          연락하시면 됩니다. 수업 시간이나 비용도 두 분이 편하게 정하시면 돼요. IB를 준비하는 모든 학생이 잘
          맞는 선생님을 만나 원하는 결과를 얻을 수 있도록 돕고 싶습니다.
        </p>
        <p className="text-sm text-gray-500">
          선생님의 신원과 경력은 학생·학부모님께서 직접 확인해 주세요.
        </p>
      </div>
    </main>
  );
}
