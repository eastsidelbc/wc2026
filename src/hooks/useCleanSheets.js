import { useState, useEffect } from 'react'
import { useMatches } from './useMatches.js'

const CACHE_KEY = 'wc2026_cleansheets'
const CACHE_TTL = 5 * 60 * 1000

export function useCleanSheets() {
  const { matches, loading: matchesLoading } = useMatches()
  const [leaders, setLeaders]   = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    try {
      const cached = sessionStorage.getItem(CACHE_KEY)
      if (cached) {
        const { data, ts } = JSON.parse(cached)
        if (Date.now() - ts < CACHE_TTL) {
          setLeaders(data)
          setLoading(false)
          return
        }
      }
    } catch (_) {}

    if (matchesLoading) return

    const matchList = Array.isArray(matches) ? matches : (matches?.data ?? [])
    const sheetMap  = {}

    for (const m of matchList) {
      if (m.homeScore === null || m.homeScore === undefined) continue

      // Away team scored 0 → home team clean sheet
      if (m.awayScore === 0) {
        const gk  = m.lineups?.home?.find(p => p.position === 'GK' && p.starter === true)
        const key = m.homeTeam
        if (!sheetMap[key]) sheetMap[key] = { team: m.homeTeam, goalkeeper: gk?.name ?? null, cleanSheets: 0 }
        sheetMap[key].cleanSheets++
        if (gk?.name && !sheetMap[key].goalkeeper) sheetMap[key].goalkeeper = gk.name
      }

      // Home team scored 0 → away team clean sheet
      if (m.homeScore === 0) {
        const gk  = m.lineups?.away?.find(p => p.position === 'GK' && p.starter === true)
        const key = m.awayTeam
        if (!sheetMap[key]) sheetMap[key] = { team: m.awayTeam, goalkeeper: gk?.name ?? null, cleanSheets: 0 }
        sheetMap[key].cleanSheets++
        if (gk?.name && !sheetMap[key].goalkeeper) sheetMap[key].goalkeeper = gk.name
      }
    }

    const result = Object.values(sheetMap).sort((a, b) => b.cleanSheets - a.cleanSheets)
    setLeaders(result)
    setLoading(false)
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data: result, ts: Date.now() }))
    } catch (_) {}
  }, [matches, matchesLoading])

  return { leaders, loading }
}
