'use client'
import { useMemo } from 'react'
import useSWR from 'swr'
import { fetcher, apiUrl } from '@/lib/api'
import MatchCard from './MatchCard'
import MatchSkeleton from './MatchSkeleton'
import { translateLeague, leagueFame, leagueIcon } from '@/lib/leagues'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const norm = (s) => (s || '').toLowerCase().replace(/\s+/g, '')
const matchKey = (m) => `${norm(m.home_team)}_${norm(m.away_team)}`

const HOT_THRESHOLD = 10  // fame rank ≤ 10 = "hot"

// ─── Sub-components ───────────────────────────────────────────────────────────

const SectionLabel = ({ children, hot }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '20px 0 8px' }}>
    <span style={{
      fontSize: 11, fontWeight: 800, letterSpacing: 0.8, textTransform: 'uppercase',
      color: hot ? '#FFD700' : 'rgba(255,255,255,0.4)',
    }}>
      {children}
    </span>
    <div style={{
      flex: 1, height: 1,
      background: hot
        ? 'linear-gradient(90deg,rgba(255,215,0,0.3),transparent)'
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
    .sort(([a], [b]) => leagueFame(a) - leagueFame(b))
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function MatchList({ tab }) {
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

  if (isLoading) {
    return (
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 8 }}>
        {[...Array(4)].map((_, i) => <MatchSkeleton key={i} />)}
      </div>
    )
  }

  if (!Array.isArray(matches) || matches.length === 0) {
    return <EmptyState />
  }

  const live      = matches.filter((m) => m.status === 'live')
  const scheduled = matches.filter((m) => m.status !== 'live' && m.status !== 'finished')
  const finished  = matches.filter((m) => m.status === 'finished')

  const liveGroups      = groupByLeague(live)
  const scheduledGroups = groupByLeague(scheduled)
  const finishedGroups  = groupByLeague(finished)

  return (
    <div style={{ padding: '0 16px 80px' }}>

      {/* ── Live Now ── */}
      {live.length > 0 && (
        <>
          <SectionLabel hot>🔴 Live Now — {live.length} match{live.length !== 1 ? 'es' : ''}</SectionLabel>
          {liveGroups.map(([league, ms]) => (
            <LeagueSection key={league} league={league} matches={ms} isMultiSource={isMultiSource} />
          ))}
        </>
      )}

      {/* ── Upcoming ── */}
      {scheduled.length > 0 && (
        <>
          <SectionLabel>🕐 Upcoming</SectionLabel>
          {scheduledGroups.map(([league, ms]) => (
            <LeagueSection key={league} league={league} matches={ms} isMultiSource={isMultiSource} />
          ))}
        </>
      )}

      {/* ── Finished ── */}
      {finished.length > 0 && (
        <>
          <SectionLabel>✅ Finished</SectionLabel>
          {finishedGroups.map(([league, ms]) => (
            <LeagueSection key={league} league={league} matches={ms} isMultiSource={isMultiSource} />
          ))}
        </>
      )}

    </div>
  )
}
