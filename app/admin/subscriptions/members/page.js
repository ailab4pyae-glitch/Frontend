'use client'
import { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/auth'

const STATUS_STYLE = {
  active:    { color: '#00FF87', bg: 'rgba(0,255,135,0.1)',  label: '✅ Active'    },
  expired:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', label: '⏰ Expired'   },
  cancelled: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',  label: '❌ Cancelled' },
  none:      { color: 'rgba(255,255,255,0.25)', bg: 'rgba(255,255,255,0.04)', label: '⚪ No Sub' },
}

function getSubStatus(row) {
  if (!row.sub_status) return 'none'
  if (row.sub_status === 'active' && new Date(row.expires_at) < new Date()) return 'expired'
  return row.sub_status
}

const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'
const daysLeft = (iso) => {
  if (!iso) return null
  const d = Math.ceil((new Date(iso) - Date.now()) / 86400000)
  return d > 0 ? `${d}d left` : `${Math.abs(d)}d ago`
}

export default function MembersPage() {
  const [members,   setMembers]   = useState([])
  const [filter,    setFilter]    = useState('all')
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState('')
  const [modal,     setModal]     = useState(null) // { userId, mode: 'activate'|'cancel' }
  const [plans,     setPlans]     = useState([])
  const [selPlan,   setSelPlan]   = useState('')
  const [days,      setDays]      = useState('')
  const [saving,    setSaving]    = useState(false)

  const load = () => {
    setLoading(true)
    adminFetch('/api/admin/subscription/members')
      .then(setMembers).catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    adminFetch('/api/admin/subscription/plans').then(setPlans).catch(() => {})
  }, [])

  const visible = members.filter((m) => {
    const st = getSubStatus(m)
    if (filter === 'all')    return true
    if (filter === 'active') return st === 'active'
    if (filter === 'none')   return st === 'none' || st === 'expired'
    return true
  })

  const activate = async () => {
    if (!selPlan && !days) return
    setSaving(true)
    try {
      await adminFetch(`/api/admin/subscription/members/${modal.userId}/activate`, {
        method: 'POST', body: JSON.stringify({ plan_id: selPlan || null, days: days ? Number(days) : null }),
      })
      setModal(null); load()
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  const cancel = async (userId) => {
    if (!confirm('Cancel this subscription?')) return
    await adminFetch(`/api/admin/subscription/members/${userId}/cancel`, { method: 'PUT' }).catch((e) => setError(e.message))
    load()
  }

  const FILTERS = [
    { id: 'all',    label: 'All' },
    { id: 'active', label: '✅ Active' },
    { id: 'none',   label: '⚪ No Sub / Expired' },
  ]

  return (
    <div style={{ maxWidth: 780 }}>
      <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: '0 0 20px' }}>Members</h2>

      {error && <div style={{ background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.3)', borderRadius: 8, padding: '10px 14px', color: '#ff6b6b', marginBottom: 16, fontSize: 13 }}>{error}</div>}

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {FILTERS.map(({ id, label }) => (
          <button key={id} onClick={() => setFilter(id)} style={{
            padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700,
            background: filter === id ? 'rgba(0,255,135,0.15)' : 'rgba(255,255,255,0.06)',
            color: filter === id ? '#00FF87' : 'rgba(255,255,255,0.45)',
          }}>{label}</button>
        ))}
        <span style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.25)', fontSize: 12, alignSelf: 'center' }}>
          {visible.length} user{visible.length !== 1 ? 's' : ''}
        </span>
      </div>

      {loading ? (
        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>Loading…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {visible.map((m) => {
            const st    = getSubStatus(m)
            const style = STATUS_STYLE[st] || STATUS_STYLE.none
            return (
              <div key={m.id} style={{
                background: '#141824', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 12, padding: '12px 16px',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                {/* Avatar */}
                <div style={{
                  width: 38, height: 38, borderRadius: '50%',
                  background: 'rgba(0,255,135,0.1)', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, fontWeight: 700, color: '#00FF87',
                }}>
                  {(m.full_name || m.username || '?')[0].toUpperCase()}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>
                      {m.full_name || m.username || `User ${m.telegram_id}`}
                    </span>
                    {m.username && <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>@{m.username}</span>}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 2 }}>
                    TG: {m.telegram_id} · Joined {fmtDate(m.created_at)}
                  </div>
                  {m.expires_at && (
                    <div style={{ fontSize: 11, marginTop: 2, color: st === 'active' ? '#00FF87' : '#f59e0b' }}>
                      {m.plan_name} · Expires {fmtDate(m.expires_at)} ({daysLeft(m.expires_at)})
                    </div>
                  )}
                </div>

                {/* Status badge */}
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: style.bg, color: style.color, flexShrink: 0 }}>
                  {style.label}
                </span>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button onClick={() => { setModal({ userId: m.id }); setSelPlan(''); setDays('') }} style={{
                    padding: '5px 10px', borderRadius: 7, border: '1px solid rgba(0,255,135,0.3)',
                    background: 'rgba(0,255,135,0.08)', color: '#00FF87', cursor: 'pointer', fontSize: 12, fontWeight: 700,
                  }}>
                    {st === 'active' ? '＋ Extend' : 'Activate'}
                  </button>
                  {st === 'active' && (
                    <button onClick={() => cancel(m.id)} style={{
                      padding: '5px 10px', borderRadius: 7, border: '1px solid rgba(255,68,68,0.2)',
                      background: 'rgba(255,68,68,0.06)', color: '#ff6b6b', cursor: 'pointer', fontSize: 12,
                    }}>Cancel</button>
                  )}
                </div>
              </div>
            )
          })}

          {!visible.length && (
            <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13, textAlign: 'center', padding: '32px 0' }}>No members found</div>
          )}
        </div>
      )}

      {/* Activate modal */}
      {modal && (
        <div onClick={(e) => e.target === e.currentTarget && setModal(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        }}>
          <div style={{ background: '#141824', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '22px 22px', width: '100%', maxWidth: 360 }}>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Activate / Extend Subscription</div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700, display: 'block', marginBottom: 5 }}>Select Plan</label>
              <select value={selPlan} onChange={(e) => setSelPlan(e.target.value)}
                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '8px 12px', color: '#fff', fontSize: 13, outline: 'none' }}>
                <option value="">— choose plan —</option>
                {plans.filter((p) => p.is_active).map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.duration_days}d)</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700, display: 'block', marginBottom: 5 }}>Or Custom Days</label>
              <input type="number" min="1" placeholder="e.g. 7" value={days}
                onChange={(e) => setDays(e.target.value)}
                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '8px 12px', color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={activate} disabled={saving || (!selPlan && !days)} style={{
                flex: 1, padding: '10px', borderRadius: 9, border: 'none', fontWeight: 700, fontSize: 13,
                background: '#00FF87', color: '#0a0e1a', cursor: 'pointer',
              }}>{saving ? 'Saving…' : 'Activate'}</button>
              <button onClick={() => setModal(null)} style={{
                padding: '10px 16px', borderRadius: 9, border: '1px solid rgba(255,255,255,0.12)', background: 'none',
                color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontWeight: 700, fontSize: 13,
              }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
