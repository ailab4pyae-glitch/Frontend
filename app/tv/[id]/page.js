'use client'
import { useState, useCallback, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import useSWR from 'swr'
import { fetcher, apiUrl } from '@/lib/api'
import { killActiveStream } from '@/lib/player'
import VideoPlayer from '@/components/VideoPlayer'

export default function TVWatchPage() {
  const { id }      = useParams()
  const router      = useRouter()
  const [failed, setFailed] = useState(false)

  useEffect(() => () => killActiveStream(), [])

  const { data: channel, isLoading } = useSWR(apiUrl.tvChannel(id), fetcher)

  const handleError = useCallback(() => setFailed(true), [])

  return (
    <div style={{ minHeight: '100vh', background: '#0A0E1A' }}>
      {/* Header */}
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

        {channel && (
          <>
            <div style={{
              width: 28, height: 28, borderRadius: 7,
              background: (channel.color || '#00FF87') + '30',
              border: `1px solid ${(channel.color || '#00FF87')}50`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
              overflow: 'hidden', flexShrink: 0,
            }}>
              {channel.logo_url
                ? <img src={channel.logo_url} alt={channel.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : channel.emoji}
            </div>
            <span style={{ fontWeight: 700, fontSize: 15, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {channel.name}
            </span>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4,
              background: 'rgba(0,255,135,0.15)', color: '#00FF87',
              border: '1px solid rgba(0,255,135,0.25)', flexShrink: 0,
            }}>LIVE</span>
          </>
        )}
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 0 80px' }}>
        {/* Player */}
        <div style={{ background: '#000' }}>
          {isLoading && (
            <div style={{
              aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: '#000',
            }}>
              <div className="spinner" />
            </div>
          )}

          {!isLoading && channel?.stream_url && !failed && (
            <VideoPlayer key={channel.id} url={channel.stream_url} isLive onError={handleError} allExhausted={failed} />
          )}

          {!isLoading && (!channel?.stream_url || failed) && (
            <div style={{
              aspectRatio: '16/9', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 10,
              background: '#0a0a0a', color: 'rgba(255,255,255,0.4)',
              padding: '0 24px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 38 }}>📡</div>
              <p style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.85)', margin: 0 }}>
                {failed ? 'Stream unavailable' : 'No stream configured'}
              </p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: 0 }}>
                {failed ? 'Try again later' : 'This channel has no stream yet'}
              </p>
              {failed && (
                <button
                  onClick={() => setFailed(false)}
                  style={{
                    marginTop: 6, background: 'rgba(0,255,135,0.12)',
                    border: '1px solid rgba(0,255,135,0.3)', color: '#00FF87',
                    borderRadius: 20, padding: '8px 22px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  Retry
                </button>
              )}
            </div>
          )}
        </div>

        {/* Channel info */}
        {channel && (
          <div style={{
            padding: '14px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: (channel.color || '#00FF87') + '20',
              border: `1px solid ${(channel.color || '#00FF87')}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, overflow: 'hidden', flexShrink: 0,
            }}>
              {channel.logo_url
                ? <img src={channel.logo_url} alt={channel.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : channel.emoji}
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: 16, margin: 0 }}>{channel.name}</p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: '3px 0 0' }}>
                {channel.category}{channel.country ? ` · ${channel.country}` : ''}{channel.language ? ` · ${channel.language}` : ''}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
