'use client'
import { useState, useCallback, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import useSWR from 'swr'
import { fetcher, apiUrl } from '@/lib/api'
import VideoPlayer from '@/components/VideoPlayer'
import ServerSelector from '@/components/ServerSelector'
import LiveBadge from '@/components/LiveBadge'

const TeamLogo = ({ src, name }) => {
  const [err, setErr] = useState(false)
  if (!err && src) {
    return <img src={src} alt={name} onError={() => setErr(true)}
      style={{ width: 36, height: 36, objectFit: 'contain', borderRadius: 4 }} />
  }
  return (
    <div style={{
      width: 36, height: 36, borderRadius: 6,
      background: 'rgba(0,255,135,0.1)', border: '1px solid rgba(0,255,135,0.2)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 12, fontWeight: 700, color: '#00FF87',
    }}>
      {(name || '?').slice(0, 2).toUpperCase()}
    </div>
  )
}

export default function WatchPage() {
  const { id }  = useParams()
  const router  = useRouter()

  const { data: match }   = useSWR(apiUrl.match(id),   fetcher)
  const { data: streams } = useSWR(apiUrl.streams(id), fetcher, { refreshInterval: 60000 })

  // SD first (default), HD as fallback
  const allUrls = [
    ...((streams?.SD || []).map((s) => s.url)),
    ...((streams?.HD || []).map((s) => s.url)),
  ]

  const [serverIndex, setServerIndex] = useState(0)
  const activeUrl = allUrls[serverIndex] || null

  // Reset server index when streams change
  useEffect(() => { setServerIndex(0) }, [id])

  const handleError = useCallback(() => {
    setServerIndex((prev) => {
      const next = prev + 1
      return next < allUrls.length ? next : prev
    })
  }, [allUrls.length])

  const handleSelect = useCallback((url) => {
    const idx = allUrls.indexOf(url)
    if (idx !== -1) setServerIndex(idx)
  }, [allUrls])

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
          onClick={() => router.back()}
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', padding: 4 }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
        </button>
        <span style={{ fontWeight: 700, fontSize: 15, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {match?.title || 'Watch'}
        </span>
        {match && <LiveBadge status={match.status} scheduledAt={match.scheduled_at} />}
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 0 80px' }}>
        {/* Video Player */}
        <div style={{ background: '#000' }}>
          {activeUrl
            ? <VideoPlayer key={activeUrl} url={activeUrl} isLive={match?.status === 'live'} onError={handleError} />
            : (
              <div style={{
                aspectRatio: '16/9', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 12,
                background: '#000', color: 'rgba(255,255,255,0.4)',
              }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="rgba(255,255,255,0.2)"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>
                <p style={{ fontSize: 14 }}>No stream available</p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Stream will appear at kickoff</p>
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
                  ? new Date(match.scheduled_at).toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })
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
              <p style={{ fontSize: 18, fontWeight: 700, color: '#60a5fa' }}>
                {streams.SD?.length || 0}
              </p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>SD</p>
            </div>
            <div style={{ width: 1, background: 'rgba(255,255,255,0.07)' }} />
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 18, fontWeight: 700, color: '#00FF87' }}>
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
            {allUrls.length > 0 && (
              <>
                <div style={{ width: 1, background: 'rgba(255,255,255,0.07)' }} />
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 18, fontWeight: 700, color: '#00FF87' }}>
                    {serverIndex + 1}
                  </p>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Active</p>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
