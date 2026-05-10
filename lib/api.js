const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3050'

export const fetcher = async (url) => {
  const r = await fetch(url)
  if (!r.ok) throw new Error(`API ${r.status}`)
  return r.json()
}

export const api = {
  tabs:    ()         => fetcher(`${BASE}/api/tabs`),
  matches: (tab)      => fetcher(`${BASE}/api/matches?tab=${tab}`),
  match:   (id)       => fetcher(`${BASE}/api/matches/${id}`),
  streams: (matchId)  => fetcher(`${BASE}/api/streams/${matchId}`),
  servers: (opts = '') => fetcher(`${BASE}/api/servers${opts}`),
}

export const apiUrl = {
  tabs:    ()         => `${BASE}/api/tabs`,
  matches: (tab)      => `${BASE}/api/matches?tab=${encodeURIComponent(tab)}`,
  match:   (id)       => `${BASE}/api/matches/${id}`,
  streams: (matchId)  => `${BASE}/api/streams/${matchId}`,
}

// Wrap external logo URLs through the backend proxy to avoid hotlink blocking.
// URLs that already point to the same API host are passed through unchanged.
export const proxyLogo = (url) => {
  if (!url) return null
  try {
    const u = new URL(url)
    const apiHost = new URL(BASE).hostname
    if (u.hostname === apiHost) return url          // already our host
    return `${BASE}/api/proxy/logo?url=${encodeURIComponent(url)}`
  } catch {
    return url
  }
}

export const formatTime = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

export const formatDate = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  const today = new Date()
  const diff = Math.floor((d - today) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}
