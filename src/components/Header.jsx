import styles from './Header.module.css'

export default function Header({ activeTab, tabs, onTabChange }) {
  return (
    <header className={styles.header}>
      <div className={styles.top}>
        <span className={styles.trophy}>🏆</span>
        <div className={styles.titles}>
          <h1 className={styles.title}>World Cup 2026</h1>
          <span className={styles.subtitle}>June 11 – July 19 · USA / MEX / CAN</span>
        </div>
        <div className={styles.liveBadge}>LIVE</div>
      </div>
      <nav className={styles.nav}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`${styles.navBtn} ${activeTab === tab.id ? styles.active : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </header>
  )
}
