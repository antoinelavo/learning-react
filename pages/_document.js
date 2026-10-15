import { Html, Head, Main, NextScript } from 'next/document';
import Script from 'next/script'

export default function Document() {
  return (
    <Html lang="ko">
      <Head>
        {/* ✅ Google Fonts - Noto Sans KR */}
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&display=swap"
          rel="stylesheet"
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
              // Google Ads isn't used: deny ad consent and turn off Google
              // signals so the tag sends no remarketing/conversion requests.
              gtag('consent', 'default', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'granted' });
              gtag('set', { allow_google_signals: false, allow_ad_personalization_signals: false });
              gtag('js', new Date());
              gtag('config', 'G-ZT9SKBMMYE', { page_path: window.location.pathname });
            `,
          }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
