'use client'
import { useMemo, useState, useEffect, useCallback } from 'react'
import useSWR from 'swr'
import { fetcher, apiUrl, isSoon } from '@/lib/api'
import MatchCard from './MatchCard'
import MatchSkeleton from './MatchSkeleton'
import { translateLeague, leagueFame, leagueIcon } from '@/lib/leagues'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const norm = (s) => (s || '').toLowerCase().replace(/\s+/g, '')
const matchKey = (m) => `${norm(m.home_team)}_${norm(m.away_team)}`
const leagueKey = (m) => translateLeague(m.league) || m.league || 'Other'

const groupByLeague = (matches) => {
  const map = new Map()
  for (const m of matches) {
    const key = leagueKey(m)
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(m)
  }
  return [...map.entries()]
    .sort(([a], [b]) => {
      const diff = leagueFame(a) - leagueFame(b)
      return diff !== 0 ? diff : a.localeCompare(b)
    })
    .map(([league, ms]) => [
      league,
      ms.slice().sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at)),
    ])
}

// ─── Status tab bar ───────────────────────────────────────────────────────────

const TAB_COLORS = {
  live:     { accent: '#00FF87', glow: 'rgba(0,255,135,0.7)',    badge: 'rgba(0,255,135,0.15)'    },
  soon:     { accent: '#f59e0b', glow: 'rgba(245,158,11,0.7)',   badge: 'rgba(245,158,11,0.15)'   },
  upcoming: { accent: '#60a5fa', glow: 'rgba(96,165,250,0.7)',   badge: 'rgba(96,165,250,0.15)'   },
}

