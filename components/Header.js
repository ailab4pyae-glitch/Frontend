'use client'
import { useState } from 'react'
import { useConfig } from '@/lib/config'
import { useAuth } from '@/lib/useAuth'
import SubscribeModal from './SubscribeModal'

const fmtDate = (iso) => iso
  ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  : ''

export default function Header() {
  const [showModal, setShowModal] = useState(false)
  const { ui }    = useConfig()
  const { auth }  = useAuth()
  const isPremium = auth?.is_premium === true
  const isExpired = auth?.expired    === true

  return (
    <>
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: '#FFD700',
        borderBottom: '3px solid #a855f7',
        padding: '0 12px',
        height: 52,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 8,
      }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#7c3aed">
            <path d="M8 5v14l11-7z"/>
          </svg>
          <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.3px', color: '#0D1220', whiteSpace: 'nowrap' }}>
            Rangon<span style={{ color: '#4c1d95' }}>TV</span>
          </span>
        </div>

        {/* Right actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>

          {/* Telegram — icon only on mobile, icon+text on desktop */}
          {ui?.telegramUrl && (
            <a
              href={ui.telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                background: 'rgba(124,58,237,0.15)',
                border: '1px solid rgba(124,58,237,0.4)',
                borderRadius: 20, padding: '5px 10px',
                color: '#4c1d95', textDecoration: 'none',
                fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
              <span className="hide-mobile">{ui.telegramLabel || 'Telegram'}</span>
            </a>
          )}

          {/* Premium badge */}
          {isPremium && (
            <span style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.4)',
              borderRadius: 20, padding: '5px 10px',
              color: '#4c1d95', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
            }}>
              👑 <span className="hide-mobile">Premium · {fmtDate(auth?.expires_at)}</span>
            </span>
          )}

          {/* Expired */}
          {isExpired && !isPremium && (
            <button onClick={() => setShowModal(true)} style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.4)',
              borderRadius: 20, padding: '5px 10px',
              color: '#4c1d95', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
            }}>
              ⏰ Renew
            </button>
          )}

          {/* Subscribe */}
          {!isPremium && !isExpired && ui?.telegramBotUrl && (
            <button onClick={() => setShowModal(true)} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
              border: '2px solid #FFD700', borderRadius: 20, padding: '6px 12px',
              color: '#FFD700', fontSize: 12, fontWeight: 800, cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(124,58,237,0.4), 0 0 0 1px rgba(255,215,0,0.2)',
              whiteSpace: 'nowrap',
            }}>
              ⭐ Subscribe
            </button>
          )}


        </div>

      </header>

      {showModal && <SubscribeModal onClose={() => setShowModal(false)} />}

      <style>{`
        @media (max-width: 480px) {
          .hide-mobile { display: none; }
        }
      `}</style>
    </>
  )
}
