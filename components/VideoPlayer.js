'use client'
import { useEffect, useRef, useState, useCallback } from 'react'

const isFlv = (url) => /\.flv(\?|$)/i.test(url)

const getNetworkTier = () => {
  if (typeof navigator === 'undefined') return 'medium'
  const c = navigator.connection || navigator.mozConnection || navigator.webkitConnection
  if (!c) return 'medium'
  if (c.effectiveType === '4g' && c.downlink > 4) return 'fast'
  if (c.effectiveType === 'slow-2g' || c.effectiveType === '2g' || c.downlink < 1) return 'slow'
  if (c.effectiveType === '3g' || c.downlink < 2) return 'slow'
  return 'medium'
}

export default function VideoPlayer({ url, isLive = false, onError }) {
  const videoRef  = useRef(null)
  const hlsRef    = useRef(null)
  const flvRef    = useRef(null)
  const timersRef = useRef([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(false)

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearInterval)
    timersRef.current = []
  }, [])

  const handleError = useCallback(() => {
    setError(true)
    setLoading(false)
    clearTimers()
    onError?.()
  }, [onError, clearTimers])

  const destroyPlayers = useCallback(() => {
    clearTimers()
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null }
    if (flvRef.current) {
      try { flvRef.current.unload(); flvRef.current.detachMediaElement(); flvRef.current.destroy() } catch (_) {}
      flvRef.current = null
    }
  }, [clearTimers])

  // Stall detector — if currentTime doesn't move for 8 × 5s = 40s → switch server
  const startStallDetector = useCallback((video) => {
    let lastTime = -1, stallCount = 0
    const id = setInterval(() => {
      if (video.paused || video.ended) return
      if (video.currentTime === lastTime) {
        if (++stallCount >= 8) handleError()
      } else {
        stallCount = 0
      }
      lastTime = video.currentTime
    }, 5000)
    timersRef.current.push(id)
  }, [handleError])

  // Live catchup — if lag > 8s behind buffered end, jump to live edge
  const startLiveCatchup = useCallback((video) => {
    const id = setInterval(() => {
      if (video.paused || !video.buffered.length) return
      const bufferedEnd = video.buffered.end(video.buffered.length - 1)
      if (bufferedEnd - video.currentTime > 8) video.currentTime = bufferedEnd - 1
    }, 4000)
    timersRef.current.push(id)
  }, [])

  useEffect(() => {
    if (!url || !videoRef.current) return
    const video = videoRef.current
    setLoading(true)
    setError(false)
    destroyPlayers()

    const tier = getNetworkTier()
    let ready = false

    const onReady = () => {
      if (ready) return
      ready = true
      setLoading(false)
      video.play().catch(() => {})
      startStallDetector(video)
      if (isLive) startLiveCatchup(video)
    }

    // Hard load timeout — if stream hasn't started in 40s, switch
    const loadTimeout = setTimeout(() => { if (!ready) handleError() }, 40000)
    timersRef.current.push(loadTimeout)

    if (isFlv(url)) {
      // ── FLV ────────────────────────────────────────────────────────────────
      const initFlv = async () => {
        const flvjs = (await import('flv.js')).default
        if (!flvjs.isSupported()) { handleError(); return }
        const player = flvjs.createPlayer(
          { type: 'flv', url, isLive, cors: true, withCredentials: false },
          {
            enableWorker:             true,
            enableStashBuffer:        !isLive,
            stashInitialSize:         isLive ? 384 : (tier === 'slow' ? 1024 : 512),
            lazyLoad:                 false,
            deferLoadAfterSourceOpen: false,
          }
        )
        flvRef.current = player
        player.attachMediaElement(video)
        player.load()
        player.on(flvjs.Events.ERROR, () => handleError())
        player.on(flvjs.Events.MEDIA_INFO, () => onReady())
      }
      initFlv()
    } else {
      // ── HLS ────────────────────────────────────────────────────────────────
      const initHls = async () => {
        const Hls = (await import('hls.js')).default
        if (Hls.isSupported()) {
          const cfg = isLive
            ? {
                maxBufferLength:              8,
                maxMaxBufferLength:           16,
                liveSyncDurationCount:        2,
                liveMaxLatencyDurationCount:  6,
                backBufferLength:             4,
                // Fewer retries = faster failure detection (was 4+6 retries ~15s)
                manifestLoadingMaxRetry:      1,
                fragLoadingMaxRetry:          2,
                manifestLoadingMaxRetryTimeout: 2000,
                fragLoadingMaxRetryTimeout:   2000,
                nudgeMaxRetry:                3,
                enableWorker:                 true,
              }
            : {
                maxBufferLength:            tier === 'slow' ? 90  : 60,
                maxMaxBufferLength:         tier === 'slow' ? 180 : 120,
                startLevel:                 tier === 'slow' ? 0   : -1,
                abrEwmaDefaultEstimate:     tier === 'slow' ? 300000 : 1000000,
                backBufferLength:           tier === 'slow' ? 30  : 15,
                manifestLoadingMaxRetry:    1,
                fragLoadingMaxRetry:        2,
                manifestLoadingMaxRetryTimeout: 2000,
                fragLoadingMaxRetryTimeout: 2000,
                enableWorker:               true,
              }

          const hls = new Hls(cfg)
          hlsRef.current = hls
          hls.loadSource(url)
          hls.attachMedia(video)
          hls.on(Hls.Events.MANIFEST_PARSED, () => onReady())
          hls.on(Hls.Events.ERROR, (_, data) => { if (data.fatal) handleError() })
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = url
          video.addEventListener('loadedmetadata', function onMeta() {
            video.removeEventListener('loadedmetadata', onMeta)
            onReady()
          })
          video.addEventListener('error', handleError, { once: true })
        } else {
          handleError()
        }
      }
      initHls()
    }

    return () => destroyPlayers()
  }, [url, isLive, handleError, destroyPlayers, startStallDetector, startLiveCatchup])

  return (
    <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#000', borderRadius: 12, overflow: 'hidden' }}>
      <video
        ref={videoRef}
        playsInline
        controls
        style={{ width: '100%', height: '100%', objectFit: 'contain', display: error ? 'none' : 'block' }}
      />

      {isLive && !loading && !error && (
        <div style={{
          position: 'absolute', top: 12, left: 12,
          display: 'flex', alignItems: 'center', gap: 5,
          background: 'rgba(255,68,68,0.85)', backdropFilter: 'blur(4px)',
          borderRadius: 20, padding: '3px 10px',
          fontSize: 11, fontWeight: 800, letterSpacing: 1, color: '#fff',
        }}>
          <span className="live-dot" /> LIVE
        </div>
      )}

      {loading && !error && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 14, background: '#000',
        }}>
          <div className="spinner" />
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Connecting to stream…</span>
        </div>
      )}

      {error && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 14, background: '#0a0e1a', padding: 24, textAlign: 'center',
        }}>
          <div style={{ fontSize: 40 }}>📡</div>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>Stream unavailable</p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Try another server below</p>
          {onError && (
            <button onClick={onError} style={{
              marginTop: 4, background: 'rgba(0,255,135,0.12)',
              border: '1px solid rgba(0,255,135,0.3)', color: '#00FF87',
              borderRadius: 20, padding: '8px 20px', fontSize: 13, fontWeight: 700,
            }}>
              Try Next Server
            </button>
          )}
        </div>
      )}
    </div>
  )
}
