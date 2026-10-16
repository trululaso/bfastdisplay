import { useEffect, useRef } from 'react'

let apiPromise
function loadYouTubeApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT)
  if (!apiPromise) {
    apiPromise = new Promise((resolve, reject) => {
      const previous = window.onYouTubeIframeAPIReady
      window.onYouTubeIframeAPIReady = () => {
        previous?.()
        resolve(window.YT)
      }
      const script = document.createElement('script')
      script.src = 'https://www.youtube.com/iframe_api'
      script.onerror = () => {
        apiPromise = null
        reject(new Error('Could not load the YouTube API'))
      }
      document.head.appendChild(script)
    })
  }
  return apiPromise
}

// One YouTube player that is reused for every video (loadVideoById),
// which is smoother than tearing the iframe down between videos.
// `seek` ({ time }) jumps to that second; pass a new object each time.
export default function YouTubePlayer({ videoId, start = 0, playKey, muted, paused, seek, onPlaying, onEnded, onFail, onProgress, onAutoMuted }) {
  const hostRef = useRef(null)
  const playerRef = useRef(null)
  const callbacks = useRef({})
  callbacks.current = { onPlaying, onEnded, onFail, onProgress, onAutoMuted }
  const wanted = useRef({ videoId, start, muted, paused })
  wanted.current = { videoId, start, muted, paused }
  const started = useRef(false) // has the current video begun buffering/playing?
  const soundCheck = useRef()

  const fallBackToMuted = (p) => {
    p.mute()
    p.playVideo()
    callbacks.current.onAutoMuted?.()
  }

  // Always start muted (the only autoplay browsers guarantee), then unmute if wanted.
  const load = (p) => {
    const { videoId, start, muted } = wanted.current
    started.current = false
    clearTimeout(soundCheck.current)
    p.mute()
    p.loadVideoById({ videoId, startSeconds: start })
    if (!muted) {
      p.unMute()
      // A browser that refuses to play with sound never gets the video going.
      soundCheck.current = setTimeout(() => !started.current && fallBackToMuted(p), 6000)
    }
  }

  useEffect(() => {
    let cancelled = false
    let player
    let poll
    const isWanted = (p) => p.getVideoData?.()?.video_id === wanted.current.videoId
    const el = document.createElement('div')
    hostRef.current.appendChild(el)

    loadYouTubeApi()
      .then((YT) => {
        if (cancelled) return
        player = new YT.Player(el, {
          width: '100%',
          height: '100%',
          playerVars: {
            autoplay: 1,
            mute: 1,
            controls: 0,
            disablekb: 1,
            fs: 0,
            iv_load_policy: 3,
            playsinline: 1,
            rel: 0,
          },
          events: {
            onReady: (e) => {
              playerRef.current = e.target
              load(e.target)
              poll = setInterval(() => {
                const p = playerRef.current
                const duration = p?.getDuration?.() || 0
                if (duration > 0 && isWanted(p)) callbacks.current.onProgress?.(p.getCurrentTime(), duration)
              }, 500)
            },
            onStateChange: (e) => {
              const p = e.target
              // While switching, the previous video can still report events: ignore them.
              if (!isWanted(p)) return
              if (e.data === YT.PlayerState.BUFFERING || e.data === YT.PlayerState.PLAYING) started.current = true
              if (e.data === YT.PlayerState.PLAYING) callbacks.current.onPlaying?.()
              if (e.data === YT.PlayerState.ENDED) callbacks.current.onEnded?.()
              // YouTube reports a pause the moment a new video is loaded; ignore that one.
              // Any other pause we didn't ask for means the browser blocked playback
              // with sound: fall back to muted and keep going.
              if (e.data === YT.PlayerState.PAUSED && started.current && !wanted.current.paused) {
                if (p.isMuted()) p.playVideo()
                else fallBackToMuted(p)
              }
            },
            onError: (e) => callbacks.current.onFail?.(false, `YouTube error ${e.data}`),
          },
        })
      })
      .catch((err) => !cancelled && callbacks.current.onFail?.(true, err.message))

    return () => {
      cancelled = true
      clearInterval(poll)
      clearTimeout(soundCheck.current)
      player?.destroy?.()
      playerRef.current = null
      if (hostRef.current) hostRef.current.innerHTML = ''
    }
  }, [])

  // New video (playKey also changes when the same video comes up twice in a row).
  useEffect(() => {
    if (playerRef.current) load(playerRef.current)
  }, [videoId, start, playKey])

  useEffect(() => {
    const p = playerRef.current
    if (!p) return
    if (paused) p.pauseVideo()
    else p.playVideo()
  }, [paused])

  useEffect(() => {
    if (seek) playerRef.current?.seekTo?.(seek.time, true)
  }, [seek])

  useEffect(() => {
    const p = playerRef.current
    if (!p) return
    if (muted) p.mute()
    else p.unMute()
  }, [muted])

  return <div className="yt-host" ref={hostRef} />
}
