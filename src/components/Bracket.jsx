import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { groups, powerRankings, TEAM_NAME_MAP } from '../data/static.js'
import { useBracket } from '../hooks/useBracket.js'
import { useLiveScores } from '../hooks/useLiveScores.js'
import { splitGoalsByTeam, describeGoal, getVenue, useMatchHeadline } from './matchCard-helpers.js'
import styles from './Bracket.module.css'

const ROUND_ORDER = ['round_of_32', 'round_of_16', 'quarter_final', 'semi_final', 'third_place', 'final']
const ROUND_LABELS = {
  round_of_32: 'R32', round_of_16: 'R16', quarter_final: 'QF',
  semi_final: 'SF', third_place: '3rd', final: 'Final',
}

const FLAG_MAP = {}
for (const g of groups) {
  for (const t of g.teams) {
    FLAG_MAP[t.name] = t.flag
    if (TEAM_NAME_MAP[t.name]) FLAG_MAP[TEAM_NAME_MAP[t.name]] = t.flag
  }
}

const REVERSE_NAME_MAP = Object.fromEntries(
  Object.entries(TEAM_NAME_MAP).map(([k, v]) => [v, k])
)

const TIER_MAP = {}
powerRankings.forEach((tier, i) => {
  tier.teams.forEach(t => { TIER_MAP[t.name] = i + 1 })
})

function getFlag(name) {
  if (!name) return null
  return FLAG_MAP[name] ?? FLAG_MAP[REVERSE_NAME_MAP[name]] ?? null
}

function getTier(name) {
  return TIER_MAP[name] ?? TIER_MAP[REVERSE_NAME_MAP[name]] ?? 5
}

function isUpset(winner, loser) {
  if (!winner || !loser) return false
  return getTier(winner) - getTier(loser) >= 2
}

function scoreSuffix(m) {
  if (m.penalties) return ` (PKs ${m.penalties.home}-${m.penalties.away})`
  if (m.extraTime) return ' (AET)'
  return ''
}

function matchKey(m) {
  return String(m.id ?? m.matchNo)
}

// Finds the match (in any round) whose home/away ref points at matchNo's
// winner — i.e. the match this one "feeds into" for connector-line drawing.
function findFeedTarget(bracket, matchNo) {
  for (const round of ROUND_ORDER) {
    const target = (bracket[round] || []).find(m => m.homeRef === `W${matchNo}` || m.awayRef === `W${matchNo}`)
    if (target) return target
  }
  return null
}

function buildWinnerMap(bracket) {
  const map = {}
  if (!bracket) return map
  Object.values(bracket).forEach(matches => {
    (matches || []).forEach(m => {
      if (m.winner && m.matchNo != null) map[m.matchNo] = m.winner
    })
  })
  return map
}

function findMatchByNo(bracket, matchNo) {
  if (!bracket) return null
  for (const matches of Object.values(bracket)) {
    const found = (matches || []).find(m => m.matchNo === matchNo)
    if (found) return found
  }
  return null
}

// Turns a resolved side into a plain noun phrase for composing into a parent
// label, without repeating "TBD — Winner of" at every nesting level.
function fragment(resolved) {
  if (resolved.name) return resolved.name
  const text = (resolved.label ?? 'TBD').replace(/^TBD — /, '').replace(/^Winner of /, '')
  return text.includes(' vs ') ? `(${text})` : text
}

