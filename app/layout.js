import Header from '@/components/Header.server';
import Footer from '@/components/Footer.server';
import '@/styles/globals.css';
import { Noto_Sans_KR } from "next/font/google";
import Script from 'next/script'


const notoSansKR = Noto_Sans_KR({
    variable: "--fonts--noto-sans-kr",
    subsets: ["latin"],
})

export const metadata = {
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={notoSansKR.className}>
      <head>
        <script
         src="https://cdn.iamport.kr/v1/iamport.js"
         defer
       ></script>
        <Script
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=G-ZT9SKBMMYE"
        />
        <Script
          id="gtag-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-ZT9SKBMMYE', { page_path: window.location.pathname });
            `,
          }}
        />

      </head>
      <body className="min-h-screen min-w-screen bg-gray-50">
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
