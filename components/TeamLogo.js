'use client'
import { useState } from 'react'

export default function TeamLogo({ src, name, size = 48 }) {
  const [err, setErr] = useState(false)
  if (!err && src) {
    return (
      <img
        src={src} alt={name}
        onError={() => setErr(true)}
        style={{ width: size, height: size, objectFit: 'contain', borderRadius: 6 }}
      />
    )
  }
  const initials = (name || '?').slice(0, 2).toUpperCase()
  return (
    <div style={{
      width: size, height: size, borderRadius: 8,
      background: 'rgba(0,255,135,0.1)',
      border: '1px solid rgba(0,255,135,0.2)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.28, fontWeight: 700, color: '#00FF87',
    }}>
      {initials}
    </div>
  )
}
