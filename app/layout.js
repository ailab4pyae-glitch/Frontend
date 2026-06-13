import './globals.css'
import Script from 'next/script'

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || 'Ballone Live'
const SITE_DESC = process.env.NEXT_PUBLIC_SITE_DESC || 'Watch live football matches free online. Stream Premier League, Champions League, La Liga, Serie A and more on Ballone Live.'
const SITE_URL  = process.env.NEXT_PUBLIC_SITE_URL  || 'https://ballonelive.com'
const ADSENSE_ID = process.env.NEXT_PUBLIC_ADSENSE_ID || ''
const GA_ID      = process.env.NEXT_PUBLIC_GA_ID      || 'G-0NJWFQCF34'

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0A0E1A',
}

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default:  `${SITE_NAME} – Free Football Live Streaming`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESC,
  keywords:    'live football streaming, watch football online free, premier league live, champions league live, la liga live, serie a live, bundesliga live, world cup live, football stream, live sports streaming, free football tv, myanmar football live',
  openGraph: {
    title:       `${SITE_NAME} – Free Football Live Streaming`,
    description: SITE_DESC,
    type:        'website',
    locale:      'en_US',
    siteName:    SITE_NAME,
    url:         SITE_URL,
  },
  twitter: {
    card:        'summary_large_image',
    title:       `${SITE_NAME} – Free Football Live Streaming`,
    description: SITE_DESC,
    site:        '@ballonelive',
  },
  robots: {
    index:  true,
    follow: true,
    googleBot: {
      index:             true,
      follow:            true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet':       -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type':    'WebSite',
  name:       SITE_NAME,
  url:        SITE_URL,
  description: SITE_DESC,
  potentialAction: {
    '@type':       'SearchAction',
    target:        `${SITE_URL}/?tab=main-live&q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        {children}

        {/* Google Analytics 4 */}
        {GA_ID && <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">{`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}', { page_path: window.location.pathname });
          `}</Script>
        </>}

        {ADSENSE_ID && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_ID}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  )
}
