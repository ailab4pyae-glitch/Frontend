export default function LiveBadge({ status, scheduledAt }) {
  if (status === 'live') {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        background: 'rgba(255,68,68,0.15)',
        border: '1px solid rgba(255,68,68,0.3)',
        color: '#ff4444', fontSize: 11, fontWeight: 700,
        padding: '3px 8px', borderRadius: 20, letterSpacing: '.5px',
      }}>
        <span className="live-dot" />
        LIVE
      </span>
    )
  }

  if (status === 'finished') {
    return (
      <span style={{
        background: 'rgba(255,255,255,0.07)',
        color: 'rgba(255,255,255,0.4)',
        fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20,
      }}>
        FT
      </span>
    )
  }

  // scheduled
  const time = scheduledAt
    ? new Date(scheduledAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    : ''

  return (
    <span style={{
      background: 'rgba(255,255,255,0.07)',
      color: 'rgba(255,255,255,0.55)',
      fontSize: 12, fontWeight: 600, padding: '3px 8px', borderRadius: 20,
    }}>
      {time}
    </span>
  )
}
