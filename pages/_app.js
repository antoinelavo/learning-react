import '../styles/globals.css';
import Header from '@/components/Header'
import Head from 'next/head';
import Footer from '@/components/Footer';
import { Noto_Sans_KR } from "next/font/google";

const notoSansKR = Noto_Sans_KR({
    variable: "--fonts--noto-sans-kr",
    subsets: ["latin"],
})


export default function App({ Component, pageProps }) {
  const showHeader = !Component.hideHeader;

  return (
    <>
    <html lang="en" className={notoSansKR.className}>
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/images/favicon.svg" />
        <meta name="author" content="IB Master" />
      </Head>
      <Header />
      <Component {...pageProps} />
      <Footer />
    </html>
    </>
  );
}

