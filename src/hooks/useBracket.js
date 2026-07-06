import { useState, useEffect } from 'react'
import { fetchBracket } from '../services/api.js'

// ── useBracket ───────────────────────────────────────────────
// Fetches full knockout bracket from Zafronix.
// Caches for 5 minutes to protect the 250 req/day free tier.

const CACHE_KEY = 'wc2026_bracket'
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export function useBracket() {
  const [bracket, setBracket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [source, setSource]   = useState(null) // 'zafronix' | 'cache'

  useEffect(() => {
    let cancelled = false

    async function load() {
      // Check memory cache first
      try {
        const cached = sessionStorage.getItem(CACHE_KEY)
        if (cached) {
          const { data, ts } = JSON.parse(cached)
          if (Date.now() - ts < CACHE_TTL) {
            if (!cancelled) {
              setBracket(data.stages || data)
              setSource('cache')
              setLoading(false)
            }
            return
          }
        }
      } catch (_) {}

      try {
        const data = await fetchBracket(2026)
        const stages = data.stages || data
        if (!cancelled) {
          setBracket(stages)
          setSource('zafronix')
          setLoading(false)
          sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data: stages, ts: Date.now() }))
        }
      } catch (_) {
        if (!cancelled) {
          setError('Could not load bracket data')
          setLoading(false)
        }
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  return { bracket, loading, error, source }
}
