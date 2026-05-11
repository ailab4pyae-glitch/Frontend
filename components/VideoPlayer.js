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

const RotateIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16.48 2.52c3.27 1.55 5.61 4.72 5.97 8.48h1.5C23.44 4.84 18.29 0 12 0l-.66.03 3.81 3.81 1.33-1.32zm-6.25-.77c-.59-.59-1.54-.59-2.12 0L1.75 8.11c-.59.59-.59 1.54 0 2.12l12.02 12.02c.59.59 1.54.59 2.12 0l6.36-6.36c.59-.59.59-1.54 0-2.12L10.23 1.75zm4.6 19.44L2.81 9.17l6.36-6.36 12.02 12.02-6.36 6.36zm-7.31.29C4.25 19.94 1.91 16.76 1.55 13H.05C.56 19.16 5.71 24 12 24l.66-.03-3.81-3.81-1.33 1.32z"/>
  </svg>
)

export default function VideoPlayer({ url, isLive = false, onError, allExhausted = false }) {
  const videoRef       = useRef(null)
  const hlsRef         = useRef(null)
  const flvRef         = useRef(null)
  const plyrRef        = useRef(null)
  const timersRef      = useRef([])
  const loadTimeoutRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(false)

  const handleRotate = useCallback(async () => {
    const el = videoRef.current
    if (!el) return
    try {
      await el.requestFullscreen()
      if (screen.orientation?.lock) await screen.orientation.lock('landscape').catch(() => {})
    } catch (_) {}
  }, [])

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearInterval)
    timersRef.current = []
    if (loadTimeoutRef.current) { clearTimeout(loadTimeoutRef.current); loadTimeoutRef.current = null }
  }, [])

  const handleError = useCallback(() => {
    clearTimers()
    if (onError && !allExhausted) {
      // more servers available — switch silently, keep spinner visible
      setLoading(true)
      setError(false)
      onError()
    } else {
      // last server exhausted — show error screen
      setError(true)
      setLoading(false)
    }
  }, [onError, allExhausted, clearTimers])

  const destroyStream = useCallback(() => {
    clearTimers()
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null }
    if (flvRef.current) {
      try { flvRef.current.unload(); flvRef.current.detachMediaElement(); flvRef.current.destroy() } catch (_) {}
      flvRef.current = null
    }
  }, [clearTimers])

  // Stall detector — if currentTime doesn't move for 8 × 5s = 40s → error
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

  // Plyr — initialise once on mount, destroy on unmount
  useEffect(() => {
    if (!videoRef.current) return
    let cancelled = false
    let plyr = null

    ;(async () => {
      const Plyr = (await import('plyr')).default
      if (cancelled || !videoRef.current) return
      plyr = new Plyr(videoRef.current, {
        controls: ['play', 'progress', 'current-time', 'mute', 'volume', 'fullscreen'],
        hideControls: true,
        resetOnEnd: false,
        keyboard: { focused: true, global: false },
        tooltips: { controls: false, seek: false },
        fullscreen: { enabled: true, fallback: true, iosNative: false },
      })
      plyrRef.current = plyr
    })()

    return () => {
      cancelled = true
      if (plyr) { try { plyr.destroy() } catch (_) {} }
      plyrRef.current = null
    }
  }, []) // once per mount (component is keyed by url in watch page)

  // Stream loading
  useEffect(() => {
    if (!url || !videoRef.current) return
    const video = videoRef.current
    setLoading(true)
    setError(false)
    destroyStream()

    const tier = getNetworkTier()
    let ready = false

    const onReady = () => {
      if (ready) return
      ready = true
      if (loadTimeoutRef.current) { clearTimeout(loadTimeoutRef.current); loadTimeoutRef.current = null }
      setLoading(false)
      video.play().catch(() => {})
      startStallDetector(video)
      if (isLive) startLiveCatchup(video)
    }

    loadTimeoutRef.current = setTimeout(() => { if (!ready) handleError() }, 40000)

    if (isFlv(url)) {
      ;(async () => {
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
      })()
    } else {
      ;(async () => {
        const Hls = (await import('hls.js')).default
        if (Hls.isSupported()) {
          const cfg = isLive
            ? {
                maxBufferLength:                8,
                maxMaxBufferLength:             16,
                liveSyncDurationCount:          2,
                liveMaxLatencyDurationCount:    6,
                backBufferLength:               4,
                manifestLoadingMaxRetry:        1,
                fragLoadingMaxRetry:            2,
                manifestLoadingMaxRetryTimeout: 2000,
                fragLoadingMaxRetryTimeout:     2000,
                nudgeMaxRetry:                  3,
                enableWorker:                   true,
              }
            : {
                maxBufferLength:                tier === 'slow' ? 90  : 60,
                maxMaxBufferLength:             tier === 'slow' ? 180 : 120,
                startLevel:                     tier === 'slow' ? 0   : -1,
                abrEwmaDefaultEstimate:         tier === 'slow' ? 300000 : 1000000,
                backBufferLength:               tier === 'slow' ? 30  : 15,
                manifestLoadingMaxRetry:        1,
                fragLoadingMaxRetry:            2,
                manifestLoadingMaxRetryTimeout: 2000,
                fragLoadingMaxRetryTimeout:     2000,
                enableWorker:                   true,
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
      })()
    }

    return () => destroyStream()
  }, [url, isLive, handleError, destroyStream, startStallDetector, startLiveCatchup])

  return (
    <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#000', borderRadius: 12, overflow: 'hidden' }}>
      <video
        ref={videoRef}
        playsInline
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
      />

      {/* Rotate button — sits above Plyr controls bar (~44px) */}
      {!loading && !error && (
        <button
          onClick={handleRotate}
          style={{
            position: 'absolute', bottom: 52, right: 10, zIndex: 20,
            background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
            border: '1px solid rgba(255,255,255,0.18)', borderRadius: 8,
            color: '#fff', padding: '6px 8px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          title="Rotate to landscape"
        >
          <RotateIcon />
        </button>
      )}

      {loading && !error && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 30,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 14, background: '#000',
        }}>
          <div className="spinner" />
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Connecting to stream…</span>
        </div>
      )}

      {error && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 30,
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
