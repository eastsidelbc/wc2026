import { useState } from 'react'
import { storylines } from '../data/static.js'
import { useRssHeadlines } from '../hooks/useRssHeadlines.js'
import styles from './Storylines.module.css'

const TYPE_CLASS = {
  default: '',
  hot:     styles.hot,
  injury:  styles.injury,
  host:    styles.host,
}

function timeAgo(pubDate) {
  if (!pubDate) return ''
  const diff = Date.now() - new Date(pubDate).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function Storylines() {
  const [tab, setTab] = useState('narratives')
  const { articles, loading } = useRssHeadlines()

  return (
    <div>
      <div className={styles.tabs}>
        <button
          className={`${styles.tabBtn} ${tab === 'narratives' ? styles.tabActive : ''}`}
          onClick={() => setTab('narratives')}
        >
          Narratives
        </button>
        <button
          className={`${styles.tabBtn} ${tab === 'buzz' ? styles.tabActive : ''}`}
          onClick={() => setTab('buzz')}
        >
          🔴 Live Buzz
        </button>
      </div>

      {tab === 'narratives' && (
        <div>
          {storylines.map((s, i) => (
            <div key={i} className={`${styles.card} ${TYPE_CLASS[s.type] || ''}`}>
              <div className={styles.tag}>{s.tag}</div>
              <div className={styles.title}>{s.title}</div>
              <div className={styles.body}>{s.body}</div>
            </div>
          ))}
        </div>
      )}

      {tab === 'buzz' && (
        <div>
          {loading && (
            <div className={styles.loading}>Loading live articles…</div>
          )}
          {!loading && articles.length === 0 && (
            <div className={styles.empty}>
              No World Cup articles right now. Check back during match days.
            </div>
          )}
          {articles.map((a, i) => (
            <a
              key={i}
              className={styles.buzzCard}
              href={a.link}
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className={styles.buzzMeta}>
                <span className={styles.buzzSource}>{a.source}</span>
                <span className={styles.buzzTime}>{timeAgo(a.pubDate)}</span>
              </div>
              <div className={styles.buzzTitle}>{a.title}</div>
              <div className={styles.buzzBody}>{a.description}</div>
              <div className={styles.buzzLink}>Read full article ↗</div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
