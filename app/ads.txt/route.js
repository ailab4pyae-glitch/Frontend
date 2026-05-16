// Dynamic ads.txt — auto-updates when publisher ID changes in admin
// Google requires: google.com, ca-pub-XXXX, DIRECT, f08c47fec0942fa0

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3050'

export async function GET() {
  let publisherId = ''
  try {
    const res = await fetch(`${API}/api/config`, { next: { revalidate: 3600 } })
    const cfg = await res.json()
    publisherId = cfg?.ads?.networks?.adsense?.publisher_id || ''
  } catch (_) {}

  const lines = []

  if (publisherId) {
    lines.push(`google.com, ${publisherId}, DIRECT, f08c47fec0942fa0`)
  }

  // PropellerAds — add their ads.txt line
  lines.push('propellerads.com, 0, DIRECT')

  const content = lines.length > 0
    ? lines.join('\n')
    : '# No ad network configured yet'

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
