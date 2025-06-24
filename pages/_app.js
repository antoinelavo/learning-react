import Header from '@/components/Header.server';
import Footer from '@/components/Footer.server';
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
    icon: '/images/favicon.ico',
  },
};

export default function RootLayout({ Component, pageProps }) {
  return (
    <html lang="en" className={notoSansKR.className}>
      <body className="min-h-screen min-w-screen bg-gray-50">
        <Header />
        <Component {...pageProps} />
        <Footer />
      </body>
    </html>
  );
}
