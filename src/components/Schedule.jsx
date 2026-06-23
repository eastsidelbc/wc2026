import { useState, useMemo } from 'react'
import { schedule, TEAM_NAME_MAP, STADIUM_ELEVATION } from '../data/static.js'
import { useMatches } from '../hooks/useMatches.js'
import { useLiveScores } from '../hooks/useLiveScores.js'
import { useEspnHeadlines } from '../hooks/useEspnHeadlines.js'
import styles from './Schedule.module.css'

const NAME_MAP = TEAM_NAME_MAP
const REVERSE_NAME_MAP = Object.fromEntries(
  Object.entries(TEAM_NAME_MAP).map(([k, v]) => [v, k])
)

const ESPN_NAME_MAP = {
  'USA':              'United States',
  'Korea Republic':   'South Korea',
  'IR Iran':          'Iran',
  'Congo DR':         'DR Congo',
  'Cabo Verde':       'Cape Verde',
  'Türkiye':          'Turkey',
  'Bosnia and Herzegovina': 'Bosnia-Herzegovina',
}

function teamKey(str) {
  const bare = str.split(' ').slice(1).join(' ')
  return NAME_MAP[bare] ?? bare
}

function espnName(zName) {
  return ESPN_NAME_MAP[zName] ?? REVERSE_NAME_MAP[zName] ?? zName
}

// Match the date format used in static schedule: "Jun 23 (Mon)"
function formatToday() {
  const d = new Date()
  const month   = d.toLocaleDateString('en-US', { month: 'short' })
  const day     = d.getDate()
  const weekday = d.toLocaleDateString('en-US', { weekday: 'short' })
  return `${month} ${day} (${weekday})`
}

function parseScheduleDate(str) {
  return new Date(str.replace(/\s*\(.*\)/, '') + ' 2026')
}

const TODAY     = formatToday()
const TODAY_D   = parseScheduleDate(TODAY)
// Show Today chip whenever any matches remain (today or future)
const hasTodayOrFuture = schedule.some(m => parseScheduleDate(m.date) >= TODAY_D)

// ESPN goal type text → short badge label (null = don't show)
function goalTypeBadge(typeText) {
  if (!typeText) return null
  if (typeText === 'Goal - Header')    return 'Header'
  if (typeText === 'Goal - Volley')    return 'Volley'
  if (typeText === 'Goal - Free-kick') return 'FK'
  return null
}

// Form string "WWDLL" → last 3 chars as dot array
function formDots(formStr) {
  if (!formStr) return []
  return formStr.slice(-3).split('')
}