const StatusTabs = ({ active, onChange, liveCount, soonCount, upcomingCount }) => {
  const tabs = [
    { id: 'live',     label: 'Live',     count: liveCount     },
    { id: 'soon',     label: 'Soon',     count: soonCount     },
    { id: 'upcoming', label: 'Upcoming', count: upcomingCount },
  ]
  return (
    <div style={{
      display: 'flex', gap: 4, padding: '10px 16px 0',
      borderBottom: '1px solid rgba(255,255,255,0.07)',
    }}>
      {tabs.map(({ id, label, count }) => {
        const isActive = active === id
        const c = TAB_COLORS[id]
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '8px 14px', fontSize: 13, fontWeight: 700,
              color: isActive ? '#fff' : 'rgba(255,255,255,0.38)',
              position: 'relative',
              borderBottom: isActive ? `2px solid ${c.accent}` : '2px solid transparent',
              marginBottom: -1,
              display: 'flex', alignItems: 'center', gap: 6,
              transition: 'color .15s',
            }}
          >
            {/* Colored dot for every tab when active */}
            {isActive && (
              <span style={{
                width: 7, height: 7, borderRadius: '50%',
                background: c.accent, flexShrink: 0,
                boxShadow: `0 0 6px ${c.glow}`,
                animation: id === 'live' ? 'pulse 1.4s ease-in-out infinite' : 'none',
              }} />
            )}
            <span style={{ color: isActive ? c.accent : 'rgba(255,255,255,0.38)' }}>
              {label}
            </span>
            {count > 0 && (
              <span style={{
                fontSize: 11, fontWeight: 800,
                background: isActive ? c.badge : 'rgba(255,255,255,0.07)',
                color:      isActive ? c.accent : 'rgba(255,255,255,0.3)',
                borderRadius: 10, padding: '1px 6px', lineHeight: 1.6,
              }}>
                {count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ─── League sidebar item ──────────────────────────────────────────────────────

const SidebarItem = ({ label, icon, count, liveCount, isActive, onClick }) => (
  <button
    onClick={onClick}
    style={{
      width: '100%', textAlign: 'left', background: 'none', border: 'none',
      cursor: 'pointer', padding: '7px 10px', borderRadius: 8,
      display: 'flex', alignItems: 'center', gap: 6,
      background: isActive ? 'rgba(0,255,135,0.08)' : 'transparent',
      transition: 'background .12s',
    }}
  >
    <span style={{ fontSize: 13, flexShrink: 0 }}>{icon}</span>
    <span style={{
      flex: 1, fontSize: 12, fontWeight: isActive ? 700 : 500,
      color: isActive ? '#fff' : 'rgba(255,255,255,0.55)',
      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
    {liveCount > 0 && (
      <span style={{
        fontSize: 10, fontWeight: 800, color: '#00FF87',
        background: 'rgba(0,255,135,0.12)', borderRadius: 8, padding: '1px 5px', flexShrink: 0,
      }}>
        {liveCount}
      </span>
    )}
    {liveCount === 0 && count > 0 && (
      <span style={{
        fontSize: 10, color: 'rgba(255,255,255,0.25)', flexShrink: 0,
      }}>
        {count}
      </span>
    )}
  </button>
)

// ─── League sidebar (desktop) ─────────────────────────────────────────────────

const LeagueSidebar = ({ leagues, active, onChange }) => (
  <div style={{
    width: 168, flexShrink: 0,
    borderRight: '1px solid rgba(255,255,255,0.06)',
    padding: '12px 8px', overflowY: 'auto',
    maxHeight: 'calc(100vh - 120px)', position: 'sticky', top: 52,
  }}>
    <SidebarItem
      label="All leagues"
      icon="⚽"
      count={leagues.reduce((s, l) => s + l.count, 0)}
      liveCount={leagues.reduce((s, l) => s + l.liveCount, 0)}
      isActive={active === null}
      onClick={() => onChange(null)}
    />
    <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '6px 4px' }} />
    {leagues.map(({ key, label, icon, count, liveCount }) => (
      <SidebarItem
        key={key}
        label={label}
        icon={icon}
        count={count}
        liveCount={liveCount}
        isActive={active === key}
        onClick={() => onChange(key)}
      />
    ))}
  </div>
)

// ─── Mobile filter sheet ──────────────────────────────────────────────────────

const MobileSheet = ({ leagues, active, onChange, onClose }) => (
  <>
    {/* Backdrop */}
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
        zIndex: 100, backdropFilter: 'blur(2px)',
      }}
    />
    {/* Sheet */}
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: '#141824', borderRadius: '18px 18px 0 0',
      zIndex: 101, padding: '0 0 env(safe-area-inset-bottom,16px)',
      maxHeight: '72vh', display: 'flex', flexDirection: 'column',
    }}>
      {/* Handle */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.2)' }} />
      </div>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '4px 16px 10px',
      }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Filter by League</span>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 20, padding: 4 }}
        >×</button>
      </div>
      <div style={{ overflowY: 'auto', padding: '0 8px 16px' }}>
        <SidebarItem
          label="All leagues"
          icon="⚽"
          count={leagues.reduce((s, l) => s + l.count, 0)}
          liveCount={leagues.reduce((s, l) => s + l.liveCount, 0)}
          isActive={active === null}
          onClick={() => { onChange(null); onClose() }}
        />
        <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '6px 4px' }} />
        {leagues.map(({ key, label, icon, count, liveCount }) => (
          <SidebarItem
            key={key}
            label={label}
            icon={icon}
            count={count}
            liveCount={liveCount}
            isActive={active === key}
            onClick={() => { onChange(key); onClose() }}
          />
        ))}
      </div>
    </div>
  </>
)

// ─── League section in match list ─────────────────────────────────────────────

