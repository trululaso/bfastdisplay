import { useEffect, useState } from 'react'
import { settings, videos } from './config.js'
import { navigate } from './router.js'
import Stage from './Stage.jsx'
import { Backdrop, Clock, Thumb } from './parts.jsx'

const ROTATE = Number(new URLSearchParams(window.location.search).get('rotate')) || 0
const BACKDROP_EVERY_MS = 8000

// Landing page: every video as a card. Tapping one opens it; the button in the
// bottom-right corner starts the loop that plays them all.
export default function Menu() {
  const [backdrop, setBackdrop] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setBackdrop((i) => (i + 1) % videos.length), BACKDROP_EVERY_MS)
    return () => clearInterval(timer)
  }, [])

  return (
    <>
      <Backdrop id={videos[backdrop].youtubeId} />
      <Stage width={1080} height={1920} rotate={ROTATE}>
        <main className="screen menu">
          <header className="top">
            <div className="brand">
              {settings.logo && <img className="brand-logo" src={settings.logo} alt="" />}
              <span className="brand-event">{settings.eventName}</span>
            </div>
            <Clock />
          </header>

          <div className="menu-heading">
            <h1>Videos</h1>
            <span className="menu-hint">Toca un video para verlo</span>
          </div>

          <ol className="menu-grid">
            {videos.map((v, i) => (
              <li key={v.youtubeId} style={{ '--i': i }}>
                <button type="button" className="menu-card" onClick={() => navigate(`/video/${v.youtubeId}`)}>
                  <div className="menu-thumb">
                    <Thumb id={v.youtubeId} />
                    <span className="menu-play">
                      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                        <path d="M7 4v16l13-8z" />
                      </svg>
                    </span>
                  </div>
                  {v.tag && <span className="library-tag">{v.tag}</span>}
                  <span className="menu-title">{v.title}</span>
                  {v.subtitle && <span className="library-subtitle">{v.subtitle}</span>}
                </button>
              </li>
            ))}
          </ol>

          <button type="button" className="loop-button" onClick={() => navigate('/loop')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="m17 2 4 4-4 4" />
              <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
              <path d="m7 22-4-4 4-4" />
              <path d="M21 13v1a4 4 0 0 1-4 4H3" />
            </svg>
            Loop
          </button>
        </main>
      </Stage>
    </>
  )
}