function resolveRef(ref, bracket, winnerMap, depth = 0) {
  if (!ref) return { name: null, label: 'TBD' }
  if (depth > 5) return { name: null, label: 'TBD' }

  const wMatch = /^W(\d+)$/.exec(ref)
  if (wMatch) {
    const matchNo = Number(wMatch[1])
    const winner = winnerMap[matchNo]
    if (winner) return { name: winner, label: null }

    const refMatch = findMatchByNo(bracket, matchNo)
    if (!refMatch) return { name: null, label: `TBD — Winner of Match ${matchNo}` }

    const homeName = refMatch.home || refMatch.homeTeam
    const awayName = refMatch.away || refMatch.awayTeam
    const homeResolved = homeName
      ? { name: homeName, label: null }
      : resolveRef(refMatch.homeRef, bracket, winnerMap, depth + 1)
    const awayResolved = awayName
      ? { name: awayName, label: null }
      : resolveRef(refMatch.awayRef, bracket, winnerMap, depth + 1)

    return { name: null, label: `TBD — Winner of ${fragment(homeResolved)} vs ${fragment(awayResolved)}` }
  }
  const groupMatch = /^([123])([A-L])$/.exec(ref)
  if (groupMatch) {
    const [, pos, letter] = groupMatch
    const posLabel = pos === '1' ? 'winner' : pos === '2' ? 'runner-up' : 'best 3rd-place'
    return { name: null, label: `TBD — Group ${letter} ${posLabel}` }
  }
  return { name: null, label: `TBD (${ref})` }
}

// Resolves a team slot to either a known name or a TBD label — shared by
// the full MatchCard and the compact bracket-view card.
function getDisplayTeam(name, teamRef, bracket, winnerMap) {
  const resolved = !name ? resolveRef(teamRef, bracket, winnerMap) : null
  const displayName = name || resolved?.name || null
  return { displayName, label: displayName ? null : resolved.label }
}

function MatchCard({ match: m, live, winnerMap, bracket, getHeadline, getGoalType }) {
  const homeName = m.home || m.homeTeam || null
  const awayName = m.away || m.awayTeam || null
  const finished = m.status === 'finished'
  const isLiveMatch = m.status === 'live'
  const upset = finished && isUpset(m.winner, m.loser)

  function rowClass(teamName) {
    if (isLiveMatch || m.status === 'scheduled') return styles.neutral
    if (!finished || !teamName) return styles.neutral
    return teamName === m.winner ? styles.winner : styles.loser
  }

  function TeamRow({ name, teamRef, winnerMap }) {
    const { displayName, label } = getDisplayTeam(name, teamRef, bracket, winnerMap)
    return (
      <div className={`${styles.teamRow} ${rowClass(displayName)}`}>
        {displayName
          ? <span>{getFlag(displayName)} {displayName}</span>
          : <span className={styles.tbdRef}>{label}</span>}
      </div>
    )
  }

  const venue = getVenue(m)
  const headline = finished ? getHeadline?.(m) : null
  const { hasSplit, homeGoals, awayGoals } = splitGoalsByTeam(m.goals)

  function GoalLine({ g, align }) {
    const { minute, isOG, isPen, badge } = describeGoal(g, m, getGoalType)
    const scorerText = (
      <span className={styles.goalScorer}>
        {g.scorer}
        {isOG && ' (OG)'}
        {isPen && ' (P)'}
        {badge && <span className={styles.goalBadge}>{badge}</span>}
      </span>
    )
    const minuteText = <span className={styles.goalMinute}>{minute}'</span>
    return (
      <div className={styles.goalRow}>
        {align === 'away' ? <>{minuteText}{scorerText}</> : <>{scorerText}{minuteText}</>}
      </div>
    )
  }

  return (
    <div className={styles.matchCard}>
      <div className={styles.matchTeams}>
        <TeamRow name={homeName} teamRef={m.homeRef} winnerMap={winnerMap} />
        <div className={styles.score}>
          {live
            ? <span>{live.competitors?.[0]?.score ?? '—'} – {live.competitors?.[1]?.score ?? '—'}</span>
            : finished
              ? <span>{m.homeScore} – {m.awayScore}{scoreSuffix(m)}</span>
              : <span className={styles.vs}>vs</span>}
        </div>
        <TeamRow name={awayName} teamRef={m.awayRef} winnerMap={winnerMap} />
      </div>

      {venue && <div className={styles.venue}>{venue}</div>}

      <div className={styles.badgeRow}>
        {isLiveMatch && <span className={styles.badgeLive}>🔴 LIVE</span>}
        {finished && <span className={styles.badgeDone}>✅ Done</span>}
        {m.status === 'scheduled' && m.kickoff && <span className={styles.badgeUpcoming}>🕐 {m.kickoff}</span>}
        {upset && <span className={styles.badgeUpset}>🚨 Upset</span>}
      </div>

      {finished && m.goals?.length > 0 && (
        hasSplit ? (
          <div className={styles.goalsSplit}>
            <div className={styles.goalsCol}>
              {homeGoals.map((g, gi) => <GoalLine key={gi} g={g} align="home" />)}
            </div>
            <div className={styles.goalsCol}>
              {awayGoals.map((g, gi) => <GoalLine key={gi} g={g} align="away" />)}
            </div>
          </div>
        ) : (
          <div className={styles.goalsFlat}>
            {m.goals.map((g, gi) => <GoalLine key={gi} g={g} align="home" />)}
          </div>
        )
      )}

      {headline && <div className={styles.headline}>"{headline}"</div>}
    </div>
  )
}

