'use client'
import { useRouter } from 'next/navigation'

export default function NotFound() {
  const router = useRouter()
  return (
    <div style={{
      minHeight: '100vh', background: '#0A0E1A', color: '#fff',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 14, padding: 24, textAlign: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      <div style={{ fontSize: 56 }}>📡</div>
      <p style={{ fontSize: 22, fontWeight: 800 }}>Page not found</p>
      <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', maxWidth: 280 }}>
        This page doesn&apos;t exist or the match may have ended.
      </p>
      <button
        onClick={() => router.push('/')}
        style={{
          marginTop: 8,
          background: 'rgba(0,255,135,0.12)',
          border: '1px solid rgba(0,255,135,0.3)',
          color: '#00FF87', borderRadius: 20,
          padding: '10px 24px', fontSize: 14, fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        Back to Live
      </button>
    </div>
  )
}
