'use client'

export default function ServerSelector({ streams = { SD: [], HD: [] }, activeUrl, onSelect }) {
  const allServers = [
    ...streams.HD.map((s, i) => ({ ...s, label: `HD ${i + 1}`, quality: 'HD' })),
    ...streams.SD.map((s, i) => ({ ...s, label: `SD ${i + 1}`, quality: 'SD' })),
  ]

  if (allServers.length === 0) {
    return (
      <div style={{
        background: '#141824', borderRadius: 14,
        border: '1px solid rgba(255,255,255,0.06)',
        padding: '20px 16px', textAlign: 'center',
      }}>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
          No servers available yet
        </p>
      </div>
    )
  }

  return (
    <div>
      <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>
        Available Servers
      </p>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8,
      }}>
        {allServers.map((server, idx) => {
          const active  = server.url === activeUrl
          const isHD    = server.quality === 'HD'
          const chipColor = isHD ? '#00FF87' : '#60a5fa'

          return (
            <button
              key={idx}
              onClick={() => onSelect(server.url)}
              style={{
                background: active ? 'rgba(0,255,135,0.08)' : '#141824',
                border: `1.5px solid ${active ? '#00FF87' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 10, padding: '12px 14px',
                display: 'flex', flexDirection: 'column', gap: 4, textAlign: 'left',
                cursor: 'pointer', transition: 'all .15s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 5,
                  background: isHD ? 'rgba(0,255,135,0.12)' : 'rgba(96,165,250,0.12)',
                  color: chipColor,
                }}>
                  {server.quality}
                </span>
                {active && (
                  <span style={{ fontSize: 11, color: '#00FF87' }}>
                    ▶ Playing
                  </span>
                )}
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: active ? '#fff' : 'rgba(255,255,255,0.6)' }}>
                {server.label}
              </span>
              {server.source_name && (
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                  {server.source_name}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
