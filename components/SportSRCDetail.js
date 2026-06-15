'use client'
import { useState } from 'react'

const HC = '#00e5ff'   // home cyan
const AC = '#a78bfa'   // away purple

// Parse "65%" → 65, or 65 → 65
function parseNum(v) {
  if (v === null || v === undefined || v === '') return null
  const n = parseFloat(String(v).replace('%', '').replace(',', '.'))
  return isNaN(n) ? null : n
}

function StatBar({ name, home, away }) {
  const h = parseNum(home)
  const a = parseNum(away)
  const total = (h ?? 0) + (a ?? 0)
  const hPct = total > 0 ? Math.round((h / total) * 100) : 50
  const aPct = 100 - hPct
  const fmt = (v, raw) => {
    if (v === null) return raw ?? '–'
    const s = String(raw)
    return s.includes('%') ? `${Math.round(v)}%` : Math.round(v)
  }
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 14, fontWeight: 800, color: HC, minWidth: 36 }}>{fmt(h, home)}</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: .8, textAlign: 'center', flex: 1 }}>{name}</span>
        <span style={{ fontSize: 14, fontWeight: 800, color: AC, minWidth: 36, textAlign: 'right' }}>{fmt(a, away)}</span>
      </div>
      <div style={{ height: 5, borderRadius: 5, background: 'rgba(255,255,255,0.07)', overflow: 'hidden', display: 'flex' }}>
        <div style={{ width: `${hPct}%`, background: `linear-gradient(90deg,${HC}66,${HC})`, transition: 'width .7s ease' }} />
        <div style={{ width: `${aPct}%`, background: `linear-gradient(90deg,${AC},${AC}66)`, transition: 'width .7s ease' }} />
      </div>
    </div>
  )
}

function PlayerRow({ player, side }) {
  const away = side === 'away'
  const num  = player.number ?? player.jersey_number ?? player.shirt_number ?? ''
  const name = player.name   || player.player_name   || player.short_name   || '?'
  const pos  = (player.position || player.pos || player.role || '').toUpperCase().slice(0, 2)
  const color = away ? AC : HC
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 5,
      padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
      flexDirection: away ? 'row-reverse' : 'row',
    }}>
      <span style={{
        width: 20, height: 20, borderRadius: 4, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: away ? 'rgba(167,139,250,0.13)' : 'rgba(0,229,255,0.1)',
        fontSize: 9, fontWeight: 900, color,
      }}>{num || '?'}</span>
      <span style={{
        fontSize: 11, color: 'rgba(255,255,255,0.8)', flex: 1,
        textAlign: away ? 'right' : 'left',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>{name}</span>
      {pos && (
        <span style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.25)', flexShrink: 0 }}>{pos}</span>
      )}
    </div>
  )
}

const EV_ICON = {
  goal: '⚽', penalty: '⚽', 'own-goal': '⚽', own_goal: '⚽',
  yellow: '🟨', yellow_card: '🟨', yellowcard: '🟨',
  red: '🟥', red_card: '🟥', redcard: '🟥',
  substitution: '🔄', sub: '🔄', substitution_in: '🔄',
  var: '📺',
}

function EventRow({ ev }) {
  const type   = (ev.type || ev.event_type || ev.incident_type || '').toLowerCase().replace(/[\s-]/g, '_')
  const icon   = EV_ICON[type] || '●'
  const isHome = (ev.team === 'home') || (ev.is_home === true) || (ev.side === 'home')
  const color  = isHome ? HC : AC
  const player = ev.player || ev.player_name || ev.name || ev.player_in || ''
  const min    = ev.minute ?? ev.time ?? ev.min ?? ev.match_time ?? ''
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
      flexDirection: isHome ? 'row' : 'row-reverse',
    }}>
      <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.3)', minWidth: 26, textAlign: isHome ? 'left' : 'right' }}>
        {min !== '' ? `${min}'` : ''}
      </span>
      <span style={{ fontSize: 13 }}>{icon}</span>
      <span style={{ fontSize: 12, fontWeight: 700, color, flex: 1, textAlign: isHome ? 'left' : 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {player}
      </span>
    </div>
  )
}

