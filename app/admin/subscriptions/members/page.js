'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { adminFetch } from '@/lib/auth'

const STATUS_STYLE = {
  active:  { color: '#00FF87', bg: 'rgba(0,255,135,0.1)',  label: '✅ Active'   },
  expired: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', label: '⏰ Expired'  },
  none:    { color: 'rgba(255,255,255,0.25)', bg: 'rgba(255,255,255,0.04)', label: '⚪ No Sub' },
}

const fmtDate  = (iso) => iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'
const daysLeft = (iso) => {
  if (!iso) return null
  const d = Math.ceil((new Date(iso) - Date.now()) / 86400000)
  return d > 0 ? `${d}d left` : `${Math.abs(d)}d ago`
}

function getSubStatus(row) {
  if (!row.sub_status) return 'none'
  if (row.sub_status === 'active' && new Date(row.expires_at) < new Date()) return 'expired'
  return row.sub_status
}

const INPUT_STYLE = {
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 8, padding: '8px 12px', color: '#fff', fontSize: 13,
  outline: 'none', width: '100%', boxSizing: 'border-box',
}

const SELECT_STYLE = { ...INPUT_STYLE, cursor: 'pointer' }

export default function MembersPage() {
  const [data,     setData]     = useState({ users: [], total: 0, page: 1, totalPages: 1 })
  const [search,   setSearch]   = useState('')
  const [status,   setStatus]   = useState('')
  const [sort,     setSort]     = useState('created_at')
  const [order,    setOrder]    = useState('desc')
  const [page,     setPage]     = useState(1)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')
  const [modal,    setModal]    = useState(null)   // activate modal { userId }
  const [detail,   setDetail]   = useState(null)   // user detail modal
  const [plans,    setPlans]    = useState([])
  const [selPlan,  setSelPlan]  = useState('')
  const [days,     setDays]     = useState('')
  const [saving,   setSaving]   = useState(false)
  const searchTimer = useRef(null)

  const load = useCallback((pg = page) => {
    setLoading(true)
    const params = new URLSearchParams({
      page: pg, limit: 20, sort, order,
      ...(search && { search }),
      ...(status && { status }),
    })
    adminFetch(`/api/admin/users?${params}`)
      .then((d) => setData(d))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [search, status, sort, order, page])

  useEffect(() => { load(1); setPage(1) }, [status, sort, order])
  useEffect(() => { adminFetch('/api/admin/subscription/plans').then(setPlans).catch(() => {}) }, [])

  const onSearch = (val) => {
    setSearch(val)
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => { setPage(1); load(1) }, 400)
  }

  const goPage = (pg) => { setPage(pg); load(pg) }

  const openDetail = async (id) => {
    try {
      const d = await adminFetch(`/api/admin/users/${id}`)
      setDetail(d)
    } catch (e) { setError(e.message) }
  }

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

  const deleteUser = async (id) => {
    if (!confirm('Delete this user and all their data?')) return
    await adminFetch(`/api/admin/users/${id}`, { method: 'DELETE' }).catch((e) => setError(e.message))
    setDetail(null); load()
  }

  return (
    <div style={{ maxWidth: 900 }}>
      <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: '0 0 20px' }}>Members</h2>

      {error && (
        <div style={{ background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.3)', borderRadius: 8, padding: '10px 14px', color: '#ff6b6b', marginBottom: 16, fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* ── Toolbar ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <input
          type="text" placeholder="Search name, username, Telegram ID…"
          value={search} onChange={(e) => onSearch(e.target.value)}
          style={{ ...INPUT_STYLE, flex: 1, minWidth: 200 }}
        />
        {/* Status filter */}
        <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ ...SELECT_STYLE, width: 160 }}>
          <option value="">All Status</option>
          <option value="active">✅ Active</option>
          <option value="expired">⏰ Expired</option>
          <option value="none">⚪ No Subscription</option>
        </select>
        {/* Sort */}
        <select value={sort} onChange={(e) => setSort(e.target.value)} style={{ ...SELECT_STYLE, width: 150 }}>
          <option value="created_at">Joined Date</option>
          <option value="expires_at">Expiry Date</option>
          <option value="full_name">Name A–Z</option>
        </select>
        {/* Order */}
        <select value={order} onChange={(e) => setOrder(e.target.value)} style={{ ...SELECT_STYLE, width: 140 }}>
          <option value="desc">Newest First</option>
          <option value="asc">Oldest First</option>
        </select>
        <button onClick={() => { setPage(1); load(1) }} style={{
          padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)',
          background: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 13,
        }}>↻</button>
      </div>

      {/* ── Total count ── */}
      <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12, marginBottom: 10 }}>
        {loading ? 'Loading…' : `${data.total} user${data.total !== 1 ? 's' : ''} found`}
      </div>

      {/* ── Grid Table ── */}
      <div style={{ background: '#141824', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{
          display: 'grid', gridTemplateColumns: '2fr 1fr 1.2fr 1fr 1.2fr 1fr',
          background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.07)',
          padding: '8px 16px', gap: 8,
        }}>
          {['User', 'Telegram ID', 'Plan', 'Status', 'Expires', 'Actions'].map((h) => (
            <div key={h} style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '.5px' }}>{h}</div>
          ))}
        </div>

        {/* Rows */}
        {loading ? (
          <div style={{ padding: '32px 16px', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>Loading…</div>
        ) : !data.users.length ? (
          <div style={{ padding: '32px 16px', color: 'rgba(255,255,255,0.25)', fontSize: 13, textAlign: 'center' }}>No members found</div>
        ) : data.users.map((m) => {
          const st    = getSubStatus(m)
          const style = STATUS_STYLE[st] || STATUS_STYLE.none
          return (
            <div key={m.id} style={{
              display: 'grid', gridTemplateColumns: '2fr 1fr 1.2fr 1fr 1.2fr 1fr',
              padding: '11px 16px', gap: 8, alignItems: 'center',
              borderTop: '1px solid rgba(255,255,255,0.05)',
              transition: 'background .15s',
            }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              {/* User */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                  background: 'rgba(0,255,135,0.1)', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#00FF87',
                }}>
                  {(m.full_name || m.username || '?')[0].toUpperCase()}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{ color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    onClick={() => openDetail(m.id)}
                    title="View details"
                  >
                    {m.full_name || m.username || `User ${m.telegram_id}`}
                  </div>
                  {m.username && (
                    <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>@{m.username}</div>
                  )}
                </div>
              </div>

              {/* Telegram ID */}
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{m.telegram_id}</div>

              {/* Plan */}
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{m.plan_name || '—'}</div>

              {/* Status */}
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: style.bg, color: style.color }}>
                  {style.label}
                </span>
              </div>

              {/* Expires */}
              <div style={{ fontSize: 12 }}>
                {m.expires_at ? (
                  <>
                    <div style={{ color: st === 'active' ? '#00FF87' : 'rgba(255,255,255,0.4)' }}>{fmtDate(m.expires_at)}</div>
                    <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11 }}>{daysLeft(m.expires_at)}</div>
                  </>
                ) : (
                  <span style={{ color: 'rgba(255,255,255,0.2)' }}>—</span>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 5 }}>
                <button onClick={() => { setModal({ userId: m.id }); setSelPlan(''); setDays('') }} style={{
                  padding: '4px 9px', borderRadius: 6, border: '1px solid rgba(0,255,135,0.3)',
                  background: 'rgba(0,255,135,0.08)', color: '#00FF87', cursor: 'pointer', fontSize: 11, fontWeight: 700,
                }}>
                  {st === 'active' ? '+Ext' : 'Activate'}
                </button>
                {st === 'active' && (
                  <button onClick={() => cancel(m.id)} style={{
                    padding: '4px 9px', borderRadius: 6, border: '1px solid rgba(255,68,68,0.2)',
                    background: 'rgba(255,68,68,0.06)', color: '#ff6b6b', cursor: 'pointer', fontSize: 11,
                  }}>✕</button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Pagination ── */}
      {data.totalPages > 1 && (
        <div style={{ display: 'flex', gap: 4, marginTop: 14, justifyContent: 'flex-end', flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={() => goPage(page - 1)} disabled={page <= 1} style={{
            padding: '5px 10px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.1)',
            background: 'none', color: page <= 1 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.5)',
            cursor: page <= 1 ? 'not-allowed' : 'pointer', fontSize: 12,
          }}>← Prev</button>

          {Array.from({ length: data.totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === data.totalPages || Math.abs(p - page) <= 2)
            .reduce((acc, p, i, arr) => {
              if (i > 0 && p - arr[i - 1] > 1) acc.push('…')
              acc.push(p); return acc
            }, [])
            .map((p, i) => p === '…' ? (
              <span key={`e${i}`} style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12, padding: '0 4px' }}>…</span>
            ) : (
              <button key={p} onClick={() => goPage(p)} style={{
                padding: '5px 10px', borderRadius: 7, fontSize: 12,
                border: p === page ? '1px solid #00FF87' : '1px solid rgba(255,255,255,0.1)',
                background: p === page ? 'rgba(0,255,135,0.15)' : 'none',
                color: p === page ? '#00FF87' : 'rgba(255,255,255,0.5)',
                cursor: 'pointer', fontWeight: p === page ? 700 : 400,
              }}>{p}</button>
            ))}

          <button onClick={() => goPage(page + 1)} disabled={page >= data.totalPages} style={{
            padding: '5px 10px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.1)',
            background: 'none', color: page >= data.totalPages ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.5)',
            cursor: page >= data.totalPages ? 'not-allowed' : 'pointer', fontSize: 12,
          }}>Next →</button>

          <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12, marginLeft: 4 }}>
            Page {page} of {data.totalPages}
          </span>
        </div>
      )}

      {/* ── Activate Modal ── */}
      {modal && (
        <div onClick={(e) => e.target === e.currentTarget && setModal(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        }}>
          <div style={{ background: '#141824', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: 24, width: '100%', maxWidth: 360 }}>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Activate / Extend Subscription</div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700, display: 'block', marginBottom: 5 }}>Select Plan</label>
              <select value={selPlan} onChange={(e) => setSelPlan(e.target.value)} style={SELECT_STYLE}>
                <option value="">— choose plan —</option>
                {plans.filter((p) => p.is_active).map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.duration_days}d)</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700, display: 'block', marginBottom: 5 }}>Or Custom Days</label>
              <input type="number" min="1" placeholder="e.g. 7" value={days} onChange={(e) => setDays(e.target.value)} style={INPUT_STYLE} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={activate} disabled={saving || (!selPlan && !days)} style={{
                flex: 1, padding: 10, borderRadius: 9, border: 'none', fontWeight: 700, fontSize: 13,
                background: '#00FF87', color: '#0a0e1a', cursor: 'pointer', opacity: saving || (!selPlan && !days) ? .5 : 1,
              }}>{saving ? 'Saving…' : 'Activate'}</button>
              <button onClick={() => setModal(null)} style={{
                padding: '10px 16px', borderRadius: 9, border: '1px solid rgba(255,255,255,0.12)',
                background: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 13,
              }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── User Detail Modal ── */}
      {detail && (
        <div onClick={(e) => e.target === e.currentTarget && setDetail(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        }}>
          <div style={{ background: '#141824', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: 24, width: '100%', maxWidth: 560, maxHeight: '85vh', overflowY: 'auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(0,255,135,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: '#00FF87', flexShrink: 0 }}>
                {(detail.full_name || detail.username || '?')[0].toUpperCase()}
              </div>
              <div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>{detail.full_name || detail.username || `User ${detail.telegram_id}`}</div>
                <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>
                  {detail.username && `@${detail.username} · `}TG: {detail.telegram_id} · Joined {fmtDate(detail.created_at)}
                </div>
              </div>
            </div>

            {/* Subscription History */}
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>Subscription History</div>
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, overflow: 'hidden', marginBottom: 20 }}>
              {!detail.subscriptions?.length ? (
                <div style={{ padding: '12px 14px', color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>No subscriptions</div>
              ) : detail.subscriptions.map((s) => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 13 }}>
                  <div>
                    <div style={{ color: '#fff', fontWeight: 600 }}>{s.plan_name}</div>
                    <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>{fmtDate(s.started_at)} → {fmtDate(s.expires_at)}</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20, ...STATUS_STYLE[s.status === 'active' && new Date(s.expires_at) < new Date() ? 'expired' : s.status] || {} }}>
                    {s.status}
                  </span>
                </div>
              ))}
            </div>

            {/* Transaction History */}
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>Transactions</div>
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, overflow: 'hidden', marginBottom: 20 }}>
              {!detail.transactions?.length ? (
                <div style={{ padding: '12px 14px', color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>No transactions</div>
              ) : detail.transactions.map((t) => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 13 }}>
                  <div>
                    <div style={{ color: '#fff', fontWeight: 600 }}>{t.plan_name} · {t.amount} {t.currency}</div>
                    <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>{t.payment_method || '—'} · {fmtDate(t.created_at)}</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: t.status === 'approved' ? 'rgba(0,255,135,0.1)' : t.status === 'pending' ? 'rgba(245,158,11,0.1)' : 'rgba(255,68,68,0.1)', color: t.status === 'approved' ? '#00FF87' : t.status === 'pending' ? '#f59e0b' : '#ff6b6b' }}>
                    {t.status}
                  </span>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={() => deleteUser(detail.id)} style={{
                padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(255,68,68,0.3)',
                background: 'rgba(255,68,68,0.08)', color: '#ff6b6b', cursor: 'pointer', fontSize: 13,
              }}>Delete User</button>
              <button onClick={() => setDetail(null)} style={{
                padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)',
                background: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 13,
              }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