// Drama score from Zafronix match data
function getDrama(zm) {
  if (!zm || zm.homeScore == null) return null
  let score = 0
  const reds      = (zm.cards  ?? []).filter(c => c.color === 'red').length
  const lateGoals = (zm.goals  ?? []).filter(g => g.minute >= 80 || g.addedMinute).length
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

export default function Schedule() {
  const [filter,    setFilter]    = useState(hasTodayOrFuture ? 'today' : 'all')
  const [openMatch, setOpenMatch] = useState(null)

  const { matches: zMatches }              = useMatches()
  const { liveScores, isLive }             = useLiveScores([])
  const { headlines, goalTypes, teamForms} = useEspnHeadlines()
  const matchList = zMatches?.data ?? zMatches ?? []

  const zLookup = useMemo(() => {
    const map = {}
    matchList.forEach(m => {
      if (m.homeTeam && m.awayTeam) {
        map[`${m.homeTeam}|${m.awayTeam}`] = m
        map[`${m.awayTeam}|${m.homeTeam}`] = m
      }
    })
    return map
  }, [matchList])

  const fixtures = useMemo(() => schedule, [])

  const ALL_GROUPS = useMemo(
    () => [...new Set(fixtures.map(m => m.group))].sort(),
    [fixtures]
  )

  const byDate = {}
  fixtures.forEach(m => {
    if (!byDate[m.date]) byDate[m.date] = []
    byDate[m.date].push(m)
  })

  const filtered = {}
  Object.entries(byDate).forEach(([date, matches]) => {
    const isCurrentOrFuture = parseScheduleDate(date) >= TODAY_D
    const shown = matches.filter(m => {
      if (filter === 'all')   return true
      if (filter === 'today') return isCurrentOrFuture
      if (filter === '🔥')    return m.hot
      return m.group === filter
    })
    if (shown.length > 0) filtered[date] = shown
  })

  function getLiveScore(match) {
    if (!isLive || !liveScores.length) return null
    return liveScores.find(e =>
      e.name?.toLowerCase().includes(teamKey(match.home).toLowerCase()) ||
      e.name?.toLowerCase().includes(teamKey(match.away).toLowerCase())
    ) || null
  }

  function getZMatch(match) {
    return zLookup[`${teamKey(match.home)}|${teamKey(match.away)}`] || null
  }

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

  function toggleMatch(key) {
    setOpenMatch(prev => prev === key ? null : key)
  }

  return (
    <div>
      {isLive && (
        <div className={styles.liveBar}>
          🔴 Live scores updating every 45 seconds
        </div>
      )}

      <div className={styles.chips}>
        {[...(hasTodayOrFuture ? ['today'] : []), 'all', '🔥', ...ALL_GROUPS].map(f => (
          <button
            key={f}
            className={`${styles.chip} ${filter === f ? styles.active : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'today' ? 'Today' : f === 'all' ? 'All' : f === '🔥' ? '🔥 Big' : `Gr ${f}`}
          </button>
        ))}
      </div>

      {Object.entries(filtered).map(([date, matches]) => (
        <div key={date} className={styles.dayBlock}>
          <div className={styles.dayLabel}>{date}</div>
          {matches.map((m, i) => {
            const live      = getLiveScore(m)
            const zm        = getZMatch(m)
            const hasScore  = zm && (zm.homeScore != null || zm.awayScore != null)
            const venue     = zm ? [zm.city, zm.stadium].filter(Boolean).join(' · ') : null
            const elevation = zm?.stadiumId ? STADIUM_ELEVATION[zm.stadiumId] : null
            const matchKey  = `${date}-${i}`
            const isOpen    = openMatch === matchKey
            const headline  = getHeadline(zm)
            const drama     = getDrama(zm)
            const hasSplit  = zm?.goals?.some(g => g.team === 'home' || g.team === 'away') ?? false
            const homeGoals = hasSplit ? zm.goals.filter(g => g.team === 'home') : []
            const awayGoals = hasSplit ? zm.goals.filter(g => g.team === 'away') : []
            const homeForm  = getForm(zm?.homeTeam)
            const awayForm  = getForm(zm?.awayTeam)

            return (
              <div
                key={i}
                className={`${styles.matchCard} ${hasScore ? styles.completed : ''} ${isOpen ? styles.open : ''}`}
                onClick={hasScore ? () => toggleMatch(matchKey) : undefined}
              >
                <div className={styles.matchRow}>
                  <div className={styles.matchGroup}>G{m.group}</div>
                  <div className={styles.matchTeams}>
                    <span>{m.home}</span>
                    {live
                      ? <span className={styles.liveScore}>
                          {live.competitors?.[0]?.score ?? '—'} – {live.competitors?.[1]?.score ?? '—'}
                        </span>
                      : hasScore
                        ? <span className={styles.finalScore}>
                            {zm.homeScore} – {zm.awayScore}
                          </span>
                        : <span className={styles.vs}>vs</span>
                    }
                    <span>{m.away}</span>
                  </div>
                  <div className={styles.matchMeta}>
                    {drama && hasScore
                      ? <span className={styles.dramaBadge}>{drama.emoji} {drama.label}</span>
                      : <span className={styles.matchTime}>{m.time}</span>
                    }
                    {m.hot && <div className={styles.matchHot}>🔥</div>}
                    {hasScore && <div className={styles.matchArrow}>▼</div>}
                  </div>
                </div>

                {/* Form dots — only when ESPN form data available */}
                {(homeForm || awayForm) && (
                  <div className={styles.formRow}>
                    <div className={styles.formDots}>
                      {formDots(homeForm).map((r, fi) => (
                        <span key={fi} className={`${styles.formDot} ${styles[`form${r}`]}`} />
                      ))}
                    </div>
                    <div className={styles.formDots} style={{ justifyContent: 'flex-end' }}>
                      {formDots(awayForm).map((r, fi) => (
                        <span key={fi} className={`${styles.formDot} ${styles[`form${r}`]}`} />
                      ))}
                    </div>
                  </div>
                )}

                {venue && !isOpen && (
                  <div className={styles.matchVenue}>
                    {venue}{elevation ? ` ⛰️ ${elevation.toLocaleString()}m` : ''}
                  </div>
                )}

                <div className={styles.recapExpand}>
                  <div className={styles.recapInner}>
                    {venue && (
                      <div className={styles.recapVenue}>
                        📍 {venue}{elevation ? ` ⛰️ ${elevation.toLocaleString()}m` : ''}
                      </div>
                    )}

                    {zm?.goals?.length > 0 && (
                      hasSplit ? (
                        <div className={styles.recapGoalsSplit}>
                          <div className={`${styles.recapGoalCol} ${styles.recapGoalColHome}`}>
                            <div className={styles.recapGoalColHeader}>{m.home}</div>
                            {homeGoals.map((g, gi) => {
                              const isOG   = g.type === 'own_goal'
                              const isPen  = g.type === 'penalty'
                              const min    = g.addedMinute ? `${g.minute}+${g.addedMinute}` : `${g.minute}`
                              const badge  = !isOG && !isPen ? goalTypeBadge(getGoalType(zm, g.minute)) : null
                              return (
                                <div key={gi} className={styles.recapGoalHome}>
                                  <span className={styles.recapScorerName}>
                                    {g.scorer}
                                    {isOG  && <span className={styles.recapOG}> OG</span>}
                                    {isPen && <span className={styles.recapOG}> P</span>}
                                    {badge && <span className={styles.goalTypeBadge}>{badge}</span>}
                                  </span>
                                  <span className={styles.recapMinuteSplit}>
                                    {min}' {isOG ? '🙈' : '⚽'}
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                          <div className={`${styles.recapGoalCol} ${styles.recapGoalColAway}`}>
                            <div className={styles.recapGoalColHeader}>{m.away}</div>
                            {awayGoals.map((g, gi) => {
                              const isOG   = g.type === 'own_goal'
                              const isPen  = g.type === 'penalty'
                              const min    = g.addedMinute ? `${g.minute}+${g.addedMinute}` : `${g.minute}`
                              const badge  = !isOG && !isPen ? goalTypeBadge(getGoalType(zm, g.minute)) : null
                              return (
                                <div key={gi} className={styles.recapGoalAway}>
                                  <span className={styles.recapMinuteSplit}>
                                    {isOG ? '🙈' : '⚽'} {min}'
                                  </span>
                                  <span className={styles.recapScorerName}>
                                    {g.scorer}
                                    {isOG  && <span className={styles.recapOG}> OG</span>}
                                    {isPen && <span className={styles.recapOG}> P</span>}
                                    {badge && <span className={styles.goalTypeBadge}>{badge}</span>}
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className={styles.recapGoals}>
                          {zm.goals.map((g, gi) => {
                            const isOG  = g.type === 'own_goal'
                            const isPen = g.type === 'penalty'
                            const min   = g.addedMinute ? `${g.minute}+${g.addedMinute}` : `${g.minute}`
                            const badge = !isOG && !isPen ? goalTypeBadge(getGoalType(zm, g.minute)) : null
                            return (
                              <div key={gi} className={styles.recapGoalRow}>
                                <span className={styles.recapMinute}>{min}'</span>
                                <span className={styles.recapScorer}>
                                  {g.scorer}
                                  {isOG  && <span className={styles.recapOG}> (OG)</span>}
                                  {isPen && <span className={styles.recapOG}> (P)</span>}
                                  {badge && <span className={styles.goalTypeBadge}>{badge}</span>}
                                </span>
                                <span className={styles.recapBall}>{isOG ? '🙈' : '⚽'}</span>
                              </div>
                            )
                          })}
                        </div>
                      )
                    )}

                    {headline && (
                      <div className={styles.recapHeadline}>"{headline}"</div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ))}

      {Object.keys(filtered).length === 0 && (
        <div className={styles.empty}>No matches for this filter.</div>
      )}
    </div>
  )
}
