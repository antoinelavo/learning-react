import Header from '@/components/Header.server';
import Footer from '@/components/Footer.server';
import Head from 'next/head';
import '@/styles/globals.css';
import { Noto_Sans_KR } from "next/font/google";

const notoSansKR = Noto_Sans_KR({
    variable: "--fonts--noto-sans-kr",
    subsets: ["latin"],
})

export const metadata = {
  title: 'IB Master 과외 찾기',
  description: 'IB 과외 선생님을 쉽고 빠르게 찾아보세요.',
  icons: {
    icon: '/images/favicon.svg',      // ← public/images/favicon.svg
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={notoSansKR.className}>
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="@/public/images/favicon.svg" />
        <meta name="author" content="IB Master" />
        <meta name="robots" content="index, follow"></meta>
      </Head>
      <body className="min-h-screen min-w-screen bg-gray-50">
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
