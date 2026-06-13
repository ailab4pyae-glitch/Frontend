'use client'
import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import useSWR from 'swr'
import { fetcher, apiUrl, formatDate, formatTime } from '@/lib/api'
import { killActiveStream } from '@/lib/player'
import { useConfig } from '@/lib/config'
import { useAuth, getToken } from '@/lib/useAuth'
import LiveBadge from '@/components/LiveBadge'
import VideoPlayer from '@/components/VideoPlayer'
import ServerSelector from '@/components/ServerSelector'
import TeamLogo from '@/components/TeamLogo'
import AdBanner from '@/components/AdBanner'

// ── Countdown gaming UI ────────────────────────────────────────────────────────
const CYBER = '#00e5ff'
const CYBER2 = '#7c3aed'

function CdDigit({ value, mmLabel }) {
  return (
    <div style={{
      display:'flex', flexDirection:'column', alignItems:'center', gap:4,
      background:'linear-gradient(180deg,rgba(0,229,255,0.07) 0%,rgba(0,229,255,0.02) 100%)',
      border:`1px solid rgba(0,229,255,0.22)`,
      borderRadius:10, padding:'10px 15px', minWidth:58, position:'relative', overflow:'hidden',
      boxShadow:'0 0 18px rgba(0,229,255,0.08), inset 0 0 12px rgba(0,229,255,0.04)',
    }}>
      <div style={{ position:'absolute',top:0,left:'15%',right:'15%',height:1,background:`linear-gradient(90deg,transparent,${CYBER},transparent)`,opacity:.7 }}/>
      <span style={{
        fontSize:34, fontWeight:900, color:'#fff', lineHeight:1, fontVariantNumeric:'tabular-nums',
        textShadow:`0 0 8px ${CYBER}, 0 0 22px rgba(0,229,255,0.6), 0 0 45px rgba(0,229,255,0.25)`,
        animation:'cdNumGlow 2s ease-in-out infinite',
      }}>{value}</span>
      <span style={{ fontSize:10, fontWeight:700, color:`rgba(0,229,255,0.75)`, letterSpacing:.3 }}>{mmLabel}</span>
    </div>
  )
}

function CdColon() {
  return (
    <span style={{
      fontSize:26, fontWeight:900, color:`rgba(0,229,255,0.35)`,
      textShadow:`0 0 10px ${CYBER}`,
      animation:'cdColonBlink 1s ease-in-out infinite',
      alignSelf:'flex-start', marginTop:10, userSelect:'none',
    }}>:</span>
  )
}

