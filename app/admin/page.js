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

export default function AdminDashboard() {
  const [stats, setStats]   = useState(null)
  const [error, setError]   = useState('')

  useEffect(() => {
    adminFetch('/api/admin/stats')
      .then(setStats)
      .catch((e) => setError(e.message))
  }, [])

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
        <Stat label="Live Now"   value={stats?.matches.live}      color="#ff4444" />
        <Stat label="Scheduled"  value={stats?.matches.scheduled} color="#f59e0b" />
        <Stat label="Finished"   value={stats?.matches.finished}  color="rgba(255,255,255,0.4)" />
        <Stat label="Total Matches" value={stats?.matches.total}  color="#fff" />
        <Stat label="Streams"    value={stats?.streams.total}
              sub={`${stats?.streams.healthy ?? 0} healthy`}
              color={healthPct != null ? (healthPct > 80 ? '#00FF87' : healthPct > 50 ? '#f59e0b' : '#ff4444') : '#fff'} />
        <Stat label="Stream Health" value={healthPct != null ? `${healthPct}%` : null}
              color={healthPct != null ? (healthPct > 80 ? '#00FF87' : healthPct > 50 ? '#f59e0b' : '#ff4444') : '#fff'} />
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
