'use client'
import { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/auth'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const inp = (extra = {}) => ({
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 8, padding: '9px 12px',
  color: '#fff', fontSize: 14, outline: 'none',
  width: '100%', boxSizing: 'border-box',
  ...extra,
})

const timeAgo = (iso) => {
  if (!iso) return 'Never'
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (sec < 10)   return 'Just now'
  if (sec < 60)   return `${sec}s ago`
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`
  return `${Math.floor(sec / 3600)}h ago`
}

// Parse "HH:MM" → total minutes since midnight
const toMin = (hhmm) => {
  const [h, m] = (hhmm || '00:00').split(':').map(Number)
  return h * 60 + m
}

// Check if current local time is inside the active window
const isActiveNow = (from, to) => {
  if (!from || !to) return true
  const now = new Date()
  const cur  = now.getHours() * 60 + now.getMinutes()
  const f = toMin(from), t = toMin(to)
  return f <= t ? (cur >= f && cur < t) : (cur >= f || cur < t)
}

const INTERVALS = [
  { label: '1 min',  ms: 60_000 },
  { label: '2 min',  ms: 120_000 },
  { label: '5 min',  ms: 300_000 },
  { label: '10 min', ms: 600_000 },
  { label: '15 min', ms: 900_000 },
  { label: '30 min', ms: 1_800_000 },
  { label: '1 hr',   ms: 3_600_000 },
]

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({ on, onChange, size = 38 }) {
  const h = Math.round(size * 0.55)
  return (
    <button
      onClick={() => onChange(!on)}
      style={{
        width: size, height: h, borderRadius: size,
        border: 'none', flexShrink: 0,
        background: on ? '#00FF87' : 'rgba(255,255,255,0.12)',
        cursor: 'pointer', position: 'relative', transition: 'background .2s',
      }}
    >
      <span style={{
        position: 'absolute', top: 3, borderRadius: '50%',
        width: h - 6, height: h - 6,
        background: on ? '#0A0E1A' : 'rgba(255,255,255,0.5)',
        left: on ? size - h + 3 : 3,
        transition: 'left .2s',
      }} />
    </button>
  )
}

// ─── ScraperCard ─────────────────────────────────────────────────────────────

function ScraperCard({ slug, name, driver }) {
  const [cfg,     setCfg]     = useState(null)   // { is_active, active_hours, sync_interval_ms }
  const [state,   setState]   = useState(null)   // { running, last_run_at, last_result }
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [running, setRunning] = useState(false)
  const [error,   setError]   = useState('')

  // Load schedule config + runtime state
  useEffect(() => {
    Promise.all([
      adminFetch(`/api/admin/scrapers/${slug}/schedule`),
      adminFetch(`/api/admin/scrapers/${slug}/status`),
    ]).then(([schedule, status]) => {
      setCfg(schedule)
      setState(status)
    }).catch((e) => setError(e.message))

    // Poll status every 5s
    const id = setInterval(() =>
      adminFetch(`/api/admin/scrapers/${slug}/status`)
        .then(setState).catch(() => {}),
    5000)
    return () => clearInterval(id)
  }, [slug])

  const save = async () => {
    setSaving(true)
    setError('')
    try {
      const body = {
        is_active:        cfg.is_active,
        active_hours:     cfg.active_hours ?? null,
        sync_interval_ms: cfg.sync_interval_ms,
      }
      const updated = await adminFetch(`/api/admin/scrapers/${slug}/schedule`, {
        method: 'PUT',
        body: JSON.stringify(body),
      })
      setCfg(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  const runNow = async () => {
    if (running) return
    setRunning(true)
    try {
      await adminFetch(`/api/admin/scrapers/${slug}/run`, { method: 'POST' })
    } catch (e) { setError(e.message); setRunning(false) }
  }

  // Stop spinner once status polling reports not running
  useEffect(() => {
    if (state && !state.running) setRunning(false)
  }, [state])

  if (!cfg) return (
    <div style={{ background: '#141824', borderRadius: 12, padding: '24px', color: 'rgba(255,255,255,0.2)', fontSize: 14 }}>
      Loading {name}…
    </div>
  )

  // Derived schedule state
  const always    = !cfg.active_hours?.from || !cfg.active_hours?.to
  const fromVal   = cfg.active_hours?.from ?? '06:00'
  const toVal     = cfg.active_hours?.to   ?? '23:00'
  const overnight = !always && fromVal >= toVal
  const activeNow = isActiveNow(cfg.active_hours?.from, cfg.active_hours?.to)
  const intervalMs = cfg.sync_interval_ms ?? 120_000
  const intervalMin = Math.round(intervalMs / 60_000)

  const setFrom = (v) => setCfg((c) => ({ ...c, active_hours: { from: v, to: toVal } }))
  const setTo   = (v) => setCfg((c) => ({ ...c, active_hours: { from: fromVal, to: v } }))
  const setAlways = (v) => setCfg((c) => ({ ...c, active_hours: v ? null : { from: '06:00', to: '23:00' } }))
  const setInterval = (ms) => setCfg((c) => ({ ...c, sync_interval_ms: ms }))

  const isRunning = running || state?.running

  return (
    <div style={{
      background: '#141824', borderRadius: 14,
      border: `1px solid ${cfg.is_active ? 'rgba(0,255,135,0.15)' : 'rgba(255,255,255,0.07)'}`,
      overflow: 'hidden',
    }}>
      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 22px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Running dot */}
          <div style={{
            width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
            background: isRunning ? '#60a5fa' : (cfg.is_active ? '#00FF87' : 'rgba(255,255,255,0.2)'),
            boxShadow: isRunning ? '0 0 8px rgba(96,165,250,0.6)' : 'none',
            animation: isRunning ? 'pulse 1.4s ease-in-out infinite' : 'none',
          }} />
          <div>
            <span style={{ fontWeight: 700, fontSize: 16, color: '#fff' }}>{name}</span>
            <span style={{
              marginLeft: 8, fontSize: 11, padding: '2px 8px', borderRadius: 20,
              background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.4)', fontWeight: 600,
            }}>{driver}</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Active-now badge */}
          {cfg.is_active && !always && (
            <span style={{
              fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 700,
              background: activeNow ? 'rgba(0,255,135,0.1)' : 'rgba(245,158,11,0.1)',
              color: activeNow ? '#00FF87' : '#f59e0b',
              border: `1px solid ${activeNow ? 'rgba(0,255,135,0.25)' : 'rgba(245,158,11,0.25)'}`,
            }}>
              {activeNow ? '● Running window' : '○ Paused window'}
            </span>
          )}
          <span style={{ fontSize: 12, color: cfg.is_active ? '#00FF87' : 'rgba(255,255,255,0.3)', fontWeight: 600 }}>
            {cfg.is_active ? 'Enabled' : 'Disabled'}
          </span>
          <Toggle on={cfg.is_active} onChange={(v) => setCfg((c) => ({ ...c, is_active: v }))} size={44} />
        </div>
      </div>

      <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 22 }}>

        {/* ── Active Hours ── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Active Hours</span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginLeft: 8 }}>
                scraper skips all ticks outside this window
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: always ? '#00FF87' : 'rgba(255,255,255,0.35)', fontWeight: 600 }}>
                {always ? '24 / 7' : 'Restricted'}
              </span>
              <Toggle on={always} onChange={setAlways} size={36} />
            </div>
          </div>

          {!always ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 5 }}>Run from</div>
                  <input type="time" value={fromVal} onChange={(e) => setFrom(e.target.value)}
                    style={inp({ maxWidth: 130, colorScheme: 'dark' })} />
                </div>
                <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 18, paddingBottom: 10 }}>→</div>
                <div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 5 }}>Until</div>
                  <input type="time" value={toVal} onChange={(e) => setTo(e.target.value)}
                    style={inp({ maxWidth: 130, colorScheme: 'dark' })} />
                </div>
                {overnight && (
                  <span style={{
                    fontSize: 11, padding: '4px 10px', borderRadius: 20, fontWeight: 700,
                    background: 'rgba(245,158,11,0.1)', color: '#f59e0b',
                    border: '1px solid rgba(245,158,11,0.25)', marginBottom: 2,
                  }}>🌙 Overnight</span>
                )}
              </div>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', margin: '10px 0 0' }}>
                {overnight
                  ? `Scraper runs ${fromVal} → midnight → ${toVal}. Skipped between ${toVal}–${fromVal}.`
                  : `Scraper runs ${fromVal} – ${toVal}. Skipped outside this window.`}
                {' '}Saves CPU, DB queries, and Redis reads every skipped tick.
              </p>
            </div>
          ) : (
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', margin: 0 }}>
              No time restriction. Scraper runs on every interval tick around the clock.
            </p>
          )}
        </div>

        {/* ── Sync Interval ── */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Sync Interval</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 12 }}>
            How often the scraper polls for new matches. Lower = more server & Redis usage.
          </div>

          {/* Quick-pick chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
            {INTERVALS.map(({ label, ms }) => (
              <button key={ms} onClick={() => setInterval(ms)} style={{
                border: `1px solid ${intervalMs === ms ? 'rgba(0,255,135,0.5)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 20, padding: '5px 14px', fontSize: 12, fontWeight: 600,
                background: intervalMs === ms ? 'rgba(0,255,135,0.12)' : 'rgba(255,255,255,0.04)',
                color: intervalMs === ms ? '#00FF87' : 'rgba(255,255,255,0.4)',
                cursor: 'pointer', transition: 'all .15s',
              }}>{label}</button>
            ))}
          </div>

          {/* Custom minutes input */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="number" min="1" step="1"
              value={intervalMin}
              onChange={(e) => setInterval(Math.max(1, parseInt(e.target.value) || 1) * 60_000)}
              style={inp({ maxWidth: 80, fontSize: 13 })}
            />
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>minutes</span>
            {!INTERVALS.find((d) => d.ms === intervalMs) && (
              <span style={{ fontSize: 11, color: '#f59e0b', padding: '3px 10px', borderRadius: 20, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                Custom
              </span>
            )}
          </div>
        </div>

        {/* ── Last Run / Status ── */}
        {state && (
          <div style={{
            display: 'flex', gap: 16, flexWrap: 'wrap',
            padding: '12px 14px', borderRadius: 8,
            background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 2 }}>Last run</div>
              <div style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>{timeAgo(state.last_run_at)}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 2 }}>Status</div>
              <div style={{ fontSize: 13, fontWeight: 700,
                color: isRunning ? '#60a5fa'
                  : state.last_result?.status === 'ok'      ? '#00FF87'
                  : state.last_result?.status === 'skipped'  ? '#f59e0b'
                  : state.last_result?.status === 'error'    ? '#ef4444'
                  : 'rgba(255,255,255,0.3)',
              }}>
                {isRunning ? '⏳ Running…'
                  : state.last_result?.status === 'ok'      ? '✅ OK'
                  : state.last_result?.status === 'skipped'  ? '⏭ Skipped (outside window)'
                  : state.last_result?.status === 'error'    ? `❌ ${state.last_result.message || 'Error'}`
                  : '—'}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div style={{ fontSize: 12, color: '#ef4444', background: 'rgba(239,68,68,0.08)', padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.2)' }}>
            {error}
          </div>
        )}

        {/* ── Actions ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={save} disabled={saving} style={{
            border: 'none', borderRadius: 8, padding: '10px 24px',
            background: saved ? 'rgba(0,255,135,0.15)' : '#00FF87',
            color: saved ? '#00FF87' : '#0A0E1A',
            fontWeight: 700, fontSize: 14,
            cursor: saving ? 'not-allowed' : 'pointer', transition: 'all .2s',
          }}>
            {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Schedule'}
          </button>

          <button onClick={runNow} disabled={isRunning || !cfg.is_active} style={{
            border: `1px solid ${isRunning ? 'rgba(96,165,250,0.3)' : 'rgba(96,165,250,0.5)'}`,
            borderRadius: 8, padding: '9px 20px',
            background: 'rgba(96,165,250,0.1)',
            color: isRunning || !cfg.is_active ? 'rgba(96,165,250,0.35)' : '#60a5fa',
            fontWeight: 700, fontSize: 14,
            cursor: isRunning || !cfg.is_active ? 'not-allowed' : 'pointer', transition: 'all .2s',
          }}>
            {isRunning ? '⏳ Running…' : '▶ Run Now'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ScrapersPage() {
  const [sources, setSources] = useState(null)
  const [error,   setError]   = useState('')

  useEffect(() => {
    adminFetch('/api/admin/sources')
      .then((rows) => setSources(rows.filter((s) => ['chinalive', 'socolive'].includes(s.slug))))
      .catch((e) => setError(e.message))
  }, [])

  return (
    <div style={{ maxWidth: 780 }}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 700, margin: 0 }}>Scraper Scheduler</h2>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginTop: 6 }}>
          Set when each scraper is allowed to run. Ticks outside the window are skipped — no DB queries, no Redis reads, no Playwright launches.
        </p>
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '12px 16px', color: '#ef4444', marginBottom: 20, fontSize: 13 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {sources === null ? (
          <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 14 }}>Loading…</div>
        ) : (
          sources.map((s) => (
            <ScraperCard
              key={s.slug}
              slug={s.slug}
              name={s.name}
              driver={s.driver_type}
            />
          ))
        )}
      </div>

      <div style={{ marginTop: 24, padding: '14px 18px', borderRadius: 10, background: 'rgba(0,255,135,0.04)', border: '1px solid rgba(0,255,135,0.1)' }}>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, margin: 0, lineHeight: 1.7 }}>
          <strong style={{ color: '#00FF87' }}>How it works:</strong> Each scraper runs a repeating timer. On every tick it reads its schedule from the DB — if the current time is outside the configured window, the tick is skipped entirely. Changes take effect on the next tick with no server restart needed.
          <br />
          <strong style={{ color: '#f59e0b' }}>Overnight windows:</strong> set From later than Until (e.g. 18:00 → 09:00) to run evenings + overnight and skip daytime.
        </p>
      </div>
    </div>
  )
}
