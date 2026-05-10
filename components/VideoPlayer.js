'use client'
import { useEffect, useRef, useState, useCallback } from 'react'

const isFlv = (url) => /\.flv(\?|$)/i.test(url)

export default function VideoPlayer({ url, isLive = false, onError }) {
  const videoRef = useRef(null)
  const hlsRef   = useRef(null)
  const flvRef   = useRef(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(false)

  const handleError = useCallback(() => {
    setError(true)
    setLoading(false)
    onError?.()
  }, [onError])

  const destroyPlayers = () => {
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null }
    if (flvRef.current) { flvRef.current.unload(); flvRef.current.detachMediaElement(); flvRef.current.destroy(); flvRef.current = null }
  }

  useEffect(() => {
    if (!url || !videoRef.current) return
    const video = videoRef.current
    setLoading(true)
    setError(false)
    destroyPlayers()

    if (isFlv(url)) {
      // FLV stream — use flv.js
      const initFlv = async () => {
        const flvjs = (await import('flv.js')).default
        if (!flvjs.isSupported()) { handleError(); return }

        const player = flvjs.createPlayer({
          type: 'flv',
          url,
          isLive: true,
          cors: true,
          withCredentials: false,
        }, {
          enableWorker: false,
          lazyLoad: false,
          seekType: 'range',
        })
        flvRef.current = player
        player.attachMediaElement(video)
        player.load()

        player.on(flvjs.Events.ERROR, () => handleError())
        player.on(flvjs.Events.MEDIA_INFO, () => {
          setLoading(false)
          video.play().catch(() => {})
        })

        // If media info never fires, try playing after a short wait
        const fallbackTimer = setTimeout(() => {
          setLoading(false)
          video.play().catch(() => {})
        }, 4000)

        return () => clearTimeout(fallbackTimer)
      }
      initFlv()
    } else {
      // HLS stream — use hls.js (or native Safari)
      const initHls = async () => {
        const Hls = (await import('hls.js')).default

        if (Hls.isSupported()) {
          const hls = new Hls({
            maxBufferLength: 30,
            maxMaxBufferLength: 60,
            enableWorker: true,
          })
          hlsRef.current = hls
          hls.loadSource(url)
          hls.attachMedia(video)

          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            setLoading(false)
            video.play().catch(() => {})
          })

          hls.on(Hls.Events.ERROR, (_, data) => {
            if (data.fatal) handleError()
          })
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = url
          const onMeta = () => {
            setLoading(false)
            video.play().catch(() => {})
            video.removeEventListener('loadedmetadata', onMeta)
          }
          video.addEventListener('loadedmetadata', onMeta)
          video.addEventListener('error', handleError, { once: true })
        } else {
          handleError()
        }
      }
      initHls()
    }

    return () => destroyPlayers()
  }, [url, handleError])

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
          <span className="live-dot" />
          LIVE
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
          <p style={{ fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>
            Stream unavailable
          </p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
            Try another server below
          </p>
          {onError && (
            <button
              onClick={onError}
              style={{
                marginTop: 4,
                background: 'rgba(0,255,135,0.12)', border: '1px solid rgba(0,255,135,0.3)',
                color: '#00FF87', borderRadius: 20, padding: '8px 20px',
                fontSize: 13, fontWeight: 700,
              }}
            >
              Try Next Server
            </button>
          )}
        </div>
      )}
    </div>
  )
}
