import TeacherList from './TeacherList';
import ClientFind from './ClientFind';

export const metadata = {
  title: 'IB 과외 찾기',
  description: 'IB 과외 선생님을 수수료 없이 쉽고 빠르게 찾아보세요.',
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
    icon: '/images/favicon.svg',
  },
  openGraph: {
    title: 'IB 과외 찾기',
    description: 'IB 과외 선생님을 수수료 없이 쉽고 빠르게 찾아보세요.',
    url: 'https://ibmaster.net/find',
    siteName: 'IB Master',
    locale: 'ko-KR',
    type: 'website',
  },
};

export default function FindPage() {
  return (
    <ClientFind>
      <main className="max-w-6xl mx-auto px-4 py-10 min-h-screen">
        {/* Header */}
        <div className="bg-white text-center border w-full h-fit mx-auto mb-6 py-6 px-4 border-gray-200 rounded-xl shadow-md">
          <h1 className="text-2xl font-bold mb-4">IB 과외 선생님 찾기</h1>
          <p className="text-md font-normal text-gray-500">
            과외 글 게시, 열람 비용 없이 원하는 IB 과외 선생님을 찾아보세요.
          </p>
        </div>

        {/* Teacher List */}
        <div className="flex flex-col md:flex-row">
          <TeacherList />
        </div>
      </main>
    </ClientFind>
  );
}