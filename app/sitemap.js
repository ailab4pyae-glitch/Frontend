const BASE = process.env.NEXT_PUBLIC_API_URL  || 'http://localhost:3050'
const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://ballonelive.com'

export default async function sitemap() {
  const staticPages = [
    { url: SITE,           priority: 1.0, changeFrequency: 'always' },
    { url: `${SITE}/tv`,  priority: 0.7, changeFrequency: 'daily'  },
  ]

  try {
    const res = await fetch(`${BASE}/api/matches`, { next: { revalidate: 300 } })
    if (!res.ok) return staticPages
    const matches = await res.json()
    if (!Array.isArray(matches)) return staticPages

    const matchPages = matches
      .filter((m) => m.status !== 'finished')
      .map((m) => ({
        url:             `${SITE}/watch/${m.id}`,
        priority:        m.status === 'live' ? 0.95 : 0.8,
        changeFrequency: m.status === 'live' ? 'always' : 'hourly',
        lastModified:    new Date(),
      }))

    return [...staticPages, ...matchPages]
  } catch {
    return staticPages
  }
}
