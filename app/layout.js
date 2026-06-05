import Header from '@/components/Header.server';
import Footer from '@/components/Footer.server';
import Providers from '@/components/Providers.client';
import '@/styles/globals.css';
import Script from 'next/script'

export const metadata = {
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Noto Sans KR — loaded async to avoid render-blocking 24 KiB of @font-face CSS */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <Script
          id="load-noto-sans-kr"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              var l = document.createElement('link');
              l.rel = 'stylesheet';
              l.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@100..900&display=swap';
              document.head.appendChild(l);
            `,
          }}
        />
        <noscript>
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@100..900&display=swap"
          />
        </noscript>

        {/* Google Adsense */}
        <Script
          strategy="afterInteractive"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6915654460353407"
          crossOrigin="anonymous"
        />

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
      <meta name="google-site-verification" content="Hknak_CdA4t8EAfJu1IOPcLFJqwIS_Q59pseEIAqR_g" />
      </head>
      <body className="min-h-screen min-w-screen bg-gray-50">
        <Providers>
          <Header />
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
