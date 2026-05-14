'use client'
import { useRouter } from 'next/navigation'
import LiveBadge from './LiveBadge'
import { proxyLogo, isSoon } from '../lib/api'
import { useConfig } from '../lib/config'
import TeamLogo from './TeamLogo'
import { translateLeague, leagueIcon } from '../lib/leagues'

const localTime = (iso) => {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false })
}

const localDate = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  const today    = new Date(); today.setHours(0,0,0,0)
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)
  d.setHours(0,0,0,0)
  if (d.getTime() === today.getTime())    return 'Today'
  if (d.getTime() === tomorrow.getTime()) return 'Tomorrow'
  return new Date(iso).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })
}

export default function MatchCard({ match, multiSource = false }) {
  const router         = useRouter()
  const { tabMap }  = useConfig()
  const sourceTab   = tabMap[match.source_tab]

  const isLive     = match.status === 'live'
  const isFinished = match.status === 'finished'
  const soon       = !isLive && !isFinished && isSoon(match.scheduled_at)

  const league     = translateLeague(match.league) || ''
  const icon       = leagueIcon(league)
  const timeStr    = localTime(match.scheduled_at)
  const dateStr    = localDate(match.scheduled_at)

  const hasScore   = match.score_home != null && match.score_away != null

  return (
    <div
      className="fade-in"
      onClick={() => router.push(`/watch/${match.id}`)}
      style={{
        background: isLive
          ? 'linear-gradient(145deg, #141824 0%, #1a1228 100%)'
          : '#141824',
        borderRadius: 16,
        border: `1px solid ${
          isLive     ? 'rgba(255,68,68,0.25)' :
          soon       ? 'rgba(245,158,11,0.2)' :
          isFinished ? 'rgba(255,255,255,0.04)' :
                       'rgba(255,255,255,0.07)'
        }`,
        padding: '14px 16px',
        cursor: 'pointer',
        transition: 'all .2s',
        display: 'flex', flexDirection: 'column', gap: 10,
        position: 'relative', overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(0,255,135,0.3)'
        e.currentTarget.style.transform = 'translateY(-1px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = isLive ? 'rgba(255,68,68,0.25)' : soon ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.07)'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >

      {/* Top — league/cup name */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0 }}>
          {isLive && (
            <span style={{
              display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
              background: '#ff4444',
              animation: 'livePulse 1.4s ease-in-out infinite',
              flexShrink: 0,
            }} />
          )}
          <span style={{ fontSize: 11, marginRight: 2 }}>{icon}</span>
          <span style={{
            fontSize: 11, fontWeight: 700,
            color: isLive ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.4)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            textTransform: 'uppercase', letterSpacing: 0.4,
          }}>
            {league || sourceTab?.name || 'Football'}
          </span>
        </div>
        <LiveBadge status={match.status} scheduledAt={match.scheduled_at} />
      </div>

      {/* Teams + Score */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

        {/* Home team */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
          <TeamLogo src={proxyLogo(match.home_logo)} name={match.home_team} />
          <span style={{
            fontSize: 11, fontWeight: 700, textAlign: 'center',
            color: 'rgba(255,255,255,0.9)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            maxWidth: '100%',
          }}>
            {match.home_team || 'Home'}
          </span>
        </div>

        {/* Centre — score / time */}
        <div style={{
          flexShrink: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: 5, minWidth: 80,
        }}>
          {isLive ? (
            <>
              {/* Score */}
              <span style={{
                fontSize: 26, fontWeight: 900, letterSpacing: 3, lineHeight: 1,
                color: multiSource ? '#FFD700' : '#fff',
                textShadow: multiSource
                  ? '0 0 20px rgba(255,215,0,0.7)'
                  : hasScore ? '0 0 16px rgba(255,255,255,0.25)' : 'none',
              }}>
                {hasScore ? `${match.score_home} - ${match.score_away}` : 'VS'}
              </span>

              {/* Elapsed minutes — pulsing */}
              {match.elapsed_minutes != null ? (
                <span style={{
                  fontSize: 12, fontWeight: 800, color: '#ff4444',
                  background: 'rgba(255,68,68,0.12)',
                  border: '1px solid rgba(255,68,68,0.25)',
                  borderRadius: 6, padding: '2px 8px', letterSpacing: 0.5,
                  animation: 'livePulse 2s ease-in-out infinite',
                }}>
                  {match.elapsed_minutes}&apos;
                </span>
              ) : (
                <span style={{
                  fontSize: 10, fontWeight: 700, color: '#ff4444',
                  background: 'rgba(255,68,68,0.1)',
                  border: '1px solid rgba(255,68,68,0.2)',
                  borderRadius: 6, padding: '2px 8px', letterSpacing: 0.5,
                }}>
                  LIVE
                </span>
              )}

              {/* Kickoff time (local) */}
              {match.scheduled_at && (
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 1 }}>
                  {dateStr} {timeStr}
                </span>
              )}

              {/* Multi source badge */}
              {multiSource && (
                <span style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: 0.5,
                  color: '#FFD700', background: 'rgba(255,215,0,0.1)',
                  border: '1px solid rgba(255,215,0,0.3)',
                  borderRadius: 4, padding: '1px 5px',
                }}>
                  MULTI
                </span>
              )}
            </>
          ) : isFinished ? (
            <>
              <span style={{
                fontSize: 24, fontWeight: 900, letterSpacing: 2, lineHeight: 1,
                color: 'rgba(255,255,255,0.55)',
              }}>
                {hasScore ? `${match.score_home} - ${match.score_away}` : 'FT'}
              </span>
              {match.scheduled_at && (
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>
                  {dateStr} {timeStr}
                </span>
              )}
            </>
          ) : (
            <>
              {/* Local kickoff time — large */}
              <span style={{
                fontSize: soon ? 20 : 18, fontWeight: 800, letterSpacing: 1,
                color: soon ? '#f59e0b' : 'rgba(255,255,255,0.6)',
                lineHeight: 1,
              }}>
                {timeStr || 'TBD'}
              </span>
              <span style={{
                fontSize: 10, fontWeight: 600,
                color: soon ? 'rgba(245,158,11,0.7)' : 'rgba(255,255,255,0.3)',
              }}>
                {dateStr}
              </span>
              {soon && (
                <span style={{
                  fontSize: 9, fontWeight: 800, color: '#f59e0b',
                  background: 'rgba(245,158,11,0.1)',
                  border: '1px solid rgba(245,158,11,0.25)',
                  borderRadius: 4, padding: '2px 6px', letterSpacing: 0.5,
                }}>
                  SOON
                </span>
              )}
            </>
          )}
        </div>

        {/* Away team */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
          <TeamLogo src={proxyLogo(match.away_logo)} name={match.away_team} />
          <span style={{
            fontSize: 11, fontWeight: 700, textAlign: 'center',
            color: 'rgba(255,255,255,0.9)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            maxWidth: '100%',
          }}>
            {match.away_team || 'Away'}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 9, gap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          {isLive ? (
            <>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '3px 7px', borderRadius: 5,
                background: 'rgba(96,165,250,0.12)', color: '#60a5fa',
                border: '1px solid rgba(96,165,250,0.2)',
              }}>SD</span>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '3px 7px', borderRadius: 5,
                background: 'rgba(0,255,135,0.08)', color: '#00FF87',
                border: '1px solid rgba(0,255,135,0.18)',
              }}>HD</span>
            </>
          ) : isFinished ? (
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', fontWeight: 600 }}>Full Time</span>
          ) : (
            <span style={{ fontSize: 11, color: soon ? '#f59e0b' : 'rgba(255,255,255,0.25)', fontWeight: 600 }}>
              {soon ? '⏱ Starting soon' : `Kicks off ${timeStr}`}
            </span>
          )}
        </div>

        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          fontSize: 12, fontWeight: 700,
          color: isLive ? '#00FF87' : soon ? '#f59e0b' : 'rgba(255,255,255,0.35)',
          padding: '5px 12px', borderRadius: 20,
          background: isLive
            ? 'rgba(0,255,135,0.1)'
            : soon ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${isLive ? 'rgba(0,255,135,0.2)' : soon ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.06)'}`,
        }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          {isLive ? 'Watch' : isFinished ? 'Replay' : soon ? 'Soon' : 'Upcoming'}
        </span>
      </div>
    </div>
  )
}
