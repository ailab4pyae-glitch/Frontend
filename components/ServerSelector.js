'use client'

const getFormat    = (url = '') => url.includes('.m3u8') ? 'HLS' : url.includes('.flv') ? 'FLV' : 'STREAM'
const isIframeUrl  = (url = '') => !url.includes('.m3u8') && !url.includes('.flv')

export default function ServerSelector({ streams, activeUrl, onSelect }) {
  const SD = Array.isArray(streams?.SD) ? streams.SD : []
  const HD = Array.isArray(streams?.HD) ? streams.HD : []

  // SD first — lower bandwidth, better default for slow networks
  const allServers = [
    ...SD.map((s, i) => ({ ...s, quality: isIframeUrl(s.url) ? null : 'SD', format: getFormat(s.url), sdIdx: i })),
    ...HD.map((s, i) => ({ ...s, quality: isIframeUrl(s.url) ? null : 'HD', format: getFormat(s.url), hdIdx: i })),
  ]

  if (allServers.length === 0) {
    return (
      <div style={{
        background: '#0d1117', borderRadius: 14,
        border: '1px solid rgba(255,255,255,0.06)',
        padding: '22px 16px', textAlign: 'center',
      }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>📡</div>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', margin: 0 }}>No servers available yet</p>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', margin: '6px 0 0' }}>Stream will appear at kickoff</p>
      </div>
    )
  }

  return (
    <div>
      <style>{`
        @keyframes _pulse {
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:.35; transform:scale(.65); }
        }
        @keyframes _glow {
          0%,100% { box-shadow: 0 0 0 0 rgba(0,255,135,.18); }
          50%      { box-shadow: 0 0 0 5px rgba(0,255,135,.0); }
        }
        .srv-btn { transition: border-color .15s, background .15s, box-shadow .15s; }
        .srv-btn:hover { border-color: rgba(255,255,255,.18) !important; background: #161d2e !important; }
      `}</style>

      <p style={{
        fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)',
        letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10,
      }}>
        Select Server
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
        {allServers.map((server, idx) => {
          const active    = server.url === activeUrl
          const isHD      = server.quality === 'HD'
          const isHLS     = server.format === 'HLS'
          const noQuality = server.quality === null   // iframe — no HD/SD badge
          const accent    = isHD ? '#00FF87' : '#60a5fa'
          const qualIdx   = isHD ? server.hdIdx : server.sdIdx

          // Label logic: iframe → "Server N", HLS → "Smooth N", FLV → "Backup N"
          const label = noQuality
            ? `Server ${idx + 1}`
            : isHLS
            ? `Smooth ${qualIdx + 1}`
            : `Backup ${qualIdx + 1}`

          return (
            <button
              key={idx}
              className="srv-btn"
              onClick={() => onSelect(server.url)}
              style={{
                background: active
                  ? (isHD ? 'rgba(0,255,135,0.07)' : 'rgba(96,165,250,0.07)')
                  : '#0d1117',
                border: `1.5px solid ${active ? accent : 'rgba(255,255,255,0.07)'}`,
                borderRadius: 11,
                padding: '11px 12px',
                display: 'flex', flexDirection: 'column', gap: 7,
                textAlign: 'left', cursor: 'pointer',
                boxShadow: active
                  ? `0 0 14px ${isHD ? 'rgba(0,255,135,0.1)' : 'rgba(96,165,250,0.1)'}`
                  : 'none',
              }}
            >
              {/* ── Top row: quality/format badges + playing indicator ── */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 20 }}>

                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  {/* Pulse dot — visible only when active */}
                  {active && (
                    <span style={{
                      width: 7, height: 7, borderRadius: '50%',
                      background: accent, flexShrink: 0,
                      display: 'inline-block',
                      animation: '_pulse 1.5s ease-in-out infinite',
                    }} />
                  )}

                  {/* Quality badge: HD / SD — hidden for iframe servers */}
                  {!noQuality && (
                    <span style={{
                      fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 4,
                      background: isHD ? 'rgba(0,255,135,0.13)' : 'rgba(96,165,250,0.13)',
                      color: accent,
                      letterSpacing: 0.5,
                    }}>
                      {server.quality}
                    </span>
                  )}

                  {/* Format badge: HLS / FLV — hidden for iframe servers */}
                  {!noQuality && (
                    <span style={{
                      fontSize: 9, fontWeight: 600, padding: '2px 5px', borderRadius: 4,
                      background: isHLS ? 'rgba(255,255,255,0.06)' : 'rgba(255,165,0,0.09)',
                      color: isHLS ? 'rgba(255,255,255,0.4)' : '#f59e0b',
                      border: `1px solid ${isHLS ? 'rgba(255,255,255,0.08)' : 'rgba(245,158,11,0.18)'}`,
                    }}>
                      {server.format}
                    </span>
                  )}
                </div>

                {/* "Playing" text on active server */}
                {active && (
                  <span style={{
                    fontSize: 10, fontWeight: 700,
                    color: accent, letterSpacing: 0.3,
                  }}>
                    Playing
                  </span>
                )}
              </div>

              {/* ── Bottom row: server name + default tag ── */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{
                  fontSize: 13, fontWeight: 600,
                  color: active ? '#fff' : 'rgba(255,255,255,0.5)',
                }}>
                  {label}
                </span>

                {/* DEFAULT tag on first server when not playing */}
                {idx === 0 && !active && (
                  <span style={{
                    fontSize: 9, fontWeight: 700, letterSpacing: 0.5,
                    color: '#60a5fa',
                    background: 'rgba(96,165,250,0.08)',
                    border: '1px solid rgba(96,165,250,0.18)',
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
