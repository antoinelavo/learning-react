import '../styles/globals.css';
import Header from '@/components/Header'
import Head from 'next/head';
import Footer from '@/components/Footer';

export default function App({ Component, pageProps }) {
  const showHeader = !Component.hideHeader;

  return (
    <>
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/images/favicon.svg" />
        <meta name="author" content="IB Master" />
      </Head>
      <Header />
      <Component {...pageProps} />
      <Footer />
    </>
  );
}

