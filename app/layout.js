import './globals.css'
import Script from 'next/script'

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || 'ThaeGyiKoneThuLay'
const SITE_DESC = process.env.NEXT_PUBLIC_SITE_DESC || 'Watch live football, basketball and sports matches free online'
const ADSENSE_ID = process.env.NEXT_PUBLIC_ADSENSE_ID || ''

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export const metadata = {
  title: {
    default:  `${SITE_NAME} – Live Sports`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESC,
  keywords:    'live football, live sports, football streaming, watch football online, live match',
  openGraph: {
    title:       `${SITE_NAME} – Live Sports`,
    description: SITE_DESC,
    type:        'website',
    locale:      'en_US',
  },
  twitter: {
    card:        'summary_large_image',
    title:       `${SITE_NAME} – Live Sports`,
    description: SITE_DESC,
  },
  robots: {
    index:  true,
    follow: true,
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
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
