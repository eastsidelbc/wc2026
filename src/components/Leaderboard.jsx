import { useState } from 'react'
import { useScorers } from '../hooks/useScorers.js'
import styles from './Leaderboard.module.css'

const TABS = ['Goals', 'Assists', 'Cards']

export default function Leaderboard() {
  const [activeTab, setActiveTab] = useState('Goals')
  const { scorers, loading, error } = useScorers()

  // Sort based on active tab
  const sorted = [...scorers].sort((a, b) => {
    if (activeTab === 'Goals')   return (b.goals   ?? 0) - (a.goals   ?? 0)
    if (activeTab === 'Assists') return (b.assists  ?? 0) - (a.assists  ?? 0)
    if (activeTab === 'Cards')   return (b.yellowCards ?? 0) - (a.yellowCards ?? 0)
    return 0
  }).slice(0, 20)

  return (
    <div>
      <div className={styles.sectionLabel}>Tournament Leaderboard</div>

      <div className={styles.tabs}>
        {TABS.map(t => (
          <button
            key={t}
            className={`${styles.tab} ${activeTab === t ? styles.active : ''}`}
            onClick={() => setActiveTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {loading && (
        <div className={styles.state}>
          <div className={styles.spinner} />
          <span>Loading {activeTab.toLowerCase()}...</span>
        </div>
      )}

      {error && (
        <div className={styles.errorState}>
          ⚠️ {error} — data will appear once the tournament starts.
        </div>
      )}

      {!loading && !error && sorted.length === 0 && (
        <div className={styles.state}>
          No data yet — check back once matches begin.
        </div>
      )}

      {!loading && sorted.length > 0 && sorted.map((player, i) => (
        <div key={player.name || i} className={styles.playerRow}>
          <div className={`${styles.rank} ${i < 3 ? styles.topRank : ''}`}>
            {i + 1}
          </div>
          <div className={styles.flag}>{player.flag || player.country_flag || '🏳️'}</div>
          <div className={styles.playerInfo}>
            <div className={styles.playerName}>{player.name}</div>
            <div className={styles.playerTeam}>{player.team || player.country}</div>
          </div>
          <div className={styles.statBadge}>
            {activeTab === 'Goals'   && <>{player.goals   ?? 0} ⚽</>}
            {activeTab === 'Assists' && <>{player.assists  ?? 0} 🎯</>}
            {activeTab === 'Cards'   && <>{player.yellowCards ?? 0} 🟨</>}
          </div>
        </div>
      ))}
    </div>
  )
}
