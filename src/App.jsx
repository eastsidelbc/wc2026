import { useState } from 'react'
import Header from './components/Header.jsx'
import PowerRankings from './components/PowerRankings.jsx'
import Groups from './components/Groups.jsx'
import Schedule from './components/Schedule.jsx'
import Leaderboard from './components/Leaderboard.jsx'
import Storylines from './components/Storylines.jsx'
import styles from './App.module.css'

const TABS = [
  { id: 'power',      label: 'Power Rankings' },
  { id: 'groups',     label: 'Groups' },
  { id: 'schedule',   label: 'Schedule' },
  { id: 'leaderboard',label: 'Leaderboard' },
  { id: 'storylines', label: 'Storylines' },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('power')

  return (
    <div className={styles.app}>
      <Header activeTab={activeTab} tabs={TABS} onTabChange={setActiveTab} />
      <main className={styles.main}>
        {activeTab === 'power'       && <PowerRankings />}
        {activeTab === 'groups'      && <Groups />}
        {activeTab === 'schedule'    && <Schedule />}
        {activeTab === 'leaderboard' && <Leaderboard />}
        {activeTab === 'storylines'  && <Storylines />}
      </main>
    </div>
  )
}
