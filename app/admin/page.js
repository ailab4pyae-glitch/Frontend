'use client'
import { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/auth'

const Stat = ({ label, value, sub, color = '#00FF87' }) => (
  <div style={{
    background: '#141824', borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.07)',
    padding: '20px 22px',
  }}>
    <div style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1 }}>{value ?? '—'}</div>
    <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginTop: 6 }}>{label}</div>
    {sub && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>{sub}</div>}
  </div>
)

const timeAgo = (iso) => {
  if (!iso) return 'Never'
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (sec < 10)  return 'Just now'
  if (sec < 60)  return `${sec}s ago`
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`
  return `${Math.floor(sec / 3600)}h ago`
}

const RESULT_STYLE = {
  ok:      { color: '#00FF87', bg: 'rgba(0,255,135,0.08)',  border: 'rgba(0,255,135,0.2)',  icon: '✅', label: 'OK' },
  error:   { color: '#ef4444', bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.2)',  icon: '❌', label: 'Failed' },
  skipped: { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', icon: '⏭', label: 'Skipped' },
}

function ScraperCard({ scraper, onRun }) {
  const result  = scraper.last_result
  const rs      = result ? (RESULT_STYLE[result.status] || RESULT_STYLE.error) : null
  const running = scraper.running

  return (
    <div style={{
      background: '#141824', borderRadius: 12,
      border: `1px solid ${rs ? rs.border : 'rgba(255,255,255,0.07)'}`,
      padding: '18px 20px',
      display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
    }}>
      {/* Status dot */}
      <div style={{
        width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
        background: running ? '#60a5fa' : (rs ? rs.color : 'rgba(255,255,255,0.2)'),
        boxShadow: running ? '0 0 8px rgba(96,165,250,0.6)' : (rs?.color ? `0 0 8px ${rs.color}44` : 'none'),
        animation: running ? 'livePulse 1.4s ease-in-out infinite' : 'none',
      }} />

      {/* Name + slug */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: '#fff' }}>{scraper.name}</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
          {scraper.is_active ? '● Active' : '○ Disabled'}
        </div>
      </div>

      {/* Last result badge */}
      {running ? (
        <span style={{ fontSize: 12, fontWeight: 700, color: '#60a5fa' }}>⏳ Running…</span>
      ) : rs ? (
        <div style={{ textAlign: 'right' }}>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
            background: rs.bg, color: rs.color, border: `1px solid ${rs.border}`,
          }}>
            {rs.icon} {rs.label}
          </span>
          {result.message && (
            <div style={{ fontSize: 10, color: '#ef4444', marginTop: 4, maxWidth: 220, textAlign: 'right', wordBreak: 'break-all' }}>
              {result.message.slice(0, 80)}{result.message.length > 80 ? '…' : ''}
            </div>
          )}
        </div>
      ) : (
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>No data yet</span>
      )}

      {/* Last run time */}
      <div style={{ textAlign: 'right', minWidth: 70 }}>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
          {timeAgo(scraper.last_run_at)}
        </div>
        {scraper.last_run_at && (
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 1 }}>
            {new Date(scraper.last_run_at).toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Run Now button */}
      <button
        onClick={() => onRun(scraper.slug)}
        disabled={running || !scraper.is_active}
        style={{
          flexShrink: 0, border: `1px solid ${running ? 'rgba(96,165,250,0.2)' : 'rgba(96,165,250,0.4)'}`,
          borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 700,
          background: running ? 'rgba(96,165,250,0.05)' : 'rgba(96,165,250,0.1)',
          color: running || !scraper.is_active ? 'rgba(96,165,250,0.35)' : '#60a5fa',
          cursor: running || !scraper.is_active ? 'not-allowed' : 'pointer',
        }}
      >
        {running ? '…' : '▶ Run'}
      </button>
    </div>
  )
}

export default function AdminDashboard() {
  const [stats,    setStats]    = useState(null)
  const [scrapers, setScrapers] = useState([])
  const [error,    setError]    = useState('')

  const loadAll = () => Promise.all([
    adminFetch('/api/admin/stats').then(setStats).catch((e) => setError(e.message)),
    adminFetch('/api/admin/scrapers').then(setScrapers).catch(() => {}),
  ])

  useEffect(() => {
    loadAll()
    // Refresh scraper status every 10s so "Running…" resolves automatically
    const id = setInterval(() => adminFetch('/api/admin/scrapers').then(setScrapers).catch(() => {}), 10000)
    return () => clearInterval(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const runScraper = async (slug) => {
    setScrapers((prev) => prev.map((s) => s.slug === slug ? { ...s, running: true } : s))
    try {
      await adminFetch(`/api/admin/scrapers/${slug}/run`, { method: 'POST' })
    } catch (e) {
      alert(e.message)
      setScrapers((prev) => prev.map((s) => s.slug === slug ? { ...s, running: false } : s))
    }
  }

  const healthPct = stats
    ? stats.streams.total === 0 ? 100
      : Math.round((stats.streams.healthy / stats.streams.total) * 100)
    : null

  return (
    <div style={{ maxWidth: 900 }}>
      <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 700, margin: '0 0 24px' }}>Dashboard</h2>

      {error && (
        <div style={{ background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.3)', borderRadius: 8, padding: '12px 16px', color: '#ff6b6b', marginBottom: 20 }}>
          {error}
        </div>
      )}

      {/* Match stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(170px,1fr))', gap: 12, marginBottom: 32 }}>
        <Stat label="Live Now"      value={stats?.matches.live}      color="#00FF87" />
        <Stat label="Scheduled"     value={stats?.matches.scheduled} color="#f59e0b" />
        <Stat label="Finished"      value={stats?.matches.finished}  color="rgba(255,255,255,0.4)" />
        <Stat label="Total Matches" value={stats?.matches.total}     color="#fff" />
        <Stat label="Streams"       value={stats?.streams.total}
              sub={`${stats?.streams.healthy ?? 0} healthy`}
              color={healthPct != null ? (healthPct > 80 ? '#00FF87' : healthPct > 50 ? '#f59e0b' : '#ef4444') : '#fff'} />
        <Stat label="Stream Health" value={healthPct != null ? `${healthPct}%` : null}
              color={healthPct != null ? (healthPct > 80 ? '#00FF87' : healthPct > 50 ? '#f59e0b' : '#ef4444') : '#fff'} />
      </div>

      {/* Scraper Status */}
      <h3 style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>
        Scraper Status
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 32 }}>
        {scrapers.length === 0 && (
          <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>Loading…</div>
        )}
        {scrapers.map((s) => (
          <ScraperCard key={s.slug} scraper={s} onRun={runScraper} />
        ))}
      </div>

      {/* Per-tab breakdown */}
      <h3 style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>
        Matches per Tab
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {(stats?.perTab || Array.from({ length: 5 })).map((tab, i) => (
          <div key={i} style={{
            background: '#141824', borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.07)',
            padding: '14px 18px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>
              {tab?.name ?? <span style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 4, display: 'inline-block', width: 100, height: 14 }} />}
            </span>
            <span style={{
              background: 'rgba(0,255,135,0.1)', color: '#00FF87',
              borderRadius: 20, padding: '3px 12px', fontSize: 13, fontWeight: 700,
            }}>
              {tab?.match_count ?? 0}
            </span>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div style={{ display: 'flex', gap: 12, marginTop: 32, flexWrap: 'wrap' }}>
        <a href="/admin/matches" style={{
          background: 'rgba(0,255,135,0.1)', color: '#00FF87',
          border: '1px solid rgba(0,255,135,0.2)',
          borderRadius: 10, padding: '12px 20px',
          fontWeight: 600, fontSize: 14, textDecoration: 'none',
        }}>
          ⚽ Add Match / Stream URL
        </a>
        <a href="/admin/sources" style={{
          background: 'rgba(96,165,250,0.08)', color: '#60a5fa',
          border: '1px solid rgba(96,165,250,0.2)',
          borderRadius: 10, padding: '12px 20px',
          fontWeight: 600, fontSize: 14, textDecoration: 'none',
        }}>
          🔧 Manage Scrapers
        </a>
        <a href="/admin/config" style={{
          background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 10, padding: '12px 20px',
          fontWeight: 600, fontSize: 14, textDecoration: 'none',
        }}>
          ⚙️ Edit Config
        </a>
      </div>
    </div>
  )
}
