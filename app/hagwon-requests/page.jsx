import HagwonRequestsPageClient from './HagwonRequestsPageClient';

export const metadata = {
  title: '학원 요청 게시판',
  description: '학생이 학원 요청 글을 올리고 학원이 열람할 수 있는 간단한 게시판입니다.',
};

export default function HagwonRequestsPage() {
  return <HagwonRequestsPageClient />;
}