function CountdownPanel({ match }) {
  const [secs, setSecs] = useState(() =>
    match?.scheduled_at ? Math.max(0, Math.floor((new Date(match.scheduled_at) - Date.now()) / 1000)) : null
  )
  useEffect(() => {
    if (!match?.scheduled_at) return
    const id = setInterval(() => setSecs(Math.max(0, Math.floor((new Date(match.scheduled_at) - Date.now()) / 1000))), 1000)
    return () => clearInterval(id)
  }, [match?.scheduled_at])

  const pad = (n) => String(n).padStart(2, '0')
  const h = secs != null ? Math.floor(secs / 3600) : 0
  const m = secs != null ? Math.floor((secs % 3600) / 60) : 0
  const s = secs != null ? secs % 60 : 0

  // Show kickoff in Myanmar time (Asia/Rangoon = UTC+6:30) so user's mental math matches the countdown.
  // The rest of the app uses Vietnam time (UTC+7), but here local time avoids the 30-min confusion.
  const kickoffLabel = match?.scheduled_at
    ? new Date(match.scheduled_at).toLocaleString('my-MM', {
        weekday:'short', month:'short', day:'numeric',
        hour:'2-digit', minute:'2-digit', hour12:false,
        timeZone:'Asia/Rangoon',
      })
    : null

  return (
    <div style={{
      aspectRatio:'16/9', position:'relative', overflow:'hidden',
      background:'#06080f',
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
    }}>
      <style>{`
        @keyframes cdGrid  { 0%,100%{opacity:.5} 50%{opacity:.9} }
        @keyframes cdScan  { 0%{top:-2px} 100%{top:100%} }
        @keyframes cdIn    { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes cdShimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
        @keyframes cdNumGlow { 0%,100%{text-shadow:0 0 8px #00e5ff,0 0 22px rgba(0,229,255,.6),0 0 45px rgba(0,229,255,.25)} 50%{text-shadow:0 0 4px #00e5ff,0 0 10px rgba(0,229,255,.3)} }
        @keyframes cdColonBlink { 0%,100%{opacity:.8} 50%{opacity:.2} }
        @keyframes cdBadgeShimmer { 0%{background-position:0% center} 100%{background-position:200% center} }
        @keyframes cdOrb   { 0%,100%{transform:scale(1);opacity:.6} 50%{transform:scale(1.3);opacity:.25} }
      `}</style>

      {/* Dot grid */}
      <div style={{
        position:'absolute', inset:0, pointerEvents:'none',
        backgroundImage:'radial-gradient(circle,rgba(0,229,255,0.12) 1px,transparent 1px)',
        backgroundSize:'24px 24px',
        animation:'cdGrid 5s ease-in-out infinite',
      }}/>

      {/* Sweep scanline */}
      <div style={{
        position:'absolute', left:0, right:0, height:1, pointerEvents:'none',
        background:`linear-gradient(90deg,transparent 0%,${CYBER} 40%,${CYBER} 60%,transparent 100%)`,
        opacity:.12, animation:'cdScan 4s linear infinite',
      }}/>

      {/* Ambient orbs */}
      <div style={{ position:'absolute', width:260, height:260, borderRadius:'50%', top:'-15%', left:'-5%', background:`radial-gradient(circle,rgba(124,58,237,0.22) 0%,transparent 70%)`, animation:'cdOrb 6s ease-in-out infinite', pointerEvents:'none' }}/>
      <div style={{ position:'absolute', width:200, height:200, borderRadius:'50%', bottom:'-10%', right:'-5%', background:`radial-gradient(circle,rgba(0,229,255,0.14) 0%,transparent 70%)`, animation:'cdOrb 7s ease-in-out infinite 1.5s', pointerEvents:'none' }}/>

      {/* HUD corner brackets */}
      {[{top:10,left:10,borderTop:`1.5px solid ${CYBER}`,borderLeft:`1.5px solid ${CYBER}`},{top:10,right:10,borderTop:`1.5px solid ${CYBER}`,borderRight:`1.5px solid ${CYBER}`},{bottom:10,left:10,borderBottom:`1.5px solid ${CYBER}`,borderLeft:`1.5px solid ${CYBER}`},{bottom:10,right:10,borderBottom:`1.5px solid ${CYBER}`,borderRight:`1.5px solid ${CYBER}`}].map((st,i)=>(
        <div key={i} style={{ position:'absolute', width:16, height:16, opacity:.45, pointerEvents:'none', ...st }}/>
      ))}

      {/* "LIVE SOON" shimmering badge */}
      <div style={{ position:'relative', marginBottom:13, animation:'cdIn .3s ease both' }}>
        <div style={{
          border:'1px solid rgba(0,229,255,0.3)',
          borderRadius:4, padding:'5px 18px',
          background:'rgba(0,229,255,0.05)',
        }}>
          <span style={{
            fontSize:11, fontWeight:900, letterSpacing:2.5, textTransform:'uppercase',
            background:'linear-gradient(90deg,#00e5ff,#a78bfa,#fff,#00e5ff)',
            backgroundSize:'300% auto',
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
            backgroundClip:'text',
            animation:'cdBadgeShimmer 2.5s linear infinite',
            display:'block',
          }}>
            ⚡ LIVE SOON · ပွဲစတော့မည်
          </span>
        </div>
      </div>

      {/* Teams */}
      <div style={{ display:'flex', alignItems:'center', gap:18, marginBottom:14, animation:'cdIn .3s ease .06s both', position:'relative' }}>
        <div style={{ textAlign:'center', width:74 }}>
          {match?.home_logo
            ? <img src={match.home_logo} alt="" style={{ width:36,height:36,objectFit:'contain',marginBottom:5,filter:`drop-shadow(0 0 7px rgba(0,229,255,0.5))` }} onError={e=>e.target.style.display='none'}/>
            : <div style={{ width:36,height:36,marginBottom:5 }}/>
          }
          <p style={{ fontSize:11,fontWeight:700,color:'rgba(255,255,255,.85)',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{match?.home_team||'—'}</p>
        </div>
        <div style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:3 }}>
          <span style={{ fontSize:10,fontWeight:900,color:`rgba(0,229,255,0.5)`,letterSpacing:3,
            textShadow:`0 0 8px ${CYBER}` }}>VS</span>
        </div>
        <div style={{ textAlign:'center', width:74 }}>
          {match?.away_logo
            ? <img src={match.away_logo} alt="" style={{ width:36,height:36,objectFit:'contain',marginBottom:5,filter:`drop-shadow(0 0 7px rgba(124,58,237,0.5))` }} onError={e=>e.target.style.display='none'}/>
            : <div style={{ width:36,height:36,marginBottom:5 }}/>
          }
          <p style={{ fontSize:11,fontWeight:700,color:'rgba(255,255,255,.85)',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{match?.away_team||'—'}</p>
        </div>
      </div>

      {/* Digit countdown */}
      {secs != null && (
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12, animation:'cdIn .3s ease .12s both', position:'relative' }}>
          {h > 0 && <><CdDigit value={pad(h)} mmLabel="နာရီ" /><CdColon /></>}
          <CdDigit value={pad(m)} mmLabel="မိနစ်" />
          <CdColon />
          <CdDigit value={pad(s)} mmLabel="စက္ကန့်" />
        </div>
      )}

      {/* Kickoff time */}
      {kickoffLabel && (
        <p style={{ fontSize:12, fontWeight:700, color:`rgba(0,229,255,0.55)`, margin:'0 0 6px', letterSpacing:.5,
          animation:'cdIn .3s ease .18s both', position:'relative' }}>
          ⏱ {kickoffLabel} <span style={{ fontSize:10, opacity:.6 }}>MMT</span>
        </p>
      )}

      {/* Myanmar subtitle — shimmer */}
      <p style={{ margin:0, position:'relative', animation:'cdIn .3s ease .22s both' }}>
        <span style={{
          fontSize:12, fontWeight:600,
          background:'linear-gradient(90deg,rgba(255,255,255,.2),rgba(0,229,255,.7),rgba(255,255,255,.2))',
          backgroundSize:'200% auto',
          WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
          animation:'cdShimmer 3s linear infinite',
          display:'block',
        }}>
          ပွဲစချိန်တွင် အလိုအလျောက် ကြည့်ရှုနိုင်မည်
        </span>
      </p>
    </div>
  )
}

