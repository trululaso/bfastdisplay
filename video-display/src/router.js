import { useEffect, useState } from 'react'

// Tiny client-side router. URL options like ?rotate=90 stay on every page.
export function navigate(path, { replace = false } = {}) {
  const url = path + window.location.search
  if (replace) window.history.replaceState({ inApp: true }, '', url)
  else window.history.pushState({ inApp: true }, '', url)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

// Back to the menu: a real "back" when we came from it, otherwise go there directly.
export function goToMenu() {
  if (window.history.state?.inApp) window.history.back()
  else navigate('/', { replace: true })
}

export function usePath() {
  const [path, setPath] = useState(window.location.pathname)
  useEffect(() => {
    const onChange = () => setPath(window.location.pathname)
    window.addEventListener('popstate', onChange)
    return () => window.removeEventListener('popstate', onChange)
  }, [])
  return path.replace(/\/+$/, '') || '/'
}
