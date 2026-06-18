// ============================================================
// API SERVICE — wc2026
// All external data fetching lives here.
// AGENT-DATA is responsible for changes to this file.
//
// Sources:
//   Zafronix   → /api/zafronix/*  (Vercel serverless proxy)
//   ESPN       → /api/espn/*      (Vercel serverless proxy, CORS fix)
//   Fallback   → openfootball GitHub raw JSON
// ============================================================

const BASE = import.meta.env.DEV
  ? 'http://localhost:3000'
  : ''

// ── Zafronix ────────────────────────────────────────────────

export async function fetchMatches(year = 2026) {
  const res = await fetch(`${BASE}/api/zafronix/matches?year=${year}`)
  if (!res.ok) throw new Error('Zafronix matches failed')
  return res.json()
}

export async function fetchStandings(year = 2026) {
  const res = await fetch(`${BASE}/api/zafronix/standings?year=${year}`)
  if (!res.ok) throw new Error('Zafronix standings failed')
  return res.json()
}

export async function fetchTopScorers(year = 2026) {
  const res = await fetch(`${BASE}/api/zafronix/scorers?year=${year}`)
  if (!res.ok) throw new Error('Zafronix scorers failed')
  return res.json()
}

export async function fetchPlayers(year = 2026) {
  const res = await fetch(`${BASE}/api/zafronix/players?year=${year}`)
  if (!res.ok) throw new Error('Zafronix players failed')
  return res.json()
}

// ── ESPN Live Scores ─────────────────────────────────────────
// Only called during active match windows to preserve rate limits

export async function fetchLiveScores() {
  const res = await fetch(`${BASE}/api/espn/live`)
  if (!res.ok) throw new Error('ESPN live scores failed')
  return res.json()
}

// ── Fallback ─────────────────────────────────────────────────

export async function fetchFallbackMatches() {
  const res = await fetch(
    'https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json'
  )
  if (!res.ok) throw new Error('Fallback failed')
  return res.json()
}

// ── Helpers ──────────────────────────────────────────────────

// Returns true if any match is currently live (within kickoff ± 120 min)
export function isMatchWindowActive(matches = []) {
  const now = Date.now()
  return matches.some(m => {
    if (!m.kickoff_utc) return false
    const kick = new Date(m.kickoff_utc).getTime()
    return now >= kick && now <= kick + 120 * 60 * 1000
  })
}
