import { useState, useEffect } from 'react'

const CACHE_KEY = 'wc2026_buzz'
const CACHE_TTL = 20 * 60 * 1000

export function useRssHeadlines() {
  const [state, setState] = useState({ articles: [], loading: true })

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(CACHE_KEY)
      if (raw) {
        const { data, ts } = JSON.parse(raw)
        if (Date.now() - ts < CACHE_TTL) {
          setState({ articles: data, loading: false })
          return
        }
      }
    } catch {}

    fetch('/api/rss/bbc')
      .then(r => r.json())
      .then(data => {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }))
        setState({ articles: data, loading: false })
      })
      .catch(() => setState({ articles: [], loading: false }))
  }, [])

  return state
}