export default function SportSRCDetail({ data, match, loading }) {
  const [tab, setTab] = useState(null)

  if (loading) {
    return (
      <div style={{ padding: '20px 16px', display: 'flex', justifyContent: 'center' }}>
        <div className="spinner" style={{ width: 20, height: 20 }} />
      </div>
    )
  }

  if (!data) return null

  // Normalise — different API shapes
  const stats      = data.stats         || data.statistics    || data.match_stats  || []
  const lineups    = data.lineups        || data.lineup        || null
  const events     = data.events         || data.timeline      || data.incidents    || data.goals || []

  const homePlayers    = lineups?.home?.players         || lineups?.home?.starting_xi
                      || lineups?.home?.xi              || (Array.isArray(lineups?.home) ? lineups.home : [])
  const awayPlayers    = lineups?.away?.players         || lineups?.away?.starting_xi
                      || lineups?.away?.xi              || (Array.isArray(lineups?.away) ? lineups.away : [])
  const homeFormation  = lineups?.home?.formation       || lineups?.home?.formation_string || ''
  const awayFormation  = lineups?.away?.formation       || lineups?.away?.formation_string || ''

  const hasStats   = Array.isArray(stats)      && stats.length   > 0
  const hasLineups = Array.isArray(homePlayers) && homePlayers.length > 0
  const hasEvents  = Array.isArray(events)     && events.length  > 0

  const TABS = [
    { id: 'stats',   label: 'Stats',   show: hasStats },
    { id: 'lineups', label: 'Lineups', show: hasLineups },
    { id: 'events',  label: 'Events',  show: hasEvents },
  ].filter(t => t.show)

  if (!TABS.length) return null

  const active = tab || TABS[0].id

  return (
    <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', marginTop: 4 }}>

      {/* Tab header */}
      <div style={{ display: 'flex', background: 'rgba(0,0,0,0.25)' }}>
        {TABS.map(t => {
          const on = active === t.id
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex: 1, padding: '12px 6px',
              background: 'none', border: 'none', cursor: 'pointer',
              borderBottom: `2px solid ${on ? HC : 'transparent'}`,
              color: on ? '#fff' : 'rgba(255,255,255,0.3)',
              fontSize: 11, fontWeight: 800, letterSpacing: .8,
              textTransform: 'uppercase', transition: 'all .15s',
              textShadow: on ? `0 0 10px ${HC}` : 'none',
            }}>
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Stats */}
      {active === 'stats' && hasStats && (
        <div style={{ padding: '16px 16px 8px' }}>
          {/* Team name row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: HC, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '45%' }}>
              {match?.home_team || 'Home'}
            </span>
            <span style={{ fontSize: 11, fontWeight: 800, color: AC, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '45%', textAlign: 'right' }}>
              {match?.away_team || 'Away'}
            </span>
          </div>
          {stats.map((s, i) => (
            <StatBar
              key={i}
              name={s.name || s.stat_name || s.title || s.type || `Stat ${i + 1}`}
              home={s.home ?? s.home_value ?? s.homeValue ?? (Array.isArray(s.values) ? s.values[0] : undefined)}
              away={s.away ?? s.away_value ?? s.awayValue ?? (Array.isArray(s.values) ? s.values[1] : undefined)}
            />
          ))}
        </div>
      )}

      {/* Lineups */}
      {active === 'lineups' && hasLineups && (
        <div style={{ padding: '14px 12px 8px' }}>
          {/* Formation header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, gap: 8 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: '0 0 3px', fontSize: 11, fontWeight: 800, color: HC, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {match?.home_team || 'Home'}
              </p>
              {homeFormation && (
                <span style={{ fontSize: 9, fontWeight: 700, color: `${HC}99`, background: `${HC}14`, padding: '2px 6px', borderRadius: 4 }}>
                  {homeFormation}
                </span>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0, textAlign: 'right' }}>
              <p style={{ margin: '0 0 3px', fontSize: 11, fontWeight: 800, color: AC, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {match?.away_team || 'Away'}
              </p>
              {awayFormation && (
                <span style={{ fontSize: 9, fontWeight: 700, color: `${AC}99`, background: `${AC}14`, padding: '2px 6px', borderRadius: 4 }}>
                  {awayFormation}
                </span>
              )}
            </div>
          </div>

          {/* Two-column player list */}
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              {homePlayers.map((p, i) => <PlayerRow key={i} player={p} side="home" />)}
            </div>
            <div style={{ width: 1, background: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              {awayPlayers.map((p, i) => <PlayerRow key={i} player={p} side="away" />)}
            </div>
          </div>
        </div>
      )}

      {/* Events / Timeline */}
      {active === 'events' && hasEvents && (
        <div style={{ padding: '8px 16px 8px' }}>
          {/* Team names */}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0 10px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: HC }}>{match?.home_team || 'Home'}</span>
            <span style={{ fontSize: 10, fontWeight: 800, color: AC }}>{match?.away_team || 'Away'}</span>
          </div>
          {events.map((ev, i) => <EventRow key={i} ev={ev} />)}
        </div>
      )}
    </div>
  )
}
