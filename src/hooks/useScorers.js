import { useState, useEffect } from 'react'
import { fetchTopScorers } from '../services/api.js'

const CACHE_KEY = 'wc2026_scorers'
const CACHE_TTL = 10 * 60 * 1000 // 10 minutes — scorers don't change mid-match

export function useScorers() {
  const [scorers, setScorers]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const cached = sessionStorage.getItem(CACHE_KEY)
        if (cached) {
          const { data, ts } = JSON.parse(cached)
          if (Date.now() - ts < CACHE_TTL) {
            if (!cancelled) { setScorers(data); setLoading(false) }
            return
          }
        }
      } catch (_) {}

      try {
        const data = await fetchTopScorers(2026)
        const list = data.scorers || data.players || data
        if (!cancelled) {
          setScorers(list)
          setLoading(false)
          sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data: list, ts: Date.now() }))
        }
      } catch (err) {
        if (!cancelled) {
          setError('Could not load scorer data')
          setLoading(false)
        }
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  return { scorers, loading, error }
}
