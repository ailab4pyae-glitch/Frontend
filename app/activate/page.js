'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { saveToken, getToken, checkToken } from '@/lib/useAuth'
import { Suspense } from 'react'

// Re-export checkToken for internal use
async function verify(token) {
  const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3050'
  const res  = await fetch(`${BASE}/api/auth/check?token=${token}`)
  return res.json()
}

function ActivateContent() {
  const router     = useRouter()
  const params     = useSearchParams()
  const [state, setState] = useState('checking') // checking | success | invalid | already

  useEffect(() => {
    const token = params.get('activate') || params.get('token')
    if (!token) { router.replace('/'); return }

    verify(token).then((data) => {
      if (data.is_premium || data.expired) {
        saveToken(token)
        setState(data.is_premium ? 'success' : 'expired')
      } else if (data.reason === 'invalid_token') {
        setState('invalid')
      } else {
        // Token exists but no active sub — still save it so expiry UI shows
        saveToken(token)
        setState('expired')
      }
    }).catch(() => setState('invalid'))
  }, [])

  const go = () => router.replace('/')

  const STATES = {
    checking: {
      icon: '⏳', color: '#60a5fa',
      title: 'Activating…',
      desc: 'Please wait a moment.',
      btn: null,
    },
    success: {
      icon: '✅', color: '#00FF87',
      title: 'Premium Activated!',
      desc: 'Your device is now registered. No ads, HD streams, all matches.',
      btn: '▶ Watch Now',
    },
    expired: {
      icon: '⏰', color: '#f59e0b',
      title: 'Subscription Expired',
      desc: 'Your premium has expired. Subscribe again via Telegram to reactivate.',
      btn: 'Go to Home',
    },
    invalid: {
      icon: '❌', color: '#ef4444',
      title: 'Link Invalid',
      desc: 'This activation link is not valid. Check with support if you think this is a mistake.',
      btn: 'Go to Home',
    },
  }

  const s = STATES[state] || STATES.checking

  return (
    <div style={{
      minHeight: '100vh', background: '#0A0E1A',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{
        background: '#141824', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 20, padding: '36px 28px', maxWidth: 380, width: '100%', textAlign: 'center',
      }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>{s.icon}</div>
        <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 800, margin: '0 0 10px' }}>{s.title}</h1>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, lineHeight: 1.6, margin: '0 0 24px' }}>{s.desc}</p>
        {s.btn && (
          <button
            onClick={go}
            style={{
              background: s.color === '#00FF87' ? 'linear-gradient(135deg,#00FF87,#00c96b)' : 'rgba(255,255,255,0.08)',
              color: s.color === '#00FF87' ? '#0a0e1a' : s.color,
              border: 'none', borderRadius: 12, padding: '12px 28px',
              fontWeight: 800, fontSize: 15, cursor: 'pointer', width: '100%',
            }}
          >{s.btn}</button>
        )}
      </div>
    </div>
  )
}

export default function ActivatePage() {
  return <Suspense><ActivateContent /></Suspense>
}
