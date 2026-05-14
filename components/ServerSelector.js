'use client'

const getFormat = (url = '') => url.includes('.m3u8') ? 'HLS' : url.includes('.flv') ? 'FLV' : 'STREAM'

export default function ServerSelector({ streams = { SD: [], HD: [] }, activeUrl, onSelect }) {
  // SD first — matches allUrls order in WatchPage (default plays SD for low-bandwidth users)
  const allServers = [
    ...streams.SD.map((s, i) => ({ ...s, quality: 'SD', format: getFormat(s.url), index: i })),
    ...streams.HD.map((s, i) => ({ ...s, quality: 'HD', format: getFormat(s.url), index: i })),
  ]

  if (allServers.length === 0) {
    return (
      <div style={{
        background: '#141824', borderRadius: 14,
        border: '1px solid rgba(255,255,255,0.06)',
        padding: '20px 16px', textAlign: 'center',
      }}>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>No servers available yet</p>
      </div>
    )
  }

  return (
    <div>
      <p style={{
        fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)',
        letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10,
      }}>
        Select Server
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
        {allServers.map((server, idx) => {
          const active   = server.url === activeUrl
          const isHD     = server.quality === 'HD'
          const isHLS    = server.format === 'HLS'
          const isFirst  = idx === 0
          const color    = isHD ? '#00FF87' : '#60a5fa'

          return (
            <button
              key={idx}
              onClick={() => onSelect(server.url)}
              style={{
                background: active ? (isHD ? 'rgba(0,255,135,0.08)' : 'rgba(96,165,250,0.08)') : '#141824',
                border: `1.5px solid ${active ? color : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 10, padding: '12px 14px',
                display: 'flex', flexDirection: 'column', gap: 5,
                textAlign: 'left', cursor: 'pointer', transition: 'all .15s',
              }}
            >
              {/* Quality + format row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 5,
                    background: isHD ? 'rgba(0,255,135,0.12)' : 'rgba(96,165,250,0.12)',
                    color,
                  }}>
                    {server.quality}
                  </span>
                  <span style={{
                    fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4,
                    background: isHLS ? 'rgba(255,255,255,0.07)' : 'rgba(255,165,0,0.1)',
                    color: isHLS ? 'rgba(255,255,255,0.5)' : '#f59e0b',
                    border: `1px solid ${isHLS ? 'rgba(255,255,255,0.1)' : 'rgba(245,158,11,0.2)'}`,
                  }}>
                    {server.format}
                  </span>
                </div>
                {active && (
                  <span style={{ fontSize: 11, color }}>▶</span>
                )}
              </div>

              {/* Label row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{
                  fontSize: 12, fontWeight: 600,
                  color: active ? '#fff' : 'rgba(255,255,255,0.55)',
                }}>
                  {isHLS ? 'Smooth' : 'Backup'} {server.index + 1}
                </span>
                {isFirst && !active && (
                  <span style={{
                    fontSize: 9, fontWeight: 700, letterSpacing: 0.4,
                    color: '#60a5fa', background: 'rgba(96,165,250,0.1)',
                    border: '1px solid rgba(96,165,250,0.25)',
                    borderRadius: 4, padding: '1px 5px',
                  }}>
                    DEFAULT
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
