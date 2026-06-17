'use client'
import { useEffect, useState, useCallback } from 'react'
import { adminFetch } from '@/lib/auth'
import dynamic from 'next/dynamic'

const VideoPlayer = dynamic(() => import('@/components/VideoPlayer'), { ssr: false })

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3050'

function StreamPlayerModal({ stream, onClose }) {
  const proxyUrl = `${BASE}/api/proxy/stream/${stream.id}`
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 640 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
              background: stream.quality === 'HD' ? 'rgba(0,255,135,0.1)' : 'rgba(96,165,250,0.1)',
              color: stream.quality === 'HD' ? '#00FF87' : '#60a5fa',
            }}>{stream.quality}</span>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }}>
              {stream.url.length > 60 ? stream.url.slice(0, 60) + '…' : stream.url}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8,
              color: '#fff', padding: '6px 12px', cursor: 'pointer', fontSize: 14,
            }}
          >
            ✕ Close
          </button>
        </div>
        <VideoPlayer key={proxyUrl} url={proxyUrl} isLive={true} />
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 8, textAlign: 'center' }}>
          Playing via backend proxy · source: {stream.source_name}
        </p>
      </div>
    </div>
  )
}

// ─── tiny shared styles ───────────────────────────────────────────────────────
const input = (extra = {}) => ({
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 8, padding: '9px 12px',
  color: '#fff', fontSize: 14, outline: 'none', width: '100%',
  boxSizing: 'border-box',
  ...extra,
})
const btn = (variant = 'primary', extra = {}) => ({
  border: 'none', borderRadius: 8, padding: '9px 18px',
  fontSize: 13, fontWeight: 700, cursor: 'pointer',
  background: variant === 'primary'  ? '#00FF87'
            : variant === 'danger'   ? 'rgba(255,68,68,0.15)'
            : 'rgba(255,255,255,0.07)',
  color:      variant === 'primary'  ? '#0A0E1A'
            : variant === 'danger'   ? '#ff6b6b'
            : 'rgba(255,255,255,0.7)',
  ...extra,
})

const EMPTY_MATCH = { tab_slug: '', home_team: '', away_team: '', home_logo: '', away_logo: '', league: '', status: 'scheduled', scheduled_at: '' }
const EMPTY_STREAM = { url: '', quality: 'SD' }

// ─── TeamInput — team name field with auto logo lookup + preview ──────────────
function TeamInput({ label, nameValue, logoValue, onNameChange, onLogoChange }) {
  const [fetching, setFetching] = useState(false)
  const [imgErr,   setImgErr]   = useState(false)

  const fetchLogo = async (name) => {
    if (!name?.trim()) return
    setFetching(true)
    try {
      const data = await adminFetch(`/api/admin/teams/logo?name=${encodeURIComponent(name.trim())}`)
      if (data?.logo_url) { onLogoChange(data.logo_url); setImgErr(false) }
    } catch (_) {}
    finally { setFetching(false) }
  }

  const proxyUrl = logoValue
    ? `${BASE}/api/proxy/logo?url=${encodeURIComponent(logoValue)}`
    : null

  const initials = (nameValue || '?').slice(0, 2).toUpperCase()

  return (
    <div>
      <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase' }}>{label} *</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
        {/* Logo preview */}
        <div style={{
          width: 38, height: 38, borderRadius: 8, flexShrink: 0, overflow: 'hidden',
          background: 'rgba(0,255,135,0.08)', border: '1px solid rgba(0,255,135,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {proxyUrl && !imgErr
            ? <img src={proxyUrl} alt={nameValue} onError={() => setImgErr(true)}
                style={{ width: 36, height: 36, objectFit: 'contain' }} />
            : <span style={{ fontSize: 11, fontWeight: 700, color: '#00FF87' }}>{initials}</span>
          }
        </div>

        {/* Name input */}
        <input
          value={nameValue}
          onChange={(e) => { onNameChange(e.target.value); setImgErr(false) }}
          onBlur={(e) => { if (!logoValue) fetchLogo(e.target.value) }}
          placeholder={`${label} name`}
          style={input({ flex: 1 })}
          required
        />

        {/* Refresh logo button */}
        <button
          type="button"
          onClick={() => fetchLogo(nameValue)}
          disabled={fetching || !nameValue}
          title="Auto-fetch logo"
          style={{
            border: 'none', borderRadius: 8, padding: '9px 10px', flexShrink: 0,
            background: fetching ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.07)',
            color: fetching ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.5)',
            cursor: fetching || !nameValue ? 'not-allowed' : 'pointer', fontSize: 14,
          }}
        >{fetching ? '…' : '🔍'}</button>
      </div>

      {/* Optional manual logo URL */}
      <input
        value={logoValue}
        onChange={(e) => { onLogoChange(e.target.value); setImgErr(false) }}
        placeholder="Logo URL (auto-filled or paste manually)"
        style={input({ marginTop: 6, fontSize: 12, color: 'rgba(255,255,255,0.5)' })}
      />
    </div>
  )
}

