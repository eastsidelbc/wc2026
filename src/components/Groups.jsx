import { useState } from 'react'
import { groups } from '../data/static.js'
import { useStandings } from '../hooks/useStandings.js'
import styles from './Groups.module.css'

const VERDICT_CLASS = {
  lock:   styles.vLock,
  likely: styles.vLikely,
  bubble: styles.vBubble,
  out:    styles.vOut,
}

// Build flag and verdict lookups from static data
const FLAG_MAP    = {}
const VERDICT_MAP = {}
groups.forEach(g => g.teams.forEach(t => {
  FLAG_MAP[t.name]    = t.flag
  VERDICT_MAP[t.name] = { verdict: t.verdict, label: t.label }
}))

export default function Groups() {
  const [openGroups, setOpenGroups] = useState(new Set())
  const { standings } = useStandings()

  function toggle(letter) {
    setOpenGroups(prev => {
      const next = new Set(prev)
      next.has(letter) ? next.delete(letter) : next.add(letter)
      return next
    })
  }

  return (
    <div>
      <div className={styles.infoBar}>
        Top 2 from each group advance. Best 8 third-place teams also advance → Round of 32.
      </div>

      {groups.map(g => {
        const isOpen = openGroups.has(g.letter)
        const liveRows = standings[g.letter]

        return (
          <div key={g.letter} className={`${styles.groupCard} ${isOpen ? styles.open : ''}`}>
            <div className={styles.groupHeader} onClick={() => toggle(g.letter)}>
              <div className={styles.groupLetter}>G{g.letter}</div>
              <div className={styles.groupPreview}>
                {g.hot && '🔥 '}
                <strong>{g.teams[0].name}</strong>
                {' · '}{g.teams.slice(1).map(t => t.name).join(' · ')}
              </div>
              <div className={styles.groupArrow}>▼</div>
            </div>

            {isOpen && (
              <div className={styles.groupBody}>
                {liveRows ? (
                  <>
                    <div className={styles.standHeader}>
                      <div style={{ width: 16 }} />
                      <div style={{ width: 18 }} />
                      <div className={styles.standHeaderSpacer} />
                      <div className={styles.standHeaderLabels}>
                        <div className={styles.standHeaderLabel}>P</div>
                        <div className={styles.standHeaderLabel}>GD</div>
                        <div className={styles.standHeaderLabel}>Pts</div>
                      </div>
                    </div>
                    {liveRows.map(row => {
                      const v = VERDICT_MAP[row.team]
                      return (
                        <div
                          key={row.team}
                          className={`${styles.standRow} ${row.advanced ? styles.advanced : ''}`}
                        >
                          <div className={`${styles.standPos} ${row.position <= 2 ? styles.top : ''}`}>
                            {row.position}
                          </div>
                          <div className={styles.standFlag}>{FLAG_MAP[row.team] || '🏳️'}</div>
                          <div className={styles.standName}>{row.team}</div>
                          {v && (
                            <div className={`${styles.verdict} ${VERDICT_CLASS[v.verdict] || ''}`}>
                              {v.label}
                            </div>
                          )}
                          <div className={styles.standStats}>
                            <div className={styles.standStat}>{row.played}</div>
                            <div className={styles.standStat}>{row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}</div>
                            <div className={`${styles.standStat} ${styles.pts}`}>{row.points}</div>
                          </div>
                        </div>
                      )
                    })}
                  </>
                ) : (
                  g.teams.map(t => (
                    <div key={t.name} className={styles.teamRow}>
                      <div className={styles.teamFlag}>{t.flag}</div>
                      <div className={styles.teamInfo}>
                        <div className={styles.teamName}>{t.name}</div>
                        <div className={styles.teamSub}>{t.sub}</div>
                      </div>
                      <div className={`${styles.verdict} ${VERDICT_CLASS[t.verdict]}`}>
                        {t.label}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
