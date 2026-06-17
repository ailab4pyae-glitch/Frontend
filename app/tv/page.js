'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import Header from '@/components/Header'
import { fetcher, apiUrl } from '@/lib/api'

// Vibrant gradient pairs — each channel gets one deterministically
const GRADIENTS = [
  ['#667eea', '#764ba2'],
  ['#f093fb', '#f5576c'],
  ['#4facfe', '#00f2fe'],
  ['#43e97b', '#38f9d7'],
  ['#fa709a', '#fee140'],
  ['#ff0844', '#ffb199'],
  ['#0fd850', '#f9f047'],
  ['#8ec5fc', '#e0c3fc'],
  ['#f77062', '#fe5196'],
  ['#c471f5', '#fa71cd'],
  ['#30cfd0', '#667eea'],
  ['#ff758c', '#ff7eb3'],
  ['#43e97b', '#fa709a'],
  ['#4facfe', '#f093fb'],
  ['#ffecd2', '#fcb69f'],
  ['#a18cd1', '#fbc2eb'],
]

function getGradient(name = '') {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0
  return GRADIENTS[Math.abs(h) % GRADIENTS.length]
}

const CAT_COLOR = {
  sports: '#00FF87', entertainment: '#FF6B6B', news: '#4EC9E0',
  kids: '#FFD166', general: '#A8B8D8', music: '#C77DFF',
  movies: '#FF9F1C', documentary: '#2EC4B6', lifestyle: '#F72585',
  'myanmar tv': '#00FF87', 'news tv': '#4EC9E0',
}
const catColor = (cat) => CAT_COLOR[(cat || '').toLowerCase()] || '#aaa'

const FLAG_MAP = {
  myanmar: '🇲🇲', usa: '🇺🇸', uk: '🇬🇧', 'united kingdom': '🇬🇧',
  thailand: '🇹🇭', china: '🇨🇳', japan: '🇯🇵', korea: '🇰🇷',
  india: '🇮🇳', france: '🇫🇷', germany: '🇩🇪', spain: '🇪🇸',
  italy: '🇮🇹', brazil: '🇧🇷', australia: '🇦🇺', canada: '🇨🇦',
  singapore: '🇸🇬', malaysia: '🇲🇾', indonesia: '🇮🇩', vietnam: '🇻🇳',
}

