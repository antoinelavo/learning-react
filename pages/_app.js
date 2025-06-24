import Header from '@/components/Header.server';
import Footer from '@/components/Footer.server';
import '@/styles/globals.css';
import { Noto_Sans_KR } from "next/font/google";

const notoSansKR = Noto_Sans_KR({
    variable: "--fonts--noto-sans-kr",
    subsets: ["latin"],
})

export const metadata = {
  icons: {
    icon: '/favicon.ico',
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
