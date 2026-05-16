'use client'
import { useMemo, useState } from 'react'
import useSWR from 'swr'
import { fetcher, apiUrl, isSoon } from '@/lib/api'
import MatchCard from './MatchCard'
import MatchSkeleton from './MatchSkeleton'
import { translateLeague, leagueFame, leagueIcon } from '@/lib/leagues'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const norm = (s) => (s || '').toLowerCase().replace(/\s+/g, '')
const matchKey = (m) => `${norm(m.home_team)}_${norm(m.away_team)}`

const HOT_THRESHOLD = 10  // fame rank ≤ 10 = "hot"

// ─── Sub-components ───────────────────────────────────────────────────────────

const SectionLabel = ({ children, hot, soon }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '20px 0 8px' }}>
    <span style={{
      fontSize: 11, fontWeight: 800, letterSpacing: 0.8, textTransform: 'uppercase',
      color: hot ? '#FFD700' : soon ? '#f59e0b' : 'rgba(255,255,255,0.4)',
    }}>
      {children}
    </span>
    <div style={{
      flex: 1, height: 1,
      background: hot
        ? 'linear-gradient(90deg,rgba(255,215,0,0.3),transparent)'
        : soon
        ? 'linear-gradient(90deg,rgba(245,158,11,0.3),transparent)'
        : 'rgba(255,255,255,0.06)',
    }} />
  </div>
)

