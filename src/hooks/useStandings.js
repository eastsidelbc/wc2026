import { useState, useEffect } from 'react'
import { fetchStandings } from '../services/api.js'

const CACHE_KEY = 'wc2026_standings'
const CACHE_TTL = 5 * 60 * 1000

export function useStandings() {
  const [standings, setStandings] = useState({})
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const [source, setSource]       = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const cached = sessionStorage.getItem(CACHE_KEY)
        if (cached) {
          const { data, ts } = JSON.parse(cached)
          if (Date.now() - ts < CACHE_TTL) {
            if (!cancelled) { setStandings(data); setSource('cache'); setLoading(false) }
            return
          }
        }
      } catch (_) {}

      try {
        const data = await fetchStandings(2026)
        const groups = data.groups || data
        if (!cancelled) {
          setStandings(groups)
          setSource('zafronix')
          setLoading(false)
          sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data: groups, ts: Date.now() }))
        }
      } catch (err) {
        if (!cancelled) { setError('Could not load standings'); setLoading(false) }
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  return { standings, loading, error, source }
}
