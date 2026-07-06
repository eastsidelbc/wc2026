import { useState } from 'react'
import Header from './components/Header.jsx'
import PowerRankings from './components/PowerRankings.jsx'
import Groups from './components/Groups.jsx'
import Schedule from './components/Schedule.jsx'
import Bracket from './components/Bracket.jsx'
import Leaderboard from './components/Leaderboard.jsx'
import Storylines from './components/Storylines.jsx'
import FunFacts from './components/FunFacts.jsx'
import styles from './App.module.css'

const TABS = [
  { id: 'bracket',    label: 'Bracket' },
  { id: 'schedule',   label: 'Schedule' },
  { id: 'groups',     label: 'Groups' },
  { id: 'power',      label: 'Power Rankings' },
  { id: 'leaderboard',label: 'Leaderboard' },
  { id: 'storylines', label: 'Storylines' },
  { id: 'funfacts',   label: 'Fun Facts' },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('bracket')

  return (
    <div className={styles.app}>
      <Header activeTab={activeTab} tabs={TABS} onTabChange={setActiveTab} />
      <main className={styles.main}>
        {activeTab === 'power'       && <PowerRankings />}
        {activeTab === 'groups'      && <Groups />}
        {activeTab === 'schedule'    && <Schedule />}
        {activeTab === 'bracket'     && <Bracket />}
        {activeTab === 'leaderboard' && <Leaderboard />}
        {activeTab === 'storylines'  && <Storylines />}
        {activeTab === 'funfacts'    && <FunFacts />}
      </main>
    </div>
  )
}
