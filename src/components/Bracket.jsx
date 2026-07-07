import { useState, useEffect, useMemo, useRef } from 'react'
import { groups, powerRankings, TEAM_NAME_MAP } from '../data/static.js'
import { useBracket } from '../hooks/useBracket.js'
import { useMatches } from '../hooks/useMatches.js'
import { useLiveScores } from '../hooks/useLiveScores.js'
import { splitGoalsByTeam, describeGoal, getVenue, useMatchHeadline } from './matchCard-helpers.js'
import styles from './Bracket.module.css'

const ROUND_ORDER = ['round_of_32', 'round_of_16', 'quarter_final', 'semi_final', 'third_place', 'final']
const ROUND_LABELS = {
  round_of_32: 'R32', round_of_16: 'R16', quarter_final: 'QF',
  semi_final: 'SF', third_place: '3rd', final: 'Final',
}

// Modifier class per round carrying the CSS custom properties (--round-gap,
// --round-offset) that drive both card spacing and connector-line math below.
const ROUND_RHYTHM_CLASS = {
  round_of_32: 'roundR32', round_of_16: 'roundR16', quarter_final: 'roundQF',
  semi_final: 'roundSF', third_place: 'roundThird', final: 'roundFinal',
}

// Bracket-view only — full names stay in list view. Requested pairs first;
// the four "Real API string" entries are added because Zafronix's actual
// field value differs from the common name for those teams (verified via
// ZAFRONIX-API.md / TEAM_NAME_MAP earlier this session) — without them,
// Korea Republic/Cabo Verde/Congo DR/Côte d'Ivoire would still truncate
// since the requested key never appears in real bracket data.
const SHORT_NAME_MAP = {
  'Bosnia and Herzegovina': 'Bosnia',
  'United States': 'USA',
  'South Africa': 'S Africa',
  'South Korea': 'S Korea',
  'Cape Verde': 'C Verde',
  'DR Congo': 'DR Congo',
  'Ivory Coast': 'Ivory Coast',
  'Saudi Arabia': 'Saudi',
  // Real API strings:
  'Korea Republic': 'S Korea',
  'Cabo Verde': 'C Verde',
  'Congo DR': 'DR Congo',
  "Côte d'Ivoire": 'Ivory Coast',
}

