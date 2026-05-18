'use client'

const getFormat = (url = '') => url.includes('.m3u8') ? 'HLS' : url.includes('.flv') ? 'FLV' : null

// ── Design tokens ─────────────────────────────────────────────────────────────
const THEME = {
  HD: {
    accent:         '#e879f9',
    glow:           'rgba(232,121,249,0.35)',
    bgInactive:     'rgba(232,121,249,0.10)',
    bgActive:       'linear-gradient(135deg, rgba(232,121,249,0.28) 0%, rgba(232,121,249,0.10) 100%)',
    borderInactive: 'rgba(232,121,249,0.30)',
    badge:          'rgba(232,121,249,0.25)',
    label:          'HD',
  },
  SD: {
    accent:         '#a78bfa',
    glow:           'rgba(167,139,250,0.35)',
    bgInactive:     'rgba(167,139,250,0.10)',
    bgActive:       'linear-gradient(135deg, rgba(167,139,250,0.28) 0%, rgba(167,139,250,0.10) 100%)',
    borderInactive: 'rgba(167,139,250,0.30)',
    badge:          'rgba(167,139,250,0.25)',
    label:          'SD',
  },
}

// ── Single stream button ───────────────────────────────────────────────────────
function StreamButton({ server, index, isActive, onSelect }) {
  const fmt     = getFormat(server.url)
  const quality = server.quality  // 'HD' | 'SD'
  const t       = quality === 'HD' ? THEME.HD : THEME.SD
  const num     = index + 1

  return (
    <button
      onClick={() => onSelect(server.url)}
      style={{
        position:   'relative',
        background: isActive ? t.bgActive : t.bgInactive,
        border:     `1.5px solid ${isActive ? t.accent : t.borderInactive}`,
        borderRadius: 10,
        padding:    '8px 10px',
        cursor:     'pointer',
        overflow:   'hidden',
        boxShadow:  isActive ? `0 0 20px ${t.glow}` : 'none',
        display:    'flex', alignItems: 'center', gap: 7,
        width:      '100%',
      }}
    >
      {/* Active left bar */}
      {isActive && (
        <span style={{
          position: 'absolute', top: 0, left: 0, bottom: 0, width: 3,
          background: t.accent, borderRadius: '10px 0 0 10px',
        }} />
      )}

      {/* Quality badge */}
      <span style={{
        fontSize: 10, fontWeight: 900, padding: '2px 7px', borderRadius: 5,
        background: t.badge, color: t.accent, letterSpacing: 0.6, flexShrink: 0,
      }}>
        {quality}
      </span>

      {/* Server number */}
      <span style={{
        fontSize: 13, fontWeight: 800,
        color: isActive ? '#fff' : t.accent,
        flex: 1, opacity: isActive ? 1 : 0.85,
      }}>
        Stream {num}
      </span>

      {/* Format pill */}
      {fmt && (
        <span style={{
          fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4,
          background: fmt === 'HLS' ? 'rgba(255,255,255,0.07)' : 'rgba(251,191,36,0.1)',
          color:      fmt === 'HLS' ? 'rgba(255,255,255,0.4)'  : '#fbbf24',
          border:     `1px solid ${fmt === 'HLS' ? 'rgba(255,255,255,0.1)' : 'rgba(251,191,36,0.25)'}`,
          flexShrink: 0,
        }}>
          {fmt}
        </span>
      )}

      {/* Playing dot or signal bars */}
      {isActive ? (
        <span style={{
          width: 7, height: 7, borderRadius: '50%',
          background: t.accent, flexShrink: 0,
          animation: 'srvDot 1.3s ease-in-out infinite',
        }} />
      ) : (
        <svg width="14" height="11" viewBox="0 0 16 12" fill="none" style={{ flexShrink: 0 }}>
          <rect x="0"    y="6" width="3"   height="6"  rx="1" fill={t.accent} opacity="0.3"/>
          <rect x="4.5"  y="4" width="3"   height="8"  rx="1" fill={t.accent} opacity="0.45"/>
          <rect x="9"    y="2" width="3"   height="10" rx="1" fill={t.accent} opacity="0.65"/>
          <rect x="13.5" y="0" width="2.5" height="12" rx="1" fill={t.accent} opacity="0.85"/>
        </svg>
      )}
    </button>
  )
}

// ── Section header ────────────────────────────────────────────────────────────
function Section({ qualityKey, servers, activeUrl, onSelect }) {
  if (!servers.length) return null
  const t = THEME[qualityKey] || THEME.SD

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
        <span style={{
          width: 8, height: 8, borderRadius: '50%',
          background: t.accent, flexShrink: 0,
          boxShadow: `0 0 6px ${t.accent}`,
        }} />
        <span style={{
          fontSize: 11, fontWeight: 800,
          color: t.accent,
          letterSpacing: 1.2, textTransform: 'uppercase',
        }}>
          {t.label} Quality
        </span>
        <span style={{ fontSize: 10, color: t.accent, fontWeight: 700, opacity: 0.6 }}>
          {servers.length} {servers.length === 1 ? 'stream' : 'streams'}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
        {servers.map((s, i) => (
          <StreamButton
            key={s.id || i}
            server={s}
            index={i}
            isActive={s.url === activeUrl}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  )
}

// ── Empty state ────────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 18, padding: '32px 16px', textAlign: 'center',
    }}>
      <div style={{ fontSize: 36, marginBottom: 10 }}>📡</div>
      <p style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.5)', margin: '0 0 6px' }}>
        Streams loading…
      </p>
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', margin: 0, lineHeight: 1.6 }}>
        Streams appear at kickoff.<br/>Check back in a moment.
      </p>
    </div>
  )
}

// ── Root component ─────────────────────────────────────────────────────────────
export default function ServerSelector({ streams, activeUrl, onSelect }) {
  const rawSD = streams?.SD || []
  const rawHD = streams?.HD || []

  // Preserve quality from the API response — iframe URLs keep their SD/HD designation
  const hdStreams = rawHD.map((s) => ({ ...s, quality: 'HD' }))
  const sdStreams = rawSD.map((s) => ({ ...s, quality: 'SD' }))

  const total = hdStreams.length + sdStreams.length
  if (total === 0) return <EmptyState />

  return (
    <div>
      <style>{`
        @keyframes srvDot {
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:.25; transform:scale(.55); }
        }
      `}</style>

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 14,
      }}>
        <span style={{
          fontSize: 13, fontWeight: 800,
          color: 'rgba(255,255,255,0.55)',
          letterSpacing: 0.8, textTransform: 'uppercase',
        }}>
          Select Stream
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa' }}>
          {total} available
        </span>
      </div>

      {/* HD first — best quality on top */}
      <Section qualityKey="HD" servers={hdStreams} activeUrl={activeUrl} onSelect={onSelect} />
      <Section qualityKey="SD" servers={sdStreams} activeUrl={activeUrl} onSelect={onSelect} />
    </div>
  )
}
