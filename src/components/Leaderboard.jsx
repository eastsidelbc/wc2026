import { useState } from 'react'
import { useEspnLeaderboard } from '../hooks/useEspnLeaderboard.js'
import styles from './Leaderboard.module.css'

const TABS = ['Goals', 'Assists', 'Cards']

function PlayerAvatar({ headshot }) {
  if (headshot) {
    return (
      <img
        src={headshot}
        alt=""
        className={styles.flag}
        style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }}
        onError={e => { e.currentTarget.style.display = 'none' }}
      />
    )
  }
  return <div className={styles.flag}>🏳️</div>
}

export default function Leaderboard() {
  const [activeTab, setActiveTab] = useState('Goals')
  const { goalLeaders, assistLeaders, cardLeaders, loading, error } = useEspnLeaderboard()

  const rows =
    activeTab === 'Goals'   ? goalLeaders   :
    activeTab === 'Assists' ? assistLeaders :
    cardLeaders

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

      {error && !loading && (
        <div className={styles.errorState}>
          ⚠️ {error} — data will appear once matches begin.
        </div>
      )}

      {!loading && !error && rows.length === 0 && (
        <div className={styles.state}>No data yet — check back once matches begin.</div>
      )}

      {!loading && rows.length > 0 && rows.slice(0, 20).map((player, i) => (
        <div key={player.name} className={styles.playerRow}>
          <div className={`${styles.rank} ${i < 3 ? styles.topRank : ''}`}>{i + 1}</div>
          <PlayerAvatar headshot={player.headshot} />
          <div className={styles.playerInfo}>
            <div className={styles.playerName}>{player.name}</div>
            <div className={styles.playerTeam}>{player.team}</div>
          </div>
          <div className={styles.statBadge}>
            {activeTab === 'Goals'   && <>{player.goals} ⚽</>}
            {activeTab === 'Assists' && <>{player.assists} 🎯</>}
            {activeTab === 'Cards'   && (
              <>
                {player.yellowCards > 0 && <span>{player.yellowCards} 🟨</span>}
                {player.redCards    > 0 && <span style={{ marginLeft: 4 }}>{player.redCards} 🟥</span>}
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