const LeagueSection = ({ league, matches, isMultiSource }) => {
  const icon = leagueIcon(league)
  const fame = leagueFame(league)
  const hot  = fame <= 8
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '8px 0 6px',
        borderBottom: `1px solid ${hot ? 'rgba(255,215,0,0.1)' : 'rgba(255,255,255,0.05)'}`,
        marginBottom: 8,
      }}>
        <span style={{ fontSize: 13 }}>{icon}</span>
        <span style={{ fontSize: 12, fontWeight: 800, color: hot ? '#FFD700' : 'rgba(255,255,255,0.55)', letterSpacing: 0.3 }}>
          {league || 'Football'}
        </span>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', fontWeight: 600 }}>
          {matches.length}
        </span>
        {hot && (
          <span style={{
            marginLeft: 'auto', fontSize: 9, fontWeight: 800, color: '#FFD700',
            background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.2)',
            borderRadius: 4, padding: '1px 5px',
          }}>🔥 HOT</span>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {matches.map((m) => <MatchCard key={m.id} match={m} multiSource={isMultiSource(m)} />)}
      </div>
    </div>
  )
}

const EmptyTab = ({ statusTab, hasSearch, search }) => (
  <div style={{ textAlign: 'center', padding: '48px 24px', color: 'rgba(255,255,255,0.3)' }}>
    <div style={{ fontSize: 36, marginBottom: 12 }}>
      {statusTab === 'live' ? '📡' : statusTab === 'soon' ? '⏰' : '📅'}
    </div>
    <p style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.45)', margin: '0 0 6px' }}>
      {hasSearch ? `No matches for "${search}"` : statusTab === 'live' ? 'No live matches right now' : statusTab === 'soon' ? 'No matches starting soon' : 'No upcoming matches'}
    </p>
    {!hasSearch && statusTab === 'live' && (
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', margin: 0 }}>Check Soon or Upcoming for scheduled matches</p>
    )}
  </div>
)

// ─── Main component ───────────────────────────────────────────────────────────

