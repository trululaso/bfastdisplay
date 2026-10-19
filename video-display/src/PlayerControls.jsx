import { useEffect, useRef, useState } from 'react'

const HIDE_AFTER_MS = 4000
const CORNER_HIDE_AFTER_MS = 2000

// Touch controls over the video. A tap shows ⏮ ⏯ ⏭ for a few seconds (⏮ ⏭ only
// when onPrev/onNext are given), then they fade out, also while paused, so a paused
// frame can be shown at an exhibition without the controls in the way. The
// full-screen and sound buttons show for 2 seconds when a video starts (`playKey`)
// and on every tap.
export default function PlayerControls({ playKey, paused, muted, fullscreen, onTogglePause, onToggleMute, onToggleFullscreen, onPrev, onNext }) {
  const [visible, setVisible] = useState(false)
  const [cornerVisible, setCornerVisible] = useState(true)
  const hideTimer = useRef()
  const cornerTimer = useRef()

  const showCorner = () => {
    setCornerVisible(true)
    clearTimeout(cornerTimer.current)
    cornerTimer.current = setTimeout(() => setCornerVisible(false), CORNER_HIDE_AFTER_MS)
  }

  const show = () => {
    setVisible(true)
    clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => setVisible(false), HIDE_AFTER_MS)
    showCorner()
  }

  const hide = () => {
    clearTimeout(hideTimer.current)
    clearTimeout(cornerTimer.current)
    setVisible(false)
    setCornerVisible(false)
  }

  useEffect(showCorner, [playKey])

  useEffect(
    () => () => {
      clearTimeout(hideTimer.current)
      clearTimeout(cornerTimer.current)
    },
    [],
  )

  // Each button keeps the controls up and doesn't count as a tap on the background.
  const press = (action) => (e) => {
    e.stopPropagation()
    action()
    show()
  }

  const onBackground = (e) => {
    e.stopPropagation()
    if (visible) hide()
    else show()
  }

  return (
    <div className={`controls${visible ? ' is-visible' : ''}`} onClick={onBackground}>
      <div className="controls-center">
        {onPrev && (
          <button type="button" className="ctrl" aria-label="Video anterior" onClick={press(onPrev)}>
            <Icon d="M19 20 9 12l10-8v16zM5 19V5" filled />
          </button>
        )}
        <button type="button" className="ctrl ctrl-main" aria-label={paused ? 'Reproducir' : 'Pausar'} onClick={press(onTogglePause)}>
          {paused ? <Icon d="M7 4v16l13-8z" filled /> : <Icon d="M7 4h3.5v16H7zM13.5 4H17v16h-3.5z" filled />}
        </button>
        {onNext && (
          <button type="button" className="ctrl" aria-label="Video siguiente" onClick={press(onNext)}>
            <Icon d="m5 4 10 8-10 8V4zM19 5v14" filled />
          </button>
        )}
      </div>
      <div className={`controls-corner${cornerVisible ? ' is-visible' : ''}`}>
        <button
          type="button"
          className="ctrl ctrl-corner"
          aria-label={fullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
          onClick={press(onToggleFullscreen)}
        >
          {fullscreen ? <Icon d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" /> : <Icon d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />}
        </button>
        <button
          type="button"
          className={`ctrl ctrl-corner ctrl-sound${muted ? ' is-muted' : ''}`}
          aria-label={muted ? 'Activar sonido' : 'Silenciar'}
          onClick={press(onToggleMute)}
        >
          {muted ? (
            <Icon d="M11 5 6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6" />
          ) : (
            <Icon d="M11 5 6 9H2v6h4l5 4V5zM15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" />
          )}
          {muted && <span>Activar sonido</span>}
        </button>
      </div>
    </div>
  )
}

function Icon({ d, filled = false }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={d} />
    </svg>
  )
}
