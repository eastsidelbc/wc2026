import { useState } from 'react'
import { powerRankings, odds as ODDS } from '../data/static.js'
import styles from './PowerRankings.module.css'

export default function PowerRankings() {
  const [openRank, setOpenRank] = useState(null)

  function toggle(rank) {
    setOpenRank(prev => prev === rank ? null : rank)
  }

  return (
    <div>
      <div className={styles.sectionLabel}>Tournament Favorites</div>

      {/* Odds strip */}
      <div className={styles.oddsStrip}>
        {ODDS.map(o => (
          <div key={o.name} className={styles.oddsItem}>
            <div className={styles.oddsFlag}>{o.flag}</div>
            <div className={styles.oddsCountry}>{o.name}</div>
            <div className={styles.oddsVal}>{o.odds}</div>
          </div>
        ))}
      </div>

      {/* Tiers */}
      {powerRankings.map(tier => (
        <div key={tier.tier} className={styles.tierSection}>
          <div className={styles.tierHeader}>
            <div className={styles.tierLine} />
            <div className={styles.tierTitle}>{tier.tier}</div>
            <div className={styles.tierLine} />
          </div>

          {tier.teams.map(team => {
            const isOpen = openRank === team.rank
            return (
              <div
                key={team.rank}
                className={`${styles.rankCard} ${isOpen ? styles.open : ''}`}
                onClick={() => toggle(team.rank)}
              >
                <div className={styles.rankTop}>
                  <div className={`${styles.rankNum} ${team.rank <= 3 ? styles.top3 : ''}`}>
                    {team.rank}
                  </div>
                  <div className={styles.flag}>{team.flag}</div>
                  <div className={styles.rankInfo}>
                    <div className={styles.rankName}>{team.name}</div>
                    <div className={styles.rankNote}>{team.note}</div>
                  </div>
                  <div className={`${styles.tierBadge} ${styles[team.badgeClass]}`}>
                    {team.badge}
                  </div>
                  <div className={styles.rankArrow}>▼</div>
                </div>

                <div className={styles.rankExpand}>
                  <div className={styles.rankExpandInner}>
                    {team.summary}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
