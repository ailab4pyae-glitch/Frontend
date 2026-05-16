// Singleton that tracks the one stream allowed to play at a time.
// Import killActiveStream anywhere to stop whatever is currently playing.

export const activeStream = { video: null, hls: null, flv: null }

export const killActiveStream = () => {
  if (activeStream.video) {
    try { activeStream.video.pause(); activeStream.video.src = '' } catch (_) {}
  }
  if (activeStream.hls) {
    try { activeStream.hls.destroy() } catch (_) {}
    activeStream.hls = null
  }
  if (activeStream.flv) {
    try {
      activeStream.flv.unload()
      activeStream.flv.detachMediaElement()
      activeStream.flv.destroy()
    } catch (_) {}
    activeStream.flv = null
  }
  activeStream.video = null
}