const LeagueSection = ({ league, matches, isMultiSource }) => {
  const translated = translateLeague(league)
  const icon       = leagueIcon(translated)
  const fame       = leagueFame(translated)
  const hot        = fame <= HOT_THRESHOLD

  return (
    <div style={{ marginBottom: 4 }}>
      {/* League header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 7,
        padding: '10px 4px 6px',
        borderBottom: `1px solid ${hot ? 'rgba(255,215,0,0.12)' : 'rgba(255,255,255,0.05)'}`,
        marginBottom: 8,
      }}>
        <span style={{ fontSize: 14 }}>{icon}</span>
        <span style={{
          fontSize: 12, fontWeight: 800,
          color: hot ? '#FFD700' : 'rgba(255,255,255,0.6)',
          letterSpacing: 0.3,
        }}>
          {translated || league || 'Football'}
        </span>
        <span style={{
          fontSize: 10, color: 'rgba(255,255,255,0.2)', fontWeight: 600,
          marginLeft: 2,
        }}>
          {matches.length} match{matches.length !== 1 ? 'es' : ''}
        </span>
        {hot && (
          <span style={{
            fontSize: 9, fontWeight: 800, color: '#FFD700',
            background: 'rgba(255,215,0,0.1)',
            border: '1px solid rgba(255,215,0,0.25)',
            borderRadius: 4, padding: '1px 5px', letterSpacing: 0.5,
            marginLeft: 'auto',
          }}>
            🔥 HOT
          </span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {matches.map((m) => (
          <MatchCard key={m.id} match={m} multiSource={isMultiSource(m)} />
        ))}
      </div>
    </div>
  )
}

const EmptyState = () => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', padding: '60px 24px', gap: 12, textAlign: 'center',
  }}>
    <div style={{ fontSize: 48 }}>📭</div>
    <p style={{ fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>
      No matches right now
    </p>
    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
      Check back soon for live matches
    </p>
  </div>
)

// ─── Group matches by translated league, sorted by fame ───────────────────────

const groupByLeague = (matches) => {
  const map = new Map()
  for (const m of matches) {
    const key = translateLeague(m.league) || m.league || 'Other'
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(m)
  }
  return [...map.entries()]
    .sort(([a], [b]) => {
      const diff = leagueFame(a) - leagueFame(b)
      return diff !== 0 ? diff : a.localeCompare(b) // same fame → alphabetical
    })
    .map(([league, ms]) => [
      league,
      ms.slice().sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at)),
    ])
}

// ─── Main component ───────────────────────────────────────────────────────────

// ─── League filter bar ────────────────────────────────────────────────────────

const LeagueFilter = ({ leagues, active, onChange }) => (
  <div style={{
    display: 'flex', gap: 6, overflowX: 'auto', padding: '8px 16px 4px',
    scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch',
  }}>
    <button
      onClick={() => onChange(null)}
      style={{
        flexShrink: 0, border: 'none', borderRadius: 20,
        padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
        background: active == null ? '#00FF87' : 'rgba(255,255,255,0.07)',
        color:      active == null ? '#0A0E1A' : 'rgba(255,255,255,0.55)',
        transition: 'all .15s',
      }}
    >
      All
    </button>
    {leagues.map(({ key, label, icon, liveCount }) => (
      <button
        key={key}
        onClick={() => onChange(key)}
        style={{
          flexShrink: 0, border: 'none', borderRadius: 20,
          padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
          background: active === key ? '#00FF87' : 'rgba(255,255,255,0.07)',
          color:      active === key ? '#0A0E1A' : 'rgba(255,255,255,0.55)',
          display: 'flex', alignItems: 'center', gap: 4,
          transition: 'all .15s',
        }}
      >
        <span>{icon}</span>
        <span>{label}</span>
        {liveCount > 0 && (
          <span style={{
            fontSize: 10, fontWeight: 800,
            background: active === key ? 'rgba(0,0,0,0.2)' : 'rgba(0,255,135,0.15)',
            color: active === key ? '#0A0E1A' : '#00FF87',
            borderRadius: 10, padding: '1px 5px',
          }}>
            {liveCount}
          </span>
        )}
      </button>
    ))}
  </div>
)

// ─── Main component ───────────────────────────────────────────────────────────

export default function MatchList({ tab }) {
  const [leagueFilter, setLeagueFilter] = useState(null)

  const { data: matches, isLoading } = useSWR(
    apiUrl.matches(tab),
    fetcher,
    { refreshInterval: 30000, revalidateOnFocus: true }
  )

  const isMultiSource = useMemo(() => {
    if (!Array.isArray(matches)) return () => false
    const counts = {}
    for (const m of matches) {
      const k = matchKey(m); counts[k] = (counts[k] || 0) + 1
    }
    return (m) => counts[matchKey(m)] > 1
  }, [matches])

  // Build sorted league list for the filter bar (exclude finished)
  const leagueOptions = useMemo(() => {
    if (!Array.isArray(matches)) return []
    const map = new Map()
    for (const m of matches) {
      if (m.status === 'finished') continue
      const key = translateLeague(m.league) || m.league || 'Other'
      if (!map.has(key)) map.set(key, { key, label: key, icon: leagueIcon(key), liveCount: 0 })
      if (m.status === 'live') map.get(key).liveCount++
    }
    return [...map.values()].sort((a, b) => leagueFame(a.key) - leagueFame(b.key))
  }, [matches])

  if (isLoading) {
    return (
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 8 }}>
        {[...Array(4)].map((_, i) => <MatchSkeleton key={i} />)}
      </div>
    )
  }

  const nonFinished = Array.isArray(matches) ? matches.filter((m) => m.status !== 'finished') : []
  if (!Array.isArray(matches) || nonFinished.length === 0) {
    return <EmptyState />
  }

  // Apply league filter (always exclude finished)
  const visible = (leagueFilter == null ? nonFinished : nonFinished.filter(
    (m) => (translateLeague(m.league) || m.league || 'Other') === leagueFilter
  ))

  const live     = visible.filter((m) => m.status === 'live')
  const soon     = visible.filter((m) => m.status !== 'live' && m.status !== 'finished' && isSoon(m.scheduled_at))
  const upcoming = visible.filter((m) => m.status !== 'live' && m.status !== 'finished' && !isSoon(m.scheduled_at))

  const liveGroups     = groupByLeague(live)
  const soonGroups     = groupByLeague(soon)
  const upcomingGroups = groupByLeague(upcoming)

  return (
    <div style={{ paddingBottom: 80 }}>

      {/* League filter bar */}
      {leagueOptions.length > 1 && (
        <LeagueFilter
          leagues={leagueOptions}
          active={leagueFilter}
          onChange={setLeagueFilter}
        />
      )}

      <div style={{ padding: '0 16px' }}>
        {/* ── Live Now ── */}
        {live.length > 0 && (
          <>
            <SectionLabel hot>🔴 Live Now — {live.length} match{live.length !== 1 ? 'es' : ''}</SectionLabel>
            {liveGroups.map(([league, ms]) => (
              <LeagueSection key={league} league={league} matches={ms} isMultiSource={isMultiSource} />
            ))}
          </>
        )}

        {/* ── Starting Soon ── */}
        {soon.length > 0 && (
          <>
            <SectionLabel soon>⚡ Starting Soon — {soon.length} match{soon.length !== 1 ? 'es' : ''}</SectionLabel>
            {soonGroups.map(([league, ms]) => (
              <LeagueSection key={league} league={league} matches={ms} isMultiSource={isMultiSource} />
            ))}
          </>
        )}

        {/* ── Upcoming ── */}
        {upcoming.length > 0 && (
          <>
            <SectionLabel>🕐 Upcoming</SectionLabel>
            {upcomingGroups.map(([league, ms]) => (
              <LeagueSection key={league} league={league} matches={ms} isMultiSource={isMultiSource} />
            ))}
          </>
        )}

        {(live.length === 0 && soon.length === 0 && upcoming.length === 0) && leagueFilter && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
            No matches for this league right now
          </div>
        )}
      </div>
    </div>
  )
}
