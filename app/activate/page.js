'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { saveToken } from '@/lib/useAuth'
import { Suspense } from 'react'

const BOT_URL = process.env.NEXT_PUBLIC_BOT_URL || 'https://t.me/Rangoontv_bot'

async function verify(token) {
  const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3050'
  const res  = await fetch(`${BASE}/api/auth/check?token=${token}`)
  return res.json()
}

function ActivateContent() {
  const router  = useRouter()
  const params  = useSearchParams()
  const [state, setState] = useState('checking')

  useEffect(() => {
    const token = params.get('activate') || params.get('token')
    if (!token) { router.replace('/'); return }

    verify(token).then((data) => {
      if (data.is_premium || data.expired) {
        saveToken(token)
        const nextState = data.is_premium ? 'success' : 'expired'
        setState(nextState)
        if (data.is_premium) {
          setTimeout(() => router.replace('/'), 3000)
        }
      } else if (data.reason === 'invalid_token') {
        setState('invalid')
      } else {
        saveToken(token)
        setState('expired')
      }
    }).catch(() => setState('invalid'))
  }, [])

  const STATES = {
    checking: {
      icon: '⏳', color: '#60a5fa',
      title: 'စစ်ဆေးနေသည်…',
      desc: 'ခဏစောင့်ပါ။',
      btn: null,
      action: null,
    },
    success: {
      icon: '✅', color: '#00FF87',
      title: 'Premium အသက်ဝင်ပြီ!',
      desc: 'သင့် device တွင် premium ဝင်ပြီးပြီ။ ကြော်ငြာမရှိ၊ HD stream၊ match အားလုံးကြည့်နိုင်သည်။\n\nနောက် 3 စက္ကန့်အတွင်း အလိုအလျောက် ရောက်ရှိသွားမည်။',
      btn: '▶ ယခုကြည့်ရှုရန်',
      action: () => router.replace('/'),
    },
    expired: {
      icon: '⏰', color: '#f59e0b',
      title: 'Subscription သက်တမ်းကုန်ပြီ',
      desc: 'သင့် premium သက်တမ်းကုန်သွားပြီ။ ပြန်လည် subscribe လုပ်ရန် Telegram bot သို့ သွားပါ။',
      btn: '📲 Telegram Bot သို့',
      action: () => window.open(BOT_URL, '_blank'),
    },
    invalid: {
      icon: '❌', color: '#ef4444',
      title: 'Link မမှန်ကန်ပါ',
      desc: 'ဤ activation link သည် မမှန်ကန်ပါ။ ပြဿနာရှိပါက Telegram bot သို့ ဆက်သွယ်ပါ။',
      btn: '📲 Telegram Bot သို့',
      action: () => window.open(BOT_URL, '_blank'),
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
        <p style={{
          color: 'rgba(255,255,255,0.45)', fontSize: 14, lineHeight: 1.6, margin: '0 0 24px',
          whiteSpace: 'pre-line',
        }}>{s.desc}</p>
        {s.btn && (
          <button
            onClick={s.action}
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
