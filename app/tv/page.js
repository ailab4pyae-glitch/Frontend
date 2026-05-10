'use client'
import { useState } from 'react'
import Header from '@/components/Header'
import BottomNav from '@/components/BottomNav'
import VideoPlayer from '@/components/VideoPlayer'

const CHANNELS = [
  {
    section: 'Myanmar TV',
    items: [
      { id: 'mrtv',     name: 'MRTV',        emoji: '📺', color: '#e63946', url: null },
      { id: 'mrtv4',    name: 'MRTV-4',       emoji: '🎬', color: '#457b9d', url: null },
      { id: 'myawady',  name: 'Myawady TV',   emoji: '🌟', color: '#2a9d8f', url: null },
      { id: 'channel7', name: 'Channel 7',    emoji: '7️⃣', color: '#e76f51', url: null },
    ],
  },
  {
    section: 'Sports TV',
    items: [
      { id: 'espn',     name: 'ESPN',         emoji: '🏆', color: '#e63946', url: null },
      { id: 'bein1',    name: 'beIN Sports 1', emoji: '⚽', color: '#06aed5', url: null },
      { id: 'bein2',    name: 'beIN Sports 2', emoji: '⚽', color: '#06aed5', url: null },
      { id: 'skysport', name: 'Sky Sports',   emoji: '🔵', color: '#0077b6', url: null },
      { id: 'dazn',     name: 'DAZN',         emoji: '🎯', color: '#f72585', url: null },
      { id: 'paramount', name: 'Paramount+',  emoji: '⭐', color: '#0054a3', url: null },
    ],
  },
  {
    section: 'News TV',
    items: [
      { id: 'cnn',      name: 'CNN',          emoji: '🌍', color: '#cc0000', url: null },
      { id: 'bbc',      name: 'BBC News',     emoji: '🎙', color: '#bb1919', url: null },
      { id: 'aljazeera', name: 'Al Jazeera',  emoji: '📡', color: '#00843d', url: null },
      { id: 'bloomberg', name: 'Bloomberg',   emoji: '📊', color: '#f4a000', url: null },
    ],
  },
]

const ChannelCard = ({ channel, onSelect }) => (
  <button
    onClick={() => channel.url ? onSelect(channel) : null}
    style={{
      background: '#141824',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 12, padding: '16px 12px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
      cursor: channel.url ? 'pointer' : 'default',
      transition: 'border-color .15s',
      opacity: channel.url ? 1 : 0.5,
      textAlign: 'center',
    }}
    onMouseEnter={(e) => channel.url && (e.currentTarget.style.borderColor = 'rgba(0,255,135,0.25)')}
    onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}
  >
    <div style={{
      width: 52, height: 52, borderRadius: 12,
      background: channel.color + '22',
      border: `1px solid ${channel.color}44`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 24,
    }}>
      {channel.emoji}
    </div>
    <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.8)', lineHeight: 1.3 }}>
      {channel.name}
    </span>
    {!channel.url && (
      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>Coming soon</span>
    )}
  </button>
)

export default function TVPage() {
  const [modal, setModal] = useState(null) // { name, url }

  return (
    <div style={{ minHeight: '100vh', background: '#0A0E1A' }}>
      <Header />

      <main style={{ padding: '16px 16px 80px' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>TV Channels</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>
          Live channels — add streams from admin panel
        </p>

        {CHANNELS.map(({ section, items }) => (
          <div key={section} style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: 1, textTransform: 'uppercase' }}>
                {section}
              </span>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {items.map((ch) => (
                <ChannelCard key={ch.id} channel={ch} onSelect={setModal} />
              ))}
            </div>
          </div>
        ))}
      </main>

      {/* Player Modal */}
      {modal && (
        <div
          onClick={() => setModal(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 300,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: '100%', maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 12 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700, fontSize: 16 }}>{modal.name}</span>
              <button
                onClick={() => setModal(null)}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 20, padding: '6px 12px', color: '#fff', fontSize: 13 }}
              >
                ✕ Close
              </button>
            </div>
            <VideoPlayer url={modal.url} isLive onError={() => setModal(null)} />
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
