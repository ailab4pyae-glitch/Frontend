'use client'
import { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/auth'

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3050'

const CATEGORIES_TV    = ['Myanmar TV', 'Sports TV', 'News TV', 'Entertainment TV', 'Other']
const CATEGORIES_RADIO = ['Myanmar Radio', 'News Radio', 'International Radio', 'Other']
const EMOJIS_TV        = ['📺','🎬','⭐','7️⃣','9️⃣','5️⃣','📡','📱','🎞','🏛','📖','🎭','🏆','⚽','🔵','🎯','🌍','🎙','📊','📻']
const EMOJIS_RADIO     = ['📻','🎙','🌏','📡','🔊','🎵','🎶','📢']

const inp = (extra = {}) => ({
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 8, padding: '9px 12px',
  color: '#fff', fontSize: 14, outline: 'none',
  width: '100%', boxSizing: 'border-box',
  ...extra,
})

const BLANK = (type = 'tv') => ({
  name: '', slug: '', type, category: type === 'tv' ? 'Myanmar TV' : 'Myanmar Radio',
  emoji: type === 'tv' ? '📺' : '📻', color: '#00FF87',
  logo_url: '', stream_url: '', is_active: true, position: 0,
  country: 'Myanmar', language: 'Burmese',
})

function ChannelRow({ ch, onEdit, onDelete, onToggle, onLogoFetched }) {
  const hasStream = !!ch.stream_url
  const [fetching, setFetching] = useState(false)
  const [fetchMsg, setFetchMsg] = useState('')

  const fetchLogo = async () => {
    setFetching(true); setFetchMsg('')
    try {
      const res = await adminFetch(`/api/admin/tv/${ch.id}/fetch-logo`, { method: 'POST' })
      if (res.logo_url) {
        onLogoFetched(ch.id, res.logo_url)
        setFetchMsg('✓')
      } else {
        setFetchMsg('–')
      }
    } catch { setFetchMsg('!') }
    finally { setFetching(false); setTimeout(() => setFetchMsg(''), 3000) }
  }

  return (
    <div style={{
      background: '#141824', borderRadius: 10,
      border: `1px solid ${ch.is_active ? 'rgba(0,255,135,0.1)' : 'rgba(255,255,255,0.05)'}`,
      padding: '12px 16px',
      display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
      opacity: ch.is_active ? 1 : 0.55,
    }}>
      {/* Logo preview or emoji */}
      <div style={{
        width: 44, height: 44, borderRadius: 10, flexShrink: 0,
        background: ch.color + '22', border: `1px solid ${ch.color}44`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}>
        {ch.logo_url
          ? <img src={ch.logo_url} alt={ch.name} style={{ width: 36, height: 36, objectFit: 'contain' }}
              onError={e => { e.target.style.display = 'none' }} />
          : <span style={{ fontSize: 20 }}>{ch.emoji}</span>
        }
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
          {ch.name}
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4,
            background: ch.type === 'tv' ? 'rgba(96,165,250,0.15)' : 'rgba(245,158,11,0.15)',
            color: ch.type === 'tv' ? '#60a5fa' : '#f59e0b',
          }}>{ch.type.toUpperCase()}</span>
          {ch.logo_url && (
            <span style={{ fontSize: 10, color: '#00FF87', fontWeight: 700 }}>🖼 logo</span>
          )}
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
          {ch.category} · #{ch.position}
        </div>
        {ch.stream_url && (
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 280 }}>
            🔗 {ch.stream_url}
          </div>
        )}
      </div>

      {/* Stream badge */}
      <span style={{
        fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20,
        background: hasStream ? 'rgba(0,255,135,0.1)' : 'rgba(255,255,255,0.06)',
        color: hasStream ? '#00FF87' : 'rgba(255,255,255,0.3)',
        border: `1px solid ${hasStream ? 'rgba(0,255,135,0.2)' : 'rgba(255,255,255,0.08)'}`,
        flexShrink: 0,
      }}>
        {hasStream ? '▶ Live' : 'No URL'}
      </span>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
        {/* Fetch logo */}
        <button onClick={fetchLogo} disabled={fetching} title="Auto-fetch logo from Wikipedia" style={{
          border: '1px solid rgba(251,191,36,0.3)', borderRadius: 7, padding: '5px 10px',
          fontSize: 11, fontWeight: 700, background: 'rgba(251,191,36,0.08)',
          color: fetchMsg === '✓' ? '#00FF87' : fetchMsg === '–' ? 'rgba(255,255,255,0.3)' : '#fbbf24',
          cursor: fetching ? 'not-allowed' : 'pointer', minWidth: 52, textAlign: 'center',
        }}>
          {fetching ? '…' : fetchMsg || '🔍 Logo'}
        </button>
        <button onClick={() => onToggle(ch)} style={{
          border: `1px solid ${ch.is_active ? 'rgba(0,255,135,0.3)' : 'rgba(255,255,255,0.15)'}`,
          borderRadius: 7, padding: '5px 10px', fontSize: 11, fontWeight: 700,
          background: ch.is_active ? 'rgba(0,255,135,0.08)' : 'rgba(255,255,255,0.05)',
          color: ch.is_active ? '#00FF87' : 'rgba(255,255,255,0.4)', cursor: 'pointer',
        }}>
          {ch.is_active ? '● On' : '○ Off'}
        </button>
        <button onClick={() => onEdit(ch)} style={{
          border: '1px solid rgba(96,165,250,0.3)', borderRadius: 7, padding: '5px 10px',
          fontSize: 11, fontWeight: 700, background: 'rgba(96,165,250,0.08)',
          color: '#60a5fa', cursor: 'pointer',
        }}>
          ✏ Edit
        </button>
        <button onClick={() => onDelete(ch)} style={{
          border: '1px solid rgba(239,68,68,0.25)', borderRadius: 7, padding: '5px 10px',
          fontSize: 11, fontWeight: 700, background: 'rgba(239,68,68,0.07)',
          color: '#ef4444', cursor: 'pointer',
        }}>
          🗑
        </button>
      </div>
    </div>
  )
}

