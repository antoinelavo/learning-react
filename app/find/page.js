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
    icon: '/images/favicon.ico',
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
      <TeacherList />
    </ClientFind>
  );
}