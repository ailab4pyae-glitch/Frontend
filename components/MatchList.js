'use client'
import { useEffect, useRef, useMemo } from 'react'
import useSWR from 'swr'
import { fetcher, apiUrl } from '@/lib/api'
import MatchCard from './MatchCard'
import MatchSkeleton from './MatchSkeleton'

const SectionLabel = ({ children }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 8, margin: '20px 0 10px',
  }}>
    <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.45)', letterSpacing: 1, textTransform: 'uppercase' }}>
      {children}
    </span>
    <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
  </div>
)

const EmptyState = ({ tab }) => (
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

export default function MatchList({ tab }) {
  const { data: matches, isLoading, mutate } = useSWR(
    apiUrl.matches(tab),
    fetcher,
    { refreshInterval: 30000, revalidateOnFocus: true }
  )

  // Keep refreshInterval reference
  const mutateRef = useRef(mutate)
  useEffect(() => { mutateRef.current = mutate }, [mutate])

  const isMultiSource = useMemo(() => {
    if (!Array.isArray(matches)) return () => false
    const norm = (s) => (s || '').toLowerCase().replace(/\s+/g, '')
    const key = (m) => `${norm(m.home_team)}_${norm(m.away_team)}`
    const counts = {}
    for (const m of matches) { const k = key(m); counts[k] = (counts[k] || 0) + 1 }
    return (m) => counts[key(m)] > 1
  }, [matches])

  if (isLoading) {
    return (
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 8 }}>
        <MatchSkeleton />
        <MatchSkeleton />
        <MatchSkeleton />
      </div>
    )
  }

  if (!Array.isArray(matches) || matches.length === 0) {
    return <EmptyState tab={tab} />
  }

  const live      = matches.filter((m) => m.status === 'live')
  const scheduled = matches.filter((m) => m.status !== 'live' && m.status !== 'finished')
  const finished  = matches.filter((m) => m.status === 'finished')

  return (
    <div style={{ padding: '0 16px 16px' }}>
      {live.length > 0 && (
        <>
          <SectionLabel>🔴 Live Now ({live.length})</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {live.map((m) => <MatchCard key={m.id} match={m} multiSource={isMultiSource(m)} />)}
          </div>
        </>
      )}

      {scheduled.length > 0 && (
        <>
          <SectionLabel>🕐 Upcoming</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {scheduled.map((m) => <MatchCard key={m.id} match={m} multiSource={isMultiSource(m)} />)}
          </div>
        </>
      )}

      {finished.length > 0 && (
        <>
          <SectionLabel>✅ Finished</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {finished.map((m) => <MatchCard key={m.id} match={m} multiSource={isMultiSource(m)} />)}
          </div>
        </>
      )}
    </div>
  )
}
