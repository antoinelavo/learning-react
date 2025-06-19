import Header from '@/components/Header.server';
import Footer from '@/components/Footer.server';
import Head from 'next/head';
import '@/styles/globals.css';    // ← ensure this path is correct


export const metadata = {
  title: 'IB Master 과외 찾기',
  description: 'IB 과외 선생님을 쉽고 빠르게 찾아보세요.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/images/favicon.svg" />
        <meta name="author" content="IB Master" />
      </Head>
      <body className="bg-gray-50 min-h-screen">
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
