// ============================================================
// API SERVICE — wc2026
// All external data fetching lives here.
// AGENT-DATA is responsible for changes to this file.
//
// Sources:
//   Zafronix   → /api/zafronix/*  (Vercel serverless proxy)
//   ESPN       → /api/espn/*      (Vercel serverless proxy, CORS fix)
//   Fallback   → openfootball GitHub raw JSON
//
// Dev mode: calls Zafronix directly (no Vercel functions needed).
// Prod mode: all Zafronix calls go through /api/zafronix/* proxy.
//
// DATA SOURCE STRATEGY
// Goals leaderboard    → ESPN (athletesInvolved in details[])
// Cards leaderboard    → ESPN (yellowCard/redCard in details[])
// Assists              → ESPN (not available yet)
// Live scores          → ESPN (scoreboard endpoint)
// Match results        → Zafronix /matches (primary) + ESPN (fallback)
// Group standings      → Zafronix /standings
// Stadium + city       → Zafronix /stadiums
// Bracket              → Zafronix /bracket (future)
// Scorers backup       → Zafronix /matches goals[] array (fallback if ESPN down)
// ============================================================

const isDev = import.meta.env.DEV

const BASE = isDev
  ? 'https://api.zafronix.com/fifa/worldcup/v1'
  : '/api/zafronix'

const HEADERS = isDev
  ? { 'X-API-Key': import.meta.env.VITE_ZAFRONIX_KEY }
  : {}

// ── Zafronix ────────────────────────────────────────────────

export async function fetchMatches(year = 2026) {
  const res = await fetch(`${BASE}/matches?year=${year}`, { headers: HEADERS })
  if (!res.ok) throw new Error('Zafronix matches failed')
  return res.json()
}

export async function fetchStandings(year = 2026) {
  const res = await fetch(`${BASE}/standings?year=${year}`, { headers: HEADERS })
  if (!res.ok) throw new Error('Zafronix standings failed')
  return res.json()
}

export async function fetchTopScorers(year = 2026) {
  const res = await fetch(`${BASE}/scorers?year=${year}`, { headers: HEADERS })
  if (!res.ok) throw new Error('Zafronix scorers failed')
  return res.json()
}

export async function fetchPlayers(year = 2026) {
  const res = await fetch(`${BASE}/players?year=${year}`, { headers: HEADERS })
  if (!res.ok) throw new Error('Zafronix players failed')
  return res.json()
}

export async function fetchRoster(team, year = 2026) {
  const res = await fetch(`${BASE}/teams/${encodeURIComponent(team)}/roster?year=${year}`, { headers: HEADERS })
  if (!res.ok) throw new Error('Zafronix roster failed')
  return res.json()
}

// ── ESPN Live Scores ─────────────────────────────────────────
// Only called during active match windows to preserve rate limits

export async function fetchLiveScores() {
  const res = await fetch('/api/espn/live')
  if (!res.ok) throw new Error('ESPN live scores failed')
  return res.json()
}

const ESPN_SCOREBOARD = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard'

export async function fetchEspnLive() {
  const url = isDev ? ESPN_SCOREBOARD : '/api/espn/live'
  const res = await fetch(url)
  if (!res.ok) throw new Error('ESPN live failed')
  return res.json()
}

// Semantic alias — use this in leaderboard/stats contexts
export async function fetchEspnScoreboard() {
  const url = isDev ? ESPN_SCOREBOARD : '/api/espn/live'
  const res = await fetch(url)
  if (!res.ok) throw new Error('ESPN scoreboard failed')
  return res.json()
}

// Fallback scorer list built from Zafronix match goals[] arrays.
// Used when ESPN scoreboard is unavailable.
export async function fetchZafronixGoals(year = 2026) {
  const data = await fetchMatches(year)
  const matches = data.matches ?? (Array.isArray(data) ? data : [])
  const scorerMap = {}

  for (const match of matches) {
    for (const goal of (match.goals ?? [])) {
      if (goal.ownGoal) continue
      const name = goal.scorer ?? goal.player ?? goal.playerName
      if (!name) continue
      const team = goal.team ?? goal.teamName ?? ''
      if (!scorerMap[name]) {
        scorerMap[name] = { name, team, headshot: null, goals: 0, yellowCards: 0, redCards: 0 }
      }
      scorerMap[name].goals++
    }
  }

  return Object.values(scorerMap).sort((a, b) => b.goals - a.goals)
}

export async function fetchOnThisDay() {
  const res = await fetch(`${BASE}/on-this-day`, { headers: HEADERS })
  if (!res.ok) throw new Error('Zafronix on-this-day failed')
  return res.json()
}

export async function fetchTrivia(year = 2026) {
  const res = await fetch(`${BASE}/trivia?year=${year}`, { headers: HEADERS })
  if (!res.ok) throw new Error('Zafronix trivia failed')
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
