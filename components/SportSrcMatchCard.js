'use client'
import { memo } from 'react'
import { useRouter } from 'next/navigation'
import { proxyLogo, isSoon } from '../lib/api'
import TeamLogo from './TeamLogo'
import { translateLeague } from '../lib/leagues'

const localTime = (iso) => {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true })
}

const localDate = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)
  const dc = new Date(iso); dc.setHours(0, 0, 0, 0)
  if (dc.getTime() === today.getTime())    return 'Today'
  if (dc.getTime() === tomorrow.getTime()) return 'Tomorrow'
  return new Date(iso).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

const PILL = (color, hex) => ({
  display: 'inline-flex', alignItems: 'center', gap: 3,
  fontSize: 10, fontWeight: 700, color,
  background: `${hex}18`, border: `1px solid ${hex}30`,
  borderRadius: 20, padding: '3px 9px', whiteSpace: 'nowrap',
})

const PILL_DIM = {
  display: 'inline-flex', alignItems: 'center', gap: 3,
  fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.2)',
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 20, padding: '3px 9px', whiteSpace: 'nowrap',
}

function SportSrcMatchCard({ match }) {
  const router     = useRouter()
  const isLive     = match.status === 'live'
  const isFinished = match.status === 'finished'
  const soon       = !isLive && !isFinished && isSoon(match.scheduled_at)
  const hasScore   = match.score_home != null && match.score_away != null
  const timeStr    = localTime(match.scheduled_at)
  const dateStr    = localDate(match.scheduled_at)
  const league     = translateLeague(match.league) || match.league || 'FIFA World Cup'

  return (
    <div
      className="fade-in"
      onClick={() => router.push(`/watch/${match.id}?from=sport-src`)}
      style={{
        position: 'relative', overflow: 'hidden',
        background: isLive
          ? 'linear-gradient(145deg,#17110200 0%,#1c1600 40%,#181000 100%)'
          : '#131007',
        borderRadius: 18,
        border: `1px solid ${
          isLive     ? 'rgba(250,204,21,0.32)' :
          soon       ? 'rgba(250,204,21,0.16)' :
          isFinished ? 'rgba(255,255,255,0.05)' :
                       'rgba(255,255,255,0.08)'
        }`,
        cursor: 'pointer',
        transition: 'transform .18s, box-shadow .18s, border-color .18s',
        boxShadow: isLive ? '0 4px 24px rgba(250,204,21,0.07)' : 'none',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = '0 8px 32px rgba(250,204,21,0.14)'
        e.currentTarget.style.borderColor = 'rgba(250,204,21,0.55)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = isLive ? '0 4px 24px rgba(250,204,21,0.07)' : 'none'
        e.currentTarget.style.borderColor = isLive ? 'rgba(250,204,21,0.32)' : soon ? 'rgba(250,204,21,0.16)' : 'rgba(255,255,255,0.08)'
      }}
    >

      {/* Gold shimmer top line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: isLive
          ? 'linear-gradient(90deg,transparent 0%,#facc15 30%,#fef08a 50%,#facc15 70%,transparent 100%)'
          : 'linear-gradient(90deg,transparent 0%,rgba(250,204,21,0.25) 50%,transparent 100%)',
        opacity: isLive ? 0.9 : 0.4,
      }} />

      {/* Header — league + status */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '13px 16px 0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <span style={{ fontSize: 14, flexShrink: 0 }}>🏆</span>
          <span style={{
            fontSize: 10, fontWeight: 800, letterSpacing: 0.9,
            color: 'rgba(250,204,21,0.65)', textTransform: 'uppercase',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{league}</span>
        </div>

        {isLive ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <span style={{
              width: 7, height: 7, borderRadius: '50%', background: '#facc15',
              boxShadow: '0 0 8px rgba(250,204,21,0.9)',
              animation: 'livePulse 1.4s ease-in-out infinite', flexShrink: 0,
            }} />
            <span style={{
              fontSize: 10, fontWeight: 800, letterSpacing: 0.6,
              color: '#facc15',
              background: 'rgba(250,204,21,0.12)',
              border: '1px solid rgba(250,204,21,0.3)',
              borderRadius: 6, padding: '2px 8px',
            }}>LIVE</span>
          </div>
        ) : soon ? (
          <span style={{
            fontSize: 10, fontWeight: 800, color: '#f59e0b',
            background: 'rgba(245,158,11,0.1)',
            border: '1px solid rgba(245,158,11,0.25)',
            borderRadius: 6, padding: '2px 8px', flexShrink: 0,
          }}>SOON</span>
        ) : isFinished ? (
          <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.2)', flexShrink: 0 }}>FT</span>
        ) : null}
      </div>

      {/* Teams + Score */}
      <div style={{
        display: 'flex', alignItems: 'center',
        padding: '12px 16px 14px', gap: 10,
      }}>

        {/* Home team */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, minWidth: 0 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14, flexShrink: 0,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.09)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: isLive ? '0 0 16px rgba(250,204,21,0.08)' : 'none',
          }}>
            <TeamLogo src={proxyLogo(match.home_logo)} name={match.home_team} size={40} />
          </div>
          <span style={{
            fontSize: 12, fontWeight: 700, textAlign: 'center',
            color: 'rgba(255,255,255,0.88)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            maxWidth: '100%',
          }}>{match.home_team || 'Home'}</span>
        </div>

        {/* Score / Time — centre */}
        <div style={{
          flexShrink: 0, minWidth: 86,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
        }}>
          {isLive ? (
            <>
              <span style={{
                fontSize: 30, fontWeight: 900, letterSpacing: 4, lineHeight: 1,
                color: '#facc15',
                textShadow: '0 0 28px rgba(250,204,21,0.55), 0 0 8px rgba(250,204,21,0.3)',
              }}>
                {hasScore ? `${match.score_home} - ${match.score_away}` : 'VS'}
              </span>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', letterSpacing: 0.3 }}>
                {dateStr} {timeStr}
              </span>
            </>
          ) : isFinished ? (
            <>
              <span style={{
                fontSize: 28, fontWeight: 900, letterSpacing: 3, lineHeight: 1,
                color: 'rgba(255,255,255,0.4)',
              }}>
                {hasScore ? `${match.score_home} - ${match.score_away}` : 'FT'}
              </span>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>
                {dateStr}
              </span>
            </>
          ) : (
            <>
              <span style={{
                fontSize: soon ? 21 : 19, fontWeight: 900, letterSpacing: 2, lineHeight: 1,
                color: soon ? '#f59e0b' : 'rgba(255,255,255,0.5)',
              }}>
                {timeStr || 'TBD'}
              </span>
              <span style={{
                fontSize: 10, fontWeight: 600,
                color: soon ? 'rgba(245,158,11,0.6)' : 'rgba(255,255,255,0.28)',
              }}>
                {dateStr}
              </span>
            </>
          )}
        </div>

        {/* Away team */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, minWidth: 0 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14, flexShrink: 0,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.09)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: isLive ? '0 0 16px rgba(250,204,21,0.08)' : 'none',
          }}>
            <TeamLogo src={proxyLogo(match.away_logo)} name={match.away_team} size={40} />
          </div>
          <span style={{
            fontSize: 12, fontWeight: 700, textAlign: 'center',
            color: 'rgba(255,255,255,0.88)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            maxWidth: '100%',
          }}>{match.away_team || 'Away'}</span>
        </div>
      </div>

      {/* Footer — data pills + watch button */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(0,0,0,0.22)',
        padding: '9px 14px', gap: 8,
      }}>
        {/* Data pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap', minWidth: 0 }}>
          {isLive ? (
            <>
              <span style={PILL('#00e5ff', '#00e5ff')}>📊 Stats</span>
              <span style={PILL('#a78bfa', '#a78bfa')}>👥 Lineups</span>
              <span style={PILL('#34d399', '#34d399')}>📋 Events</span>
            </>
          ) : isFinished ? (
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', fontWeight: 600 }}>Full Time</span>
          ) : (
            <>
              <span style={PILL_DIM}>📊 Stats</span>
              <span style={PILL_DIM}>👥 Lineups</span>
              <span style={{ fontSize: 9, color: 'rgba(250,204,21,0.38)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                at kickoff
              </span>
            </>
          )}
        </div>

        {/* Watch button */}
        <button style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          fontSize: 12, fontWeight: 800, flexShrink: 0,
          color: isLive ? '#facc15' : soon ? '#f59e0b' : 'rgba(255,255,255,0.4)',
          background: isLive ? 'rgba(250,204,21,0.13)' : soon ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.05)',
          border: `1px solid ${isLive ? 'rgba(250,204,21,0.35)' : soon ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.08)'}`,
          borderRadius: 20, padding: '6px 14px', cursor: 'pointer',
          boxShadow: isLive ? '0 0 14px rgba(250,204,21,0.15)' : 'none',
          transition: 'all .15s',
        }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          Watch
        </button>
      </div>
    </div>
  )
}

export default memo(SportSrcMatchCard)