// ─── MatchRow ─────────────────────────────────────────────────────────────────
function MatchRow({ match, onDelete, onStreamAdded }) {
  const [open, setOpen]               = useState(false)
  const [streams, setStreams]         = useState(null)
  const [sForm, setSForm]             = useState(EMPTY_STREAM)
  const [sLoading, setSLoading]       = useState(false)
  const [sError, setSError]           = useState('')
  const [playingStream, setPlaying]   = useState(null)
  const [hesUrl, setHesUrl]           = useState('')
  const [hesScraping, setHesScraping] = useState(false)
  const [hesResult, setHesResult]     = useState(null)
  const [hesError, setHesError]       = useState('')

  const loadStreams = useCallback(async () => {
    const data = await adminFetch(`/api/admin/matches/${match.id}/streams`)
    setStreams(data || [])
  }, [match.id])

  const toggleOpen = () => {
    if (!open && !streams) loadStreams()
    setOpen((v) => !v)
  }

  const scrapeHesgoal = async (e) => {
    e.preventDefault()
    setHesError(''); setHesResult(null); setHesScraping(true)
    try {
      const data = await adminFetch(`/api/admin/matches/${match.id}/scrape-hesgoal`, {
        method: 'POST', body: JSON.stringify({ url: hesUrl }),
      })
      setHesResult(data.stream)
      await loadStreams()
      onStreamAdded?.()
    } catch (err) { setHesError(err.message) }
    finally { setHesScraping(false) }
  }

  const addStream = async (e) => {
    e.preventDefault()
    setSError(''); setSLoading(true)
    try {
      await adminFetch(`/api/admin/matches/${match.id}/streams`, {
        method: 'POST', body: JSON.stringify(sForm),
      })
      setSForm(EMPTY_STREAM)
      await loadStreams()
      onStreamAdded?.()
    } catch (err) { setSError(err.message) }
    finally { setSLoading(false) }
  }

  const deleteStream = async (sid) => {
    if (!confirm('Delete this stream URL?')) return
    await adminFetch(`/api/admin/streams/${sid}`, { method: 'DELETE' })
    setStreams((s) => s.filter((x) => x.id !== sid))
  }

  return (
    <>
      {playingStream && (
        <StreamPlayerModal stream={playingStream} onClose={() => setPlaying(null)} />
      )}

      <div style={{
        background: '#141824', borderRadius: 10,
        border: '1px solid rgba(255,255,255,0.07)',
        overflow: 'hidden',
      }}>
        {/* Match header row */}
        <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, color: '#fff', fontSize: 14, marginBottom: 3 }}>
              {match.home_team} <span style={{ color: 'rgba(255,255,255,0.35)' }}>vs</span> {match.away_team}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {match.league && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{match.league}</span>}
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '1px 8px', borderRadius: 20,
                background: match.status === 'live' ? 'rgba(0,255,135,0.12)' : 'rgba(255,255,255,0.07)',
                color: match.status === 'live' ? '#00FF87' : 'rgba(255,255,255,0.5)',
              }}>{match.status}</span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                {+match.stream_count} stream{+match.stream_count !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
          <button onClick={toggleOpen} style={btn('ghost', { padding: '6px 12px', fontSize: 12 })}>
            {open ? '▲ Hide' : '▼ Streams'}
          </button>
          <button
            onClick={() => { if (confirm('Delete this match and all its streams?')) onDelete(match.id) }}
            style={btn('danger', { padding: '7px 10px' })}
          >
            🗑
          </button>
        </div>

        {/* Expandable streams panel */}
        {open && (
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '14px 16px', background: 'rgba(0,0,0,0.2)' }}>
            {streams === null && <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>Loading…</div>}
            {streams?.length === 0 && <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>No stream URLs yet.</div>}

            {streams?.map((s) => (
              <div key={s.id} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
              }}>
                <span style={{
                  flexShrink: 0, fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                  background: s.quality === 'HD' ? 'rgba(0,255,135,0.1)' : 'rgba(96,165,250,0.1)',
                  color: s.quality === 'HD' ? '#00FF87' : '#60a5fa',
                }}>{s.quality}</span>

                <span style={{ flex: 1, fontSize: 12, color: 'rgba(255,255,255,0.6)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {s.url}
                </span>

                <span style={{
                  flexShrink: 0, fontSize: 10, padding: '2px 7px', borderRadius: 20,
                  background: s.is_healthy ? 'rgba(0,255,135,0.08)' : 'rgba(255,68,68,0.1)',
                  color: s.is_healthy ? '#00FF87' : '#ff6b6b',
                }}>{s.is_healthy ? 'healthy' : 'down'}</span>

                {/* Play button */}
                <button
                  onClick={() => setPlaying(s)}
                  style={{
                    flexShrink: 0, border: '1px solid rgba(0,255,135,0.3)',
                    borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 700,
                    background: 'rgba(0,255,135,0.08)', color: '#00FF87', cursor: 'pointer',
                  }}
                >
                  ▶ Play
                </button>

                <button onClick={() => deleteStream(s.id)} style={btn('danger', { padding: '4px 8px', fontSize: 11 })}>✕</button>
              </div>
            ))}

            {/* HES-GOAL scraper */}
            <div style={{ marginTop: 16, padding: '12px 14px', borderRadius: 8, background: 'rgba(0,229,255,0.04)', border: '1px solid rgba(0,229,255,0.12)' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(0,229,255,0.7)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
                🎯 HES-GOAL Scraper
              </div>
              <form onSubmit={scrapeHesgoal} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <input
                  placeholder="https://hes-goal.one/match-page-url"
                  value={hesUrl}
                  onChange={(e) => { setHesUrl(e.target.value); setHesResult(null); setHesError('') }}
                  required
                  style={input({ flex: '1 1 260px', borderColor: 'rgba(0,229,255,0.2)' })}
                />
                <button type="submit" disabled={hesScraping} style={{
                  ...btn('ghost'),
                  borderColor: 'rgba(0,229,255,0.35)', color: '#00e5ff',
                  background: hesScraping ? 'rgba(0,229,255,0.04)' : 'rgba(0,229,255,0.08)',
                  flexShrink: 0,
                }}>
                  {hesScraping ? '⏳ Scraping…' : '🔍 Scrape m3u8'}
                </button>
              </form>
              {hesResult && (
                <div style={{ marginTop: 8, fontSize: 12, color: '#00FF87', display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span>✅ Found: <span style={{ fontFamily: 'monospace', color: 'rgba(255,255,255,0.6)', wordBreak: 'break-all' }}>{hesResult.url}</span></span>
                  {hesResult.expires_at && (
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>
                      Expires: {new Date(hesResult.expires_at).toLocaleString()}
                    </span>
                  )}
                </div>
              )}
              {hesError && <div style={{ color: '#ff6b6b', fontSize: 12, marginTop: 6 }}>{hesError}</div>}
            </div>

            {/* Add stream form */}
            <form onSubmit={addStream} style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
              <input
                placeholder="Stream URL (m3u8 / flv)"
                value={sForm.url}
                onChange={(e) => setSForm({ ...sForm, url: e.target.value })}
                required
                style={input({ flex: '1 1 260px' })}
              />
              <select
                value={sForm.quality}
                onChange={(e) => setSForm({ ...sForm, quality: e.target.value })}
                style={input({ flex: '0 0 80px', cursor: 'pointer' })}
              >
                <option>SD</option>
                <option>HD</option>
              </select>
              <button type="submit" disabled={sLoading} style={btn('primary', { flexShrink: 0 })}>
                {sLoading ? '…' : '+ Add'}
              </button>
            </form>
            {sError && <div style={{ color: '#ff6b6b', fontSize: 12, marginTop: 6 }}>{sError}</div>}
          </div>
        )}
      </div>
    </>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function MatchesPage() {
  const [tabs, setTabs]         = useState([])
  const [activeTab, setActiveTab] = useState('')
  const [matches, setMatches]   = useState([])
  const [loading, setLoading]   = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]         = useState(EMPTY_MATCH)
  const [fError, setFError]     = useState('')
  const [fLoading, setFLoading] = useState(false)

  // Load tabs on mount
  useEffect(() => {
    adminFetch('/api/admin/tabs').then((data) => {
      setTabs(data || [])
      if (data?.length) { setActiveTab(data[0].slug); setForm((f) => ({ ...f, tab_slug: data[0].slug })) }
    })
  }, [])

  // Load matches when active tab changes
  const loadMatches = useCallback(async () => {
    if (!activeTab) return
    setLoading(true)
    try {
      const data = await adminFetch(`/api/admin/matches?tab=${activeTab}`)
      setMatches(data || [])
    } catch { setMatches([]) }
    finally { setLoading(false) }
  }, [activeTab])

  useEffect(() => { loadMatches() }, [loadMatches])

  const deleteMatch = async (id) => {
    await adminFetch(`/api/admin/matches/${id}`, { method: 'DELETE' })
    setMatches((m) => m.filter((x) => x.id !== id))
  }

  const addMatch = async (e) => {
    e.preventDefault(); setFError(''); setFLoading(true)
    try {
      await adminFetch('/api/admin/matches', { method: 'POST', body: JSON.stringify(form) })
      setForm({ ...EMPTY_MATCH, tab_slug: activeTab })
      setShowForm(false)
      await loadMatches()
    } catch (err) { setFError(err.message) }
    finally { setFLoading(false) }
  }

  return (
    <div style={{ maxWidth: 860 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 700, margin: 0 }}>Matches & Streams</h2>
        <button onClick={() => setShowForm((v) => !v)} style={btn('primary')}>
          {showForm ? '✕ Cancel' : '+ New Match'}
        </button>
      </div>

      {/* Add match form */}
      {showForm && (
        <form onSubmit={addMatch} style={{
          background: '#141824', borderRadius: 12,
          border: '1px solid rgba(0,255,135,0.2)',
          padding: '20px', marginBottom: 20,
          display: 'flex', flexDirection: 'column', gap: 14,
        }}>
          <h3 style={{ color: '#00FF87', margin: 0, fontSize: 15 }}>New Match</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase' }}>Tab *</label>
              <select value={form.tab_slug} onChange={(e) => setForm({ ...form, tab_slug: e.target.value })} style={input({ marginTop: 4, cursor: 'pointer' })} required>
                {tabs.map((t) => <option key={t.slug} value={t.slug}>{t.icon} {t.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase' }}>League</label>
              <input value={form.league} onChange={(e) => setForm({ ...form, league: e.target.value })} placeholder="e.g. Premier League" style={input({ marginTop: 4 })} />
            </div>
            <TeamInput
              label="Home Team"
              nameValue={form.home_team}
              logoValue={form.home_logo}
              onNameChange={(v) => setForm((f) => ({ ...f, home_team: v }))}
              onLogoChange={(v) => setForm((f) => ({ ...f, home_logo: v }))}
            />
            <TeamInput
              label="Away Team"
              nameValue={form.away_team}
              logoValue={form.away_logo}
              onNameChange={(v) => setForm((f) => ({ ...f, away_team: v }))}
              onLogoChange={(v) => setForm((f) => ({ ...f, away_logo: v }))}
            />
            <div>
              <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase' }}>Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} style={input({ marginTop: 4, cursor: 'pointer' })}>
                <option value="scheduled">Scheduled</option>
                <option value="live">Live</option>
                <option value="finished">Finished</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase' }}>Kick-off Time</label>
              <input type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} style={input({ marginTop: 4 })} />
            </div>
          </div>
          {fError && <div style={{ color: '#ff6b6b', fontSize: 13 }}>{fError}</div>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" disabled={fLoading} style={btn('primary')}>
              {fLoading ? 'Saving…' : 'Create Match'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} style={btn('ghost')}>Cancel</button>
          </div>
        </form>
      )}

      {/* Tab selector */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 18, paddingBottom: 4 }}>
        {tabs.map((t) => (
          <button key={t.slug} onClick={() => setActiveTab(t.slug)} style={{
            flexShrink: 0, padding: '7px 14px', borderRadius: 20, border: 'none',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
            background: activeTab === t.slug ? (t.color || '#00FF87') : 'rgba(255,255,255,0.07)',
            color: activeTab === t.slug ? '#0A0E1A' : 'rgba(255,255,255,0.55)',
          }}>
            {t.icon} {t.name}
          </button>
        ))}
      </div>

      {/* Match list */}
      {loading && (
        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, textAlign: 'center', padding: 40 }}>Loading…</div>
      )}
      {!loading && matches.length === 0 && (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>No matches in this tab yet.</p>
          <button onClick={() => setShowForm(true)} style={btn('primary', { marginTop: 8 })}>+ Add first match</button>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {matches.map((m) => (
          <MatchRow key={m.id} match={m} onDelete={deleteMatch} onStreamAdded={loadMatches} />
        ))}
      </div>
    </div>
  )
}
