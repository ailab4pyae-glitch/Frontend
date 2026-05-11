'use client'
import { useRouter } from 'next/navigation'
import LiveBadge from './LiveBadge'
import { proxyLogo, isSoon, getScheduleLabel, formatDate, formatTime } from '../lib/api'
import { useConfig } from '../lib/config'
import TeamLogo from './TeamLogo'

export default function MatchCard({ match, multiSource = false }) {
  const router           = useRouter()
  const { tabMap }       = useConfig()
  const sourceTab        = tabMap[match.source_tab]
  const sourceLabel      = sourceTab?.name  || ''
  const sourceDotColor   = sourceTab?.color || '#00FF87'

  const isLive      = match.status === 'live'
  const isFinished  = match.status === 'finished'
  const soon        = !isLive && !isFinished && isSoon(match.scheduled_at)
  const schedLabel  = getScheduleLabel(match.scheduled_at)

  return (
    <div
      className="fade-in"
      onClick={() => router.push(`/watch/${match.id}`)}
      style={{
        background: '#141824',
        borderRadius: 14,
        border: `1px solid ${isLive ? 'rgba(255,68,68,0.2)' : 'rgba(255,255,255,0.06)'}`,
        padding: '14px 16px',
        cursor: 'pointer',
        transition: 'border-color .2s, transform .15s',
        display: 'flex', flexDirection: 'column', gap: 12,
      }}
      onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(0,255,135,0.25)'}
      onMouseLeave={(e) => e.currentTarget.style.borderColor = isLive ? 'rgba(255,68,68,0.2)' : 'rgba(255,255,255,0.06)'}
    >
      {/* Top row — competition + badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          {isLive && (
            <div style={{
              width: 3, height: 14, borderRadius: 2,
              background: sourceDotColor, flexShrink: 0,
            }} />
          )}
          <span style={{
            fontSize: 12, color: 'rgba(255,255,255,0.45)',
            fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {sourceLabel || 'Football'}
          </span>
        </div>
        <LiveBadge status={match.status} scheduledAt={match.scheduled_at} />
      </div>

      {/* Teams row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Home */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <TeamLogo src={proxyLogo(match.home_logo)} name={match.home_team} />
          <span style={{
            fontSize: 12, fontWeight: 600, textAlign: 'center',
            color: 'rgba(255,255,255,0.9)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            maxWidth: '100%',
          }}>
            {match.home_team || 'Home'}
          </span>
        </div>

        {/* Score / VS */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0,
        }}>
          {isLive ? (
            <>
              <span style={{
                fontSize: 22, fontWeight: 800, letterSpacing: 2, lineHeight: 1,
                color: multiSource ? '#FFD700' : '#fff',
                textShadow: multiSource ? '0 0 12px rgba(255,215,0,0.5)' : 'none',
              }}>
                {match.score_home != null && match.score_away != null
                  ? `${match.score_home} - ${match.score_away}`
                  : 'VS'}
              </span>
              {multiSource && (
                <span style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: 0.5,
                  color: '#FFD700', background: 'rgba(255,215,0,0.12)',
                  border: '1px solid rgba(255,215,0,0.3)',
                  borderRadius: 4, padding: '1px 5px',
                }}>
                  MULTI
                </span>
              )}
              {match.elapsed_minutes != null && (
                <span style={{
                  fontSize: 11, fontWeight: 700, color: '#00FF87',
                  background: 'rgba(0,255,135,0.12)', borderRadius: 6,
                  padding: '2px 7px', letterSpacing: 0.3,
                }}>
                  {match.elapsed_minutes}&apos;
                </span>
              )}
              {match.scheduled_at && (
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
                  {formatDate(match.scheduled_at)} {formatTime(match.scheduled_at)}
                </span>
              )}
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <span style={{
                fontSize: soon ? 13 : 15, fontWeight: 700,
                color: soon ? '#f59e0b' : 'rgba(255,255,255,0.45)',
              }}>
                {schedLabel || 'VS'}
              </span>
              {soon && (
                <span style={{
                  fontSize: 10, fontWeight: 700, color: '#f59e0b',
                  background: 'rgba(245,158,11,0.12)', borderRadius: 4,
                  padding: '1px 6px', letterSpacing: 0.3,
                }}>
                  SOON
                </span>
              )}
            </div>
          )}
        </div>

        {/* Away */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <TeamLogo src={proxyLogo(match.away_logo)} name={match.away_team} />
          <span style={{
            fontSize: 12, fontWeight: 600, textAlign: 'center',
            color: 'rgba(255,255,255,0.9)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            maxWidth: '100%',
          }}>
            {match.away_team || 'Away'}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10 }}>
        {isLive ? (
          <>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
              background: 'rgba(96,165,250,0.15)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.2)',
            }}>SD</span>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
              background: 'rgba(0,255,135,0.1)', color: '#00FF87', border: '1px solid rgba(0,255,135,0.2)',
            }}>HD</span>
          </>
        ) : soon ? (
          <span style={{ fontSize: 12, color: '#f59e0b', fontWeight: 600 }}>
            ⏱ Starting soon
          </span>
        ) : (
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
            {schedLabel ? `Kicks off ${schedLabel}` : 'Upcoming'}
          </span>
        )}
        <div style={{ marginLeft: 'auto' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            fontSize: 13, fontWeight: 700,
            color: isLive ? '#00FF87' : soon ? '#f59e0b' : 'rgba(255,255,255,0.4)',
            padding: '6px 14px', borderRadius: 20, border: 'none',
            background: isLive ? 'rgba(0,255,135,0.12)' : soon ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.05)',
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            {isLive ? 'Watch' : soon ? 'Soon' : 'Upcoming'}
          </span>
        </div>
      </div>
    </div>
  )
}
