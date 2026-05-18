'use client'
import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import useSWR from 'swr'
import { fetcher, apiUrl, formatDate, formatTime } from '@/lib/api'
import { killActiveStream } from '@/lib/player'
import { useConfig } from '@/lib/config'
import { useAuth } from '@/lib/useAuth'
import LiveBadge from '@/components/LiveBadge'
import VideoPlayer from '@/components/VideoPlayer'
import ServerSelector from '@/components/ServerSelector'
import TeamLogo from '@/components/TeamLogo'
import AdBanner from '@/components/AdBanner'

export default function WatchPage() {
  const { id }     = useParams()
  const router     = useRouter()
  // Stop stream whenever this page is left — no ref needed, hits the global singleton
  useEffect(() => () => killActiveStream(), [])

  const { ui }      = useConfig()
  const { auth }    = useAuth()
  const isPremium   = auth?.is_premium === true
  const { data: match }   = useSWR(apiUrl.match(id),   fetcher, { refreshInterval: 60000, revalidateOnFocus: false })
  const { data: streams } = useSWR(apiUrl.streams(id), fetcher, { refreshInterval: 120000, keepPreviousData: true, revalidateOnFocus: false })

  const allUrls = useMemo(() => [
    ...((streams?.SD || []).map((s) => s.url)),
    ...((streams?.HD || []).map((s) => s.url)),
  ], [streams])

  const [activeUrl,    setActiveUrl]    = useState(null)
  const [allExhausted, setAllExhausted] = useState(false)
  const initializedRef = useRef(false)
  const allUrlsRef     = useRef([])

  const urlBase = (url) => url ? url.split('?')[0] : ''

  // Keep allUrlsRef in sync — lets handleError read latest urls without being a dependency
  useEffect(() => { allUrlsRef.current = allUrls }, [allUrls])

  // When streams load or refresh: keep playing the current URL if it's still in the list.
  // If only the CDN token changed (same base path), keep the old URL — still valid until
  // the health check marks it expired. Only switch when the stream is truly gone.
  useEffect(() => {
    if (!allUrls.length) return
    setAllExhausted(false)
    if (!initializedRef.current) {
      initializedRef.current = true
      try {
        const saved = localStorage.getItem(`watch_url_${id}`)
        if (saved && allUrls.includes(saved)) { setActiveUrl(saved); return }
      } catch (_) {}
      setActiveUrl(allUrls[0])
    } else {
      setActiveUrl((prev) => {
        if (!prev) return allUrls[0]
        if (allUrls.includes(prev)) return prev
        const prevBase = urlBase(prev)
        if (allUrls.some(u => urlBase(u) === prevBase)) return prev
        return allUrls[0]
      })
    }
  }, [allUrls, id])

  // Stable callback — reads allUrlsRef so allUrls is never a dependency.
  // This prevents onError prop from changing on every streams refresh,
  // which would cascade into VideoPlayer's useEffect and restart the stream.
  const handleError = useCallback(() => {
    setActiveUrl((prev) => {
      const urls = allUrlsRef.current
      const idx  = urls.indexOf(prev)
      const next = urls[idx + 1]
      if (next) { setAllExhausted(false); return next }
      setAllExhausted(true)
      return prev
    })
  }, []) // intentionally empty — stable for VideoPlayer's lifetime

  const handleSelect = useCallback((url) => {
    setActiveUrl(url)
    setAllExhausted(false)
    try { localStorage.setItem(`watch_url_${id}`, url) } catch (_) {}
  }, [id])

  return (
    <div style={{ minHeight: '100vh', background: '#0A0E1A' }}>
      {/* Back button + header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: '#0D1220', borderBottom: '1px solid rgba(255,255,255,0.07)',
        padding: '0 14px', height: 52,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <button
          onClick={() => { killActiveStream(); router.back() }}
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', padding: 4, cursor: 'pointer' }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
        </button>
        <span style={{ fontWeight: 700, fontSize: 15, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {match?.title || 'Watch'}
        </span>
        {match && <LiveBadge status={match.status} scheduledAt={match.scheduled_at} />}
        {ui?.telegramUrl && (
          <a
            href={ui.telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
              background: 'rgba(0,136,204,0.15)',
              border: '1px solid rgba(0,136,204,0.3)',
              borderRadius: 20, padding: '5px 10px',
              color: '#29b6f6', textDecoration: 'none',
              fontSize: 12, fontWeight: 700,
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
            {ui.telegramLabel || 'Telegram'}
          </a>
        )}
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 0 80px' }}>
        {/* Video Player */}
        <div style={{ background: '#000' }}>
          {activeUrl
            ? <VideoPlayer key={activeUrl} url={activeUrl} isLive={match?.status === 'live'} onError={handleError} allExhausted={allExhausted} />
            : (
              <div style={{
                aspectRatio: '16/9', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 10,
                background: '#0a0a0a', color: 'rgba(255,255,255,0.4)',
                padding: '0 24px', textAlign: 'center',
              }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="rgba(255,255,255,0.15)"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.6)', margin: 0 }}>
                  No servers available yet
                </p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: 0, lineHeight: 1.6 }}>
                  Stream will appear at kickoff
                </p>
              </div>
            )
          }
        </div>

        {/* Match info */}
        {match && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}>
            <TeamLogo src={match.home_logo} name={match.home_team} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: 700, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {match.title}
              </p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                {match.status === 'live' ? 'Ongoing' : match.scheduled_at
                  ? `${formatDate(match.scheduled_at)} ${formatTime(match.scheduled_at)}`
                  : ''}
              </p>
            </div>
            <TeamLogo src={match.away_logo} name={match.away_team} />
          </div>
        )}

        {/* Server selector */}
        <div style={{ padding: 16 }}>
          <ServerSelector
            streams={streams || { SD: [], HD: [] }}
            activeUrl={activeUrl}
            onSelect={handleSelect}
          />
        </div>

        {/* Server count info */}
        {streams && (
          <div style={{
            margin: '0 16px', padding: '12px 14px',
            background: '#141824', borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', gap: 16,
          }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 18, fontWeight: 700, color: '#a78bfa' }}>
                {streams.SD?.length || 0}
              </p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>SD</p>
            </div>
            <div style={{ width: 1, background: 'rgba(255,255,255,0.07)' }} />
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 18, fontWeight: 700, color: '#e879f9' }}>
                {streams.HD?.length || 0}
              </p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>HD</p>
            </div>
            <div style={{ width: 1, background: 'rgba(255,255,255,0.07)' }} />
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>
                {(streams.SD?.length || 0) + (streams.HD?.length || 0)}
              </p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Total</p>
            </div>
            {activeUrl && allUrls.length > 0 && (
              <>
                <div style={{ width: 1, background: 'rgba(255,255,255,0.07)' }} />
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 18, fontWeight: 700, color: '#00FF87' }}>
                    {allUrls.indexOf(activeUrl) + 1}
                  </p>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Active</p>
                </div>
              </>
            )}
          </div>
        )}
        {!isPremium && <AdBanner page="watch" slot="watch_below_player" style={{ padding: '12px 16px 0' }} />}
      </div>
    </div>
  )
}
