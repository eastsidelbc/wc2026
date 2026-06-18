import { useState, useEffect } from 'react'
import { fetchMatches, fetchFallbackMatches } from '../services/api.js'

// ── useMatches ───────────────────────────────────────────────
// Fetches all WC2026 matches from Zafronix.
// Falls back to openfootball on error.
// Caches for 5 minutes to protect the 250 req/day free tier.

const CACHE_KEY = 'wc2026_matches'
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export function useMatches() {
  const [matches, setMatches]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [source, setSource]     = useState(null) // 'zafronix' | 'fallback'

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
              setMatches(data.matches || data)
              setSource('cache')
              setLoading(false)
            }
            return
          }
        }
      } catch (_) {}

      try {
        const data = await fetchMatches(2026)
        const matches = data.matches || data
        if (!cancelled) {
          setMatches(matches)
          setSource('zafronix')
          setLoading(false)
          sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data: matches, ts: Date.now() }))
        }
      } catch (_) {
        try {
          const fallback = await fetchFallbackMatches()
          if (!cancelled) {
            setMatches(fallback.matches || [])
            setSource('fallback')
            setLoading(false)
          }
        } catch (fallbackErr) {
          if (!cancelled) {
            setError('Could not load match data')
            setLoading(false)
          }
        }
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  return { matches, loading, error, source }
}
