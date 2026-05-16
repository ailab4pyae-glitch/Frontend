'use client'
import { useEffect, useRef, useState } from 'react'
import { adminFetch } from '@/lib/auth'

const inp = (extra = {}) => ({
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 8, padding: '9px 12px',
  color: '#fff', fontSize: 14, outline: 'none',
  boxSizing: 'border-box', width: '100%',
  ...extra,
})

const DRIVER_LABELS = { playwright: '🎭 Playwright', http: '🌐 HTTP', api: '⚡ API' }

const STATUS_STYLE = {
  ok:      { color: '#00FF87', bg: 'rgba(0,255,135,0.08)',  border: 'rgba(0,255,135,0.2)',  icon: '✅' },
  warning: { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', icon: '⚠️' },
  timeout: { color: '#f97316', bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.2)', icon: '⏱️' },
  error:   { color: '#ef4444', bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.2)',  icon: '❌' },
  banned:  { color: '#ef4444', bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.2)',  icon: '🚫' },
}

function BanCheckPanel() {
  const [results,  setResults]  = useState(null)
  const [checking, setChecking] = useState(false)
  const [checkedAt, setCheckedAt] = useState(null)

  const run = async () => {
    setChecking(true)
    setResults(null)
    try {
      const data = await adminFetch('/api/admin/scrapers/ban-check')
      setResults(data)
      setCheckedAt(new Date().toLocaleTimeString())
    } catch (e) {
      setResults([{ slug: 'error', overall: 'error', checks: [{ url: '', status: 'error', reason: e.message }] }])
    } finally {
      setChecking(false)
    }
  }

  return (
    <div style={{
      background: '#141824', borderRadius: 12,
      border: '1px solid rgba(255,255,255,0.08)',
      padding: '20px 22px', marginBottom: 28,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: results ? 18 : 0 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>🛡️</span>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>IP Ban Check</span>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, margin: '4px 0 0' }}>
            Test if your server IP is blocked by each scraper source
            {checkedAt && <span style={{ marginLeft: 8, color: 'rgba(255,255,255,0.2)' }}>Last checked: {checkedAt}</span>}
          </p>
        </div>
        <button
          onClick={run}
          disabled={checking}
          style={{
            border: 'none', borderRadius: 8, padding: '10px 20px',
            background: checking ? 'rgba(255,255,255,0.08)' : '#00FF87',
            color: checking ? 'rgba(255,255,255,0.4)' : '#0A0E1A',
            fontWeight: 700, fontSize: 13, cursor: checking ? 'not-allowed' : 'pointer',
            flexShrink: 0, transition: 'all .2s',
          }}
        >
          {checking ? '⏳ Checking…' : '▶ Run Check'}
        </button>
      </div>

      {results && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {results.map((r) => {
            const st = STATUS_STYLE[r.overall] || STATUS_STYLE.error
            return (
              <div key={r.slug} style={{
                borderRadius: 10, border: `1px solid ${st.border}`,
                background: st.bg, padding: '14px 16px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 16 }}>{st.icon}</span>
                  <span style={{ color: '#fff', fontWeight: 700, fontSize: 14, textTransform: 'capitalize' }}>
                    {r.slug}
                  </span>
                  <span style={{
                    fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 700,
                    background: st.bg, color: st.color, border: `1px solid ${st.border}`,
                    textTransform: 'uppercase',
                  }}>
                    {r.overall}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {r.checks.map((c, i) => {
                    const cs = STATUS_STYLE[c.status] || STATUS_STYLE.error
                    return (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                        background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: '8px 12px',
                        gap: 12, flexWrap: 'wrap',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: 13 }}>{cs.icon}</span>
                          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, wordBreak: 'break-all' }}>
                            {c.url || '—'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                          {c.http && (
                            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                              HTTP {c.http}
                            </span>
                          )}
                          {c.latency_ms && (
                            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                              {c.latency_ms}ms
                            </span>
                          )}
                          <span style={{ fontSize: 11, fontWeight: 700, color: cs.color, textTransform: 'uppercase' }}>
                            {c.status}
                          </span>
                        </div>
                        {c.reason && (
                          <div style={{ width: '100%', fontSize: 11, color: cs.color, paddingLeft: 21 }}>
                            {c.reason}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {r.overall !== 'ok' && (
                  <div style={{ marginTop: 10, fontSize: 12, color: 'rgba(255,255,255,0.4)', paddingLeft: 4 }}>
                    {r.overall === 'banned'  && '🔧 Fix: Change server region or set SCRAPER_PROXY in env vars'}
                    {r.overall === 'timeout' && '🔧 Fix: IP may be blocked — try changing server region first'}
                    {r.overall === 'error'   && '🔧 Fix: Source site may be down or your server has no outbound access'}
                    {r.overall === 'warning' && '🔧 Fix: Site may have redesigned — check scraper selectors'}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function SourcesPage() {
  const [sources, setSources] = useState(null)
  const [saving, setSaving]   = useState({})
  const [saved,  setSaved]    = useState({})
  const [error,  setError]    = useState('')

  useEffect(() => {
    adminFetch('/api/admin/sources')
      .then(setSources)
      .catch((e) => setError(e.message))
  }, [])

  const save = async (src, patch) => {
    setSaving((s) => ({ ...s, [src.id]: true }))
    setError('')
    try {
      const updated = await adminFetch(`/api/admin/sources/${src.id}`, {
        method: 'PUT',
        body: JSON.stringify(patch),
      })
      setSources((list) => list.map((s) => s.id === src.id ? { ...s, ...updated } : s))
      setSaved((s) => ({ ...s, [src.id]: true }))
      setTimeout(() => setSaved((s) => ({ ...s, [src.id]: false })), 2500)
    } catch (e) { setError(e.message) }
    finally { setSaving((s) => ({ ...s, [src.id]: false })) }
  }

  return (
    <div style={{ maxWidth: 780 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 700, margin: 0 }}>Scraper Sources</h2>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginTop: 6 }}>
          Change the URLs scrapers use. Changes take effect on the next scrape run (no restart needed).
        </p>
      </div>

      <BanCheckPanel />

      {error && (
        <div style={{ background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.3)', borderRadius: 8, padding: '12px 16px', color: '#ff6b6b', marginBottom: 20, fontSize: 13 }}>
          {error}
        </div>
      )}

      {sources === null && (
        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>Loading…</div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {(sources || []).map((src) => (
          <SourceCard
            key={src.id}
            src={src}
            saving={saving[src.id]}
            saved={saved[src.id]}
            onSave={(patch) => save(src, patch)}
          />
        ))}
      </div>

      <div style={{ marginTop: 24, padding: '14px 18px', borderRadius: 10, background: 'rgba(0,255,135,0.04)', border: '1px solid rgba(0,255,135,0.1)' }}>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: 0 }}>
          <strong style={{ color: '#00FF87' }}>How it works:</strong> Each scraper reads its URLs from this table at the start of every run. Env vars (<code style={{ color: '#60a5fa' }}>SOCO_BASE_URL</code>, etc.) act as fallbacks if the DB row is missing.
        </p>
      </div>
    </div>
  )
}

function useScraperRun(slug) {
  const [running,   setRunning]   = useState(false)
  const [lastRunAt, setLastRunAt] = useState(null)
  const pollRef = useRef(null)

  const stopPoll = () => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null } }

  const poll = async () => {
    try {
      const data = await adminFetch(`/api/admin/scrapers/${slug}/status`)
      setLastRunAt(data.last_run_at)
      if (!data.running) { setRunning(false); stopPoll() }
    } catch (_) {}
  }

  const trigger = async () => {
    if (running) return
    setRunning(true)
    try {
      await adminFetch(`/api/admin/scrapers/${slug}/run`, { method: 'POST' })
      stopPoll()
      pollRef.current = setInterval(poll, 3000)
    } catch (e) {
      setRunning(false)
      alert(e.message)
    }
  }

  useEffect(() => () => stopPoll(), [])

  return { running, lastRunAt, trigger }
}

function SourceCard({ src, saving, saved, onSave }) {
  // Keep a local editable copy of the config
  const [config, setConfig] = useState(() => ({ ...src.config }))
  const [active, setActive] = useState(src.is_active)
  const { running, lastRunAt, trigger } = useScraperRun(src.slug)

  // For sources with base_urls array (socolive)
  const isMultiUrl = Array.isArray(config.base_urls)
  // For sources with api_base string (chinalive)
  const isSingleUrl = typeof config.api_base === 'string'

  const updateUrl = (idx, val) => {
    const urls = [...(config.base_urls || [])]
    urls[idx] = val
    setConfig((c) => ({ ...c, base_urls: urls }))
  }

  const addUrl = () => setConfig((c) => ({ ...c, base_urls: [...(c.base_urls || []), ''] }))
  const removeUrl = (idx) => {
    const urls = (config.base_urls || []).filter((_, i) => i !== idx)
    setConfig((c) => ({ ...c, base_urls: urls }))
  }

  return (
    <div style={{
      background: '#141824', borderRadius: 12,
      border: `1px solid ${active ? 'rgba(0,255,135,0.15)' : 'rgba(255,255,255,0.07)'}`,
      padding: '20px 22px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontWeight: 700, fontSize: 16, color: '#fff' }}>{src.name}</span>
            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 600,
              background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.4)' }}>
              {DRIVER_LABELS[src.driver_type] || src.driver_type}
            </span>
          </div>
          {config.description && (
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, margin: '4px 0 0' }}>
              {config.description}
            </p>
          )}
        </div>

        {/* Active toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: active ? '#00FF87' : 'rgba(255,255,255,0.35)', fontWeight: 600 }}>
            {active ? 'Active' : 'Disabled'}
          </span>
          <button
            onClick={() => setActive((v) => !v)}
            style={{
              width: 44, height: 24, borderRadius: 12, border: 'none',
              background: active ? '#00FF87' : 'rgba(255,255,255,0.12)',
              cursor: 'pointer', position: 'relative', transition: 'background .2s',
            }}
          >
            <span style={{
              position: 'absolute', top: 3, borderRadius: '50%',
              width: 18, height: 18,
              background: active ? '#0A0E1A' : 'rgba(255,255,255,0.5)',
              left: active ? 23 : 3, transition: 'left .2s',
            }} />
          </button>
        </div>
      </div>

      {/* URL fields */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* Multi-URL (socolive) */}
        {isMultiUrl && (
          <>
            <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: .5 }}>
              Base URLs (tried in order, first success wins)
            </label>
            {(config.base_urls || []).map((url, i) => (
              <div key={i} style={{ display: 'flex', gap: 8 }}>
                <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12, paddingTop: 10, flexShrink: 0, minWidth: 20 }}>
                  {i + 1}.
                </span>
                <input
                  value={url}
                  onChange={(e) => updateUrl(i, e.target.value)}
                  placeholder="https://..."
                  style={inp({ flex: 1 })}
                />
                {(config.base_urls || []).length > 1 && (
                  <button onClick={() => removeUrl(i)} style={{
                    border: 'none', borderRadius: 8, padding: '0 12px',
                    background: 'rgba(255,68,68,0.1)', color: '#ff6b6b',
                    cursor: 'pointer', fontSize: 16, flexShrink: 0,
                  }}>✕</button>
                )}
              </div>
            ))}
            <button onClick={addUrl} style={{
              alignSelf: 'flex-start', border: '1px dashed rgba(0,255,135,0.3)',
              background: 'none', borderRadius: 8, padding: '7px 14px',
              color: '#00FF87', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>
              + Add fallback URL
            </button>
          </>
        )}

        {/* Single API base (chinalive) */}
        {isSingleUrl && (
          <>
            <div>
              <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: .5, display: 'block', marginBottom: 6 }}>
                API Base URL
              </label>
              <input
                value={config.api_base}
                onChange={(e) => setConfig((c) => ({ ...c, api_base: e.target.value }))}
                placeholder="https://json.yyzb456.top"
                style={inp()}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: .5, display: 'block', marginBottom: 6 }}>
                Referer Header
              </label>
              <input
                value={config.referer || ''}
                onChange={(e) => setConfig((c) => ({ ...c, referer: e.target.value }))}
                placeholder="https://yyzbw8.live/"
                style={inp()}
              />
            </div>
          </>
        )}

        {/* Sync interval */}
        {config.sync_interval_ms !== undefined && (
          <div>
            <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: .5, display: 'block', marginBottom: 6 }}>
              Sync Interval (ms)
            </label>
            <input
              type="number" min="60000" step="60000"
              value={config.sync_interval_ms}
              onChange={(e) => setConfig((c) => ({ ...c, sync_interval_ms: +e.target.value }))}
              style={inp({ maxWidth: 180 })}
            />
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, marginLeft: 10 }}>
              = {Math.round(config.sync_interval_ms / 60000)} min
            </span>
          </div>
        )}
      </div>

      {/* Save + Run Now */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
        <button
          onClick={() => onSave({ is_active: active, config })}
          disabled={saving}
          style={{
            border: 'none', borderRadius: 8, padding: '10px 24px',
            background: saved ? 'rgba(0,255,135,0.15)' : '#00FF87',
            color: saved ? '#00FF87' : '#0A0E1A',
            fontWeight: 700, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer',
            transition: 'all .2s',
          }}
        >
          {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Changes'}
        </button>

        {/* Only show Run Now for known scrapers */}
        {(src.slug === 'chinalive' || src.slug === 'socolive') && (
          <button
            onClick={trigger}
            disabled={running}
            style={{
              border: `1px solid ${running ? 'rgba(96,165,250,0.3)' : 'rgba(96,165,250,0.5)'}`,
              borderRadius: 8, padding: '9px 20px',
              background: running ? 'rgba(96,165,250,0.08)' : 'rgba(96,165,250,0.12)',
              color: running ? 'rgba(96,165,250,0.5)' : '#60a5fa',
              fontWeight: 700, fontSize: 14,
              cursor: running ? 'not-allowed' : 'pointer',
              transition: 'all .2s',
            }}
          >
            {running ? '⏳ Running…' : '▶ Run Now'}
          </button>
        )}

        {lastRunAt && !running && (
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>
            Last run: {new Date(lastRunAt).toLocaleTimeString()}
          </span>
        )}
        {running && (
          <span style={{ color: '#60a5fa', fontSize: 12 }}>
            Scraper is running — checking every 3s…
          </span>
        )}
      </div>
    </div>
  )
}
