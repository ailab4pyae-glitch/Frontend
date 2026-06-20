'use client'
import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import useSWR from 'swr'
import { fetcher, apiUrl, formatDate } from '@/lib/api'
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

function CdDigit({ value, mmLabel }) {
  return (
    <div style={{
      display:'flex', flexDirection:'column', alignItems:'center', gap:4,
      background:'linear-gradient(180deg,rgba(0,229,255,0.07) 0%,rgba(0,229,255,0.02) 100%)',
      border:`1px solid rgba(0,229,255,0.22)`,
      borderRadius:10, padding:'clamp(7px,2vw,10px) clamp(10px,3.5vw,15px)', minWidth:'clamp(44px,12vw,58px)', position:'relative', overflow:'hidden',
      boxShadow:'0 0 18px rgba(0,229,255,0.08), inset 0 0 12px rgba(0,229,255,0.04)',
    }}>
      <div style={{ position:'absolute',top:0,left:'15%',right:'15%',height:1,background:`linear-gradient(90deg,transparent,${CYBER},transparent)`,opacity:.7 }}/>
      <span style={{
        fontSize:'clamp(24px,7.5vw,34px)', fontWeight:900, color:'#fff', lineHeight:1, fontVariantNumeric:'tabular-nums',
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
      fontSize:'clamp(18px,5.5vw,26px)', fontWeight:900, color:`rgba(0,229,255,0.35)`,
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
      position:'relative', overflow:'hidden',
      background:'#06080f',
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      padding:'clamp(18px,5vw,24px) 20px clamp(16px,5vw,22px)',
      minHeight:'clamp(240px,56.25vw,405px)',
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

      {/* Digit countdown — live ticking when scheduled_at known */}
      {secs != null && secs > 0 ? (
        <div style={{ display:'flex', alignItems:'center', gap:'clamp(4px,1.5vw,8px)', marginBottom:12, animation:'cdIn .3s ease .12s both', position:'relative' }}>
          {h > 0 && <><CdDigit value={pad(h)} mmLabel="နာရီ" /><CdColon /></>}
          <CdDigit value={pad(m)} mmLabel="မိနစ်" />
          <CdColon />
          <CdDigit value={pad(s)} mmLabel="စက္ကန့်" />
        </div>
      ) : (
        /* No scheduled time — pulsing placeholder */
        <div style={{ display:'flex', alignItems:'center', gap:'clamp(4px,1.5vw,8px)', marginBottom:12, animation:'cdIn .3s ease .12s both', position:'relative', opacity:.5 }}>
          <CdDigit value="--" mmLabel="နာရီ" />
          <CdColon />
          <CdDigit value="--" mmLabel="မိနစ်" />
          <CdColon />
          <CdDigit value="--" mmLabel="စက္ကန့်" />
        </div>
      )}

      {/* Kickoff time label */}
      <p style={{ fontSize:12, fontWeight:700, color:`rgba(0,229,255,0.55)`, margin:'0 0 6px', letterSpacing:.5,
        animation:'cdIn .3s ease .18s both', position:'relative' }}>
        {kickoffLabel ? `⏱ ${kickoffLabel} MMT` : '⏱ ပွဲချိန် မသတ်မှတ်ရသေး'}
      </p>

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
  const fromTab      = searchParams.get('from')
  const isHesgoal    = fromTab === 'hesgoal-live' || fromTab === 'main-live'
  const isChinaLive  = fromTab === 'china-live'
  // Stop stream whenever this page is left — no ref needed, hits the global singleton
  useEffect(() => () => killActiveStream(), [])

  const { ui }      = useConfig()
  const { auth }    = useAuth()
  const isPremium   = auth?.is_premium === true
  const { data: match }                      = useSWR(apiUrl.match(id),   fetcher, { refreshInterval: 60000, revalidateOnFocus: false })
  const token = getToken()
  const streamsUrl = (() => {
    const params = new URLSearchParams()
    if (token) params.set('token', token)
    if (isHesgoal) params.set('includeHesgoal', 'true')
    const qs = params.toString()
    return qs ? `${apiUrl.streams(id)}?${qs}` : apiUrl.streams(id)
  })()
  const { data: streams, isLoading: streamsLoading, mutate: mutateStreams } = useSWR(streamsUrl, fetcher, { refreshInterval: 120000, keepPreviousData: true, revalidateOnFocus: false })

  const allUrls = useMemo(() => [
    ...((streams?.HD      || []).map((s) => s.url)),
    ...((streams?.SD      || []).map((s) => s.url)),
    ...((streams?.hesgoal || []).map((s) => s.url)),
  ], [streams])

  const [activeUrl,      setActiveUrl]      = useState(null)
  const [allExhausted,   setAllExhausted]   = useState(false)
  const [mainMode,       setMainMode]       = useState(null) // 'soco'|'sd'|'hd'|'hesgoal' for main-live
  const [retryCountdown, setRetryCountdown] = useState(null) // null | 1..10
  const [isRefreshing,   setIsRefreshing]   = useState(false)
  const [playerKey,      setPlayerKey]      = useState(0)   // increment to force VideoPlayer remount
  const [autoRestart,    setAutoRestart]    = useState(false)
  const initializedRef = useRef(false)
  const allUrlsRef     = useRef([])

  const urlBase = (url) => url ? url.split('?')[0] : ''

  // Keep allUrlsRef in sync — lets handleError read latest urls without being a dependency
  useEffect(() => { allUrlsRef.current = allUrls }, [allUrls])

  // main-live: init mode once match+streams load; update activeUrl when mode changes
  useEffect(() => {
    if (!isHesgoal) return
    if (mainMode === null && (match || streams)) {
      const eng720  = streams?.hesgoal?.find(s => s.label === 'English 720')
      const eng1080 = streams?.hesgoal?.find(s => s.label === 'English 1080')
      const arHd    = streams?.hesgoal?.find(s => s.label?.startsWith('Mobile'))
      if (eng720)                      setMainMode('eng-720')
      else if (eng1080)                setMainMode('eng-1080')
      else if (arHd)                   setMainMode('ar-hd')
      else if (streams?.HD?.length)    setMainMode('china-hd')
      else if (streams?.SD?.length)    setMainMode('china-sd')
      else if (match?.stream_page_url) setMainMode('soco')
    }
  }, [isHesgoal, match, streams, mainMode])

  useEffect(() => {
    if (!isHesgoal) return
    const eng1080 = streams?.hesgoal?.find(s => s.label === 'English 1080')
    const eng720  = streams?.hesgoal?.find(s => s.label === 'English 720')
    const arHd    = streams?.hesgoal?.find(s => s.label?.startsWith('Mobile'))
    if (mainMode === 'eng-1080')      setActiveUrl(eng1080?.url || null)
    else if (mainMode === 'eng-720')  setActiveUrl(eng720?.url || null)
    else if (mainMode === 'ar-hd')    setActiveUrl(arHd?.url || null)
    else if (mainMode === 'china-hd') setActiveUrl(streams?.HD?.[0]?.url || null)
    else if (mainMode === 'china-sd') setActiveUrl(streams?.SD?.[0]?.url || null)
    else                              setActiveUrl(null) // soco iframe — no video URL
  }, [isHesgoal, mainMode, streams])

  // When streams load or refresh: if CDN token changed (same base path, different full URL)
  // → auto-switch to the fresh URL. This picks up re-warm tokens without user action.
  useEffect(() => {
    if (isHesgoal || !allUrls.length) return
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
        // Exact match — still playing, no change needed
        if (allUrls.includes(prev)) return prev
        // Base path matches but token changed (re-warm) — switch to fresh URL silently
        const prevBase = urlBase(prev)
        const refreshed = allUrls.find(u => urlBase(u) === prevBase)
        if (refreshed) return refreshed
        return allUrls[0]
      })
    }
  }, [allUrls, id, isHesgoal])

  const mutateStreamsRef = useRef(mutateStreams)
  useEffect(() => { mutateStreamsRef.current = mutateStreams }, [mutateStreams])

  // Fetch fresh stream URLs then reset player to restart from server 1.
  const doRefresh = useCallback(() => {
    setRetryCountdown(null)
    setIsRefreshing(true)
    mutateStreamsRef.current()
      .then((data) => {
        // Only reset exhausted if we actually got new streams back
        const hasStreams = data?.SD?.length || data?.HD?.length || data?.embed?.length || data?.hesgoal?.length
        if (hasStreams) {
          setAllExhausted(false)
          initializedRef.current = false
          // Force VideoPlayer remount so it restarts even if the proxy URL is unchanged.
          // Without this, the url prop stays the same → useEffect([url]) never fires →
          // player stays frozen on the error screen (most visible on mobile).
          setAutoRestart(true)
          setPlayerKey((k) => k + 1)
        }
      })
      .catch(() => {})
      .finally(() => setIsRefreshing(false))
  }, [])

  // When all servers fail: 10s countdown then auto-refresh.
  // Visible countdown gives users confidence something is happening.
  useEffect(() => {
    if (!allExhausted) { setRetryCountdown(null); return }
    let n = 10
    setRetryCountdown(n)
    const id = setInterval(() => {
      n -= 1
      if (n <= 0) { clearInterval(id); doRefresh() }
      else setRetryCountdown(n)
    }, 1000)
    return () => clearInterval(id)
  }, [allExhausted, doRefresh])

  // Manual refresh — cancel countdown and fetch immediately.
  const handleRefresh = useCallback(() => {
    setRetryCountdown(null)
    setAllExhausted(false)
    doRefresh()
  }, [doRefresh])

  // Stable callback — reads allUrlsRef so allUrls is never a dependency.
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
    <div style={{ minHeight: '100vh', background: '#ffffff' }}>
      {/* Back button + header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'linear-gradient(135deg, #17134a 0%, #1e1b4b 100%)',
        borderBottom: '1px solid rgba(99,102,241,0.4)',
        boxShadow: '0 2px 20px rgba(99,102,241,0.25)',
        padding: '0 14px', height: 54,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <button
          onClick={() => { killActiveStream(); router.back() }}
          style={{
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 8, color: '#fff', padding: '6px 8px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', flexShrink: 0,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
        </button>
        <span style={{
          fontWeight: 800, fontSize: 15, flex: 1,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          color: '#ffffff',
          textShadow: '0 1px 8px rgba(0,0,0,0.4)',
        }}>
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
              background: 'rgba(41,182,246,0.15)',
              border: '1px solid rgba(41,182,246,0.35)',
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

      <div style={{ maxWidth: 720, margin: '0 auto', paddingBottom: 80 }}>
        {/* spacing between sticky header and player */}
        <div style={{ height: 12 }} />
        {/* Video Player */}
        <div style={{ background: '#000', borderRadius: 12, overflow: 'hidden' }}>
          {match && match.status !== 'live' && !streams?.SD?.length && !streams?.HD?.length && (!match.scheduled_at || new Date(match.scheduled_at) > Date.now())
            ? <CountdownPanel match={match} />
            : isHesgoal && mainMode === 'soco' && match?.stream_page_url
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
            ? <VideoPlayer key={playerKey} url={activeUrl} isLive={match?.status === 'live'} onError={handleError} allExhausted={allExhausted} retryCountdown={retryCountdown} onRefresh={handleRefresh} autoStart={autoRestart} />
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
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  style={{
                    marginTop: 4, background: 'rgba(0,229,255,0.08)',
                    border: '1px solid rgba(0,229,255,0.25)', color: '#00e5ff',
                    borderRadius: 20, padding: '7px 20px', fontSize: 12, fontWeight: 700,
                    cursor: isRefreshing ? 'default' : 'pointer', opacity: isRefreshing ? 0.5 : 1,
                  }}
                >
                  {isRefreshing ? 'Checking…' : '↻ Refresh'}
                </button>
              </div>
            )
          }
        </div>

        {/* Match info */}
        {match && (
          <div style={{
            background: '#f8f7ff',
            borderBottom: '1px solid rgba(99,102,241,0.15)',
            padding: '14px 16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ flexShrink: 0 }}>
                <TeamLogo src={match.home_logo} name={match.home_team} />
              </div>

              <div style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
                <p style={{
                  fontWeight: 800, fontSize: 15, color: '#1e1b4b',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  margin: '0 0 6px',
                }}>
                  {match.title}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  {match.status === 'live' ? (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      background: '#dcfce7', border: '1px solid #86efac',
                      borderRadius: 20, padding: '3px 10px',
                      color: '#16a34a', fontSize: 12, fontWeight: 800,
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a' }} />
                      Live
                    </span>
                  ) : match.scheduled_at ? (
                    <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 600 }}>
                      ⏱ {formatDate(match.scheduled_at)}
                    </span>
                  ) : null}
                  {match.league && (
                    <span style={{
                      fontSize: 11, color: '#4f46e5', fontWeight: 700,
                      background: '#ede9fe', borderRadius: 6, padding: '2px 8px',
                    }}>
                      {match.league}
                    </span>
                  )}
                </div>
              </div>

              <div style={{ flexShrink: 0 }}>
                <TeamLogo src={match.away_logo} name={match.away_team} />
              </div>
            </div>
          </div>
        )}

        {/* VPN tip — above stream selector */}
        {match?.status === 'live' && (
          <div style={{
            margin: '14px 16px 0',
            padding: '11px 14px',
            borderRadius: 10,
            background: 'linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%)',
            border: '1.5px solid #f59e0b',
            display: 'flex', alignItems: 'center', gap: 11,
            boxShadow: '0 2px 8px rgba(245,158,11,0.15)',
          }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
            <div>
              <p style={{ margin: '0 0 1px', fontSize: 12, fontWeight: 800, color: '#92400e' }}>
                VPN လိုအပ်နိုင်သည်
              </p>
              <p style={{ margin: 0, fontSize: 11, color: '#b45309', lineHeight: 1.5 }}>
                ကြည့်လို့မရရင် VPN အဖွင့်အပိတ် လုပ်ပြီးကြည့်ပေးပါ
              </p>
            </div>
          </div>
        )}

        {/* Stream selector — only shown for live matches */}
        {match?.status === 'live' && isHesgoal ? (
          <div style={{
            margin: '12px 16px 0',
            padding: '14px',
            background: '#f3f4f6',
            borderRadius: 14,
            border: '1px solid #e5e7eb',
            display: 'flex', gap: 10, flexWrap: 'wrap',
          }}>
            {/* English HD 1080p — HESGoal fixed Rumble 1080p */}
            {streams?.hesgoal?.find(s => s.label === 'English 1080') && (() => {
              const active = mainMode === 'eng-1080'
              return (
                <button onClick={() => { killActiveStream(); setMainMode('eng-1080') }} style={{
                  flex: 1, padding: '12px 8px', borderRadius: 12, cursor: 'pointer',
                  border: `1.5px solid ${active ? '#00e5ff' : 'rgba(0,229,255,0.3)'}`,
                  background: active ? 'rgba(0,229,255,0.18)' : 'rgba(0,229,255,0.07)',
                  boxShadow: active ? '0 0 18px rgba(0,229,255,0.3)' : 'none',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  transition: 'all .15s',
                }}>
                  <span style={{ fontSize: 18 }}>🏴󠁧󠁢󠁥󠁮󠁧󠁿</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: active ? '#00e5ff' : '#374151' }}>English HD</span>
                  <span style={{ fontSize: 10, color: active ? 'rgba(0,229,255,0.7)' : '#9ca3af' }}>1080p</span>
                </button>
              )
            })()}
            {/* English HD 720p — HESGoal fixed Rumble 720p (DEFAULT) */}
            {streams?.hesgoal?.find(s => s.label === 'English 720') && (() => {
              const active = mainMode === 'eng-720'
              return (
                <button onClick={() => { killActiveStream(); setMainMode('eng-720') }} style={{
                  flex: 1, padding: '12px 8px', borderRadius: 12, cursor: 'pointer',
                  border: `1.5px solid ${active ? '#00e5ff' : 'rgba(0,229,255,0.3)'}`,
                  background: active ? 'rgba(0,229,255,0.18)' : 'rgba(0,229,255,0.07)',
                  boxShadow: active ? '0 0 18px rgba(0,229,255,0.3)' : 'none',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  transition: 'all .15s',
                }}>
                  <span style={{ fontSize: 18 }}>🏴󠁧󠁢󠁥󠁮󠁧󠁿</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: active ? '#00e5ff' : '#374151' }}>English HD</span>
                  <span style={{ fontSize: 10, color: '#9ca3af' }}>720p</span>
                </button>
              )
            })()}
            {/* Arab HD 720p — HESGoal Arabic scraped stream */}
            {streams?.hesgoal?.find(s => s.label?.startsWith('Mobile')) && (() => {
              const active = mainMode === 'ar-hd'
              return (
                <button onClick={() => { killActiveStream(); setMainMode('ar-hd') }} style={{
                  flex: 1, padding: '12px 8px', borderRadius: 12, cursor: 'pointer',
                  border: `1.5px solid ${active ? '#22c55e' : 'rgba(34,197,94,0.3)'}`,
                  background: active ? 'rgba(34,197,94,0.18)' : 'rgba(34,197,94,0.07)',
                  boxShadow: active ? '0 0 18px rgba(34,197,94,0.3)' : 'none',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  transition: 'all .15s',
                }}>
                  <span style={{ fontSize: 18 }}>🇸🇦</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: active ? '#22c55e' : '#374151' }}>Arab HD</span>
                  <span style={{ fontSize: 10, color: '#9ca3af' }}>720p</span>
                </button>
              )
            })()}
            {/* China HD 720p */}
            {streams?.HD?.length > 0 && (() => {
              const active = mainMode === 'china-hd'
              return (
                <button onClick={() => { killActiveStream(); setMainMode('china-hd') }} style={{
                  flex: 1, padding: '12px 8px', borderRadius: 12, cursor: 'pointer',
                  border: `1.5px solid ${active ? '#e879f9' : 'rgba(232,121,249,0.3)'}`,
                  background: active ? 'rgba(232,121,249,0.18)' : 'rgba(232,121,249,0.07)',
                  boxShadow: active ? '0 0 18px rgba(232,121,249,0.3)' : 'none',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  transition: 'all .15s',
                }}>
                  <span style={{ fontSize: 18 }}>🎬</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: active ? '#e879f9' : '#374151' }}>China HD</span>
                  <span style={{ fontSize: 10, color: '#9ca3af' }}>720p</span>
                </button>
              )
            })()}
            {/* China SD 480p */}
            {streams?.SD?.length > 0 && (() => {
              const active = mainMode === 'china-sd'
              return (
                <button onClick={() => { killActiveStream(); setMainMode('china-sd') }} style={{
                  flex: 1, padding: '12px 8px', borderRadius: 12, cursor: 'pointer',
                  border: `1.5px solid ${active ? '#a78bfa' : 'rgba(167,139,250,0.3)'}`,
                  background: active ? 'rgba(167,139,250,0.18)' : 'rgba(167,139,250,0.07)',
                  boxShadow: active ? '0 0 18px rgba(167,139,250,0.3)' : 'none',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  transition: 'all .15s',
                }}>
                  <span style={{ fontSize: 18 }}>📺</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: active ? '#a78bfa' : '#374151' }}>China SD</span>
                  <span style={{ fontSize: 10, color: '#9ca3af' }}>480p</span>
                </button>
              )
            })()}
            {/* SOCO — fallback */}
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
                  <span style={{ fontSize: 12, fontWeight: 800, color: active ? '#ff6b6b' : '#374151' }}>SOCO</span>
                  <span style={{ fontSize: 10, color: '#9ca3af' }}>Live</span>
                </button>
              )
            })()}
          </div>
        ) : match?.status === 'live' ? (
          <div style={{
            margin: '12px 16px 0',
            padding: '16px',
            background: '#f3f4f6',
            borderRadius: 14,
            border: '1px solid #e5e7eb',
          }}>
            {streams?.hesgoal?.length > 0 && !isChinaLive ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#4f46e5', letterSpacing: 1, textTransform: 'uppercase' }}>Select Channel</span>
                  <button onClick={handleRefresh} disabled={isRefreshing} style={{ background: '#ede9fe', border: '1px solid #c4b5fd', borderRadius: 8, padding: '4px 10px', color: '#4f46e5', fontSize: 11, fontWeight: 700, cursor: 'pointer', opacity: isRefreshing ? 0.5 : 1 }}>
                    {isRefreshing ? 'Loading…' : '↻ Refresh'}
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                  {streams.hesgoal.map((s, i) => {
                    const active = activeUrl === s.url
                    return (
                      <button key={s.id} onClick={() => { killActiveStream(); setActiveUrl(s.url) }} style={{
                        padding: '14px 10px', borderRadius: 10, cursor: 'pointer',
                        border: `1.5px solid ${active ? '#4f46e5' : 'rgba(99,102,241,0.2)'}`,
                        background: active ? '#ede9fe' : '#f8f7ff',
                        color: active ? '#4f46e5' : '#374151',
                        fontSize: 13, fontWeight: 700, textAlign: 'center',
                        boxShadow: active ? '0 4px 14px rgba(99,102,241,0.2)' : 'none',
                        transition: 'all .15s',
                      }}>
                        {s.label || `Server ${i + 1}`}
                      </button>
                    )
                  })}
                </div>
              </>
            ) : (
              <ServerSelector
                streams={streams || { SD: [], HD: [] }}
                activeUrl={activeUrl}
                onSelect={handleSelect}
                onRefresh={handleRefresh}
                isRefreshing={isRefreshing}
              />
            )}
          </div>
        ) : null}

        {!isPremium && <AdBanner page="watch" slot="watch_below_player" style={{ padding: '12px 16px 0' }} />}

        {/* Telegram join card */}
        {ui?.telegramUrl && (
          <div style={{
            margin: '16px 16px 0',
            padding: '16px',
            borderRadius: 14,
            background: 'linear-gradient(135deg, #e0f2fe 0%, #dbeafe 100%)',
            border: '1.5px solid #93c5fd',
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            {/* Telegram icon */}
            <div style={{
              width: 48, height: 48, borderRadius: 12, flexShrink: 0,
              background: 'linear-gradient(135deg, #0088cc, #0099dd)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(0,136,204,0.3)',
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
            </div>

            {/* Text */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: '0 0 3px', fontSize: 14, fontWeight: 800, color: '#1e3a5f' }}>
                Join our Telegram
              </p>
              <p style={{ margin: 0, fontSize: 12, color: '#3b6ea8', lineHeight: 1.4 }}>
                Get stream updates &amp; latest match links
              </p>
            </div>

            {/* Button */}
            <a
              href={ui.telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                flexShrink: 0,
                display: 'inline-flex', alignItems: 'center', gap: 5,
                background: 'linear-gradient(135deg, #0088cc, #006bb3)',
                border: 'none', borderRadius: 22,
                padding: '9px 18px',
                color: '#fff', fontSize: 13, fontWeight: 800,
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(0,136,204,0.35)',
                whiteSpace: 'nowrap',
              }}
            >
              Join →
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
