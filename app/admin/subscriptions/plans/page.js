'use client'
import { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/auth'

const inp = (extra = {}) => ({
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 8, padding: '8px 12px', color: '#fff', fontSize: 13,
  outline: 'none', width: '100%', boxSizing: 'border-box', ...extra,
})

const EMPTY = { name: '', duration_days: '', price: '', currency: 'MMK', description: '', features: '', is_active: true }

export default function PlansPage() {
  const [plans,   setPlans]   = useState([])
  const [form,    setForm]    = useState(EMPTY)
  const [editId,  setEditId]  = useState(null)
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')

  const load = () => adminFetch('/api/admin/subscription/plans').then(setPlans).catch((e) => setError(e.message))
  useEffect(() => { load() }, [])

  const openEdit = (plan) => {
    setEditId(plan.id)
    setForm({
      name:         plan.name,
      duration_days: plan.duration_days,
      price:        plan.price,
      currency:     plan.currency,
      description:  plan.description || '',
      features:     (plan.features || []).join('\n'),
      is_active:    plan.is_active,
    })
    setError('')
  }

  const reset = () => { setEditId(null); setForm(EMPTY); setError('') }

  const save = async () => {
    setSaving(true); setError('')
    try {
      const body = {
        ...form,
        duration_days: Number(form.duration_days),
        price:         Number(form.price),
        features:      form.features.split('\n').map((s) => s.trim()).filter(Boolean),
      }
      if (editId) await adminFetch(`/api/admin/subscription/plans/${editId}`, { method: 'PUT', body: JSON.stringify(body) })
      else        await adminFetch('/api/admin/subscription/plans', { method: 'POST', body: JSON.stringify(body) })
      reset(); load()
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  const deletePlan = async (id) => {
    if (!confirm('Delete this plan?')) return
    await adminFetch(`/api/admin/subscription/plans/${id}`, { method: 'DELETE' }).catch((e) => setError(e.message))
    load()
  }

  const toggle = async (plan) => {
    await adminFetch(`/api/admin/subscription/plans/${plan.id}`, {
      method: 'PUT', body: JSON.stringify({ is_active: !plan.is_active }),
    }).catch((e) => setError(e.message))
    load()
  }

  return (
    <div style={{ maxWidth: 780 }}>
      <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: '0 0 20px' }}>Subscription Plans</h2>

      {error && <div style={{ background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.3)', borderRadius: 8, padding: '10px 14px', color: '#ff6b6b', marginBottom: 16, fontSize: 13 }}>{error}</div>}

      {/* Form */}
      <div style={{ background: '#141824', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '18px 20px', marginBottom: 24 }}>
        <div style={{ color: '#fff', fontWeight: 700, fontSize: 14, marginBottom: 14 }}>
          {editId ? '✏️ Edit Plan' : '➕ New Plan'}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
          {[
            { key: 'name',         label: 'Plan Name',     ph: 'Monthly' },
            { key: 'duration_days',label: 'Duration (days)', ph: '30', type: 'number' },
            { key: 'price',        label: 'Price',         ph: '7999',  type: 'number' },
            { key: 'currency',     label: 'Currency',      ph: 'MMK'   },
            { key: 'description',  label: 'Description',   ph: 'Short description' },
          ].map(({ key, label, ph, type }) => (
            <div key={key}>
              <label style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>{label}</label>
              <input type={type || 'text'} placeholder={ph} value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                style={inp()} />
            </div>
          ))}
          <div>
            <label style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Active</label>
            <button onClick={() => setForm((f) => ({ ...f, is_active: !f.is_active }))} style={{
              height: 36, padding: '0 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: form.is_active ? 'rgba(0,255,135,0.15)' : 'rgba(255,255,255,0.07)',
              color: form.is_active ? '#00FF87' : 'rgba(255,255,255,0.4)', fontWeight: 700, fontSize: 13,
            }}>{form.is_active ? '✅ Active' : '⏸ Paused'}</button>
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Features (one per line)</label>
          <textarea rows={3} placeholder={'All live matches\nHD streams\nUnlimited devices'} value={form.features}
            onChange={(e) => setForm((f) => ({ ...f, features: e.target.value }))}
            style={inp({ resize: 'vertical', fontFamily: 'inherit' })} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={save} disabled={saving} style={{
            padding: '8px 20px', borderRadius: 8, border: 'none', fontWeight: 700, fontSize: 13,
            background: '#00FF87', color: '#0a0e1a', cursor: 'pointer',
          }}>{saving ? 'Saving…' : editId ? 'Update Plan' : 'Create Plan'}</button>
          {editId && <button onClick={reset} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', background: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>Cancel</button>}
        </div>
      </div>

      {/* Plan list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {plans.map((plan) => (
          <div key={plan.id} style={{
            background: '#141824', border: `1px solid ${plan.is_active ? 'rgba(0,255,135,0.15)' : 'rgba(255,255,255,0.06)'}`,
            borderRadius: 12, padding: '14px 16px',
            display: 'flex', alignItems: 'center', gap: 12,
            opacity: plan.is_active ? 1 : 0.5,
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{plan.name}</span>
                <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 20, fontWeight: 700,
                  background: plan.is_active ? 'rgba(0,255,135,0.1)' : 'rgba(255,255,255,0.05)',
                  color: plan.is_active ? '#00FF87' : 'rgba(255,255,255,0.3)',
                }}>{plan.is_active ? 'Active' : 'Paused'}</span>
              </div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
                {plan.duration_days} days · {Number(plan.price).toLocaleString()} {plan.currency}
                {plan.description ? ` · ${plan.description}` : ''}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => toggle(plan)} style={{ padding: '5px 10px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.12)', background: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 12 }}>
                {plan.is_active ? 'Pause' : 'Activate'}
              </button>
              <button onClick={() => openEdit(plan)} style={{ padding: '5px 10px', borderRadius: 7, border: '1px solid rgba(96,165,250,0.3)', background: 'rgba(96,165,250,0.08)', color: '#60a5fa', cursor: 'pointer', fontSize: 12 }}>Edit</button>
              <button onClick={() => deletePlan(plan.id)} style={{ padding: '5px 10px', borderRadius: 7, border: '1px solid rgba(255,68,68,0.2)', background: 'rgba(255,68,68,0.06)', color: '#ff6b6b', cursor: 'pointer', fontSize: 12 }}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
