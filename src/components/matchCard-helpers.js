import { TEAM_NAME_MAP, STADIUM_ELEVATION } from '../data/static.js'
import { useEspnHeadlines } from '../hooks/useEspnHeadlines.js'

// Zafronix name → ESPN display name differences not covered by TEAM_NAME_MAP
export const ESPN_NAME_MAP = {
  'USA':              'United States',
  'Korea Republic':   'South Korea',
  'IR Iran':          'Iran',
  'Congo DR':         'DR Congo',
  'Cabo Verde':       'Cape Verde',
  'Türkiye':          'Turkey',
  'Bosnia and Herzegovina': 'Bosnia-Herzegovina',
}

const REVERSE_NAME_MAP = Object.fromEntries(
  Object.entries(TEAM_NAME_MAP).map(([k, v]) => [v, k])
)

export function espnName(zName) {
  return ESPN_NAME_MAP[zName] ?? REVERSE_NAME_MAP[zName] ?? zName
}

// ESPN goal type text → short badge label (null = don't show)
export function goalTypeBadge(typeText) {
  if (!typeText) return null
  if (typeText === 'Goal - Header')    return 'Header'
  if (typeText === 'Goal - Volley')    return 'Volley'
  if (typeText === 'Goal - Free-kick') return 'FK'
  return null
}

export function formatGoalMinute(g) {
  return g.addedMinute ? `${g.minute}+${g.addedMinute}` : `${g.minute}`
}

// Minute text + own-goal/penalty flags + ESPN goal-type badge for one goal event
export function describeGoal(g, zm, getGoalType) {
  const isOG   = g.type === 'own_goal'
  const isPen  = g.type === 'penalty'
  const minute = formatGoalMinute(g)
  const badge  = !isOG && !isPen && getGoalType ? goalTypeBadge(getGoalType(zm, g.minute)) : null
  return { minute, isOG, isPen, badge }
}

export function splitGoalsByTeam(goals) {
  const hasSplit  = goals?.some(g => g.team === 'home' || g.team === 'away') ?? false
  const homeGoals = hasSplit ? goals.filter(g => g.team === 'home') : []
  const awayGoals = hasSplit ? goals.filter(g => g.team === 'away') : []
  return { hasSplit, homeGoals, awayGoals }
}

// City · stadium, with elevation callout for high-altitude venues
export function getVenue(zm) {
  if (!zm) return null
  const venue = [zm.city, zm.stadium].filter(Boolean).join(' · ')
  if (!venue) return null
  const elevation = zm.stadiumId ? STADIUM_ELEVATION[zm.stadiumId] : null
  return elevation ? `${venue} ⛰️ ${elevation.toLocaleString()}m` : venue
}

// Drama score from Zafronix match data
export function getDrama(zm) {
  if (!zm || zm.homeScore == null) return null
  let score = 0
  const reds      = (zm.cards ?? []).filter(c => c.color === 'red').length
  const lateGoals = (zm.goals ?? []).filter(g => g.minute >= 80 || g.addedMinute).length
  const total     = (zm.homeScore ?? 0) + (zm.awayScore ?? 0)
  const margin    = Math.abs((zm.homeScore ?? 0) - (zm.awayScore ?? 0))

  score += reds      * 2
  score += lateGoals * 2
  if (margin === 0) score += 3
  else if (margin === 1) score += 1
  if (total >= 4)   score += 2

  if (score >= 8) return { label: 'Chaos',    emoji: '💥' }
  if (score >= 5) return { label: 'Thriller', emoji: '🔥' }
  if (score >= 3) return { label: 'Lively',   emoji: '⚡' }
  return null
}

// Form string "WWDLL" → last 3 chars as dot array
export function formDots(formStr) {
  if (!formStr) return []
  return formStr.slice(-3).split('')
}

// Wraps useEspnHeadlines with team-pair/ESPN-name lookup helpers
export function useMatchHeadline() {
  const { headlines, goalTypes, teamForms } = useEspnHeadlines()

  function getHeadline(zm) {
    if (!zm) return null
    const home = espnName(zm.homeTeam)
    const away = espnName(zm.awayTeam)
    return headlines[`${home}|${away}`] ?? headlines[`${away}|${home}`] ?? null
  }

  function getGoalType(zm, minute) {
    if (!zm) return null
    const home = espnName(zm.homeTeam)
    const away = espnName(zm.awayTeam)
    const map  = goalTypes[`${home}|${away}`] ?? goalTypes[`${away}|${home}`]
    return map?.[minute] ?? null
  }

  function getForm(zName) {
    return teamForms[espnName(zName)] ?? null
  }

  return { getHeadline, getGoalType, getForm }
}
