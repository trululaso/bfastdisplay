import { useEffect, useRef, useState } from 'react'

const thumbUrl = (id, quality) => `https://i.ytimg.com/vi/${id}/${quality}.jpg`

// YouTube thumbnail. `hd` tries the 1280px version and falls back to the
// 480px one (maxres doesn't exist for every video; YouTube then serves a 120px placeholder).
export function Thumb({ id, hd = false, className }) {
  const [quality, setQuality] = useState(hd ? 'maxresdefault' : 'hqdefault')
  const fallback = () => quality !== 'hqdefault' && setQuality('hqdefault')
  return (
    <img
      className={className}
      src={thumbUrl(id, quality)}
      alt=""
      draggable={false}
      onError={fallback}
      onLoad={(e) => e.currentTarget.naturalWidth <= 120 && fallback()}
    />
  )
}

// One segment per video, like phone "stories".
export function StoryBars({ count, active, fraction }) {
  return (
    <div className="stories">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="story">
          <div
            className="story-fill"
            style={{ transform: `scaleX(${i < active ? 1 : i === active ? fraction : 0})` }}
          />
        </div>
      ))}
    </div>
  )
}

// Time bar under the video. Tap or drag it to jump; the jump happens on release.
// `rotate` is the stage rotation, so the bar works on a TV turned with ?rotate=.
export function Scrubber({ fraction, disabled, rotate = 0, className = '', onSeek }) {
  const trackRef = useRef(null)
  const [drag, setDrag] = useState(null) // fraction while the finger is down

  const at = (e) => {
    const rect = trackRef.current.getBoundingClientRect()
    const turn = (((rotate % 360) + 360) % 360) / 90
    const pos = [
      (e.clientX - rect.left) / rect.width,
      (e.clientY - rect.top) / rect.height,
      (rect.right - e.clientX) / rect.width,
      (rect.bottom - e.clientY) / rect.height,
    ][Math.round(turn) % 4]
    return Math.min(Math.max(pos, 0), 1)
  }

  const onDown = (e) => {
    if (disabled) return
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    setDrag(at(e))
  }
  const onMove = (e) => drag != null && setDrag(at(e))
  const onUp = (e) => {
    if (drag == null) return
    onSeek(at(e))
    setDrag(null)
  }

  const shown = drag ?? fraction
  return (
    <div
      className={`scrubber ${className}${drag != null ? ' is-dragging' : ''}`}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={() => setDrag(null)}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="progress-track" ref={trackRef}>
        <div className="progress-fill" style={{ transform: `scaleX(${shown})` }} />
      </div>
      <div className="scrubber-knob" style={{ left: `${shown * 100}%` }} />
    </div>
  )
}

// bFast banner along the bottom of the video page.
export function Banner() {
  return (
    <footer className="banner">
      <p className="banner-text">
        BFAST CONSTRUCCIÓN INDUSTRIALIZADA SPA.
        <br />
        DISTRIBUIDOR EXCLUSIVO PARA CHILE DE
        <br />
        GETO FORMWORKS – <span className="banner-url">www.bfastchile.cl</span>
      </p>
      <img className="banner-logo" src="/bfast.png" alt="bFast Construcción Industrializada" />
    </footer>
  )
}
