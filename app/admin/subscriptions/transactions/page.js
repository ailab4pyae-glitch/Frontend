'use client'
import { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/auth'

const STATUS = {
  pending:  { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: '⏳ Pending'  },
  approved: { color: '#00FF87', bg: 'rgba(0,255,135,0.1)',   label: '✅ Approved' },
  rejected: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   label: '❌ Rejected' },
}

const fmtDate = (iso) => iso ? new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'
const fmt     = (n)   => Number(n).toLocaleString()

export default function TransactionsPage() {
  const [txns,       setTxns]       = useState([])
  const [filter,     setFilter]     = useState('pending')
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')
  const [rejectModal, setRejectModal] = useState(null) // txn id
  const [reason,     setReason]     = useState('')
  const [acting,     setActing]     = useState({})

  const load = () => {
    setLoading(true)
    adminFetch(`/api/admin/subscription/transactions${filter !== 'all' ? `?status=${filter}` : ''}`)
      .then(setTxns).catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [filter])

  const approve = async (id) => {
    setActing((a) => ({ ...a, [id]: 'approving' }))
    setError('')
    try {
      await adminFetch(`/api/admin/subscription/transactions/${id}/approve`, { method: 'PUT' })
      load()
    } catch (e) { setError(e.message) }
    finally { setActing((a) => ({ ...a, [id]: null })) }
  }

  const reject = async () => {
    if (!rejectModal) return
    setActing((a) => ({ ...a, [rejectModal]: 'rejecting' }))
    setError('')
    try {
      await adminFetch(`/api/admin/subscription/transactions/${rejectModal}/reject`, {
        method: 'PUT', body: JSON.stringify({ reason }),
      })
      setRejectModal(null); setReason(''); load()
    } catch (e) { setError(e.message) }
    finally { setActing((a) => ({ ...a, [rejectModal]: null })) }
  }

  const FILTERS = [
    { id: 'pending',  label: '⏳ Pending'  },
    { id: 'approved', label: '✅ Approved' },
    { id: 'rejected', label: '❌ Rejected' },
    { id: 'all',      label: 'All'         },
  ]

  const pendingCount = txns.filter((t) => t.status === 'pending').length

  return (
    <div style={{ maxWidth: 780 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: 0 }}>Transactions</h2>
        {filter === 'pending' && pendingCount > 0 && (
          <span style={{ background: '#f59e0b', color: '#0a0e1a', borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 800 }}>
            {pendingCount} need review
          </span>
        )}
      </div>

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
      </div>

      {loading ? (
        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>Loading…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {txns.map((t) => {
            const st = STATUS[t.status] || STATUS.pending
            const isActing = acting[t.id]
            return (
              <div key={t.id} style={{
                background: '#141824', border: `1px solid ${t.status === 'pending' ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: 12, padding: '14px 16px',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>
                        {t.full_name || t.username || `User ${t.telegram_id}`}
                      </span>
                      {t.username && <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>@{t.username}</span>}
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: st.bg, color: st.color }}>
                        {st.label}
                      </span>
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 3 }}>
                      📦 {t.plan_name} · 💰 {fmt(t.amount)} {t.currency}
                      {t.payment_method ? ` · ${t.payment_method.toUpperCase()}` : ''}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11 }}>
                      TXN #{t.id} · Submitted {fmtDate(t.created_at)}
                      {t.verified_at ? ` · Verified ${fmtDate(t.verified_at)} by ${t.verified_by}` : ''}
                    </div>
                    {t.rejection_reason && (
                      <div style={{ color: '#ef4444', fontSize: 11, marginTop: 4 }}>Reason: {t.rejection_reason}</div>
                    )}
                  </div>

                  {/* Screenshot link */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end', flexShrink: 0 }}>
                    {t.screenshot_url && (
                      <a href={t.screenshot_url} target="_blank" rel="noopener noreferrer" style={{
                        padding: '4px 10px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.12)',
                        background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)',
                        fontSize: 11, textDecoration: 'none', fontWeight: 700,
                      }}>🖼 Screenshot</a>
                    )}

                    {/* Approve / Reject — only for pending */}
                    {t.status === 'pending' && (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => approve(t.id)}
                          disabled={!!isActing}
                          style={{
                            padding: '6px 12px', borderRadius: 8, border: 'none', fontWeight: 700, fontSize: 12,
                            background: '#00FF87', color: '#0a0e1a', cursor: 'pointer',
                          }}
                        >
                          {isActing === 'approving' ? '…' : '✅ Approve'}
                        </button>
                        <button
                          onClick={() => { setRejectModal(t.id); setReason('') }}
                          disabled={!!isActing}
                          style={{
                            padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(255,68,68,0.3)',
                            background: 'rgba(255,68,68,0.08)', color: '#ff6b6b', cursor: 'pointer', fontWeight: 700, fontSize: 12,
                          }}
                        >
                          {isActing === 'rejecting' ? '…' : '❌ Reject'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          {!txns.length && (
            <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13, textAlign: 'center', padding: '32px 0' }}>
              {filter === 'pending' ? '🎉 No pending transactions' : 'No transactions found'}
            </div>
          )}
        </div>
      )}

      {/* Reject reason modal */}
      {rejectModal && (
        <div onClick={(e) => e.target === e.currentTarget && setRejectModal(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        }}>
          <div style={{ background: '#141824', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '22px', width: '100%', maxWidth: 360 }}>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 15, marginBottom: 12 }}>❌ Reject Transaction</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 12 }}>
              Optionally add a reason — this will be shown to the user.
            </div>
            <textarea
              rows={3} value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Screenshot unclear, amount not visible"
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '8px 12px', color: '#fff', fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box', marginBottom: 14 }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={reject} style={{
                flex: 1, padding: '10px', borderRadius: 9, border: 'none', fontWeight: 700, fontSize: 13,
                background: '#ef4444', color: '#fff', cursor: 'pointer',
              }}>Confirm Reject</button>
              <button onClick={() => setRejectModal(null)} style={{
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
