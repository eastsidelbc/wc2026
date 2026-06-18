import { useState } from 'react'
import { schedule } from '../data/static.js'
import { useLiveScores } from '../hooks/useLiveScores.js'
import styles from './Schedule.module.css'

const ALL_GROUPS = [...new Set(schedule.map(m => m.group))].sort()

export default function Schedule() {
  const [filter, setFilter] = useState('all')
  const { liveScores, isLive } = useLiveScores([]) // will wire matches later

  // Group matches by date
  const byDate = {}
  schedule.forEach(m => {
    if (!byDate[m.date]) byDate[m.date] = []
    byDate[m.date].push(m)
  })

  // Apply filter
  const filtered = {}
  Object.entries(byDate).forEach(([date, matches]) => {
    const shown = matches.filter(m => {
      if (filter === 'all') return true
      if (filter === '🔥') return m.hot
      return m.group === filter
    })
    if (shown.length > 0) filtered[date] = shown
  })

  // Find live score for a match
  function getLiveScore(match) {
    if (!isLive || !liveScores.length) return null
    return liveScores.find(e =>
      e.name?.toLowerCase().includes(match.home.split(' ').pop().toLowerCase()) ||
      e.name?.toLowerCase().includes(match.away.split(' ').pop().toLowerCase())
    ) || null
  }

  return (
    <div>
      {isLive && (
        <div className={styles.liveBar}>
          🔴 Live scores updating every 45 seconds
        </div>
      )}

      {/* Filter chips */}
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

      {/* Matches */}
      {Object.entries(filtered).map(([date, matches]) => (
        <div key={date} className={styles.dayBlock}>
          <div className={styles.dayLabel}>{date}</div>
          {matches.map((m, i) => {
            const live = getLiveScore(m)
            return (
              <div key={i} className={styles.matchCard}>
                <div className={styles.matchGroup}>G{m.group}</div>
                <div className={styles.matchTeams}>
                  <span>{m.home}</span>
                  {live
                    ? <span className={styles.liveScore}>
                        {live.competitors?.[0]?.score ?? '—'} – {live.competitors?.[1]?.score ?? '—'}
                      </span>
                    : <span className={styles.vs}>vs</span>
                  }
                  <span>{m.away}</span>
                </div>
                <div className={styles.matchTime}>{m.time}</div>
                {m.hot && <div className={styles.matchHot}>🔥</div>}
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
