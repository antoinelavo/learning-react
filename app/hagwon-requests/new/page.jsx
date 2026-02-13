import HagwonRequestsCreateClient from './HagwonRequestsCreateClient';

export const metadata = {
  title: '학원 요청 글 작성',
  description: '질문에 하나씩 답하면서 학원 요청 글을 간단하게 작성해 보세요.',
};

export default function HagwonRequestsCreatePage() {
  return <HagwonRequestsCreateClient />;
}
