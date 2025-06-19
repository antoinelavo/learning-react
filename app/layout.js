import Header from '@/components/Header.server';
import Footer from '@/components/Footer.server';
import '@/styles/globals.css';    // ← ensure this path is correct


export const metadata = {
  title: 'IB Master 과외 찾기',
  description: 'IB 과외 선생님을 쉽고 빠르게 찾아보세요.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body className="bg-gray-50 min-h-screen">
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
