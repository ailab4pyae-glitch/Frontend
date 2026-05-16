'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { isAuthenticated, clearToken } from '@/lib/auth'

const NAV = [
  { label: 'Dashboard', href: '/admin',          icon: '📊' },
  { label: 'Matches',   href: '/admin/matches',  icon: '⚽' },
  { label: 'TV & Radio',href: '/admin/tv',       icon: '📺' },
  { label: 'Sources',   href: '/admin/sources',  icon: '🔌' },
  { label: 'Config',    href: '/admin/config',   icon: '⚙️'  },
  { label: 'Tests',     href: '/admin/tests',    icon: '🧪' },
]

export default function AdminLayout({ children }) {
  const router   = useRouter()
  const pathname = usePathname()
  const [ready, setReady] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!isAuthenticated()) { router.replace('/login'); return }
    setReady(true)
  }, [])

  const logout = () => { clearToken(); router.replace('/login') }

  if (!ready) return (
    <div style={{ minHeight: '100vh', background: '#0A0E1A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>Loading…</div>
    </div>
  )

  const SidebarContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Brand */}
      <div style={{ padding: '20px 20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg,#00FF87,#00c96b)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#0A0E1A">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
            </svg>
          </div>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>Admin Panel</div>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>StreamZone</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV.map(({ label, href, icon }) => {
          const active = pathname === href || (href !== '/admin' && pathname.startsWith(href))
          return (
            <a
              key={href}
              href={href}
              onClick={() => setSidebarOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 8,
                color:      active ? '#00FF87' : 'rgba(255,255,255,0.6)',
                background: active ? 'rgba(0,255,135,0.08)' : 'transparent',
                fontWeight: 600, fontSize: 14, textDecoration: 'none',
                transition: 'all .15s',
              }}
            >
              <span style={{ fontSize: 16 }}>{icon}</span>
              {label}
            </a>
          )
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding: '12px 10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <button
          onClick={logout}
          style={{
            width: '100%', padding: '10px 12px', borderRadius: 8, border: 'none',
            background: 'rgba(255,68,68,0.08)', color: '#ff6b6b',
            fontWeight: 600, fontSize: 14, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 10,
            transition: 'background .15s',
          }}
        >
          <span>🚪</span> Logout
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0A0E1A' }}>
      {/* Desktop sidebar */}
      <aside style={{
        width: 220, flexShrink: 0,
        background: '#0D1220',
        borderRight: '1px solid rgba(255,255,255,0.07)',
        display: 'none', // hidden on mobile, shown via media below
      }}
        className="admin-sidebar"
      >
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
            zIndex: 199, display: 'block',
          }}
        />
      )}

      {/* Mobile drawer */}
      <aside style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, width: 220,
        background: '#0D1220', zIndex: 200,
        transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform .25s ease',
        display: 'flex', flexDirection: 'column',
      }}>
        <SidebarContent />
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Mobile top bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)',
          background: '#0D1220',
        }}
          className="admin-topbar"
        >
          <button
            onClick={() => setSidebarOpen(true)}
            style={{ background: 'none', border: 'none', color: '#fff', padding: 4, cursor: 'pointer', fontSize: 20 }}
          >
            ☰
          </button>
          <span style={{ color: '#00FF87', fontWeight: 700, fontSize: 15 }}>
            {NAV.find(n => pathname === n.href || (n.href !== '/admin' && pathname.startsWith(n.href)))?.label || 'Admin'}
          </span>
        </div>

        <main style={{ flex: 1, padding: '24px 20px', overflowY: 'auto' }}>
          {children}
        </main>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .admin-sidebar { display: flex !important; flex-direction: column; }
          .admin-topbar  { display: none !important; }
        }
      `}</style>
    </div>
  )
}
