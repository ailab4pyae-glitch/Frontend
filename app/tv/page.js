'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import Header from '@/components/Header'
import { fetcher, apiUrl } from '@/lib/api'

const isMyanmar = (category) =>
  /myanmar|မြန်မာ/i.test(category)

function ChannelCard({ ch, onSelect, featured = false }) {
  const hasStream = !!ch.stream_url
  const size = featured ? 64 : 54

  return (
    <button
      onClick={() => hasStream && onSelect(ch)}
      style={{
        background: '#141824',
        border: `1px solid ${hasStream ? ch.color + '33' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: 14, padding: featured ? '16px 10px' : '14px 10px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        cursor: hasStream ? 'pointer' : 'default',
        transition: 'all .15s',
        opacity: hasStream ? 1 : 0.45,
        textAlign: 'center', position: 'relative',
      }}
      onMouseEnter={(e) => hasStream && (e.currentTarget.style.borderColor = ch.color + '80')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = hasStream ? ch.color + '33' : 'rgba(255,255,255,0.07)')}
    >
      {hasStream && (
        <span style={{
          position: 'absolute', top: 8, right: 8,
          width: 7, height: 7, borderRadius: '50%',
          background: '#00FF87', boxShadow: '0 0 6px #00FF87',
          animation: 'livePulse 1.4s ease-in-out infinite',
        }} />
      )}

      <div style={{
        width: size, height: size, borderRadius: 14,
        background: ch.color + '20', border: `1px solid ${ch.color}40`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden', flexShrink: 0,
      }}>
        {ch.logo_url
          ? <img src={ch.logo_url} alt={ch.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ fontSize: featured ? 30 : 26 }}>{ch.emoji}</span>
        }
      </div>

      <span style={{
        fontSize: featured ? 12 : 11, fontWeight: 700,
        color: 'rgba(255,255,255,0.85)',
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

function SectionLabel({ children, featured = false }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '20px 0 10px' }}>
      {featured && (
        <span style={{
          fontSize: 10, fontWeight: 800, letterSpacing: 1,
          background: 'rgba(0,255,135,0.15)', color: '#00FF87',
          border: '1px solid rgba(0,255,135,0.3)',
          borderRadius: 20, padding: '2px 8px',
        }}>
           မြန်မာ
        </span>
      )}
      <span style={{ fontSize: 11, fontWeight: 800, color: featured ? '#fff' : 'rgba(255,255,255,0.4)', letterSpacing: 1, textTransform: 'uppercase' }}>
        {children}
      </span>
      <div style={{ flex: 1, height: 1, background: featured ? 'rgba(0,255,135,0.15)' : 'rgba(255,255,255,0.06)' }} />
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

  // Split Myanmar categories (featured first) vs everything else
  const myanmarGroups = groups.filter(g => isMyanmar(g.category))
  const otherGroups   = groups.filter(g => !isMyanmar(g.category))

  const selectChannel = (ch) => router.push(`/tv/${ch.id}`)

  return (
    <div style={{ minHeight: '100vh', background: '#0A0E1A' }}>
      <Header />

      <main style={{ padding: '0 0 32px' }}>
        {/* TV / Radio tab strip */}
        <div style={{
          display: 'flex', gap: 0,
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          padding: '0 16px',
          background: '#0D1220',
        }}>
          {[['tv', '📺 TV'], ['radio', '📻 Radio']].map(([key, label]) => (
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

        <div style={{ padding: '0 16px' }}>
          {/* Loading skeleton */}
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

          {/* ── Myanmar featured section ── */}
          {myanmarGroups.map(({ category, channels }) => (
            <div key={category}>
              <SectionLabel featured>{category}</SectionLabel>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                {channels.map((ch) => (
                  <ChannelCard key={ch.id} ch={ch} onSelect={selectChannel} featured />
                ))}
              </div>
            </div>
          ))}

          {/* ── Other channels ── */}
          {otherGroups.length > 0 && (
            <>
              {myanmarGroups.length > 0 && (
                <div style={{ margin: '24px 0 0', padding: '16px 0 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>
                    Other Channels
                  </div>
                </div>
              )}
              {otherGroups.map(({ category, channels }) => (
                <div key={category}>
                  <SectionLabel>{category}</SectionLabel>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                    {channels.map((ch) => (
                      <ChannelCard key={ch.id} ch={ch} onSelect={selectChannel} />
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
