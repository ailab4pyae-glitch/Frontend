'use client'
import { useRouter, usePathname } from 'next/navigation'

const NAV = [
  {
    key: 'live', label: 'Live', href: '/',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? '#00FF87' : 'rgba(255,255,255,0.45)'}>
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
      </svg>
    ),
  },
  {
    key: 'tv', label: 'TV', href: '/tv',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? '#00FF87' : 'rgba(255,255,255,0.45)'}>
        <path d="M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 1.99-.9 1.99-2L23 5c0-1.1-.9-2-2-2zm0 14H3V5h18v12z"/>
      </svg>
    ),
  },
  {
    key: 'highlights', label: 'Highlights', href: '#',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? '#00FF87' : 'rgba(255,255,255,0.45)'}>
        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
      </svg>
    ),
  },
  {
    key: 'settings', label: 'Settings', href: '#',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? '#00FF87' : 'rgba(255,255,255,0.45)'}>
        <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
      </svg>
    ),
  },
]

export default function BottomNav() {
  const pathname = usePathname()
  const router   = useRouter()

  const activeKey = pathname === '/' ? 'live' : pathname === '/tv' ? 'tv' : ''

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200,
      background: '#0D1220',
      borderTop: '1px solid rgba(255,255,255,0.07)',
      display: 'flex', height: 64,
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {NAV.map(({ key, label, href, icon }) => {
        const active = activeKey === key
        return (
          <button
            key={key}
            onClick={() => href !== '#' && router.push(href)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 3,
              background: 'none', border: 'none', cursor: 'pointer',
              opacity: href === '#' ? 0.4 : 1,
            }}
          >
            {icon(active)}
            <span style={{
              fontSize: 10, fontWeight: 600,
              color: active ? '#00FF87' : 'rgba(255,255,255,0.4)',
              letterSpacing: .3,
            }}>
              {label}
            </span>
            {active && (
              <div style={{
                position: 'absolute', bottom: 0,
                width: 4, height: 4, borderRadius: '50%', background: '#00FF87',
              }} />
            )}
          </button>
        )
      })}
    </nav>
  )
}
