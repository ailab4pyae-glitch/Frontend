'use client'

export default function TabStrip({ tabs = [], activeTab, onTabChange }) {
  return (
    <>
      <style>{`
        @keyframes tabGlow { 0%,100%{opacity:.7} 50%{opacity:1} }
        .tab-pill { transition: all .18s ease !important; }
        .tab-pill:hover { opacity: 1 !important; transform: translateY(-1px); }
        ::-webkit-scrollbar { display: none; }
      `}</style>

      <div style={{
        position: 'sticky', top: 96, zIndex: 90,
        background: 'linear-gradient(180deg, var(--bg) 0%, transparent 100%)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        paddingBottom: 1,
      }}>
        <div style={{
          display: 'flex', gap: 7,
          overflowX: 'auto', padding: '10px 14px 11px',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}>
          {tabs.length === 0
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="skeleton"
                  style={{ width: 90, height: 34, borderRadius: 20, flexShrink: 0 }} />
              ))
            : tabs.map((tab) => {
                const active = tab.slug === activeTab
                const color  = tab.color || '#00e5ff'

                return (
                  <button
                    key={tab.slug}
                    className="tab-pill"
                    onClick={() => onTabChange(tab.slug)}
                    style={{
                      flexShrink: 0,
                      padding: '7px 15px',
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: 0.3,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      display: 'flex', alignItems: 'center', gap: 6,
                      ...(active ? {
                        background: `linear-gradient(135deg, ${color}30, ${color}18)`,
                        border: `1.5px solid ${color}70`,
                        color: color,
                        boxShadow: `0 0 14px ${color}30, inset 0 0 8px ${color}10`,
                        textShadow: `0 0 8px ${color}80`,
                      } : {
                        background: 'rgba(255,255,255,0.10)',
                        border: '1px solid rgba(255,255,255,0.22)',
                        color: 'rgba(255,255,255,0.80)',
                      }),
                    }}
                  >
                    {active && (
                      <span style={{
                        width: 5, height: 5, borderRadius: '50%',
                        background: color,
                        boxShadow: `0 0 6px ${color}`,
                        flexShrink: 0,
                        animation: 'tabGlow 2s ease-in-out infinite',
                      }} />
                    )}
                    <span style={{ fontSize: 13 }}>{tab.icon || '⚽'}</span>
                    {tab.name}
                  </button>
                )
              })
          }
        </div>
      </div>
    </>
  )
}
