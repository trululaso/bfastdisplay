import { useEffect, useState } from 'react'

// Lays the app out on a fixed portrait canvas (1080×1920 by default) and scales
// it to fit any screen. `rotate` turns the whole canvas for TVs whose system
// output can't be rotated (open the app with ?rotate=90 or ?rotate=-90).
export default function Stage({ width, height, rotate = 0, children }) {
  const [viewport, setViewport] = useState({ w: window.innerWidth, h: window.innerHeight })

  useEffect(() => {
    const onResize = () => setViewport({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const sideways = Math.abs(rotate) % 180 === 90
  const availableW = sideways ? viewport.h : viewport.w
  const availableH = sideways ? viewport.w : viewport.h
  const scale = Math.min(availableW / width, availableH / height)

  return (
    <div
      className="stage"
      style={{ width, height, transform: `translate(-50%, -50%) rotate(${rotate}deg) scale(${scale})` }}
    >
      {children}
    </div>
  )
}
