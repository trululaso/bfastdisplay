import { useEffect, useState } from 'react'

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

// Blurred, slowly drifting copy of the current thumbnail that fills the whole
// screen. New videos cross-fade in on top of the previous one.
export function Backdrop({ id }) {
  const [layers, setLayers] = useState([id])

  useEffect(() => {
    setLayers((current) => (current[current.length - 1] === id ? current : [...current.slice(-1), id]))
  }, [id])

  return (
    <div className="backdrop" aria-hidden>
      {layers.map((layerId) => (
        <div key={layerId} className="backdrop-layer">
          <img src={thumbUrl(layerId, 'hqdefault')} alt="" />
        </div>
      ))}
      <div className="backdrop-shade" />
    </div>
  )
}

const timeFormat = new Intl.DateTimeFormat('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false })
const dateFormat = new Intl.DateTimeFormat('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })

export function Clock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 5000)
    return () => clearInterval(timer)
  }, [])
  return (
    <div className="clock">
      <span className="clock-time">{timeFormat.format(now)}</span>
      <span className="clock-date">{dateFormat.format(now)}</span>
    </div>
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
