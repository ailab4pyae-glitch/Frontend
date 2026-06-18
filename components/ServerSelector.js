'use client'

const THEME = {
  HD: {
    accent:        '#7c3aed',
    activeBg:      '#6d28d9',
    activeText:    '#ffffff',
    inactiveBg:    '#ede9fe',
    inactiveBorder:'#c4b5fd',
    inactiveText:  '#4c1d95',
    badgeBg:       '#7c3aed',
    badgeText:     '#ffffff',
    dotColor:      '#7c3aed',
    sectionColor:  '#7c3aed',
    label:         'HD',
  },
  SD: {
    accent:        '#2563eb',
    activeBg:      '#1d4ed8',
    activeText:    '#ffffff',
    inactiveBg:    '#dbeafe',
    inactiveBorder:'#93c5fd',
    inactiveText:  '#1e3a8a',
    badgeBg:       '#2563eb',
    badgeText:     '#ffffff',
    dotColor:      '#2563eb',
    sectionColor:  '#2563eb',
    label:         'SD',
  },
}

function StreamButton({ server, lineNumber, isActive, onSelect }) {
  const t = server.quality === 'HD' ? THEME.HD : THEME.SD

  return (
    <button
      onClick={() => onSelect(server.url)}
      style={{
        position:   'relative',
        background: isActive
          ? `linear-gradient(135deg, ${t.activeBg} 0%, ${t.accent} 100%)`
          : t.inactiveBg,
        border:     `1.5px solid ${isActive ? t.accent : t.inactiveBorder}`,
        borderRadius: 10,
        padding:    '11px 12px',
        cursor:     'pointer',
        overflow:   'hidden',
        boxShadow:  isActive ? `0 6px 20px ${t.accent}55` : '0 1px 3px rgba(0,0,0,0.06)',
        display:    'flex', alignItems: 'center', gap: 8,
        width:      '100%',
        transition: 'all .15s',
      }}
    >
      {isActive && (
        <span style={{
          position: 'absolute', top: 0, left: 0, bottom: 0, width: 3,
          background: '#fff', opacity: 0.5, borderRadius: '10px 0 0 10px',
        }} />
      )}

      {/* Quality badge */}
      <span style={{
        fontSize: 10, fontWeight: 900, padding: '2px 7px', borderRadius: 5,
        background: isActive ? 'rgba(255,255,255,0.2)' : t.badgeBg,
        color:      isActive ? '#fff' : t.badgeText,
        letterSpacing: 0.6, flexShrink: 0,
      }}>
        {server.quality}
      </span>

      <span style={{
        fontSize: 13, fontWeight: 800,
        color: isActive ? '#fff' : t.inactiveText,
        flex: 1,
      }}>
        Line {lineNumber}
      </span>

      {isActive ? (
        <span style={{
          width: 7, height: 7, borderRadius: '50%',
          background: '#fff', flexShrink: 0,
          animation: 'srvDot 1.3s ease-in-out infinite',
        }} />
      ) : (
        <svg width="14" height="11" viewBox="0 0 16 12" fill="none" style={{ flexShrink: 0 }}>
          <rect x="0"    y="6" width="3"   height="6"  rx="1" fill={t.accent} opacity="0.25"/>
          <rect x="4.5"  y="4" width="3"   height="8"  rx="1" fill={t.accent} opacity="0.45"/>
          <rect x="9"    y="2" width="3"   height="10" rx="1" fill={t.accent} opacity="0.65"/>
          <rect x="13.5" y="0" width="2.5" height="12" rx="1" fill={t.accent} opacity="0.9"/>
        </svg>
      )}
    </button>
  )
}

function Section({ qualityKey, servers, activeUrl, onSelect, startLine }) {
  if (!servers.length) return null
  const t = THEME[qualityKey] || THEME.SD

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
        <span style={{
          width: 8, height: 8, borderRadius: '50%',
          background: t.dotColor, flexShrink: 0,
        }} />
        <span style={{ fontSize: 11, fontWeight: 800, color: t.sectionColor, letterSpacing: 1.2, textTransform: 'uppercase' }}>
          {t.label} Quality
        </span>
        <span style={{
          fontSize: 10, fontWeight: 800, color: '#16a34a',
          background: '#dcfce7', border: '1px solid #86efac',
          borderRadius: 6, padding: '1px 7px',
        }}>
          {servers.length} {servers.length === 1 ? 'line' : 'lines'}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
        {servers.map((s, i) => (
          <StreamButton
            key={s.id || i}
            server={s}
            lineNumber={startLine + i}
            isActive={s.url === activeUrl}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  )
}

function EmptyState({ onRefresh, isRefreshing }) {
  return (
    <div style={{
      background: '#f8f7ff',
      border: '1px solid #e0e7ff',
      borderRadius: 14, padding: '32px 16px', textAlign: 'center',
    }}>
      <div style={{ fontSize: 36, marginBottom: 10 }}>📡</div>
      <p style={{ fontSize: 15, fontWeight: 700, color: '#374151', margin: '0 0 6px' }}>
        Streams loading…
      </p>
      <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 14px', lineHeight: 1.6 }}>
        Streams appear at kickoff.<br/>Check back in a moment.
      </p>
      {onRefresh && (
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          style={{
            background: '#4f46e5', border: 'none',
            color: '#fff', borderRadius: 20, padding: '8px 22px',
            fontSize: 12, fontWeight: 700, cursor: isRefreshing ? 'default' : 'pointer',
            opacity: isRefreshing ? 0.6 : 1,
          }}
        >
          {isRefreshing ? 'Checking…' : '↻ Refresh'}
        </button>
      )}
    </div>
  )
}

export default function ServerSelector({ streams, activeUrl, onSelect, onRefresh, isRefreshing }) {
  const rawSD = streams?.SD || []
  const rawHD = streams?.HD || []
  const hdStreams = rawHD.map((s) => ({ ...s, quality: 'HD' }))
  const sdStreams = rawSD.map((s) => ({ ...s, quality: 'SD' }))
  const total = hdStreams.length + sdStreams.length

  if (total === 0) return <EmptyState onRefresh={onRefresh} isRefreshing={isRefreshing} />

  return (
    <div>
      <style>{`
        @keyframes srvDot {
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:.3; transform:scale(.55); }
        }
        @keyframes srvSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 16,
      }}>
        <span style={{ fontSize: 12, fontWeight: 900, color: '#111827', letterSpacing: 0.8, textTransform: 'uppercase' }}>
          🎯 Select Stream
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#6d28d9' }}>
            {total} available
          </span>
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              style={{
                background: '#ede9fe', border: '1px solid #c4b5fd',
                borderRadius: 8, padding: '5px 10px',
                color: '#5b21b6', cursor: isRefreshing ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 5,
                fontSize: 11, fontWeight: 700, opacity: isRefreshing ? 0.5 : 1,
              }}
            >
              <svg
                width="12" height="12" viewBox="0 0 24 24" fill="currentColor"
                style={isRefreshing ? { animation: 'srvSpin 0.8s linear infinite' } : {}}
              >
                <path d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
              </svg>
              {isRefreshing ? 'Loading…' : 'Refresh'}
            </button>
          )}
        </div>
      </div>

      <Section qualityKey="HD" servers={hdStreams} activeUrl={activeUrl} onSelect={onSelect} startLine={1} />
      <Section qualityKey="SD" servers={sdStreams} activeUrl={activeUrl} onSelect={onSelect} startLine={hdStreams.length + 1} />
    </div>
  )
}
