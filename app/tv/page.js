'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import Header from '@/components/Header'
import BottomNav from '@/components/BottomNav'
import { fetcher, apiUrl } from '@/lib/api'

function ChannelCard({ ch, onSelect }) {
  const hasStream = !!ch.stream_url
  return (
    <button
      onClick={() => hasStream && onSelect(ch)}
      style={{
        background: '#141824',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 14, padding: '14px 10px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        cursor: hasStream ? 'pointer' : 'default',
        transition: 'all .15s',
        opacity: hasStream ? 1 : 0.45,
        textAlign: 'center', position: 'relative',
      }}
      onMouseEnter={(e) => hasStream && (e.currentTarget.style.borderColor = ch.color + '80')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}
    >
      {/* Live dot */}
      {hasStream && (
        <span style={{
          position: 'absolute', top: 8, right: 8,
          width: 7, height: 7, borderRadius: '50%',
          background: '#00FF87',
          boxShadow: '0 0 6px #00FF87',
          animation: 'livePulse 1.4s ease-in-out infinite',
        }} />
      )}

      {/* Logo or emoji */}
      <div style={{
        width: 54, height: 54, borderRadius: 14,
        background: ch.color + '20',
        border: `1px solid ${ch.color}40`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}>
        {ch.logo_url
          ? <img src={ch.logo_url} alt={ch.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ fontSize: 26 }}>{ch.emoji}</span>
        }
      </div>

      <span style={{
        fontSize: 11, fontWeight: 700,
        color: 'rgba(255,255,255,0.75)',
        lineHeight: 1.3, maxWidth: '100%',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {ch.name}
      </span>

      {!hasStream && (
        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', fontWeight: 600 }}>Coming soon</span>
      )}
    </button>
  )
}

function SectionLabel({ children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '20px 0 10px' }}>
      <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.4)', letterSpacing: 1, textTransform: 'uppercase' }}>
        {children}
      </span>
      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
    </div>
  )
}

export default function TVPage() {
  const router = useRouter()
  const [tab, setTab] = useState('tv')

  const { data: tvGroups,    isLoading: tvLoading }    = useSWR(apiUrl.tv('tv'),    fetcher, { revalidateOnFocus: false })
  const { data: radioGroups, isLoading: radioLoading } = useSWR(apiUrl.tv('radio'), fetcher, { revalidateOnFocus: false })

  const groups  = tab === 'tv' ? (tvGroups || []) : (radioGroups || [])
  const loading = tab === 'tv' ? tvLoading : radioLoading

  const selectChannel = (ch) => router.push(`/tv/${ch.id}`)

  return (
    <div style={{ minHeight: '100vh', background: '#0A0E1A' }}>
      <Header />

      <main style={{ padding: '0 0 80px' }}>
        {/* Tab strip */}
        <div style={{
          display: 'flex', gap: 0,
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          padding: '0 16px',
        }}>
          {[['tv','📺 TV'], ['radio','📻 Radio']].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{
              background: 'none', border: 'none',
              borderBottom: `2px solid ${tab === key ? '#00FF87' : 'transparent'}`,
              color: tab === key ? '#00FF87' : 'rgba(255,255,255,0.45)',
              fontWeight: 700, fontSize: 14, padding: '14px 20px',
              cursor: 'pointer', transition: 'all .15s',
            }}>
              {label}
            </button>
          ))}
        </div>

        {/* Channel grid */}
        <div style={{ padding: '0 16px' }}>
          {loading && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, paddingTop: 20 }}>
              {[...Array(9)].map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 110, borderRadius: 14 }} />
              ))}
            </div>
          )}

          {!loading && groups.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
              No {tab === 'tv' ? 'TV' : 'radio'} channels yet.<br />
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>Add them from Admin → TV & Radio</span>
            </div>
          )}

          {groups.map(({ category, channels }) => (
            <div key={category}>
              <SectionLabel>{category}</SectionLabel>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                {channels.map((ch) => (
                  <ChannelCard
                    key={ch.id}
                    ch={ch}
                    onSelect={selectChannel}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
