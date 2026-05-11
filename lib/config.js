import useSWR from 'swr'

const BASE       = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3050'
const CONFIG_URL = `${BASE}/api/config`

const fetcher = (url) => fetch(url).then((r) => r.json())

// Fallback config used on first render before the API responds or on error
const FALLBACK = {
  tabs:     [],
  features: {},
  ui:       { appName: 'StreamZone', accentColor: '#00FF87', bgColor: '#0A0E1A', defaultTab: 'main-live' },
  limits:   { matchCacheTTL: 30, configCacheTTL: 60 },
}

/**
 * React hook — fetches /api/config once per session (5-min dedup window).
 * All three consumers (TabStrip, MatchCard, page.js) share the same SWR cache
 * entry so there is exactly one network request per session.
 */
export function useConfig() {
  const { data, error, isLoading } = useSWR(CONFIG_URL, fetcher, {
    revalidateOnFocus:  false,
    dedupingInterval:   5 * 60 * 1000,
    fallbackData:       FALLBACK,
  })

  const cfg = data || FALLBACK

  // Build a slug → tab lookup so consumers can do tabMap['soco-live']
  const tabMap = Object.fromEntries((cfg.tabs || []).map((t) => [t.slug, t]))

  return {
    config:   cfg,
    tabs:     cfg.tabs     || [],
    tabMap,
    features: cfg.features || {},
    ui:       cfg.ui       || FALLBACK.ui,
    limits:   cfg.limits   || FALLBACK.limits,
    isLoading,
    error,
  }
}
