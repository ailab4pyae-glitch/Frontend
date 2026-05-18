'use client'
import { useEffect, useState } from 'react'
import { useConfig } from '@/lib/config'

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3050'

const BENEFITS = [
  { icon: '🚫', text: 'Zero ads' },
  { icon: '📺', text: 'HD streams' },
  { icon: '⚽', text: 'All matches' },
  { icon: '📱', text: 'Any device' },
  { icon: '⚡', text: 'Activated in 1hr' },
  { icon: '🔒', text: 'Safe & private' },
]

const COLORS = [
  { accent: '#60a5fa', bg: 'rgba(96,165,250,0.08)',  border: 'rgba(96,165,250,0.25)' },
  { accent: '#00FF87', bg: 'rgba(0,255,135,0.08)',   border: 'rgba(0,255,135,0.25)'  },
  { accent: '#f59e0b', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.25)' },
]

const fmt = (n) => Number(n).toLocaleString()

export default function SubscribeModal({ onClose }) {
  const { ui } = useConfig()
  const [plans,        setPlans]        = useState([])
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [loading,      setLoading]      = useState(true)

  useEffect(() => {
    fetch(`${BASE}/api/subscription/plans`)
      .then((r) => r.json())
      .then((d) => {
        setPlans(d)
        setSelectedPlan(d[Math.floor(d.length / 2)]?.id ?? d[0]?.id ?? null)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const fn = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [onClose])

  const botUrl = ui?.telegramBotUrl || ''

  const handleSubscribe = () => {
    if (!botUrl) return
    onClose()
    window.open(botUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
    >
      <div style={{
        background: '#0D1220',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 16,
        width: '100%', maxWidth: 400,
        maxHeight: '88vh', overflowY: 'auto',
        position: 'relative',
      }}>

        {/* Close */}
        <button onClick={onClose} style={{
          position: 'absolute', top: 10, right: 10, zIndex: 1,
          background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: '50%',
          width: 28, height: 28, color: 'rgba(255,255,255,0.5)',
          cursor: 'pointer', fontSize: 16, lineHeight: 1,
        }}>×</button>

        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg,#0a1628,#0d1f3c)',
          borderRadius: '16px 16px 0 0',
          padding: '18px 20px 14px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 28 }}>⭐</span>
            <div>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: 17 }}>Go Premium</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2 }}>
                Watch every match · no ads · full HD
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: '14px 16px 18px' }}>

          {/* Benefits — compact chips */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14,
          }}>
            {BENEFITS.map(({ icon, text }) => (
              <span key={text} style={{
                display: 'flex', alignItems: 'center', gap: 4,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 20, padding: '4px 10px',
                fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: 600,
              }}>
                {icon} {text}
              </span>
            ))}
          </div>

          {/* Plans */}
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            Select a Plan
          </div>

          {loading ? (
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, textAlign: 'center', padding: '12px 0' }}>Loading…</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
              {plans.map((plan, i) => {
                const c        = COLORS[i % COLORS.length]
                const isActive = selectedPlan === plan.id
                const perDay   = Math.round(plan.price / plan.duration_days)
                const isBest   = plan.duration_days === Math.max(...plans.map((p) => p.duration_days))

                return (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    style={{
                      width: '100%', border: `1.5px solid ${isActive ? c.accent : 'rgba(255,255,255,0.08)'}`,
                      borderRadius: 10, background: isActive ? c.bg : 'rgba(255,255,255,0.02)',
                      padding: '10px 12px', cursor: 'pointer', textAlign: 'left',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      transition: 'all .15s', position: 'relative',
                    }}
                  >
                    {isBest && (
                      <span style={{
                        position: 'absolute', top: -7, right: 10,
                        background: c.accent, color: '#0a0e1a',
                        fontSize: 9, fontWeight: 800, borderRadius: 20, padding: '1px 7px',
                      }}>BEST</span>
                    )}
                    <div>
                      <div style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>{plan.name}</div>
                      <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, marginTop: 1 }}>
                        {plan.duration_days} days · ~{fmt(perDay)} {plan.currency}/day
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: c.accent, fontWeight: 800, fontSize: 16 }}>{fmt(plan.price)}</div>
                      <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>{plan.currency}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {/* CTA */}
          <button
            onClick={handleSubscribe}
            disabled={!botUrl}
            style={{
              width: '100%', border: 'none', borderRadius: 12, padding: '12px',
              background: botUrl ? 'linear-gradient(135deg,#00FF87,#00c96b)' : 'rgba(255,255,255,0.08)',
              color: botUrl ? '#0A0E1A' : 'rgba(255,255,255,0.3)',
              fontWeight: 800, fontSize: 14, cursor: botUrl ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
            Subscribe via Telegram
          </button>

          <div style={{ color: 'rgba(255,255,255,0.18)', fontSize: 10, textAlign: 'center', marginTop: 8 }}>
            KPay · WavePay · Bank Transfer · Activated within 1 hour
          </div>
        </div>
      </div>
    </div>
  )
}