export default function WatchPage() {
  const { id }       = useParams()
  const router       = useRouter()
  const searchParams = useSearchParams()
  const isMainPage   = searchParams.get('from') === 'main-live'
  // Stop stream whenever this page is left — no ref needed, hits the global singleton
  useEffect(() => () => killActiveStream(), [])

  const { ui }      = useConfig()
  const { auth }    = useAuth()
  const isPremium   = auth?.is_premium === true
  const { data: match }                      = useSWR(apiUrl.match(id),   fetcher, { refreshInterval: 60000, revalidateOnFocus: false })
  const token = getToken()
  const streamsUrl = token ? `${apiUrl.streams(id)}?token=${token}` : apiUrl.streams(id)
  const { data: streams, isLoading: streamsLoading } = useSWR(streamsUrl, fetcher, { refreshInterval: 120000, keepPreviousData: true, revalidateOnFocus: false })

  const allUrls = useMemo(() => [
    ...((streams?.HD || []).map((s) => s.url)),
    ...((streams?.SD || []).map((s) => s.url)),
  ], [streams])

  const [activeUrl,    setActiveUrl]    = useState(null)
  const [allExhausted, setAllExhausted] = useState(false)
  const [mainMode,     setMainMode]     = useState(null) // 'soco'|'sd'|'hd' for main-live
  const initializedRef = useRef(false)
  const allUrlsRef     = useRef([])

  const urlBase = (url) => url ? url.split('?')[0] : ''

  // Keep allUrlsRef in sync — lets handleError read latest urls without being a dependency
  useEffect(() => { allUrlsRef.current = allUrls }, [allUrls])

  // main-live: init mode once match+streams load; update activeUrl when mode changes
  useEffect(() => {
    if (!isMainPage) return
    if (mainMode === null && (match || streams)) {
      if (match?.stream_page_url) setMainMode('soco')
      else if (streams?.SD?.length) setMainMode('sd')
      else if (streams?.HD?.length) setMainMode('hd')
    }
  }, [isMainPage, match, streams, mainMode])

  useEffect(() => {
    if (!isMainPage) return
    if (mainMode === 'sd')       setActiveUrl(streams?.SD?.[0]?.url || null)
    else if (mainMode === 'hd') setActiveUrl(streams?.HD?.[0]?.url || null)
    else                        setActiveUrl(null) // soco iframe — no video URL
  }, [isMainPage, mainMode, streams])

  // When streams load or refresh: keep playing the current URL if it's still in the list.
  // If only the CDN token changed (same base path), keep the old URL — still valid until
  // the health check marks it expired. Only switch when the stream is truly gone.
  useEffect(() => {
    if (isMainPage || !allUrls.length) return
    setAllExhausted(false)
    if (!initializedRef.current) {
      initializedRef.current = true
      try {
        const saved = localStorage.getItem(`watch_url_${id}`)
        if (saved && allUrls.includes(saved)) { setActiveUrl(saved); return }
      } catch (_) {}
      setActiveUrl(allUrls[0])
    } else {
      setActiveUrl((prev) => {
        if (!prev) return allUrls[0]
        if (allUrls.includes(prev)) return prev
        const prevBase = urlBase(prev)
        if (allUrls.some(u => urlBase(u) === prevBase)) return prev
        return allUrls[0]
      })
    }
  }, [allUrls, id, isMainPage])

  // Stable callback — reads allUrlsRef so allUrls is never a dependency.
  // This prevents onError prop from changing on every streams refresh,
  // which would cascade into VideoPlayer's useEffect and restart the stream.
  const handleError = useCallback(() => {
    setActiveUrl((prev) => {
      const urls = allUrlsRef.current
      const idx  = urls.indexOf(prev)
      const next = urls[idx + 1]
      if (next) { setAllExhausted(false); return next }
      setAllExhausted(true)
      return prev
    })
  }, []) // intentionally empty — stable for VideoPlayer's lifetime

  const handleSelect = useCallback((url) => {
    setActiveUrl(url)
    setAllExhausted(false)
    try { localStorage.setItem(`watch_url_${id}`, url) } catch (_) {}
  }, [id])

  return (
    <div style={{ minHeight: '100vh', background: '#0A0E1A' }}>
      {/* Back button + header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: '#0D1220', borderBottom: '1px solid rgba(255,255,255,0.07)',
        padding: '0 14px', height: 52,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <button
          onClick={() => { killActiveStream(); router.back() }}
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', padding: 4, cursor: 'pointer' }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
        </button>
        <span style={{ fontWeight: 700, fontSize: 15, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {match?.title || 'Watch'}
        </span>
        {match && <LiveBadge status={match.status} scheduledAt={match.scheduled_at} />}
        {ui?.telegramUrl && (
          <a
            href={ui.telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
              background: 'rgba(0,136,204,0.15)',
              border: '1px solid rgba(0,136,204,0.3)',
              borderRadius: 20, padding: '5px 10px',
              color: '#29b6f6', textDecoration: 'none',
              fontSize: 12, fontWeight: 700,
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
            {ui.telegramLabel || 'Telegram'}
          </a>
        )}
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 0 80px' }}>
        {/* Video Player / Pre-match Countdown */}
        <div style={{ background: '#000' }}>
          {match && match.status !== 'live'
            ? <CountdownPanel match={match} />
            : isMainPage && mainMode === 'soco' && match?.stream_page_url
            ? (
              <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#000' }}>
                <iframe
                  key={match.stream_page_url}
                  src={`https://canetads.com${match.stream_page_url}`}
                  style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                  allowFullScreen
                  allow="autoplay; encrypted-media; fullscreen"
                  referrerPolicy="no-referrer"
                  sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
                />
              </div>
            )
            : activeUrl
            ? <VideoPlayer url={activeUrl} isLive={match?.status === 'live'} onError={handleError} allExhausted={allExhausted} />
            : streamsLoading
            ? (
              <div style={{ aspectRatio: '16/9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, background: '#000' }}>
                <div className="spinner" />
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Loading stream…</span>
              </div>
            )
            : (
              <div style={{ aspectRatio: '16/9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, background: '#0a0a0a', padding: '0 24px', textAlign: 'center' }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="rgba(255,255,255,0.15)"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.6)', margin: 0 }}>No servers available yet</p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: 0, lineHeight: 1.6 }}>Stream will appear at kickoff</p>
              </div>
            )
          }
        </div>

        {/* Match info — gaming style */}
        {match && (
          <div style={{
            position:'relative', overflow:'hidden',
            background:'linear-gradient(135deg,rgba(0,229,255,0.04) 0%,rgba(6,8,15,0.9) 50%,rgba(124,58,237,0.04) 100%)',
            borderBottom:'1px solid rgba(0,229,255,0.1)',
            padding:'12px 16px',
          }}>
            {/* Subtle top accent line */}
            <div style={{ position:'absolute',top:0,left:0,right:0,height:1,background:'linear-gradient(90deg,transparent,rgba(0,229,255,0.4),transparent)' }}/>

            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              {/* Home logo with cyber glow */}
              <div style={{ flexShrink:0, filter:'drop-shadow(0 0 6px rgba(0,229,255,0.35))' }}>
                <TeamLogo src={match.home_logo} name={match.home_team} />
              </div>

              <div style={{ flex:1, minWidth:0 }}>
                <p style={{
                  fontWeight:800, fontSize:14,
                  overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                  background:'linear-gradient(90deg,#fff 60%,rgba(0,229,255,0.7))',
                  WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
                  margin:0,
                }}>
                  {match.title}
                </p>
                <p style={{ fontSize:11, color:'rgba(0,229,255,0.55)', marginTop:4, fontWeight:600, letterSpacing:.3, margin:'4px 0 0' }}>
                  {match.status === 'live'
                    ? <span style={{ color:'#4ade80', textShadow:'0 0 8px rgba(74,222,128,0.6)', fontWeight:700 }}>● Live</span>
                    : match.scheduled_at
                    ? `⏱ ${formatDate(match.scheduled_at)} · ${formatTime(match.scheduled_at)}`
                    : ''}
                </p>
              </div>

              {/* Away logo with purple glow */}
              <div style={{ flexShrink:0, filter:'drop-shadow(0 0 6px rgba(124,58,237,0.35))' }}>
                <TeamLogo src={match.away_logo} name={match.away_team} />
              </div>
            </div>
          </div>
        )}

        {/* Stream selector — only shown for live matches */}
        {match?.status === 'live' && isMainPage ? (
          <div style={{ padding: '14px 16px', display: 'flex', gap: 10 }}>
            {/* SOCO button */}
            {match?.stream_page_url && (() => {
              const active = mainMode === 'soco'
              return (
                <button onClick={() => { killActiveStream(); setMainMode('soco') }} style={{
                  flex: 1, padding: '12px 8px', borderRadius: 12, cursor: 'pointer',
                  border: `1.5px solid ${active ? '#ff4444' : 'rgba(255,68,68,0.3)'}`,
                  background: active ? 'rgba(255,68,68,0.18)' : 'rgba(255,68,68,0.07)',
                  boxShadow: active ? '0 0 18px rgba(255,68,68,0.3)' : 'none',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  transition: 'all .15s',
                }}>
                  <span style={{ fontSize: 18 }}>🔴</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: active ? '#ff6b6b' : 'rgba(255,255,255,0.5)' }}>SOCO</span>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>Live</span>
                </button>
              )
            })()}
            {/* SD button */}
            {streams?.SD?.length > 0 && (() => {
              const active = mainMode === 'sd'
              return (
                <button onClick={() => { killActiveStream(); setMainMode('sd') }} style={{
                  flex: 1, padding: '12px 8px', borderRadius: 12, cursor: 'pointer',
                  border: `1.5px solid ${active ? '#a78bfa' : 'rgba(167,139,250,0.3)'}`,
                  background: active ? 'rgba(167,139,250,0.18)' : 'rgba(167,139,250,0.07)',
                  boxShadow: active ? '0 0 18px rgba(167,139,250,0.3)' : 'none',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  transition: 'all .15s',
                }}>
                  <span style={{ fontSize: 18 }}>📺</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: active ? '#a78bfa' : 'rgba(255,255,255,0.5)' }}>SD</span>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>China</span>
                </button>
              )
            })()}
            {/* HD button */}
            {streams?.HD?.length > 0 && (() => {
              const active = mainMode === 'hd'
              return (
                <button onClick={() => { killActiveStream(); setMainMode('hd') }} style={{
                  flex: 1, padding: '12px 8px', borderRadius: 12, cursor: 'pointer',
                  border: `1.5px solid ${active ? '#e879f9' : 'rgba(232,121,249,0.3)'}`,
                  background: active ? 'rgba(232,121,249,0.18)' : 'rgba(232,121,249,0.07)',
                  boxShadow: active ? '0 0 18px rgba(232,121,249,0.3)' : 'none',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  transition: 'all .15s',
                }}>
                  <span style={{ fontSize: 18 }}>🎬</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: active ? '#e879f9' : 'rgba(255,255,255,0.5)' }}>HD</span>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>China</span>
                </button>
              )
            })()}
          </div>
        ) : match?.status === 'live' ? (
          <div style={{ padding: 16 }}>
            <ServerSelector
              streams={streams || { SD: [], HD: [] }}
              activeUrl={activeUrl}
              onSelect={handleSelect}
            />
          </div>
        ) : null}
        {!isPremium && <AdBanner page="watch" slot="watch_below_player" style={{ padding: '12px 16px 0' }} />}
      </div>
    </div>
  )
}
