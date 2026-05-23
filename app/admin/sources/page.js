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

// Normalise DB value → [{url, enabled}]
const normaliseUrls = (raw) =>
  (raw || []).map((u) => (typeof u === 'string' ? { url: u, enabled: true } : { url: u.url ?? '', enabled: u.enabled !== false }))

function Toggle({ on, onChange, size = 38 }) {
  return (
    <button
      onClick={() => onChange(!on)}
      title={on ? 'Enabled — click to disable' : 'Disabled — click to enable'}
      style={{
        width: size, height: Math.round(size * 0.55), borderRadius: size,
        border: 'none', flexShrink: 0,
        background: on ? '#00FF87' : 'rgba(255,255,255,0.12)',
        cursor: 'pointer', position: 'relative', transition: 'background .2s',
      }}
    >
      <span style={{
        position: 'absolute', top: 3, borderRadius: '50%',
        width: Math.round(size * 0.55) - 6, height: Math.round(size * 0.55) - 6,
        background: on ? '#0A0E1A' : 'rgba(255,255,255,0.5)',
        left: on ? size - Math.round(size * 0.55) + 3 : 3,
        transition: 'left .2s',
      }} />
    </button>
  )
}

function UrlList({ items, onChange }) {
  const move = (from, to) => {
    const next = [...items]
    const [el] = next.splice(from, 1)
    next.splice(to, 0, el)
    onChange(next)
  }
  const setEnabled = (i, val) => {
    const next = items.map((u, idx) => idx === i ? { ...u, enabled: val } : u)
    onChange(next)
  }
  const setUrl = (i, val) => {
    const next = items.map((u, idx) => idx === i ? { ...u, url: val } : u)
    onChange(next)
  }
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i))
  const add    = ()  => onChange([...items, { url: '', enabled: true }])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: .5 }}>
          Mirror URLs — #1 tried first
        </label>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>
          {items.filter((u) => u.enabled).length} / {items.length} enabled
        </span>
      </div>

      {items.map((item, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: item.enabled ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.01)',
          borderRadius: 8, padding: '6px 8px',
          border: `1px solid ${item.enabled ? 'rgba(0,255,135,0.1)' : 'rgba(255,255,255,0.05)'}`,
          opacity: item.enabled ? 1 : 0.5,
          transition: 'opacity .2s',
        }}>
          {/* Order badge */}
          <span style={{
            fontSize: 11, fontWeight: 700, flexShrink: 0, minWidth: 22, textAlign: 'center',
            color: item.enabled ? '#00FF87' : 'rgba(255,255,255,0.2)',
          }}>
            {i + 1}
          </span>

          {/* On/Off toggle */}
          <Toggle on={item.enabled} onChange={(v) => setEnabled(i, v)} size={34} />

          {/* URL input */}
          <input
            value={item.url}
            onChange={(e) => setUrl(i, e.target.value)}
            placeholder="https://..."
            style={inp({ flex: 1, fontSize: 13, padding: '7px 10px',
              opacity: item.enabled ? 1 : 0.5,
              textDecoration: item.enabled ? 'none' : 'line-through',
            })}
          />

          {/* Move up */}
          <button
            onClick={() => move(i, i - 1)}
            disabled={i === 0}
            title="Move up"
            style={{
              border: 'none', background: 'rgba(255,255,255,0.05)', borderRadius: 6,
              color: i === 0 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.5)',
              cursor: i === 0 ? 'default' : 'pointer',
              padding: '4px 7px', fontSize: 12, flexShrink: 0,
            }}
          >▲</button>

          {/* Move down */}
          <button
            onClick={() => move(i, i + 1)}
            disabled={i === items.length - 1}
            title="Move down"
            style={{
              border: 'none', background: 'rgba(255,255,255,0.05)', borderRadius: 6,
              color: i === items.length - 1 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.5)',
              cursor: i === items.length - 1 ? 'default' : 'pointer',
              padding: '4px 7px', fontSize: 12, flexShrink: 0,
            }}
          >▼</button>

          {/* Remove */}
          <button
            onClick={() => remove(i)}
            title="Remove"
            style={{
              border: 'none', borderRadius: 6, padding: '4px 8px',
              background: 'rgba(255,68,68,0.08)', color: 'rgba(255,107,107,0.6)',
              cursor: 'pointer', fontSize: 14, flexShrink: 0,
            }}
          >✕</button>
        </div>
      ))}

      <button onClick={add} style={{
        alignSelf: 'flex-start', border: '1px dashed rgba(0,255,135,0.3)',
        background: 'none', borderRadius: 8, padding: '6px 14px', marginTop: 2,
        color: '#00FF87', fontSize: 13, fontWeight: 600, cursor: 'pointer',
      }}>
        + Add mirror URL
      </button>
    </div>
  )
}


function SourceCard({ src, saving, saved, onSave }) {
  const rawUrls    = Array.isArray(src.config?.base_urls) ? normaliseUrls(src.config.base_urls) : null
  const [config,   setConfig]   = useState(() => ({ ...src.config }))
  const [urlItems, setUrlItems] = useState(() => rawUrls ?? [])
  const [active,   setActive]   = useState(src.is_active)
  const { running, lastRunAt, trigger } = useScraperRun(src.slug)

  const isMultiUrl  = rawUrls !== null
  const isSingleUrl = typeof config.api_base === 'string'

  const handleSave = () => {
    const finalConfig = isMultiUrl
      ? { ...config, base_urls: urlItems.map(({ url, enabled }) => ({ url, enabled })) }
      : config
    onSave({ is_active: active, config: finalConfig })
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

        {/* Source-level active toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: active ? '#00FF87' : 'rgba(255,255,255,0.35)', fontWeight: 600 }}>
            {active ? 'Active' : 'Disabled'}
          </span>
          <Toggle on={active} onChange={setActive} size={44} />
        </div>
      </div>

      {/* URL fields */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Multi-URL (socolive) */}
        {isMultiUrl && (
          <UrlList items={urlItems} onChange={setUrlItems} />
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

      </div>

      {/* Save + Run Now */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
        <button
          onClick={handleSave}
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