export default function MatchList({ tab }) {
  const [statusTab,    setStatusTab]    = useState('live')
  const [leagueFilter, setLeagueFilter] = useState(null)
  const [search,       setSearch]       = useState('')
  const [sheetOpen,    setSheetOpen]    = useState(false)
  const [isMobile,     setIsMobile]     = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const { data: matches, isLoading } = useSWR(
    apiUrl.matches(tab),
    fetcher,
    { refreshInterval: 60000, revalidateOnFocus: false }
  )

  const isMultiSource = useMemo(() => {
    if (!Array.isArray(matches)) return () => false
    const counts = {}
    for (const m of matches) {
      const k = matchKey(m); counts[k] = (counts[k] || 0) + 1
    }
    return (m) => counts[matchKey(m)] > 1
  }, [matches])

  const nonFinished = useMemo(() =>
    Array.isArray(matches) ? matches.filter((m) => m.status !== 'finished') : []
  , [matches])

  // Counts for tab labels (unfiltered)
  const allLive     = useMemo(() => nonFinished.filter((m) => m.status === 'live'), [nonFinished])
  const allSoon     = useMemo(() => nonFinished.filter((m) => m.status !== 'live' && isSoon(m.scheduled_at)), [nonFinished])
  const allUpcoming = useMemo(() => nonFinished.filter((m) => m.status !== 'live' && !isSoon(m.scheduled_at)), [nonFinished])

  // Auto-switch: if live is empty on mount, go to soon or upcoming
  useEffect(() => {
    if (!Array.isArray(matches)) return
    if (statusTab === 'live' && allLive.length === 0) {
      if (allSoon.length > 0) setStatusTab('soon')
      else if (allUpcoming.length > 0) setStatusTab('upcoming')
    }
  }, [matches]) // eslint-disable-line

  // Matches for active tab
  const tabMatches = statusTab === 'live' ? allLive : statusTab === 'soon' ? allSoon : allUpcoming

  // League options for sidebar (from tab matches, unfiltered by league/search)
  const leagueOptions = useMemo(() => {
    const map = new Map()
    for (const m of tabMatches) {
      const key = leagueKey(m)
      if (!map.has(key)) map.set(key, { key, label: key, icon: leagueIcon(key), count: 0, liveCount: 0 })
      map.get(key).count++
      if (m.status === 'live') map.get(key).liveCount++
    }
    return [...map.values()].sort((a, b) => leagueFame(a.key) - leagueFame(b.key))
  }, [tabMatches])

  // Apply search + league filter
  const q = search.trim().toLowerCase()
  const visible = useMemo(() => {
    let ms = tabMatches
    if (q) ms = ms.filter((m) =>
      m.home_team?.toLowerCase().includes(q) ||
      m.away_team?.toLowerCase().includes(q) ||
      leagueKey(m).toLowerCase().includes(q)
    )
    if (leagueFilter) ms = ms.filter((m) => leagueKey(m) === leagueFilter)
    return ms
  }, [tabMatches, q, leagueFilter])

  const groups = useMemo(() => groupByLeague(visible), [visible])

  const handleStatusChange = useCallback((id) => {
    setStatusTab(id)
    setLeagueFilter(null)
    setSearch('')
  }, [])

  if (isLoading) {
    return (
      <div>
        <div style={{ height: 44, borderBottom: '1px solid rgba(255,255,255,0.07)' }} />
        <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[...Array(4)].map((_, i) => <MatchSkeleton key={i} />)}
        </div>
      </div>
    )
  }

  if (!Array.isArray(matches) || nonFinished.length === 0) {
    return (
      <div>
        <StatusTabs active={statusTab} onChange={handleStatusChange} liveCount={0} soonCount={0} upcomingCount={0} />
        <EmptyTab statusTab={statusTab} hasSearch={false} search="" />
      </div>
    )
  }

  return (
    <div style={{ paddingBottom: 80 }}>

      {/* Status tabs */}
      <StatusTabs
        active={statusTab}
        onChange={handleStatusChange}
        liveCount={allLive.length}
        soonCount={allSoon.length}
        upcomingCount={allUpcoming.length}
      />

      {/* Search + layout */}
      <div style={{ display: 'flex', alignItems: 'stretch' }}>

        {/* ── Desktop sidebar ── */}
        {!isMobile && leagueOptions.length > 1 && (
          <LeagueSidebar
            leagues={leagueOptions}
            active={leagueFilter}
            onChange={setLeagueFilter}
          />
        )}

        {/* ── Main content ── */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Search bar */}
          <div style={{
            padding: '10px 16px 6px',
            position: 'sticky', top: 52, zIndex: 20, background: '#0A0E1A',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12, padding: '8px 14px',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="11" cy="11" r="6"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setLeagueFilter(null) }}
                placeholder="Search team or league…"
                style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: 13 }}
              />
              {search && (
                <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: 18, lineHeight: 1, padding: 0 }}>×</button>
              )}
              {/* Mobile filter button */}
              {isMobile && leagueOptions.length > 1 && !search && (
                <button
                  onClick={() => setSheetOpen(true)}
                  style={{
                    background: leagueFilter ? 'rgba(0,255,135,0.12)' : 'rgba(255,255,255,0.07)',
                    border: leagueFilter ? '1px solid rgba(0,255,135,0.3)' : '1px solid rgba(255,255,255,0.1)',
                    color: leagueFilter ? '#00FF87' : 'rgba(255,255,255,0.5)',
                    borderRadius: 8, padding: '4px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 700,
                    display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
                  </svg>
                  {leagueFilter || 'Filter'}
                </button>
              )}
            </div>
          </div>

          {/* Match groups */}
          <div style={{ padding: '4px 16px 0' }}>
            {groups.length === 0 ? (
              <EmptyTab statusTab={statusTab} hasSearch={!!q || !!leagueFilter} search={search} />
            ) : (
              groups.map(([league, ms]) => (
                <LeagueSection key={league} league={league} matches={ms} isMultiSource={isMultiSource} />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter sheet */}
      {isMobile && sheetOpen && (
        <MobileSheet
          leagues={leagueOptions}
          active={leagueFilter}
          onChange={setLeagueFilter}
          onClose={() => setSheetOpen(false)}
        />
      )}
    </div>
  )
}
