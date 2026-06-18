import { useState, useEffect } from 'react'
import { fetchEspnScoreboard } from '../services/api.js'

const CACHE_KEY = 'wc2026_espn_headlines'
const CACHE_TTL = 5 * 60 * 1000

// Returns a map: "TeamA|TeamB" → headline string (both orientations keyed)
export function useEspnHeadlines() {
  const [headlines, setHeadlines] = useState({})

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const cached = sessionStorage.getItem(CACHE_KEY)
        if (cached) {
          const { data, ts } = JSON.parse(cached)
          if (Date.now() - ts < CACHE_TTL) {
            if (!cancelled) setHeadlines(data)
            return
          }
        }
      } catch (_) {}

      try {
        const data = await fetchEspnScoreboard()
        const map  = {}

        for (const event of (data.events ?? [])) {
          for (const competition of (event.competitions ?? [])) {
            const headline = competition.headlines?.[0]?.description
            if (!headline) continue
            const teams = (competition.competitors ?? [])
              .map(c => c.team?.displayName)
              .filter(Boolean)
            if (teams.length >= 2) {
              map[`${teams[0]}|${teams[1]}`] = headline
              map[`${teams[1]}|${teams[0]}`] = headline
            }
          }
        }

        if (!cancelled) {
          setHeadlines(map)
          sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data: map, ts: Date.now() }))
        }
      } catch (_) {}
    }

    load()
    return () => { cancelled = true }
  }, [])

  return headlines
}
