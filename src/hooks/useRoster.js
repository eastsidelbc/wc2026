import { useState, useEffect } from 'react'
import { fetchRoster } from '../services/api.js'

const CACHE_TTL = 10 * 60 * 1000

export function useRoster(team) {
  const [roster, setRoster]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    if (!team) { setLoading(false); return }
    let cancelled = false
    const CACHE_KEY = `wc2026_roster_${team}`

    async function load() {
      try {
        const cached = sessionStorage.getItem(CACHE_KEY)
        if (cached) {
          const { data, ts } = JSON.parse(cached)
          if (Date.now() - ts < CACHE_TTL) {
            if (!cancelled) { setRoster(data); setLoading(false) }
            return
          }
        }
      } catch (_) {}

      try {
        const data = await fetchRoster(team)
        const list = Array.isArray(data) ? data : (data.roster || data.players || [])
        if (!cancelled) {
          setRoster(list)
          setLoading(false)
          sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data: list, ts: Date.now() }))
        }
      } catch (err) {
        if (!cancelled) { setError('Could not load roster'); setLoading(false) }
      }
    }

    load()
    return () => { cancelled = true }
  }, [team])

  return { roster, loading, error }
}
