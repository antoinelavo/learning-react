// Server layout so the client-side /apply page can declare metadata.
export const metadata = {
  title: 'IB 과외 선생님 지원하기 | IB Master',
  description: 'IB Master에 IB 과외 선생님으로 등록하세요. 수수료 없이 프로필을 올리고 IB 학생과 학부모에게 직접 연락받을 수 있습니다.',
  alternates: {
    canonical: '/apply',
  },
  openGraph: {
    url: '/apply',
    title: 'IB 과외 선생님 지원하기 | IB Master',
    description: 'IB Master에 IB 과외 선생님으로 등록하세요. 수수료 없이 프로필을 올리고 IB 학생과 학부모에게 직접 연락받을 수 있습니다.',
  },
};

export default function ApplyLayout({ children }) {
  return children;
}
