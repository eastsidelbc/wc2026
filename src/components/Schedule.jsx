import { useState, useMemo } from 'react'
import { schedule, TEAM_NAME_MAP } from '../data/static.js'
import { useMatches } from '../hooks/useMatches.js'
import { useStandings } from '../hooks/useStandings.js'
import { useLiveScores } from '../hooks/useLiveScores.js'
import { formDots, getDrama, splitGoalsByTeam, describeGoal, getVenue, useMatchHeadline } from './matchCard-helpers.js'
import styles from './Schedule.module.css'

const NAME_MAP = TEAM_NAME_MAP

function teamKey(str) {
  const bare = str.split(' ').slice(1).join(' ')
  return NAME_MAP[bare] ?? bare
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

export default function Schedule() {
  const [filter,    setFilter]    = useState(hasTodayOrFuture ? 'today' : 'all')
  const [openMatch, setOpenMatch] = useState(null)

  const { matches: zMatches }               = useMatches()
  const { standings }                       = useStandings()
  const { liveScores, isLive }              = useLiveScores([])
  const { getHeadline, getGoalType, getForm } = useMatchHeadline()
  const matchList = zMatches?.data ?? zMatches ?? []

  // Flat map: Zafronix team name → group position (1–4)
  const positionMap = useMemo(() => {
    const map = {}
    Object.values(standings).forEach(group => {
      group.forEach(entry => { map[entry.team] = entry.position })
    })
    return map
  }, [standings])

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

  function getPosition(zName) {
    return positionMap[zName] ?? null
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

      <div className={styles.disclaimer}>
        Numbers show each team's current position in their group
      </div>

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
            const venue     = getVenue(zm)
            const matchKey  = `${date}-${i}`
            const isOpen    = openMatch === matchKey
            const headline  = getHeadline(zm)
            const drama     = getDrama(zm)
            const { hasSplit, homeGoals, awayGoals } = splitGoalsByTeam(zm?.goals)
            const homeForm  = getForm(zm?.homeTeam)
            const awayForm  = getForm(zm?.awayTeam)
            const homePos   = zm ? getPosition(zm.homeTeam) : null
            const awayPos   = zm ? getPosition(zm.awayTeam) : null

            return (
              <div
                key={i}
                className={`${styles.matchCard} ${hasScore ? styles.completed : ''} ${isOpen ? styles.open : ''}`}
                onClick={hasScore ? () => toggleMatch(matchKey) : undefined}
              >
                <div className={styles.matchRow}>
                  <div className={styles.matchGroup}>G{m.group}</div>
                  <div className={styles.matchTeams}>
                    <span>{m.home}{homePos && <span className={`${styles.teamPos} ${homePos <= 2 ? styles.teamPosAdvancing : styles.teamPosFading}`}>{homePos}</span>}</span>
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
                    <span>{m.away}{awayPos && <span className={`${styles.teamPos} ${awayPos <= 2 ? styles.teamPosAdvancing : styles.teamPosFading}`}>{awayPos}</span>}</span>
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
                  <div className={styles.matchVenue}>{venue}</div>
                )}

                <div className={styles.recapExpand}>
                  <div className={styles.recapInner}>
                    {venue && (
                      <div className={styles.recapVenue}>📍 {venue}</div>
                    )}

                    {zm?.goals?.length > 0 && (
                      hasSplit ? (
                        <div className={styles.recapGoalsSplit}>
                          <div className={`${styles.recapGoalCol} ${styles.recapGoalColHome}`}>
                            <div className={styles.recapGoalColHeader}>{m.home}</div>
                            {homeGoals.map((g, gi) => {
                              const { minute: min, isOG, isPen, badge } = describeGoal(g, zm, getGoalType)
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
                              const { minute: min, isOG, isPen, badge } = describeGoal(g, zm, getGoalType)
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
                            const { minute: min, isOG, isPen, badge } = describeGoal(g, zm, getGoalType)
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
