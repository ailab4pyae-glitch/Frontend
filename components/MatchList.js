'use client'
import { useMemo, useState, useEffect, useCallback } from 'react'
import useSWR from 'swr'
import { fetcher, apiUrl, isSoon } from '@/lib/api'
import MatchCard from './MatchCard'
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
      ms.slice().sort((a, b) => {
        // live always floats to top within each league
        if (a.status === 'live' && b.status !== 'live') return -1
        if (a.status !== 'live' && b.status === 'live') return 1
        return new Date(a.scheduled_at) - new Date(b.scheduled_at)
      }),
    ])
}

// ─── Status tab bar ───────────────────────────────────────────────────────────

const TAB_COLORS = {
  live:     { bg: 'rgba(255,200,0,0.18)',   border: '#FFD700', text: '#FFD700', dot: '#FFD700', dotGlow: 'rgba(255,215,0,0.8)',  badgeBg: 'rgba(255,215,0,0.25)',  badgeText: '#FFD700' },
  soon:     { bg: 'rgba(168,85,247,0.15)',  border: '#a855f7', text: '#c084fc', dot: '#a855f7', dotGlow: 'rgba(168,85,247,0.7)', badgeBg: 'rgba(168,85,247,0.25)', badgeText: '#c084fc' },
  upcoming: { bg: 'rgba(168,85,247,0.15)',  border: '#a855f7', text: '#c084fc', dot: '#a855f7', dotGlow: 'rgba(168,85,247,0.7)', badgeBg: 'rgba(168,85,247,0.25)', badgeText: '#c084fc' },
}

