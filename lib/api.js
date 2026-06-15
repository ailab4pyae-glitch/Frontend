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
  config:        ()        => `${BASE}/api/config`,
  tabs:          ()        => `${BASE}/api/tabs`,
  matches:       (tab)     => `${BASE}/api/matches?tab=${encodeURIComponent(tab)}`,
  match:         (id)      => `${BASE}/api/matches/${id}`,
  streams:       (matchId) => `${BASE}/api/streams/${matchId}`,
  sportsrcDetail:(matchId) => `${BASE}/api/sportsrc/detail/${matchId}`,
  tv:            (type)    => `${BASE}/api/tv${type ? `?type=${type}` : ''}`,
  tvChannel:     (id)      => `${BASE}/api/tv/${id}`,
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

// All match times are displayed in Vietnam timezone (UTC+7) to match source sites.
// Myanmar is UTC+6:30 — using local timezone would show all times 30 min early.
const TZ = 'Asia/Ho_Chi_Minh'

export const formatTime = (iso) => {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: TZ })
}

export const formatDate = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  const today = new Date()
  const diff = Math.floor((d - today) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: TZ })
}

export const isSoon = (scheduledAt) => {
  if (!scheduledAt) return false
  const diff = new Date(scheduledAt) - Date.now()
  return diff > 0 && diff <= 60 * 60 * 1000
}

// Return the midnight boundary in Vietnam time for "Today / Tomorrow" labels
const _midnight = (d) => {
  const s = new Date(d).toLocaleDateString('en-CA', { timeZone: TZ }) // 'YYYY-MM-DD' in VN time
  return new Date(s + 'T00:00:00+07:00').getTime()
}

export const getTimeLabel = (scheduledAt) => {
  if (!scheduledAt) return ''
  const d = new Date(scheduledAt)
  const diffMin = Math.round((d - Date.now()) / 60000)
  if (diffMin <= 0) return 'Now'
  if (diffMin < 60) return `${diffMin}m`
  const hhmm = formatTime(scheduledAt)
  const today = _midnight(new Date())
  const tomorrow = today + 86400000
  const matchDay = _midnight(d)
  if (matchDay === today) return `Today ${hhmm}`
  if (matchDay === tomorrow) return `Tomorrow ${hhmm}`
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) + ' ' + hhmm
}

export const getScheduleLabel = (scheduledAt) => {
  if (!scheduledAt) return ''
  const d = new Date(scheduledAt)
  const diffMin = Math.round((d - Date.now()) / 60000)
  if (diffMin > 0 && diffMin < 60) return `${diffMin} min`
  const hhmm = formatTime(scheduledAt)
  const today = _midnight(new Date())
  const tomorrow = today + 86400000
  const matchDay = _midnight(d)
  if (matchDay === today) return hhmm
  if (matchDay === tomorrow) return `Tom ${hhmm}`
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + ' ' + hhmm
}
