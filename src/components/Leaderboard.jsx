import { useState } from 'react'
import { useEspnLeaderboard } from '../hooks/useEspnLeaderboard.js'
import { useCleanSheets } from '../hooks/useCleanSheets.js'
import { groups, TEAM_NAME_MAP } from '../data/static.js'
import styles from './Leaderboard.module.css'

const TABS = ['Goals', 'Assists', 'Cards', 'Clean Sheets']

const FLAG_MAP = {}
for (const g of groups) {
  for (const t of g.teams) {
    FLAG_MAP[t.name] = t.flag
    if (TEAM_NAME_MAP[t.name]) FLAG_MAP[TEAM_NAME_MAP[t.name]] = t.flag
  }
}

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
  const { leaders: csLeaders, loading: csLoading } = useCleanSheets()

  const isCleanSheets  = activeTab === 'Clean Sheets'
  const activeLoading  = isCleanSheets ? csLoading : loading

  const rows =
    activeTab === 'Goals'   ? goalLeaders   :
    activeTab === 'Assists' ? assistLeaders :
    activeTab === 'Cards'   ? cardLeaders   :
    []

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

      {activeLoading && (
        <div className={styles.state}>
          <div className={styles.spinner} />
          <span>Loading {activeTab.toLowerCase()}...</span>
        </div>
      )}

      {error && !loading && !isCleanSheets && (
        <div className={styles.errorState}>
          ⚠️ {error} — data will appear once matches begin.
        </div>
      )}

      {/* Goals / Assists / Cards */}
      {!isCleanSheets && !loading && !error && rows.length === 0 && (
        <div className={styles.state}>No data yet — check back once matches begin.</div>
      )}

      {!isCleanSheets && !loading && rows.length > 0 && rows.slice(0, 20).map((player, i) => (
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

      {/* Clean Sheets */}
      {isCleanSheets && !csLoading && csLeaders.length === 0 && (
        <div className={styles.state}>No clean sheets recorded yet.</div>
      )}

      {isCleanSheets && !csLoading && csLeaders.map((cs, i) => (
        <div key={cs.team} className={styles.playerRow}>
          <div className={`${styles.rank} ${i < 3 ? styles.topRank : ''}`}>{i + 1}</div>
          <div className={styles.flag}>{FLAG_MAP[cs.team] ?? '🏳️'}</div>
          <div className={styles.playerInfo}>
            <div className={styles.playerName}>{cs.goalkeeper ?? '—'}</div>
            <div className={styles.playerTeam}>{cs.team}</div>
          </div>
          <div className={styles.statBadge}>{cs.cleanSheets} 🧤</div>
        </div>
      ))}
    </div>
  )
}
