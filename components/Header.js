'use client'
import { useState } from 'react'

export default function Header() {
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: '#0D1220',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      padding: '0 16px',
      height: 56,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background: 'linear-gradient(135deg, #00FF87, #00c96b)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#0A0E1A">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </div>
        <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.3px' }}>
          ThaeGyiKone<span style={{ color: '#00FF87' }}>ThuLay</span>
        </span>
      </div>

      {/* Search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {searchOpen && (
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search matches…"
            style={{
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 20, padding: '6px 14px',
              color: '#fff', fontSize: 14, width: 180, outline: 'none',
            }}
          />
        )}
        <button
          onClick={() => setSearchOpen(!searchOpen)}
          style={{ background: 'none', border: 'none', padding: 6, color: 'rgba(255,255,255,0.6)' }}
        >
          {searchOpen
            ? <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.4L17.6 5 12 10.6 6.4 5 5 6.4l5.6 5.6L5 17.6 6.4 19l5.6-5.6 5.6 5.6 1.4-1.4-5.6-5.6z"/></svg>
            : <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14"/></svg>
          }
        </button>
      </div>
    </header>
  )
}
