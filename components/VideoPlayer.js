'use client'
import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react'
import { activeStream, killActiveStream } from '@/lib/player'

const isHls    = (url) => /\.m3u8(\?|$)/i.test(url) || /\/proxy\/stream\//i.test(url)
const isIframe = (url) => url && !isHls(url)
const SWITCH_DELAY = 3

const getNetworkTier = () => {
  if (typeof navigator === 'undefined') return 'medium'
  const c = navigator.connection || navigator.mozConnection || navigator.webkitConnection
  if (!c) return 'medium'
  if (c.effectiveType === 'slow-2g' || c.effectiveType === '2g' || c.downlink < 0.8) return 'slow'
  if (c.effectiveType === '3g' || c.downlink < 2.5) return 'slow'
  if (c.effectiveType === '4g' && c.downlink > 4) return 'fast'
  return 'medium'
}

const RotateIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16.48 2.52c3.27 1.55 5.61 4.72 5.97 8.48h1.5C23.44 4.84 18.29 0 12 0l-.66.03 3.81 3.81 1.33-1.32zm-6.25-.77c-.59-.59-1.54-.59-2.12 0L1.75 8.11c-.59.59-.59 1.54 0 2.12l12.02 12.02c.59.59 1.54.59 2.12 0l6.36-6.36c.59-.59.59-1.54 0-2.12L10.23 1.75zm4.6 19.44L2.81 9.17l6.36-6.36 12.02 12.02-6.36 6.36zm-7.31.29C4.25 19.94 1.91 16.76 1.55 13H.05C.56 19.16 5.71 24 12 24l.66-.03-3.81-3.81-1.33 1.32z"/>
  </svg>
)