function ChannelModal({ channel, onSave, onClose }) {
  const [form, setForm] = useState({ ...channel, stream_url: channel.stream_url ?? '', logo_url: channel.logo_url ?? '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }))
  const categories = form.type === 'tv' ? CATEGORIES_TV : CATEGORIES_RADIO
  const emojis     = form.type === 'tv' ? EMOJIS_TV : EMOJIS_RADIO

  const submit = async () => {
    if (!form.name.trim()) { setError('Name is required'); return }
    setSaving(true); setError('')
    try {
      await onSave(form)
      onClose()
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 400,
      background: 'rgba(0,0,0,0.75)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: '#0D1220', borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.1)',
        padding: 24, width: '100%', maxWidth: 540,
        maxHeight: '90vh', overflowY: 'auto',
        display: 'flex', flexDirection: 'column', gap: 16,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ color: '#fff', fontWeight: 700, fontSize: 18, margin: 0 }}>
            {channel.id ? 'Edit Channel' : 'Add Channel'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', color: '#ef4444', fontSize: 13 }}>
            {error}
          </div>
        )}

        {/* Type toggle */}
        <div>
          <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: .5, display: 'block', marginBottom: 8 }}>Type</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {['tv', 'radio'].map((t) => (
              <button key={t} onClick={() => set('type', t)} style={{
                flex: 1, border: `1px solid ${form.type === t ? (t === 'tv' ? 'rgba(96,165,250,0.5)' : 'rgba(245,158,11,0.5)') : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 8, padding: '10px 0', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                background: form.type === t ? (t === 'tv' ? 'rgba(96,165,250,0.12)' : 'rgba(245,158,11,0.12)') : 'rgba(255,255,255,0.04)',
                color: form.type === t ? (t === 'tv' ? '#60a5fa' : '#f59e0b') : 'rgba(255,255,255,0.4)',
              }}>
                {t === 'tv' ? '📺 TV' : '📻 Radio'}
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <div>
          <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: .5, display: 'block', marginBottom: 6 }}>Channel Name *</label>
          <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. MRTV" style={inp()} />
        </div>

        {/* Category */}
        <div>
          <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: .5, display: 'block', marginBottom: 6 }}>Category</label>
          <select value={form.category} onChange={(e) => set('category', e.target.value)} style={inp()}>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Emoji + Color row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: .5, display: 'block', marginBottom: 6 }}>Emoji</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {emojis.map((e) => (
                <button key={e} onClick={() => set('emoji', e)} style={{
                  width: 34, height: 34, borderRadius: 8, fontSize: 18, cursor: 'pointer',
                  background: form.emoji === e ? 'rgba(0,255,135,0.15)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${form.emoji === e ? 'rgba(0,255,135,0.4)' : 'rgba(255,255,255,0.1)'}`,
                }}>
                  {e}
                </button>
              ))}
              <input value={form.emoji} onChange={(e) => set('emoji', e.target.value)} style={inp({ width: 50, padding: '6px 8px', textAlign: 'center', fontSize: 18 })} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: .5, display: 'block', marginBottom: 6 }}>Accent Color</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="color" value={form.color} onChange={(e) => set('color', e.target.value)}
                style={{ width: 42, height: 42, borderRadius: 8, border: 'none', cursor: 'pointer', background: 'none' }} />
              <input value={form.color} onChange={(e) => set('color', e.target.value)} style={inp({ flex: 1 })} placeholder="#00FF87" />
            </div>
            <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
              {['#c1121f','#457b9d','#2a9d8f','#e76f51','#8338ec','#3a86ff','#06aed5','#f4a000','#00FF87','#60a5fa','#f59e0b'].map((c) => (
                <button key={c} onClick={() => set('color', c)} style={{
                  width: 22, height: 22, borderRadius: '50%', background: c, border: form.color === c ? '2px solid #fff' : '2px solid transparent', cursor: 'pointer',
                }} />
              ))}
            </div>
          </div>
        </div>

        {/* Stream URL */}
        <div>
          <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: .5, display: 'block', marginBottom: 6 }}>
            Stream URL <span style={{ color: 'rgba(255,255,255,0.2)', fontWeight: 400, textTransform: 'none' }}>(m3u8 / direct)</span>
          </label>
          <input value={form.stream_url} onChange={(e) => set('stream_url', e.target.value)}
            placeholder="https://example.com/stream.m3u8" style={inp()} />
        </div>

        {/* Logo URL */}
        <div>
          <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: .5, display: 'block', marginBottom: 6 }}>Logo URL <span style={{ color: 'rgba(255,255,255,0.2)', fontWeight: 400, textTransform: 'none' }}>(optional)</span></label>
          <input value={form.logo_url} onChange={(e) => set('logo_url', e.target.value)}
            placeholder="https://example.com/logo.png" style={inp()} />
        </div>

        {/* Position + Active row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: .5, display: 'block', marginBottom: 6 }}>Position</label>
            <input type="number" value={form.position} onChange={(e) => set('position', +e.target.value)} style={inp()} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: .5, display: 'block', marginBottom: 6 }}>Status</label>
            <button onClick={() => set('is_active', !form.is_active)} style={{
              width: '100%', height: 40, borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer',
              border: `1px solid ${form.is_active ? 'rgba(0,255,135,0.4)' : 'rgba(255,255,255,0.15)'}`,
              background: form.is_active ? 'rgba(0,255,135,0.1)' : 'rgba(255,255,255,0.05)',
              color: form.is_active ? '#00FF87' : 'rgba(255,255,255,0.4)',
            }}>
              {form.is_active ? '● Active' : '○ Disabled'}
            </button>
          </div>
        </div>

        {/* Preview */}
        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '12px 14px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 8, fontWeight: 700 }}>PREVIEW</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: form.color + '22', border: `1px solid ${form.color}44`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
            }}>{form.emoji}</div>
            <div>
              <div style={{ fontWeight: 700, color: '#fff', fontSize: 14 }}>{form.name || 'Channel Name'}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{form.category}</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{
            flex: 1, border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10,
            padding: '12px 0', fontWeight: 700, fontSize: 14, cursor: 'pointer',
            background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)',
          }}>Cancel</button>
          <button onClick={submit} disabled={saving} style={{
            flex: 2, border: 'none', borderRadius: 10, padding: '12px 0',
            fontWeight: 700, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer',
            background: saving ? 'rgba(0,255,135,0.3)' : '#00FF87',
            color: '#0A0E1A',
          }}>
            {saving ? 'Saving…' : (channel.id ? 'Save Changes' : 'Add Channel')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminTVPage() {
  const [channels, setChannels] = useState([])
  const [filter, setFilter]     = useState('all')  // 'all' | 'tv' | 'radio'
  const [search, setSearch]     = useState('')
  const [modal, setModal]       = useState(null)    // null | channel object
  const [error, setError]       = useState('')
  const [bulkFetching, setBulkFetching] = useState(false)
  const [bulkMsg, setBulkMsg]   = useState('')

  const load = () =>
    adminFetch('/api/admin/tv')
      .then(setChannels)
      .catch((e) => setError(e.message))

  useEffect(() => { load() }, [])

  const save = async (form) => {
    if (form.id) {
      const updated = await adminFetch(`/api/admin/tv/${form.id}`, { method: 'PUT', body: JSON.stringify(form) })
      setChannels((prev) => prev.map((c) => c.id === form.id ? updated : c))
    } else {
      const created = await adminFetch('/api/admin/tv', { method: 'POST', body: JSON.stringify(form) })
      setChannels((prev) => [...prev, created])
    }
  }

  const toggle = async (ch) => {
    const updated = await adminFetch(`/api/admin/tv/${ch.id}`, {
      method: 'PUT', body: JSON.stringify({ is_active: !ch.is_active }),
    }).catch((e) => { setError(e.message); return null })
    if (updated) setChannels((prev) => prev.map((c) => c.id === ch.id ? updated : c))
  }

  const logoFetched = (id, logo_url) =>
    setChannels(prev => prev.map(c => c.id === id ? { ...c, logo_url } : c))

  const bulkFetch = async () => {
    setBulkFetching(true); setBulkMsg('')
    try {
      const res = await adminFetch('/api/admin/tv/fetch-logos-bulk', { method: 'POST' })
      setBulkMsg(`✓ ${res.updated} logos found`)
      await load()
    } catch (e) { setBulkMsg('Failed') }
    finally { setBulkFetching(false) }
  }

  const del = async (ch) => {
    if (!confirm(`Delete "${ch.name}"?`)) return
    await adminFetch(`/api/admin/tv/${ch.id}`, { method: 'DELETE' }).catch((e) => setError(e.message))
    setChannels((prev) => prev.filter((c) => c.id !== ch.id))
  }

  const visible = channels.filter((c) => {
    if (filter !== 'all' && c.type !== filter) return false
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) &&
        !c.category.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  // Group by category for display
  const grouped = {}
  for (const c of visible) {
    if (!grouped[c.category]) grouped[c.category] = []
    grouped[c.category].push(c)
  }

  const tvCount    = channels.filter((c) => c.type === 'tv').length
  const radioCount = channels.filter((c) => c.type === 'radio').length
  const liveCount  = channels.filter((c) => !!c.stream_url).length

  return (
    <div style={{ maxWidth: 860 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 700, margin: 0 }}>TV & Radio</h2>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginTop: 4 }}>
            Manage live TV and radio stream URLs
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {bulkMsg && <span style={{ fontSize: 12, color: '#00FF87' }}>{bulkMsg}</span>}
          <button onClick={bulkFetch} disabled={bulkFetching} style={{
            border: '1px solid rgba(251,191,36,0.4)', borderRadius: 10, padding: '10px 16px',
            background: 'rgba(251,191,36,0.1)', color: '#fbbf24',
            fontWeight: 700, fontSize: 13, cursor: bulkFetching ? 'not-allowed' : 'pointer',
          }}>
            {bulkFetching ? '🔍 Searching…' : '🔍 Fetch All Logos'}
          </button>
          <button onClick={() => setModal(BLANK(filter === 'radio' ? 'radio' : 'tv'))} style={{
            border: 'none', borderRadius: 10, padding: '10px 20px',
            background: '#00FF87', color: '#0A0E1A', fontWeight: 700, fontSize: 14, cursor: 'pointer',
          }}>
            + Add Channel
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'TV Channels', value: tvCount, color: '#60a5fa' },
          { label: 'Radio',       value: radioCount, color: '#f59e0b' },
          { label: 'Live URLs',   value: liveCount, color: '#00FF87' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: '#141824', borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)', padding: '14px 16px' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color }}>{value}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: '10px 14px', color: '#ef4444', fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* Filter + Search */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {[['all','All'],['tv','📺 TV'],['radio','📻 Radio']].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)} style={{
            border: `1px solid ${filter === val ? 'rgba(0,255,135,0.4)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 20, padding: '6px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer',
            background: filter === val ? 'rgba(0,255,135,0.1)' : 'rgba(255,255,255,0.04)',
            color: filter === val ? '#00FF87' : 'rgba(255,255,255,0.5)',
          }}>{label}</button>
        ))}
        <input
          value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search channels…"
          style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 20, padding: '6px 14px', color: '#fff', fontSize: 13,
            outline: 'none', flex: 1, minWidth: 140,
          }}
        />
      </div>

      {/* Channel list grouped by category */}
      {Object.entries(grouped).map(([category, chs]) => (
        <div key={category} style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.4)', letterSpacing: 1, textTransform: 'uppercase' }}>
              {category}
            </span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', fontWeight: 600 }}>
              ({chs.length})
            </span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {chs.map((ch) => (
              <ChannelRow key={ch.id} ch={ch}
                onEdit={(c) => setModal({ ...c, logo_url: c.logo_url || '', stream_url: c.stream_url || '' })}
                onDelete={del}
                onToggle={toggle}
                onLogoFetched={logoFetched}
              />
            ))}
          </div>
        </div>
      ))}

      {visible.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.2)', fontSize: 14 }}>
          No channels found
        </div>
      )}

      {modal && (
        <ChannelModal
          channel={modal}
          onSave={save}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