// Compact card for the horizontal-scroll Bracket view — flag + name (ellipsis
// truncated in CSS) + score only. No FIFA 3-letter codes: we have no verified
// code list in this codebase and didn't want to guess wrong ones.
function CompactMatchCard({ match: m, bracket, winnerMap, cardRef }) {
  const homeName = m.home || m.homeTeam || null
  const awayName = m.away || m.awayTeam || null
  const finished = m.status === 'finished'
  const home = getDisplayTeam(homeName, m.homeRef, bracket, winnerMap)
  const away = getDisplayTeam(awayName, m.awayRef, bracket, winnerMap)

  function cls(name) {
    if (!finished || !name) return styles.compactNeutral
    return name === m.winner ? styles.compactWinner : styles.compactLoser
  }

  return (
    <div className={styles.compactCard} ref={cardRef}>
      <div className={`${styles.compactRow} ${cls(home.displayName)}`}>
        <span className={styles.compactName}>
          {home.displayName ? `${getFlag(home.displayName) ?? ''} ${home.displayName}` : home.label}
        </span>
      </div>
      <div className={styles.compactScore}>
        {finished ? `${m.homeScore}–${m.awayScore}` : 'vs'}
      </div>
      <div className={`${styles.compactRow} ${cls(away.displayName)}`}>
        <span className={styles.compactName}>
          {away.displayName ? `${getFlag(away.displayName) ?? ''} ${away.displayName}` : away.label}
        </span>
      </div>
    </div>
  )
}