const StatusTabs = ({ active, onChange, liveCount, soonCount, upcomingCount }) => {
  const tabs = [
    { id: 'live',     label: 'Live',     count: liveCount     },
    { id: 'soon',     label: 'Soon',     count: soonCount     },
    { id: 'upcoming', label: 'Upcoming', count: upcomingCount },
  ]
  return (
    <div style={{
      display: 'flex', gap: 8, padding: '12px 16px',
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
              background:   isActive ? c.bg   : 'rgba(255,255,255,0.07)',
              border:       `1.5px solid ${isActive ? c.border : 'rgba(255,255,255,0.18)'}`,
              borderRadius: 22,
              cursor: 'pointer',
              padding: '7px 16px', fontSize: 13, fontWeight: 900,
              display: 'flex', alignItems: 'center', gap: 6,
              transition: 'all .15s',
              letterSpacing: 0.3,
              boxShadow: isActive ? `0 0 10px ${c.border}40` : 'none',
            }}
          >
            {id === 'live' && (
              <span style={{
                width: 7, height: 7, borderRadius: '50%',
                background: isActive ? c.dot : 'rgba(255,255,255,0.3)', flexShrink: 0,
                boxShadow: isActive ? `0 0 6px ${c.dotGlow}` : 'none',
                animation: isActive ? 'pulse 1.4s ease-in-out infinite' : 'none',
              }} />
            )}
            <span style={{ color: isActive ? c.text : 'rgba(255,255,255,0.75)' }}>
              {label}
            </span>
            {count > 0 && (
              <span style={{
                fontSize: 11, fontWeight: 800,
                background: isActive ? c.badgeBg : 'rgba(255,255,255,0.12)',
                color:      isActive ? c.badgeText : 'rgba(255,255,255,0.6)',
                borderRadius: 10, padding: '1px 7px', lineHeight: 1.6,
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
      color: isActive ? '#fff' : 'rgba(255,255,255,0.82)',
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
    borderRight: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(0,0,0,0.18)',
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

const LeagueSection = ({ league, matches, isMultiSource, fromTab }) => {
  const icon = leagueIcon(league)
  const fame = leagueFame(league)
  const hot  = fame <= 8
  return (
    <div style={{ marginBottom: 20 }}>
      {/* League header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 7,
        padding: '10px 16px 8px',
      }}>
        <span style={{
          width: 3, height: 14, borderRadius: 2, flexShrink: 0,
          background: hot ? 'linear-gradient(180deg,#fbbf24,#f97316)' : 'linear-gradient(180deg,#6366f1,#a855f7)',
        }} />
        <span style={{ fontSize: 14 }}>{icon}</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: '#fff', letterSpacing: 0.3 }}>
          {league || 'Football'}
        </span>
        <span style={{
          fontSize: 11, fontWeight: 800,
          color: '#fff',
          background: hot ? 'rgba(251,191,36,0.35)' : 'rgba(99,102,241,0.45)',
          border: hot ? '1px solid rgba(251,191,36,0.5)' : '1px solid rgba(99,102,241,0.6)',
          borderRadius: 8, padding: '1px 7px',
        }}>
          {matches.length}
        </span>
        {hot && (
          <span style={{
            fontSize: 9, fontWeight: 800, color: '#FFD700',
            background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.2)',
            borderRadius: 4, padding: '1px 5px',
          }}>🔥 HOT</span>
        )}
      </div>
      {/* Grid — auto-fit stretches cards to fill the row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 10,
        padding: '2px 16px 8px',
      }}>
        {matches.map((m) => (
          <MatchCard key={m.id} match={m} multiSource={isMultiSource(m)} fromTab={fromTab} />
        ))}
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
  const isMainTab = tab === 'main-live'
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

  const { data: matches, isLoading, isValidating } = useSWR(
    apiUrl.matches(tab),
    fetcher,
    { refreshInterval: 60000, revalidateOnFocus: false, dedupingInterval: 30000 }
  )

  const isMultiSource = useMemo(() => {
    if (!Array.isArray(matches)) return () => false
    const counts = {}
    for (const m of matches) {
      const k = matchKey(m); counts[k] = (counts[k] || 0) + 1
    }
    return (m) => counts[matchKey(m)] > 1
  }, [matches])

  // Single pass: partition matches into live / soon / upcoming
  const { nonFinished, allLive, allSoon, allUpcoming } = useMemo(() => {
    if (!Array.isArray(matches)) return { nonFinished: [], allLive: [], allSoon: [], allUpcoming: [] }
    const nonFinished = [], allLive = [], allSoon = [], allUpcoming = []
    for (const m of matches) {
      if (m.status === 'finished') continue
      nonFinished.push(m)
      if (m.status === 'live') { allLive.push(m); continue }
      if (isSoon(m.scheduled_at)) allSoon.push(m)
      else allUpcoming.push(m)
    }
    return { nonFinished, allLive, allSoon, allUpcoming }
  }, [matches])

  // Auto-switch: if live is empty on mount, go to soon or upcoming
  useEffect(() => {
    if (!Array.isArray(matches)) return
    if (statusTab === 'live' && allLive.length === 0) {
      if (allSoon.length > 0) setStatusTab('soon')
      else if (allUpcoming.length > 0) setStatusTab('upcoming')
    }
  }, [matches]) // eslint-disable-line

  // main-live: manually-added matches always show; scraped ones filtered to hot leagues (fame ≤ 25)
  const tabMatches = isMainTab
    ? nonFinished.filter((m) => m.source_tab === 'main-live' || leagueFame(leagueKey(m)) <= 25)
    : statusTab === 'live' ? allLive : statusTab === 'soon' ? allSoon : allUpcoming

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
      <div style={{ maxWidth: 1440, margin: '0 auto' }}>
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', gap: 18, padding: '64px 16px',
        }}>
          {/* Triple-ring spinner */}
          <div style={{ position: 'relative', width: 56, height: 56 }}>
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              border: '3px solid transparent',
              borderTopColor: '#6366f1',
              animation: 'spin .9s linear infinite',
            }} />
            <div style={{
              position: 'absolute', inset: 6, borderRadius: '50%',
              border: '3px solid transparent',
              borderTopColor: '#a855f7',
              animation: 'spin .7s linear infinite reverse',
            }} />
            <div style={{
              position: 'absolute', inset: 13, borderRadius: '50%',
              border: '3px solid transparent',
              borderTopColor: '#00e5ff',
              animation: 'spin 1.1s linear infinite',
            }} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 800, color: 'rgba(255,255,255,0.85)' }}>
              Loading matches…
            </p>
            <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
              Fetching live data
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!Array.isArray(matches) || nonFinished.length === 0) {
    return (
      <div>
        {!isMainTab && <StatusTabs active={statusTab} onChange={handleStatusChange} liveCount={0} soonCount={0} upcomingCount={0} />}
        <EmptyTab statusTab={statusTab} hasSearch={false} search="" />
      </div>
    )
  }

  return (
    <div style={{ paddingBottom: 80, maxWidth: 1440, margin: '0 auto' }}>

      {/* Status tabs — hidden for main-live */}
      {!isMainTab && (
        <StatusTabs
          active={statusTab}
          onChange={handleStatusChange}
          liveCount={allLive.length}
          soonCount={allSoon.length}
          upcomingCount={allUpcoming.length}
        />
      )}

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
            position: 'sticky', top: 52, zIndex: 20, background: 'var(--bg)',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
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
                style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'rgba(255,255,255,0.9)', fontSize: 13 }}
              />
              {search && (
                <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: 18, lineHeight: 1, padding: 0 }}>×</button>
              )}
              {/* Re-fetch indicator — shows on every background API poll */}
              {isValidating && !isLoading && !search && (
                <div style={{ position: 'relative', width: 16, height: 16, flexShrink: 0 }}>
                  <div style={{
                    position: 'absolute', inset: 0, borderRadius: '50%',
                    border: '2px solid transparent',
                    borderTopColor: '#6366f1',
                    animation: 'spin .8s linear infinite',
                  }} />
                  <div style={{
                    position: 'absolute', inset: 3, borderRadius: '50%',
                    border: '2px solid transparent',
                    borderTopColor: '#a855f7',
                    animation: 'spin .6s linear infinite reverse',
                  }} />
                </div>
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
          <div style={{ paddingTop: 4 }}>
            {groups.length === 0 ? (
              <EmptyTab statusTab={statusTab} hasSearch={!!q || !!leagueFilter} search={search} />
            ) : (
              groups.map(([league, ms]) => (
                <LeagueSection key={league} league={league} matches={ms} isMultiSource={isMultiSource} fromTab={tab} />
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
