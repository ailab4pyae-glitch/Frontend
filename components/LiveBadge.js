import { isSoon, getTimeLabel } from '../lib/api'

export default function LiveBadge({ status, scheduledAt }) {
  if (status === 'live') {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        background: 'rgba(255,68,68,0.15)', border: '1px solid rgba(255,68,68,0.4)',
        color: '#ff4444', fontSize: 11, fontWeight: 800,
        padding: '3px 8px', borderRadius: 20, letterSpacing: '.5px',
        animation: 'liveBadgePulse 1.4s ease-in-out infinite',
      }}>
        <span className="live-dot" /> LIVE
      </span>
    )
  }

  if (status === 'finished') {
    return (
      <span style={{
        background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.4)',
        fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20,
      }}>
        FT
      </span>
    )
  }

  // Scheduled — only show badge if match is within 60 min (SOON)
  const soon  = isSoon(scheduledAt)
  const label = getTimeLabel(scheduledAt)

  if (soon) {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.35)',
        color: '#f59e0b', fontSize: 11, fontWeight: 700,
        padding: '3px 8px', borderRadius: 20, letterSpacing: '.3px',
      }}>
        ⏱ {label}
      </span>
    )
  }

  // Far-future scheduled — no badge (time is already shown in card centre)
  return null
}
