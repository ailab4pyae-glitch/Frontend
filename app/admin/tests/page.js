'use client'
import { useState } from 'react'
import { adminFetch } from '@/lib/auth'

const BASE_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3050'

const statusColor = (passed) => passed ? '#00FF87' : '#ff6b6b'
const statusBg    = (passed) => passed ? 'rgba(0,255,135,0.08)' : 'rgba(255,68,68,0.08)'

export default function TestsPage() {
  const [running,  setRunning]  = useState(false)
  const [result,   setResult]   = useState(null)
  const [error,    setError]    = useState('')
  const [expanded, setExpanded] = useState({})

  const run = async () => {
    setRunning(true); setResult(null); setError('')
    try {
      const data = await adminFetch('/api/admin/run-tests', {
        method: 'POST',
        body: JSON.stringify({ base_url: BASE_API }),
      })
      setResult(data)
      // Auto-expand failed sections
      const exp = {}
      if (data?.sections) {
        data.sections.forEach((s) => {
          if (s.tests.some((t) => !t.passed)) exp[s.name] = true
        })
      }
      setExpanded(exp)
    } catch (e) { setError(e.message) }
    finally { setRunning(false) }
  }

  const toggle = (name) => setExpanded((e) => ({ ...e, [name]: !e[name] }))

  return (
    <div style={{ maxWidth: 780 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 700, margin: 0 }}>API Tests</h2>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginTop: 4 }}>
            Runs the full test suite against <code style={{ color: '#60a5fa' }}>{BASE_API}</code>
          </p>
        </div>
        <button
          onClick={run}
          disabled={running}
          style={{
            border: 'none', borderRadius: 10, padding: '11px 28px',
            background: running ? 'rgba(0,255,135,0.4)' : '#00FF87',
            color: '#0A0E1A', fontWeight: 700, fontSize: 15,
            cursor: running ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 8,
          }}
        >
          {running
            ? <><Spinner /> Running…</>
            : '▶ Run Tests'}
        </button>
      </div>

      {error && (
        <div style={{ background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.3)', borderRadius: 8, padding: '14px 18px', color: '#ff6b6b', marginBottom: 20, fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* Summary bar */}
      {result && (
        <div style={{
          background: result.ok ? 'rgba(0,255,135,0.06)' : 'rgba(255,68,68,0.06)',
          border: `1px solid ${result.ok ? 'rgba(0,255,135,0.2)' : 'rgba(255,68,68,0.2)'}`,
          borderRadius: 12, padding: '18px 22px', marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap',
        }}>
          <div style={{ fontSize: 28 }}>{result.ok ? '✅' : '❌'}</div>
          {[
            ['Total',   result.total,   '#fff'],
            ['Passed',  result.passed,  '#00FF87'],
            ['Failed',  result.failed,  result.failed > 0 ? '#ff6b6b' : '#00FF87'],
            ['Duration', `${result.durationMs}ms`, 'rgba(255,255,255,0.4)'],
          ].map(([label, val, color]) => (
            <div key={label}>
              <div style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1 }}>{val}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: .5 }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Sections */}
      {result?.sections?.map((section) => {
        const sectionPassed = section.tests.every((t) => t.passed)
        const isOpen = expanded[section.name] !== false && (expanded[section.name] || !sectionPassed || result.sections.length <= 3)

        return (
          <div key={section.name} style={{
            background: '#141824', borderRadius: 10, marginBottom: 10,
            border: `1px solid ${sectionPassed ? 'rgba(255,255,255,0.07)' : 'rgba(255,68,68,0.2)'}`,
            overflow: 'hidden',
          }}>
            {/* Section header */}
            <button
              onClick={() => toggle(section.name)}
              style={{
                width: '100%', padding: '14px 18px',
                background: 'none', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
              }}
            >
              <span style={{ fontSize: 16 }}>{sectionPassed ? '✅' : '❌'}</span>
              <span style={{ flex: 1, fontWeight: 700, color: '#fff', fontSize: 14 }}>{section.name}</span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
                {section.tests.filter((t) => t.passed).length}/{section.tests.length}
              </span>
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>{isOpen ? '▲' : '▼'}</span>
            </button>

            {/* Tests */}
            {isOpen && (
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                {section.tests.map((t, i) => (
                  <div key={i} style={{
                    padding: '12px 18px',
                    background: statusBg(t.passed),
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14 }}>{t.passed ? '✅' : '❌'}</span>
                      <span style={{ flex: 1, fontWeight: 600, color: '#fff', fontSize: 13 }}>{t.name}</span>
                      <span style={{
                        fontSize: 11, padding: '2px 8px', borderRadius: 20,
                        background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)',
                      }}>{t.ms}ms</span>
                    </div>
                    {!t.passed && t.reason && (
                      <div style={{ marginTop: 6, marginLeft: 22, fontSize: 12, color: '#ff6b6b', fontWeight: 500 }}>
                        → {t.reason}
                      </div>
                    )}
                    {t.notes?.map((n, j) => (
                      <div key={j} style={{ marginTop: 4, marginLeft: 22, fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
                        → {n}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}

      {/* Empty state */}
      {!running && !result && !error && (
        <div style={{ textAlign: 'center', padding: '60px 24px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🧪</div>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15, fontWeight: 600 }}>
            Click <strong style={{ color: '#00FF87' }}>Run Tests</strong> to check all API endpoints
          </p>
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13, marginTop: 8 }}>
            Covers health, tabs, config, matches, streams, admin auth, performance, and concurrency
          </p>
        </div>
      )}

      {running && (
        <div style={{ textAlign: 'center', padding: '60px 24px' }}>
          <Spinner size={36} />
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginTop: 16 }}>Running test suite…</p>
        </div>
      )}
    </div>
  )
}

function Spinner({ size = 16 }) {
  return (
    <span style={{
      display: 'inline-block', width: size, height: size,
      border: `2px solid rgba(0,0,0,0.2)`,
      borderTop: `2px solid #0A0E1A`,
      borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
    }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </span>
  )
}
