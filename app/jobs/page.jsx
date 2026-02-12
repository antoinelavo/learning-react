import JobsPageClient from './JobsPageClient';

export const metadata = {
  title: '학생 구인 게시판',
  description: '학생이 과외/수업 요청 글을 올리고 선생님이 열람할 수 있는 간단한 구인 게시판입니다.',
};

export default function JobsPage() {
  return <JobsPageClient />;
}

