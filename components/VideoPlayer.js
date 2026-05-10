'use client'
import { useEffect, useRef, useState, useCallback } from 'react'

export default function VideoPlayer({ url, isLive = false, onError }) {
  const videoRef = useRef(null)
  const hlsRef   = useRef(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(false)

  const handleError = useCallback(() => {
    setError(true)
    setLoading(false)
    onError?.()
  }, [onError])

  useEffect(() => {
    if (!url || !videoRef.current) return

    const video = videoRef.current
    setLoading(true)
    setError(false)

    // Destroy previous hls instance
    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
    }

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
        // Safari native HLS
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

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
    }
  }, [url, handleError])

  return (
    <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#000', borderRadius: 12, overflow: 'hidden' }}>
      <video
        ref={videoRef}
        playsInline
        controls
        style={{ width: '100%', height: '100%', objectFit: 'contain', display: error ? 'none' : 'block' }}
      />

      {/* LIVE badge overlay */}
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

      {/* Loading spinner */}
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

      {/* Error state */}
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
