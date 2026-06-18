'use client'
import { memo } from 'react'
import { useRouter } from 'next/navigation'
import { proxyLogo, isSoon } from '../lib/api'
import { useConfig } from '../lib/config'
import TeamLogo from './TeamLogo'
import { translateLeague, leagueIcon } from '../lib/leagues'

const localTime = (iso) => {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true })
}
const localDate = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  const day   = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year  = d.getFullYear()
  const wday  = d.toLocaleDateString(undefined, { weekday: 'long' })
  return `${day}/${month}/${year} (${wday})`
}

function MatchCard({ match, multiSource = false, fromTab = '' }) {
  const router     = useRouter()
  const { tabMap } = useConfig()
  const sourceTab  = tabMap[match.source_tab]

  const isLive     = match.status === 'live'
  const isFinished = match.status === 'finished'
  const soon       = !isLive && !isFinished && isSoon(match.scheduled_at)
  const league     = translateLeague(match.league) || ''
  const icon       = leagueIcon(league)
  const timeStr    = localTime(match.scheduled_at)
  const dateStr    = localDate(match.scheduled_at)
  const hasScore   = match.score_home != null && match.score_away != null

  const topBar   = isLive ? 'linear-gradient(90deg,#00c853,#00e5ff)'
                 : soon   ? 'linear-gradient(90deg,#f59e0b,#f97316)'
                          : 'linear-gradient(90deg,#6366f1,#a855f7)'
  const statusColor  = isLive ? '#16a34a' : soon ? '#d97706' : '#6366f1'
  const statusBg     = isLive ? '#dcfce7'  : soon ? '#fef3c7'  : '#ede9fe'
  const statusLabel  = isLive ? '🔴 LIVE'  : soon ? '⏱ SOON'  : isFinished ? 'FT' : 'Upcoming'
  const timeColor    = isLive ? '#dc2626'  : soon ? '#d97706'  : '#4f46e5'

  return (
    <>
      <style>{`
        @keyframes mcPop { from{opacity:0;transform:scale(.97)} to{opacity:1;transform:scale(1)} }
        @keyframes liveTopBar { 0%,100%{opacity:.8} 50%{opacity:1} }
        .mc-card { animation: mcPop .2s ease both; transition: all .18s ease !important; }
        .mc-card:hover { transform: translateY(-3px) !important; box-shadow: 0 12px 40px rgba(99,102,241,0.25) !important; }
        .mc-card:hover .mc-watch { background: #4f46e5 !important; color: #fff !important; border-color: #4f46e5 !important; }
      `}</style>

      <div
        className="mc-card"
        onClick={() => router.push(`/watch/${match.id}${fromTab ? `?from=${fromTab}` : ''}`)}
        style={{
          background: '#ffffff',
          borderRadius: 14,
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(17,14,43,0.18)',
          border: '1px solid rgba(99,102,241,0.12)',
          cursor: 'pointer',
          position: 'relative',
        }}
      >
        {/* Coloured top accent bar */}
        <div style={{
          height: 3, background: topBar,
          animation: isLive ? 'liveTopBar 2s ease-in-out infinite' : 'none',
        }} />

        {/* Header: League + Status */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '9px 12px 8px',
          background: '#f8f7ff',
          borderBottom: '1px solid rgba(99,102,241,0.08)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0 }}>
            <span style={{ fontSize: 12, flexShrink: 0 }}>{icon}</span>
            <span style={{
              fontSize: 10, fontWeight: 800, letterSpacing: 0.5, textTransform: 'uppercase',
              color: '#4338ca',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {league || sourceTab?.name || 'Football'}
            </span>
            {multiSource && (
              <span style={{
                fontSize: 8, fontWeight: 800, color: '#d97706',
                background: '#fef3c7', border: '1px solid #fde68a',
                borderRadius: 4, padding: '1px 5px', flexShrink: 0,
              }}>MULTI</span>
            )}
          </div>
          <span style={{
            fontSize: 10, fontWeight: 800, letterSpacing: 0.4,
            color: statusColor, background: statusBg,
            borderRadius: 20, padding: '3px 9px', flexShrink: 0,
          }}>
            {statusLabel}
          </span>
        </div>

        {/* Body: Teams + Score/Time */}
        <div style={{
          display: 'flex', alignItems: 'center',
          padding: '16px 12px',
          gap: 8,
          background: '#ffffff',
        }}>
          {/* Home */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: '#f1f0ff',
              border: '1.5px solid rgba(99,102,241,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', flexShrink: 0,
            }}>
              <TeamLogo src={proxyLogo(match.home_logo)} name={match.home_team} size={34} />
            </div>
            <span style={{
              fontSize: 11, fontWeight: 700, textAlign: 'center', color: '#1e1b4b',
              lineHeight: 1.3, maxWidth: 84,
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
              {match.home_team || 'Home'}
            </span>
          </div>

          {/* Centre */}
          <div style={{
            flexShrink: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 5, minWidth: 80,
          }}>
            {isLive ? (
              <>
                <div style={{
                  fontSize: 26, fontWeight: 900, letterSpacing: 2, color: '#1e1b4b', lineHeight: 1,
                }}>
                  {hasScore ? `${match.score_home}–${match.score_away}` : (
                    <span style={{ fontSize: 18, color: '#6b7280' }}>VS</span>
                  )}
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  background: '#fee2e2', borderRadius: 20, padding: '2px 8px',
                }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#dc2626', flexShrink: 0 }} />
                  <span style={{ fontSize: 9, fontWeight: 800, color: '#dc2626', letterSpacing: 0.5 }}>LIVE</span>
                </div>
                {match.scheduled_at && (
                  <span style={{ fontSize: 9, color: '#9ca3af' }}>{dateStr}</span>
                )}
              </>
            ) : isFinished ? (
              <>
                <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: 2, color: '#6b7280' }}>
                  {hasScore ? `${match.score_home}–${match.score_away}` : 'FT'}
                </div>
                <span style={{ fontSize: 9, color: '#9ca3af', fontWeight: 700 }}>{dateStr}</span>
              </>
            ) : (
              <>
                <div style={{
                  fontSize: 22, fontWeight: 900, color: timeColor,
                  letterSpacing: 0.5, lineHeight: 1,
                  textShadow: soon ? '0 0 12px rgba(245,158,11,0.3)' : 'none',
                }}>
                  {timeStr || 'TBD'}
                </div>
                <span style={{ fontSize: 9, fontWeight: 700, color: '#6b7280', letterSpacing: 0.3 }}>
                  KICK-OFF
                </span>
                <span style={{ fontSize: 9, color: '#9ca3af' }}>{dateStr}</span>
              </>
            )}
          </div>

          {/* Away */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: '#f1f0ff',
              border: '1.5px solid rgba(99,102,241,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', flexShrink: 0,
            }}>
              <TeamLogo src={proxyLogo(match.away_logo)} name={match.away_team} size={34} />
            </div>
            <span style={{
              fontSize: 11, fontWeight: 700, textAlign: 'center', color: '#1e1b4b',
              lineHeight: 1.3, maxWidth: 84,
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
              {match.away_team || 'Away'}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 12px 10px',
          background: '#f8f7ff',
          borderTop: '1px solid rgba(99,102,241,0.08)',
        }}>
          <div style={{ display: 'flex', gap: 5 }}>
            {isLive && (
              <>
                <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 4, background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd' }}>HD</span>
                <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 4, background: '#ede9fe', color: '#6d28d9', border: '1px solid #ddd6fe' }}>SD</span>
              </>
            )}
            {!isLive && !isFinished && timeStr && (
              <span style={{ fontSize: 10, color: '#6b7280', fontWeight: 600 }}>
                {soon ? `⚡ ${timeStr}` : timeStr}
              </span>
            )}
            {isFinished && <span style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600 }}>Full Time</span>}
          </div>
          <button
            className="mc-watch"
            onClick={(e) => { e.stopPropagation(); router.push(`/watch/${match.id}${fromTab ? `?from=${fromTab}` : ''}`) }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: 10, fontWeight: 800, letterSpacing: 0.3,
              color: '#4f46e5', background: '#ede9fe',
              border: '1px solid #c4b5fd',
              borderRadius: 20, padding: '4px 12px',
              cursor: 'pointer', transition: 'all .18s',
            }}
          >
            <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            {isFinished ? 'Replay' : 'Watch'}
          </button>
        </div>
      </div>
    </>
  )
}

export default memo(MatchCard)
