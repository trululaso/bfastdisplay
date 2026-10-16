import { Fragment, useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { settings, videos } from './config.js'
import { goToMenu, navigate } from './router.js'
import Stage from './Stage.jsx'
import YouTubePlayer from './YouTubePlayer.jsx'
import { Clock, Scrubber, StoryBars, Thumb } from './parts.jsx'
import PlayerControls from './PlayerControls.jsx'
import VideoList from './VideoList.jsx'

const params = new URLSearchParams(window.location.search)
const ROTATE = Number(params.get('rotate')) || 0
const START_MUTED = params.has('sound') ? params.get('sound') === '0' : settings.muted

const STALL_LIMIT_MS = 25_000 // skip a video that hasn't moved for this long
const OFFLINE_RETRY_MS = 30_000

function makeOrder(avoidFirst) {
  const order = videos.map((_, i) => i)
  if (!settings.shuffle) return order
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  // Don't repeat the last video of the previous loop right away.
  if (order.length > 1 && order[0] === avoidFirst) [order[0], order[1]] = [order[1], order[0]]
  return order
}

function reducer(state, action) {
  switch (action.type) {
    case 'step': {
      const n = videos.length
      const raw = state.pos + action.step
      const order = raw >= n && settings.shuffle ? makeOrder(state.order[n - 1]) : state.order
      return { order, pos: ((raw % n) + n) % n, key: state.key + 1, playing: false, paused: false, time: 0, duration: 0 }
    }
    case 'select': {
      const pos = state.order.indexOf(action.index)
      return { ...state, pos, key: state.key + 1, playing: false, paused: false, time: 0, duration: 0 }
    }
    case 'pause':
      return { ...state, paused: action.paused }
    case 'playing':
      return { ...state, playing: true }
    case 'progress':
      return { ...state, time: action.time, duration: action.duration }
    default:
      return state
  }
}

const pad = (n) => String(n).padStart(2, '0')
const formatTime = (s) => `${Math.floor(s / 60)}:${pad(Math.floor(s % 60))}`

const indexOf = (youtubeId) => videos.findIndex((v) => v.youtubeId === youtubeId)

// Without `videoId`: the /loop display, which plays every video one after another.
// With `videoId`: only that video (from the menu), with a back
// button; it returns to the menu when it ends.
export default function Display({ videoId }) {
  const single = videoId != null
  const [state, dispatch] = useReducer(reducer, null, () => ({
    order: single ? videos.map((_, i) => i) : makeOrder(),
    pos: single ? indexOf(videoId) : 0,
    key: 0,
    playing: false,
    paused: false,
    time: 0,
    duration: 0,
  }))
  // Opened from the menu = someone just tapped the screen, so sound is allowed.
  const [muted, setMuted] = useState(single ? false : START_MUTED)
  // Video blown up to fill the screen (turned sideways, see settings.fullscreenRotation).
  const [fullscreen, setFullscreen] = useState(false)
  const [leftFullscreen, setLeftFullscreen] = useState(false) // plays the "turn back" animation
  const [offline, setOffline] = useState(false)
  const [seek, setSeek] = useState(null)

  const { order, pos, key, playing, paused, time } = state
  const video = videos[order[pos]]
  const maxSeconds = single ? null : settings.maxSecondsPerVideo
  const duration = maxSeconds ? Math.min(state.duration, maxSeconds) : state.duration
  const fraction = duration ? Math.min(time / duration, 1) : 0

  const keyRef = useRef(key)
  keyRef.current = key
  const currentRef = useRef(order[pos])
  currentRef.current = order[pos]
  const pausedRef = useRef(paused)
  pausedRef.current = paused
  const lastAlive = useRef(Date.now())
  const lastTime = useRef(-1)
  const failures = useRef(0)

  // On a single video page, switching video changes the URL (the effect below then loads it).
  const select = useCallback(
    (index) => {
      if (single) navigate(`/video/${videos[index].youtubeId}`, { replace: true })
      else dispatch({ type: 'select', index })
    },
    [single],
  )
  const step = useCallback(
    (n) => {
      if (single) select((((currentRef.current + n) % videos.length) + videos.length) % videos.length)
      else dispatch({ type: 'step', step: n })
    },
    [single, select],
  )

  useEffect(() => {
    if (single && indexOf(videoId) !== currentRef.current) dispatch({ type: 'select', index: indexOf(videoId) })
  }, [single, videoId])
  const togglePause = useCallback(() => dispatch({ type: 'pause', paused: !pausedRef.current }), [])
  const toggleMute = useCallback(() => setMuted((m) => !m), [])

  useEffect(() => {
    lastAlive.current = Date.now()
    lastTime.current = -1
  }, [key])

  const handleFail = useCallback(
    (fatal, reason) => {
      console.warn('Video failed:', reason)
      failures.current += 1
      if (fatal || failures.current >= videos.length) {
        setOffline(true)
        return
      }
      const failedKey = keyRef.current
      setTimeout(() => keyRef.current === failedKey && step(1), 1200)
    },
    [step],
  )

  const handlePlaying = useCallback(() => {
    failures.current = 0
    dispatch({ type: 'playing' })
  }, [])

  const handleAutoMuted = useCallback(() => setMuted(true), [])

  const handleProgress = useCallback(
    (t, d) => {
      if (t !== lastTime.current) {
        lastTime.current = t
        lastAlive.current = Date.now()
      }
      dispatch({ type: 'progress', time: t, duration: d })
      if (maxSeconds && t >= maxSeconds) step(1)
    },
    [step, maxSeconds],
  )

  // From the time bar: jump there.
  const handleSeek = useCallback(
    (f) => {
      const t = f * duration
      setSeek({ time: t })
      dispatch({ type: 'progress', time: t, duration: state.duration })
    },
    [duration, state.duration],
  )

  const toggleVideoFullscreen = useCallback(() => {
    setFullscreen((on) => !on)
    setLeftFullscreen(true)
  }, [])

  // When a video finishes, go back to the vertical layout for the next one
  // (or back to the menu after a video picked there).
  const handleEnded = useCallback(() => {
    if (single) return goToMenu()
    setFullscreen(false)
    step(1)
  }, [single, step])

  // Watchdog: a video that never starts or freezes gets skipped (pausing doesn't count).
  useEffect(() => {
    const timer = setInterval(() => {
      if (pausedRef.current) lastAlive.current = Date.now()
      else if (Date.now() - lastAlive.current > STALL_LIMIT_MS) {
        lastAlive.current = Date.now()
        handleFail(false, 'stalled')
      }
    }, 3000)
    return () => clearInterval(timer)
  }, [handleFail])

  // Someone paused and walked away: carry on by itself.
  useEffect(() => {
    if (!paused || !settings.resumeAfterPauseSeconds) return
    const timer = setTimeout(() => dispatch({ type: 'pause', paused: false }), settings.resumeAfterPauseSeconds * 1000)
    return () => clearTimeout(timer)
  }, [paused])

  // No connection: show a message and retry with a full reload.
  useEffect(() => {
    if (!offline) return
    const timer = setTimeout(() => window.location.reload(), OFFLINE_RETRY_MS)
    return () => clearTimeout(timer)
  }, [offline])

  // Keyboard for setup: ← → change video, space pause, M sound, V video full screen,
  // Esc leave it, F browser full screen, Backspace back to the menu (single video).
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight') step(1)
      else if (e.key === 'ArrowLeft') step(-1)
      else if (e.key === ' ') togglePause()
      else if (e.key === 'm' || e.key === 'M') toggleMute()
      else if (e.key === 'v' || e.key === 'V') toggleVideoFullscreen()
      else if (e.key === 'Escape') setFullscreen(false)
      else if (e.key === 'f' || e.key === 'F') toggleFullscreen()
      else if (e.key === 'Backspace' && single) goToMenu()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [single, step, togglePause, toggleMute, toggleVideoFullscreen])

  const titleWords = video.title.split(' ')

  return (
    <>
      <Stage width={1080} height={1920} rotate={ROTATE}>
        {/* Any tap turns the sound on (browsers need one interaction for that). */}
        <main className={`screen${single ? ' single' : ''}`} onClick={() => muted && setMuted(false)}>
          {!single && <StoryBars count={videos.length} active={pos} fraction={fraction} />}

          <header className="top">
            {single ? (
              <button type="button" className="back-button" onClick={goToMenu}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                Volver
              </button>
            ) : (
              <div className="brand">
                {settings.logo && <img className="brand-logo" src={settings.logo} alt="" />}
                <span className="brand-event">{settings.eventName}</span>
              </div>
            )}
            {!single && <Clock />}
          </header>

          {fullscreen && <div className="fs-backdrop" />}

          <div className="player-slot">
            <section
              className={`player${fullscreen ? ' is-fullscreen' : leftFullscreen ? ' is-returning' : ''}${settings.fullscreenRotation ? '' : ' no-rotate'}`}
              style={{ '--fs-rotate': `${settings.fullscreenRotation || 0}deg` }}
            >
              <YouTubePlayer
                videoId={video.youtubeId}
                start={video.start ?? 0}
                playKey={key}
                muted={muted}
                paused={paused}
                seek={seek}
                onPlaying={handlePlaying}
                onEnded={handleEnded}
                onFail={handleFail}
                onProgress={handleProgress}
                onAutoMuted={handleAutoMuted}
              />
              <Thumb key={key} id={video.youtubeId} hd className={`poster${playing ? ' is-hidden' : ''}`} />
              <PlayerControls
                paused={paused}
                muted={muted}
                onTogglePause={togglePause}
                onToggleMute={toggleMute}
                fullscreen={fullscreen}
                onToggleFullscreen={toggleVideoFullscreen}
                onPrev={single ? null : () => step(-1)}
                onNext={single ? null : () => step(1)}
              />
              <div className="fs-progress" style={{ transform: `scaleX(${fraction})` }} />
            </section>
          </div>

          {!single && (
            <>
              <div className="progress">
                <Scrubber fraction={fraction} disabled={!duration} rotate={ROTATE} onSeek={handleSeek} />
                <span className="progress-time">
                  {duration ? `${formatTime(Math.min(time, duration))} / ${formatTime(duration)}` : '–:–'}
                </span>
              </div>

              <section className="now" key={key}>
                {settings.showQr && (
                  <div className="qr">
                    <QRCodeSVG value={`https://youtu.be/${video.youtubeId}`} size={104} marginSize={0} fgColor="#0b0c0e" />
                    <span>Escanéame</span>
                  </div>
                )}
                <div className="now-meta">
                  <span className="now-count">
                    {pad(pos + 1)}
                    <span>/{pad(videos.length)}</span>
                  </span>
                  {video.tag && <span className="tag">{video.tag}</span>}
                </div>
                <h1 className={`now-title${video.title.length > 34 ? ' is-long' : ''}`}>
                  {titleWords.map((word, i) => (
                    <Fragment key={i}>
                      <span className="word">
                        <span style={{ '--i': i }}>{word}</span>
                      </span>{' '}
                    </Fragment>
                  ))}
                </h1>
                {video.subtitle && <p className="now-subtitle">{video.subtitle}</p>}
              </section>

              <VideoList videos={videos} currentIndex={order[pos]} fraction={fraction} onSelect={select} />
            </>
          )}

          {/* Same corner as the menu's Loop button. */}
          {!single && (
            <button type="button" className="loop-button" onClick={goToMenu}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
              </svg>
              Menú
            </button>
          )}

          {offline && (
            <div className="offline">
              <strong>Sin conexión</strong>
              <span>Reintentando en unos segundos…</span>
            </div>
          )}
        </main>
      </Stage>
    </>
  )
}

function toggleFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen()
  else document.documentElement.requestFullscreen?.().catch(() => {})
}
