import { storylines } from '../data/static.js'
import styles from './Storylines.module.css'

const TYPE_CLASS = {
  default: '',
  hot:     styles.hot,
  injury:  styles.injury,
  host:    styles.host,
}

export default function Storylines() {
  return (
    <div>
      <div className={styles.sectionLabel}>Key Narratives</div>
      {storylines.map((s, i) => (
        <div key={i} className={`${styles.card} ${TYPE_CLASS[s.type] || ''}`}>
          <div className={styles.tag}>{s.tag}</div>
          <div className={styles.title}>{s.title}</div>
          <div className={styles.body}>{s.body}</div>
        </div>
      ))}
    </div>
  )
}