function shortName(name) {
  return name ? (SHORT_NAME_MAP[name] ?? name) : name
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

// Zafronix's bracket match date is a raw ISO string ("2026-06-11"), unlike
// Schedule.jsx's pre-formatted static strings — needs its own formatting.
function formatMatchDate(dateStr, withWeekday = true) {
  if (!dateStr) return null
  const d = new Date(`${dateStr}T00:00:00`)
  if (Number.isNaN(d.getTime())) return null
  const month = d.toLocaleDateString('en-US', { month: 'short' })
  const day = d.getDate()
  if (!withWeekday) return `${month} ${day}`
  const weekday = d.toLocaleDateString('en-US', { weekday: 'short' })
  return `${month} ${day} (${weekday})`
}

function matchKey(m) {
  return String(m.id ?? m.matchNo)
}

// Groups a round's matches into the pairs that feed the next round, derived
// from the next round's own homeRef/awayRef (e.g. "W12") rather than assumed
// array order. Falls back to sequential pairing for anything not claimed by a
// ref (e.g. third_place, whose feeder convention isn't W-refs) so nothing is
// silently dropped from the view. Final has no next round — renders as singles.
function pairMatches(matches, nextRoundMatches) {
  if (!nextRoundMatches || nextRoundMatches.length === 0) {
    return matches.map(m => [m])
  }
  const pairs = []
  const used = new Set()
  nextRoundMatches.forEach(nm => {
    const feeders = [nm.homeRef, nm.awayRef]
      .map(ref => {
        const wMatch = /^W(\d+)$/.exec(ref || '')
        if (!wMatch) return null
        return matches.find(m => m.matchNo === Number(wMatch[1]))
      })
      .filter(Boolean)
    if (feeders.length > 0) {
      feeders.forEach(f => used.add(matchKey(f)))
      pairs.push(feeders)
    }
  })
  const leftover = matches.filter(m => !used.has(matchKey(m)))
  for (let i = 0; i < leftover.length; i += 2) {
    pairs.push(leftover.slice(i, i + 2))
  }
  return pairs
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

// Shared by MatchCard (list view) and CompactMatchCard (bracket view) so goal
// rendering isn't duplicated between the two card variants.
function GoalLine({ g, m, getGoalType, align }) {
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

function MatchCard({ match: m, live, winnerMap, bracket, getHeadline, getGoalType, matchDetail }) {
  const homeName = m.home || m.homeTeam || null
  const awayName = m.away || m.awayTeam || null
  const finished = m.homeScore != null && m.awayScore != null
  const isLiveMatch = !!live
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
  // Bracket endpoint match objects have no goals[] (only homeScore/awayScore) —
  // fall back to the useMatches record for the same matchNo, which does.
  const detail = matchDetail?.[m.matchNo] ?? m
  const headline = finished ? getHeadline?.(detail) : null
  const { hasSplit, homeGoals, awayGoals } = splitGoalsByTeam(detail.goals)
  const dateText = [formatMatchDate(m.date), m.status === 'scheduled' ? m.kickoff : null].filter(Boolean).join(' · ')

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

      {dateText && <div className={styles.matchDate}>{dateText}</div>}
      {venue && <div className={styles.venue}>{venue}</div>}

      <div className={styles.badgeRow}>
        {isLiveMatch && <span className={styles.badgeLive}>🔴 LIVE</span>}
        {finished && <span className={styles.badgeDone}>✅ Done</span>}
        {m.status === 'scheduled' && m.kickoff && <span className={styles.badgeUpcoming}>🕐 {m.kickoff}</span>}
        {upset && <span className={styles.badgeUpset}>🚨 Upset</span>}
      </div>

      {finished && detail.goals?.length > 0 && (
        hasSplit ? (
          <div className={styles.goalsSplit}>
            <div className={styles.goalsCol}>
              {homeGoals.map((g, gi) => <GoalLine key={gi} g={g} m={detail} getGoalType={getGoalType} align="home" />)}
            </div>
            <div className={styles.goalsCol}>
              {awayGoals.map((g, gi) => <GoalLine key={gi} g={g} m={detail} getGoalType={getGoalType} align="away" />)}
            </div>
          </div>
        ) : (
          <div className={styles.goalsFlat}>
            {detail.goals.map((g, gi) => <GoalLine key={gi} g={g} m={detail} getGoalType={getGoalType} align="home" />)}
          </div>
        )
      )}

      {headline && <div className={styles.headline}>"{headline}"</div>}
    </div>
  )
}

// Compact card for the horizontal-scroll Bracket view — flag + short name +
// score always visible; tap to expand scorers/headline/venue/kickoff. No
// FIFA 3-letter codes: we have no verified code list in this codebase and
// didn't want to guess wrong ones.
function CompactMatchCard({ match: m, live, bracket, winnerMap, getHeadline, getGoalType, matchDetail, isOpen, onToggle }) {
  const homeName = m.home || m.homeTeam || null
  const awayName = m.away || m.awayTeam || null
  const finished = m.homeScore != null && m.awayScore != null
  const isLiveMatch = !!live
  const upset = finished && isUpset(m.winner, m.loser)
  const home = getDisplayTeam(homeName, m.homeRef, bracket, winnerMap)
  const away = getDisplayTeam(awayName, m.awayRef, bracket, winnerMap)

  function cls(name) {
    if (!finished || !name) return styles.compactNeutral
    return name === m.winner ? styles.compactWinner : styles.compactLoser
  }

  const venue = getVenue(m)
  // Bracket endpoint match objects have no goals[] (only homeScore/awayScore) —
  // fall back to the useMatches record for the same matchNo, which does.
  const detail = matchDetail?.[m.matchNo] ?? m
  const headline = finished ? getHeadline?.(detail) : null
  const { hasSplit, homeGoals, awayGoals } = splitGoalsByTeam(detail.goals)
  const dateText = [formatMatchDate(m.date, false), m.status === 'scheduled' ? m.kickoff : null].filter(Boolean).join(' · ')

  return (
    <div className={styles.compactCard} onClick={onToggle}>
      <div className={`${styles.compactRow} ${cls(home.displayName)}`}>
        <span className={styles.compactName}>
          {home.displayName ? `${getFlag(home.displayName) ?? ''} ${shortName(home.displayName)}` : home.label}
        </span>
      </div>
      <div className={styles.compactScore}>
        {live
          ? `${live.competitors?.[0]?.score ?? '—'}–${live.competitors?.[1]?.score ?? '—'}`
          : finished
            ? `${m.homeScore}–${m.awayScore}${scoreSuffix(m)}`
            : 'vs'}
      </div>
      <div className={`${styles.compactRow} ${cls(away.displayName)}`}>
        <span className={styles.compactName}>
          {away.displayName ? `${getFlag(away.displayName) ?? ''} ${shortName(away.displayName)}` : away.label}
        </span>
      </div>

      {dateText && <div className={styles.compactDate}>{dateText}</div>}

      {(isLiveMatch || upset) && (
        <div className={styles.badgeRow}>
          {isLiveMatch && <span className={styles.badgeLive}>🔴 LIVE</span>}
          {upset && <span className={styles.badgeUpset}>🚨 Upset</span>}
        </div>
      )}

      <div className={`${styles.compactExpand} ${isOpen ? styles.compactExpandOpen : ''}`}>
        <div className={styles.compactExpandInner}>
          {venue && <div className={styles.compactVenue}>📍 {venue}</div>}
          {m.status === 'scheduled' && m.kickoff && (
            <div className={styles.compactKickoff}>🕐 {m.kickoff}</div>
          )}

          {detail.goals?.length > 0 && (
            hasSplit ? (
              <div className={styles.goalsSplit}>
                <div className={styles.goalsCol}>
                  {homeGoals.map((g, gi) => <GoalLine key={gi} g={g} m={detail} getGoalType={getGoalType} align="home" />)}
                </div>
                <div className={styles.goalsCol}>
                  {awayGoals.map((g, gi) => <GoalLine key={gi} g={g} m={detail} getGoalType={getGoalType} align="away" />)}
                </div>
              </div>
            ) : (
              <div className={styles.goalsFlat}>
                {detail.goals.map((g, gi) => <GoalLine key={gi} g={g} m={detail} getGoalType={getGoalType} align="home" />)}
              </div>
            )
          )}

          {headline && <div className={styles.headline}>"{headline}"</div>}
        </div>
      </div>
    </div>
  )
}

export default function Bracket() {
  const { bracket, loading, error, source } = useBracket()
  const [activeRound, setActiveRound] = useState(null)
  const [viewMode, setViewMode] = useState('list')
  const [openMatchKey, setOpenMatchKey] = useState(null)

  const scrollRef = useRef(null)
  const columnRefs = useRef({})

  function toggleCompactMatch(key) {
    setOpenMatchKey(prev => prev === key ? null : key)
  }

  useEffect(() => {
    if (!bracket || activeRound) return
    const found = ROUND_ORDER.find(r => (bracket[r] || []).some(m => m.status !== 'finished'))
    setActiveRound(found || 'final')
  }, [bracket, activeRound])

  const currentMatches = activeRound ? (bracket?.[activeRound] || []) : []
  const { liveScores } = useLiveScores(currentMatches)
  const winnerMap = useMemo(() => buildWinnerMap(bracket), [bracket])
  const { getHeadline, getGoalType } = useMatchHeadline()

  // /bracket match objects have no goals[] (only homeScore/awayScore) — /matches
  // does, keyed by the same matchNo. This lookup lets cards borrow goal detail
  // from useMatches while keeping bracket structure (refs, winner/loser) from
  // the bracket endpoint.
  const { matches: fullMatches } = useMatches()
  const matchDetail = useMemo(() => {
    const list = fullMatches?.data ?? fullMatches ?? []
    const map = {}
    list.forEach(fm => {
      if (fm.matchNo != null) map[fm.matchNo] = fm
    })
    return map
  }, [fullMatches])

  function getLiveScore(m) {
    if (!liveScores.length) return null
    return liveScores.find(e =>
      ((m.home || m.homeTeam) && e.name?.toLowerCase().includes((m.home || m.homeTeam).toLowerCase())) ||
      ((m.away || m.awayTeam) && e.name?.toLowerCase().includes((m.away || m.awayTeam).toLowerCase()))
    ) || null
  }

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
              matchDetail={matchDetail}
            />
          ))}
        </>
      ) : (
        <div className={styles.bracketScroll} ref={scrollRef}>
          {ROUND_ORDER.map((r, ri) => {
            const nextRound = ROUND_ORDER[ri + 1]
            const pairs = pairMatches(bracket[r] || [], nextRound ? (bracket[nextRound] || []) : [])
            return (
              <div
                key={r}
                className={`${styles.bracketColumn} ${styles[ROUND_RHYTHM_CLASS[r]]}`}
                data-round={r}
                ref={el => { columnRefs.current[r] = el }}
              >
                <div className={styles.bracketColHeader}>{ROUND_LABELS[r]}</div>
                <div className={styles.bracketPairs}>
                  {pairs.map((pair, pi) => (
                    <div
                      key={pi}
                      className={`${styles.bracketPair} ${pair.length === 2 && nextRound ? styles.pairConnected : ''}`}
                    >
                      {pair.map(m => (
                        <CompactMatchCard
                          key={matchKey(m)}
                          match={m}
                          live={getLiveScore(m)}
                          bracket={bracket}
                          winnerMap={winnerMap}
                          getHeadline={getHeadline}
                          getGoalType={getGoalType}
                          matchDetail={matchDetail}
                          isOpen={openMatchKey === matchKey(m)}
                          onToggle={() => toggleCompactMatch(matchKey(m))}
                        />
                      ))}
                    </div>
                  ))}
                  {pairs.length === 0 && <div className={styles.compactEmpty}>TBD</div>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
