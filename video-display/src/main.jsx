import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/archivo/wdth.css'
import './styles.css'
import { videos } from './config.js'
import { usePath } from './router.js'
import Display from './Display.jsx'
import Menu from './Menu.jsx'

// /             menu with every video
// /video/<id>   one video, with a back button
// /loop         plays all the videos one after another
function Root() {
  const path = usePath()

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

  if (path === '/loop') return <Display key="loop" />
  const match = path.match(/^\/video\/([^/]+)$/)
  const videoId = match && decodeURIComponent(match[1])
  if (videoId && videos.some((v) => v.youtubeId === videoId)) return <Display key="video" videoId={videoId} />
  return <Menu />
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
