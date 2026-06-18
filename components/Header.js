'use client'
import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useConfig } from '@/lib/config'
import { useAuth } from '@/lib/useAuth'
import SubscribeModal from './SubscribeModal'

const fmtDate = (iso) => iso
  ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  : ''

const NAV_ITEMS = [
  { key: 'live', label: 'Sport',  emoji: '⚽', href: '/' },
  { key: 'tv',   label: 'TV',     emoji: '📺', href: '/tv' },
]

export default function Header() {
  const [showModal, setShowModal] = useState(false)
  const { ui }    = useConfig()
  const { auth }  = useAuth()
  const isPremium = auth?.is_premium === true
  const isExpired = auth?.expired    === true
  const pathname  = usePathname()
  const router    = useRouter()

  const activeKey = pathname === '/' ? 'live' : pathname.startsWith('/tv') ? 'tv' : ''

  return (
    <>
      <style>{`
        @keyframes headerGlow { 0%,100%{opacity:.6} 50%{opacity:1} }
        @keyframes navPulse { 0%,100%{box-shadow:0 0 6px currentColor} 50%{box-shadow:0 0 14px currentColor} }
        @keyframes logoShimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
        .nav-btn { transition: all .18s ease !important; }
        .nav-btn:hover { color: #00e5ff !important; background: rgba(0,229,255,0.07) !important; }
        .hdr-tg:hover { background: rgba(0,229,255,0.14) !important; border-color: rgba(0,229,255,0.5) !important; }
        @media (max-width: 480px) { .hide-mobile { display: none; } }
      `}</style>

      <div style={{ position: 'sticky', top: 0, zIndex: 100 }}>

        {/* ── Header bar ── */}
        <header style={{
          background: 'linear-gradient(135deg, #3730a3 0%, #312e81 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 3px 16px rgba(55,48,163,0.45)',
          padding: '0 14px',
          height: 54,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 10,
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Neon bottom accent */}
          <div style={{
            position: 'absolute', bottom: 0, left: '10%', right: '10%', height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(0,229,255,0.5) 40%, rgba(168,85,247,0.5) 60%, transparent)',
            animation: 'headerGlow 3s ease-in-out infinite',
          }} />

          {/* Logo */}
          <div
            onClick={() => router.push('/')}
            style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, cursor: 'pointer' }}
          >
            {/* Soccer ball icon with glow */}
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: 'linear-gradient(135deg, #0d1a2e 0%, #1a0d2e 100%)',
              border: '1px solid rgba(0,229,255,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 10px rgba(0,229,255,0.2), inset 0 0 8px rgba(0,229,255,0.05)',
              flexShrink: 0,
            }}>
              <span style={{ fontSize: 15 }}>⚽</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
              <span style={{
                fontWeight: 900, fontSize: 16, letterSpacing: '-0.5px', color: '#fff',
                textShadow: '0 0 12px rgba(255,255,255,0.3)',
              }}>
                Ballone
              </span>
              <span style={{
                fontWeight: 900, fontSize: 16, letterSpacing: '-0.5px',
                background: 'linear-gradient(90deg, #00e5ff, #a855f7, #00e5ff)',
                backgroundSize: '200% auto',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                animation: 'logoShimmer 4s linear infinite',
              }}>
                TV
              </span>
            </div>
          </div>

          {/* Right actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
            {ui?.telegramUrl && (
              <a
                href={ui.telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hdr-tg"
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  background: 'rgba(0,229,255,0.07)',
                  border: '1px solid rgba(0,229,255,0.25)',
                  borderRadius: 20, padding: '5px 11px',
                  color: '#00e5ff', textDecoration: 'none',
                  fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
                  transition: 'all .18s',
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
                <span className="hide-mobile">{ui.telegramLabel || 'Telegram'}</span>
              </a>
            )}

            {isPremium && (
              <span style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(0,229,255,0.08))',
                border: '1px solid rgba(168,85,247,0.4)',
                borderRadius: 20, padding: '5px 11px',
                color: '#c084fc', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
                boxShadow: '0 0 12px rgba(168,85,247,0.15)',
              }}>
                👑 <span className="hide-mobile">Premium · {fmtDate(auth?.expires_at)}</span>
              </span>
            )}

            {isExpired && !isPremium && (
              <button onClick={() => setShowModal(true)} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.35)',
                borderRadius: 20, padding: '5px 11px',
                color: '#f87171', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
              }}>
                ⏰ Renew
              </button>
            )}

            {!isPremium && !isExpired && ui?.telegramBotUrl && (
              <button onClick={() => setShowModal(true)} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'linear-gradient(135deg, #6d28d9 0%, #a855f7 100%)',
                border: '1px solid rgba(168,85,247,0.5)',
                borderRadius: 20, padding: '6px 13px',
                color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer',
                boxShadow: '0 0 16px rgba(168,85,247,0.35)',
                whiteSpace: 'nowrap', transition: 'all .18s',
              }}>
                ⭐ Subscribe
              </button>
            )}
          </div>
        </header>

        {/* ── Nav — segmented control ── */}
        <nav style={{
          background: '#1e1b4b',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', alignItems: 'center',
          padding: '8px 14px',
        }}>
          {/* Single segmented control container */}
          <div style={{
            display: 'inline-flex',
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 12,
            padding: 3,
            gap: 2,
          }}>
            {NAV_ITEMS.map(({ key, label, emoji, href }) => {
              const active = activeKey === key
              return (
                <button
                  key={key}
                  className="nav-btn"
                  onClick={() => router.push(href)}
                  style={{
                    background: active
                      ? 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)'
                      : 'transparent',
                    border: 'none',
                    borderRadius: 9,
                    color: active ? '#fff' : 'rgba(255,255,255,0.55)',
                    fontWeight: 800, fontSize: 13,
                    padding: '7px 20px',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 7,
                    whiteSpace: 'nowrap',
                    boxShadow: active ? '0 2px 10px rgba(79,70,229,0.5)' : 'none',
                    transition: 'all .18s',
                    letterSpacing: 0.3,
                  }}
                >
                  <span style={{ fontSize: 14 }}>{emoji}</span>
                  <span>{label}</span>
                  {active && key === 'live' && (
                    <span style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: '#4ade80',
                      boxShadow: '0 0 6px #4ade80',
                      flexShrink: 0,
                      animation: 'pulse 1.4s ease-in-out infinite',
                    }} />
                  )}
                </button>
              )
            })}
          </div>
        </nav>
      </div>

      {showModal && <SubscribeModal onClose={() => setShowModal(false)} />}
    </>
  )
}
