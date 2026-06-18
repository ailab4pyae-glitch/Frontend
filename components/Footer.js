export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer style={{
      marginTop: 40,
      background: 'linear-gradient(180deg, #0d0b22 0%, #0a0820 100%)',
      borderTop: '1px solid rgba(99,102,241,0.2)',
      padding: '28px 20px 40px',
      textAlign: 'center',
    }}>
      {/* Logo row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 22 }}>⚽</span>
        <span style={{ fontSize: 18, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>
          Ballone
        </span>
        <span style={{
          fontSize: 18, fontWeight: 900, letterSpacing: '-0.5px',
          background: 'linear-gradient(90deg, #6366f1, #a855f7)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          TV
        </span>
        <span style={{
          fontSize: 10, fontWeight: 800, color: '#6366f1',
          background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.35)',
          borderRadius: 4, padding: '1px 6px', letterSpacing: 0.5,
        }}>
          FREE HD
        </span>
      </div>

      {/* Tagline */}
      <p style={{ margin: '0 0 6px', fontSize: 13, color: 'rgba(255,255,255,0.55)', fontWeight: 600 }}>
        Ballonelive&nbsp;|&nbsp;Free HD Streams&nbsp;|&nbsp;No Login Required
      </p>

      {/* Domain */}
      <p style={{ margin: '0 0 14px', fontSize: 12, color: '#6366f1', fontWeight: 700, letterSpacing: 0.4 }}>
        ballonelive.com
      </p>

      {/* Divider */}
      <div style={{
        width: 60, height: 1, margin: '0 auto 14px',
        background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.5), transparent)',
      }} />

      {/* Copyright */}
      <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.25)', fontWeight: 500 }}>
        © {year} BalloneTV. All rights reserved.
      </p>
    </footer>
  )
}
