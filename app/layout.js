import Header from '@/components/Header.server';
import Footer from '@/components/Footer.server';
import Providers from '@/components/Providers.client';
import '@/styles/globals.css';
import Script from 'next/script'

export const metadata = {
  metadataBase: new URL('https://www.ibmaster.net'),
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
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

        {/* GA4. The commands below only queue into dataLayer (cheap); the
            190 KB gtag.js that processes them is fetched on the visitor's
            first interaction, or a few seconds after the page has loaded,
            so it never competes with the first render. */}
        <Script
          id="gtag-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              // Google Ads isn't used: deny ad consent and turn off Google
              // signals so the tag sends no remarketing/conversion requests.
              gtag('consent', 'default', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'granted' });
              gtag('set', { allow_google_signals: false, allow_ad_personalization_signals: false });
              gtag('js', new Date());
              gtag('config', 'G-ZT9SKBMMYE', { page_path: window.location.pathname });
              (function () {
                var events = ['pointerdown', 'keydown', 'touchstart', 'scroll'];
                var done = false;
                function load() {
                  if (done) return;
                  done = true;
                  events.forEach(function (e) { removeEventListener(e, load); });
                  var s = document.createElement('script');
                  s.async = true;
                  s.src = 'https://www.googletagmanager.com/gtag/js?id=G-ZT9SKBMMYE';
                  document.head.appendChild(s);
                }
                events.forEach(function (e) { addEventListener(e, load, { passive: true }); });
                function later() { setTimeout(load, 4000); }
                if (document.readyState === 'complete') later();
                else addEventListener('load', later);
              })();
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
