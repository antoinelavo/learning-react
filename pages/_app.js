import Header from '@/components/Header.server';
import Footer from '@/components/Footer.server';
import Providers from '@/components/Providers.client';
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

// No <html>/<body> here: in the pages router this component renders inside
// _document's <div id="__next">. React 19 hoists <html>/<body> elements to
// the real document ones, so rendering them here left the DOM out of sync
// with React's tree. Events inside the header (e.g. typing in the chat
// panel's input on a teacher profile) then sent React's event dispatch into
// an endless loop and froze the tab. Body classes live in _document.js.
export default function App({ Component, pageProps }) {
  return (
    <div className={notoSansKR.className}>
      <Providers>
        <Header />
        <Component {...pageProps} />
        <Footer />
      </Providers>
    </div>
  );
}