export default function TVPage() {
  const router   = useRouter()
  const [type, setType]     = useState('tv')
  const [cat, setCat]       = useState('all')
  const [search, setSearch] = useState('')
  const [sortAZ, setSortAZ] = useState(false)

  const { data: groups = [], isLoading } = useSWR(
    apiUrl.tv(type), fetcher, { revalidateOnFocus: false }
  )

  const all = useMemo(() => groups.flatMap(g => g.channels), [groups])

  const categories = useMemo(() => {
    const m = {}
    for (const ch of all) {
      const k = (ch.category || 'General').toLowerCase()
      m[k] = (m[k] || 0) + 1
    }
    return Object.entries(m).sort((a, b) => b[1] - a[1])
  }, [all])

  const visible = useMemo(() => {
    let list = cat === 'all' ? all
      : all.filter(ch => (ch.category || 'General').toLowerCase() === cat)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(ch => ch.name.toLowerCase().includes(q))
    }
    return sortAZ ? [...list].sort((a, b) => a.name.localeCompare(b.name)) : list
  }, [all, cat, search, sortAZ])

  return (
    <div style={{ minHeight: '100vh', background: '#141414', color: '#fff', fontFamily: 'inherit' }}>
      <Header />

      {/* ── Sticky top bar ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(20,20,20,0.94)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        {/* Row 1 */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 18px 10px', flexWrap: 'wrap',
        }}>
          {/* Type toggle */}
          <div style={{
            display: 'inline-flex', background: 'rgba(255,255,255,0.07)',
            borderRadius: 12, padding: 3, flexShrink: 0,
          }}>
            {[['tv', '📺 TV'], ['radio', '📻 Radio']].map(([k, label]) => (
              <button key={k}
                onClick={() => { setType(k); setCat('all'); setSearch('') }}
                style={{
                  background: type === k ? '#e50914' : 'none',
                  border: 'none', borderRadius: 9,
                  color: type === k ? '#fff' : 'rgba(255,255,255,0.45)',
                  padding: '6px 16px', fontSize: 13, fontWeight: 700,
                  cursor: 'pointer', transition: 'all .18s',
                }}>{label}</button>
            ))}
          </div>

          {/* Search */}
          <div style={{
            flex: 1, minWidth: 140, display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 10, padding: '7px 12px',
          }}>
            <svg width="13" height="13" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search channels…"
              style={{
                flex: 1, background: 'none', border: 'none', outline: 'none',
                color: '#fff', fontSize: 13,
              }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{
                background: 'none', border: 'none',
                color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 14, padding: 0,
              }}>✕</button>
            )}
          </div>

          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', whiteSpace: 'nowrap' }}>
            {visible.length} channels
          </span>
          <button onClick={() => setSortAZ(v => !v)} style={{
            background: sortAZ ? 'rgba(229,9,20,0.15)' : 'rgba(255,255,255,0.06)',
            border: `1px solid ${sortAZ ? 'rgba(229,9,20,0.5)' : 'rgba(255,255,255,0.1)'}`,
            color: sortAZ ? '#e50914' : 'rgba(255,255,255,0.45)',
            borderRadius: 8, padding: '6px 12px',
            fontSize: 11, fontWeight: 800, cursor: 'pointer', letterSpacing: 0.4,
          }}>A–Z</button>
        </div>

        {/* Row 2: category tabs */}
        <div style={{
          display: 'flex', overflowX: 'auto', scrollbarWidth: 'none',
          padding: '0 14px',
        }}>
          <Tab label="All" count={all.length} active={cat === 'all'} onClick={() => setCat('all')} />
          {categories.map(([k, n]) => (
            <Tab key={k} label={k} count={n} active={cat === k} onClick={() => setCat(k)} />
          ))}
        </div>
      </div>

      {/* ── Grid ── */}
      <main style={{ padding: '22px 16px 70px' }}>
        {isLoading && <Skeletons />}

        {!isLoading && visible.length === 0 && (
          <p style={{ textAlign: 'center', padding: '80px 0', color: 'rgba(255,255,255,0.2)', fontSize: 14 }}>
            No channels found
          </p>
        )}

        {!isLoading && visible.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))',
            gap: 16,
          }}>
            {visible.map(ch => (
              <ChannelCard key={ch.id} ch={ch}
                onSelect={() => ch.stream_url && router.push(`/tv/${ch.id}`)} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

function Tab({ label, count, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      background: 'none', border: 'none',
      borderBottom: `2px solid ${active ? '#e50914' : 'transparent'}`,
      color: active ? '#fff' : 'rgba(255,255,255,0.38)',
      padding: '8px 14px 9px',
      fontSize: 13, fontWeight: 700, cursor: 'pointer',
      whiteSpace: 'nowrap',
      transition: 'color .15s, border-color .15s',
      display: 'flex', alignItems: 'center', gap: 6,
      borderRadius: 0,
    }}>
      <span style={{ textTransform: 'capitalize' }}>{label}</span>
      {active && (
        <span style={{
          background: '#e50914', color: '#fff',
          borderRadius: 20, padding: '1px 7px',
          fontSize: 10, fontWeight: 900,
        }}>{count}</span>
      )}
    </button>
  )
}

function ChannelCard({ ch, onSelect }) {
  const online  = !!ch.stream_url
  const [g1, g2] = getGradient(ch.name)
  const accent  = catColor(ch.category)
  const flag    = FLAG_MAP[(ch.country || '').toLowerCase()] || ''

  const enter = (e) => {
    if (!online) return
    const el = e.currentTarget
    el.style.transform = 'translateY(-10px) scale(1.05)'
    el.style.boxShadow = `0 30px 60px rgba(0,0,0,0.9), 0 0 0 2px ${g1}88`
    el.style.zIndex = '20'
    el.querySelector('.play-btn').style.opacity = '1'
    el.querySelector('.play-btn').style.transform = 'translate(-50%,-50%) scale(1)'
  }
  const leave = (e) => {
    const el = e.currentTarget
    el.style.transform = 'translateY(0) scale(1)'
    el.style.boxShadow = '0 4px 20px rgba(0,0,0,0.5)'
    el.style.zIndex = '1'
    el.querySelector('.play-btn').style.opacity = '0'
    el.querySelector('.play-btn').style.transform = 'translate(-50%,-50%) scale(0.7)'
  }

  return (
    <div
      onClick={onSelect}
      onMouseEnter={enter}
      onMouseLeave={leave}
      style={{
        borderRadius: 12,
        overflow: 'hidden',
        cursor: online ? 'pointer' : 'default',
        position: 'relative', zIndex: 1,
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        transition: 'transform .28s cubic-bezier(.34,1.56,.64,1), box-shadow .28s ease',
        opacity: online ? 1 : 0.32,
        filter: online ? 'none' : 'grayscale(100%)',
      }}
    >
      {/* ── Colorful thumbnail ── */}
      <div style={{
        height: 130,
        background: `linear-gradient(135deg, ${g1}, ${g2})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Subtle noise texture overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at 70% 30%, rgba(255,255,255,0.15), transparent 60%)',
        }} />

        {/* Logo / emoji */}
        <ChannelLogo ch={ch} size={72} />

        {/* Flag */}
        {flag && (
          <span style={{ position: 'absolute', top: 8, right: 10, fontSize: 16, filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.5))' }}>
            {flag}
          </span>
        )}

        {/* Play button — center, appears on hover */}
        <div className="play-btn" style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%,-50%) scale(0.7)',
          width: 48, height: 48, borderRadius: '50%',
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(8px)',
          border: '2px solid rgba(255,255,255,0.8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: 0,
          transition: 'opacity .2s ease, transform .2s cubic-bezier(.34,1.56,.64,1)',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff" style={{ marginLeft: 3 }}>
            <polygon points="5,3 19,12 5,21"/>
          </svg>
        </div>

        {/* Bottom fade into card info */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 48,
          background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.55))',
        }} />
      </div>

      {/* ── Info strip ── */}
      <div style={{
        background: '#1f1f1f',
        padding: '10px 12px 11px',
        borderTop: `2px solid ${g1}`,
      }}>
        <div style={{
          fontSize: 13, fontWeight: 700, color: '#fff',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          marginBottom: 5,
        }}>
          {ch.name}
        </div>
        <span style={{
          display: 'inline-block',
          background: `${accent}20`,
          border: `1px solid ${accent}55`,
          color: accent,
          borderRadius: 20, padding: '2px 9px',
          fontSize: 9, fontWeight: 800, letterSpacing: 0.7,
          textTransform: 'uppercase',
        }}>
          {ch.category || 'General'}
        </span>
      </div>
    </div>
  )
}

function ChannelLogo({ ch, size }) {
  const [err, setErr] = useState(false)
  if (ch.logo_url && !err) {
    return (
      <img
        src={ch.logo_url} alt={ch.name}
        style={{
          width: size, height: size, objectFit: 'contain',
          filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))',
          position: 'relative', zIndex: 1,
        }}
        onError={() => setErr(true)}
      />
    )
  }
  return (
    <div style={{
      width: size, height: size,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.52,
      filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))',
      position: 'relative', zIndex: 1,
    }}>
      {ch.emoji || '📺'}
    </div>
  )
}

function Skeletons() {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))',
      gap: 16,
    }}>
      {[...Array(16)].map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 190, borderRadius: 12 }} />
      ))}
    </div>
  )
}
