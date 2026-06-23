import { useState, useEffect } from 'react'
import { fetchEspnScoreboard } from '../services/api.js'

const CACHE_KEY = 'wc2026_espn_headlines'
const CACHE_TTL = 5 * 60 * 1000

function parseEspnMinute(display) {
  if (!display) return null
  const m = display.match(/^(\d+)/)
  return m ? parseInt(m[1]) : null
}

// Returns { headlines, goalTypes, teamForms }
// headlines:  "TeamA|TeamB" → recap string
// goalTypes:  "TeamA|TeamB" → { [minute]: "Header"|"Volley"|"Free-kick"|... }
// teamForms:  "ESPN displayName" → "WWDLL" (last 5 results)
export function useEspnHeadlines() {
  const [state, setState] = useState({ headlines: {}, goalTypes: {}, teamForms: {} })

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const cached = sessionStorage.getItem(CACHE_KEY)
        if (cached) {
          const { data, ts } = JSON.parse(cached)
          if (Date.now() - ts < CACHE_TTL && data.headlines) {
            if (!cancelled) setState(data)
            return
          }
        }
      } catch (_) {}

      try {
        const data     = await fetchEspnScoreboard()
        const headlines  = {}
        const goalTypes  = {}
        const teamForms  = {}

        for (const event of (data.events ?? [])) {
          for (const competition of (event.competitions ?? [])) {
            const competitors = competition.competitors ?? []
            const teams = competitors.map(c => c.team?.displayName).filter(Boolean)
            if (teams.length < 2) continue

            const key  = `${teams[0]}|${teams[1]}`
            const keyR = `${teams[1]}|${teams[0]}`

            // Headlines
            const headline = competition.headlines?.[0]?.description
            if (headline) {
              headlines[key]  = headline
              headlines[keyR] = headline
            }

            // Goal types by minute
            const typeMap = {}
            for (const detail of (competition.details ?? [])) {
              if (!detail.scoringPlay) continue
              const min = parseEspnMinute(detail.clock?.displayValue)
              if (min != null) typeMap[min] = detail.type?.text
            }
            if (Object.keys(typeMap).length) {
              goalTypes[key]  = typeMap
              goalTypes[keyR] = typeMap
            }

            // Team form strings
            for (const c of competitors) {
              if (c.team?.displayName && c.form) {
                teamForms[c.team.displayName] = c.form
              }
            }
          }
        }

        const next = { headlines, goalTypes, teamForms }
        if (!cancelled) {
          setState(next)
          sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data: next, ts: Date.now() }))
        }
      } catch (_) {}
    }

    load()
    return () => { cancelled = true }
  }, [])

  return state
}
