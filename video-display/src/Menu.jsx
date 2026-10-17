import { videos } from './config.js'
import { navigate } from './router.js'
import Stage from './Stage.jsx'
import { Thumb } from './parts.jsx'

const ROTATE = Number(new URLSearchParams(window.location.search).get('rotate')) || 0

// Every video fits on one screen: the grid's rows share the height between them.
const COLS = videos.length > 8 ? 3 : 2
const ROWS = Math.ceil(videos.length / COLS)
// With an incomplete last row, the Loop button sits in the empty corner;
// otherwise the grid leaves room for it underneath.
const FREE_CORNER = videos.length % COLS !== 0

// Landing page: every video as a card, no scrolling. Tapping one opens it; the button in the
// bottom-right corner starts the loop that plays them all.
export default function Menu() {
  return (
    <>
      <Stage width={1080} height={1920} rotate={ROTATE}>
        <main className="screen menu">
          <img className="menu-logo" src="/geto.png" alt="GETO" />
          <h1 className="menu-hint">Toca un video para verlo</h1>

          <ol className={`menu-grid${FREE_CORNER ? '' : ' needs-room'}`} style={{ '--cols': COLS, '--rows': ROWS }}>
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
                  <span className="menu-text">
                    {v.tag && <span className="library-tag">{v.tag}</span>}
                    <span className="menu-title">{v.title}</span>
                    {v.subtitle && <span className="library-subtitle">{v.subtitle}</span>}
                  </span>
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
