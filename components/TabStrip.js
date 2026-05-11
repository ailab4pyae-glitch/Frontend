'use client'

export default function TabStrip({ tabs = [], activeTab, onTabChange }) {
  return (
    <div style={{
      position: 'sticky', top: 56, zIndex: 90,
      background: '#0A0E1A',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
    }}>
      <div style={{
        display: 'flex', gap: 6,
        overflowX: 'auto', padding: '10px 14px',
        WebkitOverflowScrolling: 'touch',
      }}>
        {tabs.length === 0
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton"
                style={{ width: 90, height: 34, borderRadius: 20, flexShrink: 0 }} />
            ))
          : tabs.map((tab) => {
              const active     = tab.slug === activeTab
              const accentColor = tab.color || '#00FF87'
              return (
                <button
                  key={tab.slug}
                  onClick={() => onTabChange(tab.slug)}
                  style={{
                    flexShrink: 0,
                    padding: '7px 16px',
                    borderRadius: 20,
                    border: active ? 'none' : '1px solid rgba(255,255,255,0.08)',
                    fontSize: 13, fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all .2s',
                    background: active ? accentColor : 'rgba(255,255,255,0.05)',
                    color:      active ? '#0A0E1A'   : 'rgba(255,255,255,0.55)',
                  }}
                >
                  {tab.icon || '⚽'} {tab.name}
                </button>
              )
            })
        }
      </div>
    </div>
  )
}
