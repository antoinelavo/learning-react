import CalendarClient from './CalendarClient.client';
import { kstToday } from '@/lib/examCalendar';

const PAGE_URL = 'https://www.ibmaster.net/tools/calendar';
const TITLE = 'IB·SAT·대입 시험 일정 캘린더 | IB Master';
const DESCRIPTION =
  'SAT 시험일과 등록 마감, 대학 정시·수시 원서접수 일정을 D-day로 확인하세요. 모든 일정에 공식 출처와 확인일을 표시합니다.';

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PAGE_URL },
  openGraph: { title: TITLE, description: DESCRIPTION, url: PAGE_URL, siteName: 'IB Master', locale: 'ko-KR', type: 'website' },
};

export const revalidate = 3600;

export default function CalendarPage() {
  return <CalendarClient initialToday={kstToday()} />;
}
