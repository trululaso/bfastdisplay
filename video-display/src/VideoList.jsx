import { useEffect, useRef } from 'react'
import { Thumb } from './parts.jsx'

const IDLE_MS = 20_000 // after a visitor scrolls, wait this long before auto-scrolling again

// Every video, tappable. The playing one is highlighted and, while nobody is
// touching the list, kept at the top so the next videos show below it.
export default function VideoList({ videos, currentIndex, fraction, onSelect }) {
  const listRef = useRef(null)
  const lastTouch = useRef(0)

  const scrollToCurrent = (behavior = 'smooth') => {
    const list = listRef.current
    const item = list?.children[currentIndex]
    if (item) list.scrollTo({ top: item.offsetTop, behavior })
  }

  useEffect(() => {
    if (Date.now() - lastTouch.current > IDLE_MS) scrollToCurrent()
    const timer = setInterval(() => {
      if (Date.now() - lastTouch.current > IDLE_MS) scrollToCurrent()
    }, 5000)
    return () => clearInterval(timer)
  }, [currentIndex])

  const touched = () => {
    lastTouch.current = Date.now()
  }

  return (
    <section className="library">
      <div className="library-heading">
        <h2>Todos los videos</h2>
        <span className="library-hint">
          <TapIcon /> Toca un video para verlo
        </span>
      </div>
      <ol className="library-list" ref={listRef} onPointerDown={touched} onWheel={touched} onTouchStart={touched}>
        {videos.map((v, i) => {
          const current = i === currentIndex
          return (
            <li key={v.youtubeId} style={{ '--i': i }}>
              <button
                type="button"
                className={`library-item${current ? ' is-current' : ''}`}
                onClick={() => !current && onSelect(i)}
              >
                <div className="library-thumb">
                  <Thumb id={v.youtubeId} />
                  {current && (
                    <div className="library-playing">
                      <span className="eq">
                        <i />
                        <i />
                        <i />
                      </span>
                    </div>
                  )}
                </div>
                <div className="library-text">
                  <span className="library-tag">{current ? 'Reproduciendo' : v.tag}</span>
                  <span className="library-title">{v.title}</span>
                  {v.subtitle && <span className="library-subtitle">{v.subtitle}</span>}
                </div>
                {current && <div className="library-progress" style={{ transform: `scaleX(${fraction})` }} />}
              </button>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

function TapIcon() {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V11" />
      <path d="M12 10.5V9a1.5 1.5 0 0 1 3 0v2" />
      <path d="M15 10.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-1.2a6 6 0 0 1-4.6-2.2L3.6 15.6a1.5 1.5 0 0 1 2.3-1.9L9 16.5V11" />
    </svg>
  )
}
