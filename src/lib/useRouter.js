import { useEffect, useState } from 'react'

/**
 * Tiny hash router — zero dependencies, works on any static host.
 * #/ → landing · #/chat → chat workspace.
 */
export function useRouter() {
  const [route, setRoute] = useState(() => window.location.hash.replace(/^#/, '') || '/')

  useEffect(() => {
    const onChange = () => setRoute(window.location.hash.replace(/^#/, '') || '/')
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  const navigate = (to) => {
    window.location.hash = to
  }

  return { route, navigate }
}