export default function Bracket() {
  const { bracket, loading, error, source } = useBracket()
  const [activeRound, setActiveRound] = useState(null)
  const [viewMode, setViewMode] = useState('list')
  const [connectors, setConnectors] = useState([])
  const [svgSize, setSvgSize] = useState({ w: 0, h: 0 })

  const scrollRef = useRef(null)
  const columnRefs = useRef({})
  const cardRefs = useRef({})

  useEffect(() => {
    if (!bracket || activeRound) return
    const found = ROUND_ORDER.find(r => (bracket[r] || []).some(m => m.status !== 'finished'))
    setActiveRound(found || 'final')
  }, [bracket, activeRound])

  const currentMatches = activeRound ? (bracket?.[activeRound] || []) : []
  const { liveScores } = useLiveScores(currentMatches)
  const winnerMap = useMemo(() => buildWinnerMap(bracket), [bracket])
  const { getHeadline, getGoalType } = useMatchHeadline()

  function getLiveScore(m) {
    if (!liveScores.length) return null
    return liveScores.find(e =>
      ((m.home || m.homeTeam) && e.name?.toLowerCase().includes((m.home || m.homeTeam).toLowerCase())) ||
      ((m.away || m.awayTeam) && e.name?.toLowerCase().includes((m.away || m.awayTeam).toLowerCase()))
    ) || null
  }

  const measureConnectors = useCallback(() => {
    const container = scrollRef.current
    if (!container || !bracket) return
    const containerRect = container.getBoundingClientRect()
    const paths = []

    ROUND_ORDER.forEach(round => {
      ;(bracket[round] || []).forEach(m => {
        if (m.matchNo == null) return
        const target = findFeedTarget(bracket, m.matchNo)
        if (!target) return
        const fromEl = cardRefs.current[matchKey(m)]
        const toEl = cardRefs.current[matchKey(target)]
        if (!fromEl || !toEl) return

        const fromRect = fromEl.getBoundingClientRect()
        const toRect = toEl.getBoundingClientRect()
        const x1 = fromRect.right - containerRect.left + container.scrollLeft
        const y1 = fromRect.top + fromRect.height / 2 - containerRect.top + container.scrollTop
        const x2 = toRect.left - containerRect.left + container.scrollLeft
        const y2 = toRect.top + toRect.height / 2 - containerRect.top + container.scrollTop
        const midX = (x1 + x2) / 2
        paths.push(`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`)
      })
    })

    setConnectors(paths)
    setSvgSize({ w: container.scrollWidth, h: container.scrollHeight })
  }, [bracket])

  useEffect(() => {
    if (viewMode !== 'bracket' || !bracket) return
    const raf = requestAnimationFrame(measureConnectors)
    window.addEventListener('resize', measureConnectors)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', measureConnectors)
    }
  }, [viewMode, bracket, measureConnectors])

  useEffect(() => {
    if (viewMode !== 'bracket') return
    const container = scrollRef.current
    if (!container) return

    const observer = new IntersectionObserver(
      entries => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        const round = visible[0]?.target?.dataset?.round
        if (round) setActiveRound(round)
      },
      { root: container, threshold: [0.3, 0.5, 0.7] }
    )

    ROUND_ORDER.forEach(r => {
      const el = columnRefs.current[r]
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [viewMode, bracket])

  function handleChipClick(r) {
    setActiveRound(r)
    if (viewMode === 'bracket') {
      columnRefs.current[r]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
  }

  if (loading) return <div className={styles.loading}>Loading bracket…</div>
  if (error) return <div className={styles.error}>Bracket data unavailable</div>
  if (!bracket) return null

  return (
    <div>
      {source === 'fallback' && <div className={styles.fallbackHint}>Using fallback data</div>}

      <div className={styles.viewToggle}>
        <button
          className={`${styles.viewBtn} ${viewMode === 'list' ? styles.viewBtnActive : ''}`}
          onClick={() => setViewMode('list')}
        >
          List
        </button>
        <button
          className={`${styles.viewBtn} ${viewMode === 'bracket' ? styles.viewBtnActive : ''}`}
          onClick={() => setViewMode('bracket')}
        >
          Bracket
        </button>
      </div>

      <div className={styles.chips}>
        {ROUND_ORDER.map(r => (
          <button
            key={r}
            className={`${styles.chip} ${activeRound === r ? styles.active : ''}`}
            onClick={() => handleChipClick(r)}
          >
            {ROUND_LABELS[r]}
          </button>
        ))}
      </div>

      {viewMode === 'list' ? (
        <>
          {currentMatches.length === 0 && (
            <div className={styles.empty}>TBD — pending previous round</div>
          )}

          {currentMatches.map(m => (
            <MatchCard
              key={matchKey(m)}
              match={m}
              live={getLiveScore(m)}
              winnerMap={winnerMap}
              bracket={bracket}
              getHeadline={getHeadline}
              getGoalType={getGoalType}
            />
          ))}
        </>
      ) : (
        <div className={styles.bracketScroll} ref={scrollRef}>
          <svg className={styles.connectorSvg} width={svgSize.w} height={svgSize.h}>
            {connectors.map((d, i) => (
              <path key={i} d={d} className={styles.connectorPath} />
            ))}
          </svg>

          {ROUND_ORDER.map(r => (
            <div
              key={r}
              className={styles.bracketColumn}
              data-round={r}
              ref={el => { columnRefs.current[r] = el }}
            >
              <div className={styles.bracketColHeader}>{ROUND_LABELS[r]}</div>
              {(bracket[r] || []).map(m => (
                <CompactMatchCard
                  key={matchKey(m)}
                  match={m}
                  bracket={bracket}
                  winnerMap={winnerMap}
                  cardRef={el => { cardRefs.current[matchKey(m)] = el }}
                />
              ))}
              {(bracket[r] || []).length === 0 && (
                <div className={styles.compactEmpty}>TBD</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