const VideoPlayer = forwardRef(function VideoPlayer({ url, isLive = false, onError, allExhausted = false, retryCountdown = null, onRefresh }, ref) {
  const containerRef    = useRef(null)
  const videoRef        = useRef(null)
  const hlsRef          = useRef(null)
  const plyrRef         = useRef(null)
  const timersRef       = useRef([])
  const loadTimeoutRef  = useRef(null)
  const countdownRef    = useRef(null)
  const mountedRef      = useRef(true)
  const allExhaustedRef = useRef(allExhausted)
  const onErrorRef      = useRef(onError)
  const iosCleanupRef   = useRef(null)

  const [started,   setStarted]   = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState(false)
  const [countdown, setCountdown] = useState(null)

  useEffect(() => { allExhaustedRef.current = allExhausted }, [allExhausted])
  useEffect(() => { onErrorRef.current = onError },           [onError])

  const handlePlay = useCallback(() => {
    setStarted(true)
    setLoading(true)
    setError(false)
  }, [])

  const handleRotate = useCallback(() => {
    const video     = videoRef.current
    const container = containerRef.current
    if (!video && !container) return
    try {
      if (video?.webkitEnterFullscreen) {
        video.webkitEnterFullscreen()
        return
      }
      const target    = container ?? video
      const fsPromise = target.requestFullscreen?.()
        ?? target.webkitRequestFullscreen?.()
        ?? target.mozRequestFullScreen?.()
      if (fsPromise && screen.orientation?.lock) {
        fsPromise.then(() => screen.orientation.lock('landscape').catch(() => {})).catch(() => {})
      }
    } catch (_) {}
  }, [])

  const clearCountdown = useCallback(() => {
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null }
    setCountdown(null)
  }, [])

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearInterval)
    timersRef.current = []
    if (loadTimeoutRef.current) { clearTimeout(loadTimeoutRef.current); loadTimeoutRef.current = null }
  }, [])

  const switchServer = useCallback(() => {
    clearCountdown()
    clearTimers()
    if (onErrorRef.current && !allExhaustedRef.current) {
      setLoading(true)
      setError(false)
      onErrorRef.current()
    } else {
      setError(true)
      setLoading(false)
    }
  }, [clearTimers, clearCountdown])

  const handleError = useCallback(() => switchServer(), [switchServer])

  const handleFatalError = useCallback(() => {
    if (countdownRef.current) return
    if (allExhaustedRef.current) { switchServer(); return }
    clearTimers()
    setLoading(false)
    let remaining = SWITCH_DELAY
    setCountdown(remaining)
    countdownRef.current = setInterval(() => {
      remaining -= 1
      if (remaining <= 0) switchServer()
      else setCountdown(remaining)
    }, 1000)
  }, [switchServer, clearTimers])

  const destroyStream = useCallback(() => {
    clearCountdown()
    clearTimers()
    const video = videoRef.current
    if (video) { try { video.playbackRate = 1.0; video.pause(); video.src = '' } catch (_) {} }
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null }
  }, [clearTimers, clearCountdown])

  const startStallDetector = useCallback((video) => {
    const tier      = getNetworkTier()
    // Tighter thresholds on mobile: 5s × 6=30s slow, 5s × 4=20s medium, 5s × 3=15s fast
    const threshold = tier === 'slow' ? 6 : tier === 'medium' ? 4 : 3
    let lastTime = -1, stallCount = 0
    const id = setInterval(() => {
      if (video.paused || video.ended) return
      if (video.currentTime === lastTime) { if (++stallCount >= threshold) handleError() }
      else stallCount = 0
      lastTime = video.currentTime
    }, 5000)
    timersRef.current.push(id)
  }, [handleError])

  const startLiveCatchup = useCallback((video) => {
    const tier     = getNetworkTier()
    const speedLag = tier === 'slow' ? 45 : tier === 'medium' ? 35 : 25
    const fastLag  = tier === 'slow' ? 70 : tier === 'medium' ? 55 : 40
    const id = setInterval(() => {
      if (video.paused || !video.buffered.length) return
      const lag = video.buffered.end(video.buffered.length - 1) - video.currentTime
      if      (lag > fastLag)  video.playbackRate = 1.3
      else if (lag > speedLag) video.playbackRate = 1.1
      else                     video.playbackRate = 1.0
    }, 3000)
    timersRef.current.push(id)
  }, [])

  const stopAll = useCallback(() => {
    killActiveStream()
    hlsRef.current = null
    timersRef.current.forEach(clearInterval); timersRef.current = []
    if (loadTimeoutRef.current) { clearTimeout(loadTimeoutRef.current); loadTimeoutRef.current = null }
    if (countdownRef.current)   { clearInterval(countdownRef.current);  countdownRef.current = null }
  }, [])

  useImperativeHandle(ref, () => ({ stop: stopAll }), [stopAll])

  useEffect(() => {
    window.addEventListener('popstate', stopAll)
    return () => window.removeEventListener('popstate', stopAll)
  }, [stopAll])

  useEffect(() => {
    if (!containerRef.current) return
    let cancelled = false
    let plyr = null

    const video = document.createElement('video')
    video.playsInline = true
    video.style.cssText = 'width:100%;height:100%;object-fit:contain'
    containerRef.current.appendChild(video)
    videoRef.current = video

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
      mountedRef.current = false
      cancelled = true
      killActiveStream()
      hlsRef.current = null
      timersRef.current.forEach(clearInterval); timersRef.current = []
      if (loadTimeoutRef.current) { clearTimeout(loadTimeoutRef.current); loadTimeoutRef.current = null }
      if (countdownRef.current)   { clearInterval(countdownRef.current);  countdownRef.current = null }
      const p = plyrRef.current || plyr
      if (p) { try { p.destroy() } catch (_) {} }
      plyrRef.current = null
      const v = videoRef.current
      videoRef.current = null
      if (v?.parentNode) { try { v.parentNode.removeChild(v) } catch (_) {} }
    }
  }, [])

  useEffect(() => {
    if (!url || !videoRef.current || !started) return
    const video = videoRef.current
    let stopped = false

    killActiveStream()
    activeStream.video = video
    setLoading(true)
    setError(false)
    destroyStream()

    const tier = getNetworkTier()
    let ready  = false

    const onReady = () => {
      if (stopped || ready) return
      ready = true
      if (loadTimeoutRef.current) { clearTimeout(loadTimeoutRef.current); loadTimeoutRef.current = null }
      setLoading(false)
      startStallDetector(video)
      if (isLive) startLiveCatchup(video)
    }

    const loadTimeoutMs = tier === 'slow' ? 50000 : 30000
    loadTimeoutRef.current = setTimeout(() => { if (!ready) handleError() }, loadTimeoutMs)

    ;(async () => {
      const Hls = (await import('hls.js')).default
      if (stopped) return
      if (Hls.isSupported()) {
        const cfg = isLive
          ? {
              startLevel:                     0,
              liveSyncDurationCount:          tier === 'slow' ? 3  : 2,
              liveMaxLatencyDurationCount:    tier === 'slow' ? 10 : tier === 'medium' ? 8 : 6,
              maxBufferLength:                tier === 'slow' ? 30 : tier === 'medium' ? 20 : 12,
              maxMaxBufferLength:             tier === 'slow' ? 60 : tier === 'medium' ? 40 : 24,
              backBufferLength:               8,
              startFragPrefetch:              true,
              abrEwmaDefaultEstimate:         tier === 'slow' ? 200000 : tier === 'medium' ? 600000 : 1000000,
              abrBandWidthFactor:             tier === 'slow' ? 0.6 : 0.75,
              abrBandWidthUpFactor:           tier === 'slow' ? 0.4 : 0.65,
              manifestLoadingMaxRetry:        tier === 'slow' ? 8  : tier === 'medium' ? 5 : 3,
              fragLoadingMaxRetry:            tier === 'slow' ? 8  : tier === 'medium' ? 5 : 3,
              manifestLoadingMaxRetryTimeout: tier === 'slow' ? 10000 : tier === 'medium' ? 6000 : 3000,
              fragLoadingMaxRetryTimeout:     tier === 'slow' ? 10000 : tier === 'medium' ? 6000 : 3000,
              nudgeMaxRetry:                  tier === 'slow' ? 12 : 5,
              nudgeOffset:                    0.1,
              lowLatencyMode:                 false,
              enableWorker:                   true,
            }
          : {
              maxBufferLength:                tier === 'slow' ? 120 : 60,
              maxMaxBufferLength:             tier === 'slow' ? 240 : 120,
              startLevel:                     tier === 'slow' ? 0   : -1,
              abrEwmaDefaultEstimate:         tier === 'slow' ? 200000 : 1000000,
              abrBandWidthFactor:             tier === 'slow' ? 0.6 : 0.8,
              abrBandWidthUpFactor:           tier === 'slow' ? 0.4 : 0.7,
              backBufferLength:               tier === 'slow' ? 30  : 15,
              manifestLoadingMaxRetry:        tier === 'slow' ? 4  : 1,
              fragLoadingMaxRetry:            tier === 'slow' ? 6  : 2,
              manifestLoadingMaxRetryTimeout: tier === 'slow' ? 8000 : 2000,
              fragLoadingMaxRetryTimeout:     tier === 'slow' ? 8000 : 2000,
              enableWorker:                   true,
            }

        const hls = new Hls(cfg)
        if (stopped) { try { hls.destroy() } catch (_) {}; return }
        hlsRef.current = hls
        activeStream.hls = hls
        hls.loadSource(url)
        hls.attachMedia(video)
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(() => {})
          video.addEventListener('playing', () => { if (!stopped) onReady() }, { once: true })
        })
        hls.on(Hls.Events.ERROR, (_, data) => { if (data.fatal) handleFatalError() })
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // iOS native HLS — persistent handlers so mid-stream failures are caught
        const onNativeError = () => { if (!stopped) handleFatalError() }
        const onNativeStall = () => {
          // iOS fires 'stalled' instead of 'error' when CDN token expires mid-stream
          if (!stopped && !video.paused) handleFatalError()
        }
        iosCleanupRef.current = () => {
          video.removeEventListener('error',   onNativeError)
          video.removeEventListener('stalled', onNativeStall)
        }
        video.src = url
        video.play().catch(() => {})
        video.addEventListener('playing', onReady, { once: true })
        video.addEventListener('error',   onNativeError)
        video.addEventListener('stalled', onNativeStall)
      } else {
        handleError()
      }
    })()

    return () => {
      stopped = true
      killActiveStream()
      if (iosCleanupRef.current) { iosCleanupRef.current(); iosCleanupRef.current = null }
      if (mountedRef.current) destroyStream()
    }
  }, [url, isLive, started, handleError, handleFatalError, destroyStream, startStallDetector, startLiveCatchup])

  if (isIframe(url)) {
    return (
      <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#000', borderRadius: 12, overflow: 'hidden' }}>
        <iframe
          key={url}
          src={url}
          style={{ width: '100%', height: '100%', border: 'none', display: 'block', overflow: 'hidden' }}
          allowFullScreen
          allow="autoplay; encrypted-media; fullscreen"
          referrerPolicy="no-referrer"
        />
      </div>
    )
  }

  return (
    <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#000', borderRadius: 12, overflow: 'hidden' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {!started && !error && (
        <div
          onClick={handlePlay}
          style={{
            position: 'absolute', inset: 0, zIndex: 25, cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 12, background: 'rgba(0,0,0,0.6)',
          }}
        >
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'rgba(0,255,135,0.18)', border: '2px solid rgba(0,255,135,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="#00FF87">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Tap to play</span>
        </div>
      )}

      {started && !loading && !error && countdown === null && (
        <button
          onClick={handleRotate}
          style={{
            position: 'absolute', bottom: 52, right: 10, zIndex: 30,
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

      {started && loading && !error && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 30,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 14, background: '#000',
        }}>
          <div className="spinner" />
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Connecting to stream…</span>
        </div>
      )}

      {countdown !== null && !error && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 30,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 12, background: 'rgba(10,14,26,0.92)', padding: 24, textAlign: 'center',
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            border: '3px solid rgba(245,158,11,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 24, fontWeight: 900, color: '#f59e0b', lineHeight: 1 }}>
              {countdown}
            </span>
          </div>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.7)', margin: 0 }}>Server failed</p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: 0 }}>Switching to next server automatically…</p>
          <button
            onClick={switchServer}
            style={{
              marginTop: 4, background: 'rgba(0,255,135,0.12)',
              border: '1px solid rgba(0,255,135,0.3)', color: '#00FF87',
              borderRadius: 20, padding: '8px 22px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}
          >
            Switch Now
          </button>
        </div>
      )}

      {error && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 30,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 12, background: '#0a0e1a', padding: 24, textAlign: 'center',
        }}>
          <div style={{ fontSize: 38 }}>📡</div>
          <p style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.85)', margin: 0 }}>All servers failed</p>

          {retryCountdown != null ? (
            /* Auto-retry countdown */
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 52, height: 52, borderRadius: '50%',
                border: '3px solid rgba(0,229,255,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: 20, fontWeight: 900, color: '#00e5ff', lineHeight: 1 }}>
                  {retryCountdown}
                </span>
              </div>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
                Refreshing servers in {retryCountdown}s…
              </p>
            </div>
          ) : (
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: 0, lineHeight: 1.7, maxWidth: 260 }}>
              Live streams can drop between coverage windows.<br />
              Servers usually recover within 1–2 minutes.
            </p>
          )}

          <button
            onClick={onRefresh || onError}
            style={{
              marginTop: 4, background: 'rgba(0,229,255,0.1)',
              border: '1px solid rgba(0,229,255,0.3)', color: '#00e5ff',
              borderRadius: 20, padding: '8px 22px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}
          >
            {retryCountdown != null ? 'Refresh Now' : '↻ Refresh'}
          </button>
        </div>
      )}
    </div>
  )
})

export default VideoPlayer
