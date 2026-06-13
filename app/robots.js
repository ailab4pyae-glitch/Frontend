export default function robots() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://ballonelive.com'
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/admin', '/api/', '/login'] },
    ],
    sitemap: `${base}/sitemap.xml`,
  }
}
