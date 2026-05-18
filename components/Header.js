'use client'
import { useState } from 'react'
import { useConfig } from '@/lib/config'
import { useAuth } from '@/lib/useAuth'
import SubscribeModal from './SubscribeModal'

const fmtDate = (iso) => iso
  ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  : ''

export default function Header() {
  const [searchOpen,   setSearchOpen]   = useState(false)
  const [query,        setQuery]        = useState('')
  const [showModal,    setShowModal]    = useState(false)
  const { ui }              = useConfig()
  const { auth }            = useAuth()
  const isPremium           = auth?.is_premium === true
  const isExpired           = auth?.expired === true

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

      {/* Right actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

        {/* Join Telegram channel */}
        {ui?.telegramUrl && (
          <a
            href={ui.telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'rgba(0,136,204,0.12)',
              border: '1px solid rgba(0,136,204,0.25)',
              borderRadius: 20, padding: '5px 12px',
              color: '#29b6f6', textDecoration: 'none',
              fontSize: 12, fontWeight: 700,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
            {ui.telegramLabel || 'Telegram'}
          </a>
        )}

        {/* Premium badge */}
        {isPremium && (
          <span style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: 'rgba(0,255,135,0.1)', border: '1px solid rgba(0,255,135,0.25)',
            borderRadius: 20, padding: '5px 12px',
            color: '#00FF87', fontSize: 12, fontWeight: 700,
          }}>
            👑 Premium · {fmtDate(auth?.expires_at)}
          </span>
        )}

        {/* Expired — show renew nudge */}
        {isExpired && !isPremium && (
          <button onClick={() => setShowModal(true)} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
            borderRadius: 20, padding: '5px 12px',
            color: '#f59e0b', fontSize: 12, fontWeight: 700, cursor: 'pointer',
          }}>
            ⏰ Expired · Renew
          </button>
        )}

        {/* Subscribe button — only for non-premium users */}
        {!isPremium && !isExpired && ui?.telegramBotUrl && (
          <button
            onClick={() => setShowModal(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'linear-gradient(135deg, #00FF87, #00c96b)',
              border: 'none', borderRadius: 20, padding: '6px 14px',
              color: '#0A0E1A', fontSize: 12, fontWeight: 800, cursor: 'pointer',
            }}
          >
            ⭐ Subscribe
          </button>
        )}

        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
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
                color: '#fff', fontSize: 14, width: 160, outline: 'none',
              }}
            />
          )}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            style={{ background: 'none', border: 'none', padding: 6, color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}
          >
            {searchOpen
              ? <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.4L17.6 5 12 10.6 6.4 5 5 6.4l5.6 5.6L5 17.6 6.4 19l5.6-5.6 5.6 5.6 1.4-1.4-5.6-5.6z"/></svg>
              : <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14"/></svg>
            }
          </button>
        </div>

      </div>{/* /Right actions */}

      {/* Subscribe modal */}
      {showModal && <SubscribeModal onClose={() => setShowModal(false)} />}

    </header>
  )
}
