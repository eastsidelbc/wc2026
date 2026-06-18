import { useState } from 'react'
import { groups } from '../data/static.js'
import styles from './Groups.module.css'

const VERDICT_CLASS = {
  lock:   styles.vLock,
  likely: styles.vLikely,
  bubble: styles.vBubble,
  out:    styles.vOut,
}

export default function Groups() {
  const [openGroups, setOpenGroups] = useState(new Set())

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
                {g.teams.map(t => (
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
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
