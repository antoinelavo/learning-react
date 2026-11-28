import CalculatorClient from './CalculatorClient.client';

const PAGE_URL = 'https://www.ibmaster.net/tools/ib-calculator';
const TITLE = 'IB 성적 계산기 – 과목별 예상 등급과 45점 총점 | IB Master';
const DESCRIPTION =
  '시험·IA 점수를 입력하면 공식 비중으로 환산해 과목별 예상 등급과 IB 디플로마 총점(45점 만점)을 계산합니다. 등급 구간은 직접 수정할 수 있습니다.';

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PAGE_URL },
  openGraph: { title: TITLE, description: DESCRIPTION, url: PAGE_URL, siteName: 'IB Master', locale: 'ko-KR', type: 'website' },
};

export default function IbCalculatorPage() {
  return <CalculatorClient />;
}
