import { Fragment, useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { settings, videos } from './config.js'
import Stage from './Stage.jsx'
import YouTubePlayer from './YouTubePlayer.jsx'
import { Backdrop, Clock, StoryBars, Thumb } from './parts.jsx'
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

export default function App() {
  const [state, dispatch] = useReducer(reducer, null, () => ({
    order: makeOrder(),
    pos: 0,
    key: 0,
    playing: false,
    paused: false,
    time: 0,
    duration: 0,
  }))
  const [muted, setMuted] = useState(START_MUTED)
  const [offline, setOffline] = useState(false)

  const { order, pos, key, playing, paused, time } = state
  const video = videos[order[pos]]
  const duration = settings.maxSecondsPerVideo ? Math.min(state.duration, settings.maxSecondsPerVideo) : state.duration
  const fraction = duration ? Math.min(time / duration, 1) : 0

  const keyRef = useRef(key)
  keyRef.current = key
  const pausedRef = useRef(paused)
  pausedRef.current = paused
  const lastAlive = useRef(Date.now())
  const lastTime = useRef(-1)
  const failures = useRef(0)

  const step = useCallback((n) => dispatch({ type: 'step', step: n }), [])
  const select = useCallback((index) => dispatch({ type: 'select', index }), [])
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
      if (settings.maxSecondsPerVideo && t >= settings.maxSecondsPerVideo) step(1)
    },
    [step],
  )

  const handleEnded = useCallback(() => step(1), [step])

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

  // Keyboard for setup: ← → change video, space pause, M sound, F fullscreen.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight') step(1)
      else if (e.key === 'ArrowLeft') step(-1)
      else if (e.key === ' ') togglePause()
      else if (e.key === 'm' || e.key === 'M') toggleMute()
      else if (e.key === 'f' || e.key === 'F') toggleFullscreen()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [step, togglePause, toggleMute])

  // Hide the mouse pointer when it isn't moving.
  useEffect(() => {
    let timer
    const onMove = () => {
      document.body.classList.remove('hide-cursor')
      clearTimeout(timer)
      timer = setTimeout(() => document.body.classList.add('hide-cursor'), 2500)
    }
    onMove()
    window.addEventListener('pointermove', onMove)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('pointermove', onMove)
    }
  }, [])

  const titleWords = video.title.split(' ')

  return (
    <>
      <Backdrop id={video.youtubeId} />
      <Stage width={1080} height={1920} rotate={ROTATE}>
        {/* Any tap turns the sound on (browsers need one interaction for that). */}
        <main className="screen" onClick={() => muted && setMuted(false)}>
          <StoryBars count={videos.length} active={pos} fraction={fraction} />

          <header className="top">
            <div className="brand">
              {settings.logo && <img className="brand-logo" src={settings.logo} alt="" />}
              <span className="brand-event">{settings.eventName}</span>
            </div>
            <Clock />
          </header>

          <section className="player">
            <YouTubePlayer
              videoId={video.youtubeId}
              start={video.start ?? 0}
              playKey={key}
              muted={muted}
              paused={paused}
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
              onPrev={() => step(-1)}
              onNext={() => step(1)}
            />
          </section>

          <div className="progress">
            <div className="progress-track">
              <div className="progress-fill" style={{ transform: `scaleX(${fraction})` }} />
            </div>
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
