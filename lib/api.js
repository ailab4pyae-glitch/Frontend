const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3050'

export const fetcher = (url) => fetch(url).then((r) => r.json())

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
