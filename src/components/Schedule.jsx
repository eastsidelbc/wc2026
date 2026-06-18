import { useState, useMemo } from 'react'
import { schedule } from '../data/static.js'
import { useMatches } from '../hooks/useMatches.js'
import { useLiveScores } from '../hooks/useLiveScores.js'
import { useEspnHeadlines } from '../hooks/useEspnHeadlines.js'
import styles from './Schedule.module.css'

const ALL_GROUPS = [...new Set(schedule.map(m => m.group))].sort()

const NAME_MAP = {
  'South Korea':  'Korea Republic',
  'Bosnia':       'Bosnia and Herzegovina',
  'Turkey':       'Türkiye',
  'Ivory Coast':  "Côte d'Ivoire",
  'Cape Verde':   'Cabo Verde',
  'Iran':         'IR Iran',
  'DR Congo':     'Congo DR',
}

function teamKey(str) {
  const bare = str.split(' ').slice(1).join(' ')
  return NAME_MAP[bare] ?? bare
}

export default function Schedule() {
  const [filter,    setFilter]    = useState('all')
  const [openMatch, setOpenMatch] = useState(null)

  const { matches: zMatches } = useMatches()
  const { liveScores, isLive } = useLiveScores([])
  const headlines  = useEspnHeadlines()
  const matchList  = zMatches?.data ?? zMatches ?? []

  const zLookup = useMemo(() => {
    const map = {}
    matchList.forEach(m => {
      if (m.homeTeam && m.awayTeam) {
        map[`${m.homeTeam}|${m.awayTeam}`] = m
        map[`${m.awayTeam}|${m.homeTeam}`] = m
      }
    })
    return map
  }, [zMatches])

  const byDate = {}
  schedule.forEach(m => {
    if (!byDate[m.date]) byDate[m.date] = []
    byDate[m.date].push(m)
  })

  const filtered = {}
  Object.entries(byDate).forEach(([date, matches]) => {
    const shown = matches.filter(m => {
      if (filter === 'all') return true
      if (filter === '🔥') return m.hot
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
    return headlines[`${zm.homeTeam}|${zm.awayTeam}`] ?? null
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
        {['all', '🔥', ...ALL_GROUPS].map(f => (
          <button
            key={f}
            className={`${styles.chip} ${filter === f ? styles.active : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'All' : f === '🔥' ? '🔥 Big' : `Gr ${f}`}
          </button>
        ))}
      </div>

      {Object.entries(filtered).map(([date, matches]) => (
        <div key={date} className={styles.dayBlock}>
          <div className={styles.dayLabel}>{date}</div>
          {matches.map((m, i) => {
            const live     = getLiveScore(m)
            const zm       = getZMatch(m)
            const hasScore = zm && (zm.homeScore != null || zm.awayScore != null)
            const venue    = zm ? [zm.city, zm.stadium].filter(Boolean).join(' · ') : null
            const matchKey = `${date}-${i}`
            const isOpen   = openMatch === matchKey
            const headline = getHeadline(zm)

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
                  <div className={styles.matchTime}>{m.time}</div>
                  {m.hot && <div className={styles.matchHot}>🔥</div>}
                  {hasScore && <div className={styles.matchArrow}>▼</div>}
                </div>

                {venue && !isOpen && <div className={styles.matchVenue}>{venue}</div>}

                {/* Recap accordion */}
                <div className={styles.recapExpand}>
                  <div className={styles.recapInner}>
                    {venue && <div className={styles.recapVenue}>📍 {venue}</div>}

                    {zm?.goals?.length > 0 && (
                      <div className={styles.recapGoals}>
                        {zm.goals.map((g, gi) => (
                          <div key={gi} className={styles.recapGoalRow}>
                            <span className={styles.recapMinute}>{g.minute ?? g.min ?? '—'}'</span>
                            <span className={styles.recapScorer}>
                              {g.scorer ?? g.player ?? g.playerName}
                              {g.ownGoal && <span className={styles.recapOG}> (OG)</span>}
                            </span>
                            <span className={styles.recapBall}>{g.ownGoal ? '🙈' : '⚽'}</span>
                          </div>
                        ))}
                      </div>
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
