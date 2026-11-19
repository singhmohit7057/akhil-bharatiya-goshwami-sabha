import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// Disable browser's native scroll restoration so it doesn't jump to a
// previously saved position after async content loads on the page.
if (typeof window !== 'undefined' && 'scrollRestoration' in history) {
  history.scrollRestoration = 'manual'
}

export function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}
