import { useState, useEffect } from 'react'
import { fetchEspnScoreboard, fetchZafronixGoals } from '../services/api.js'

const CACHE_KEY = 'wc2026_espn_leaderboard'
const CACHE_TTL = 3 * 60 * 1000

function upsert(map, key, name, team, headshot) {
  if (!map[key]) {
    map[key] = { name, team, headshot, goals: 0, assists: 0, yellowCards: 0, redCards: 0 }
  }
}

export function useEspnLeaderboard() {
  const [goalLeaders,   setGoalLeaders]   = useState([])
  const [assistLeaders, setAssistLeaders] = useState([])
  const [cardLeaders,   setCardLeaders]   = useState([])
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const cached = sessionStorage.getItem(CACHE_KEY)
        if (cached) {
          const { data, ts } = JSON.parse(cached)
          if (Date.now() - ts < CACHE_TTL) {
            if (!cancelled) {
              setGoalLeaders(data.goalLeaders   ?? [])
              setAssistLeaders(data.assistLeaders ?? [])
              setCardLeaders(data.cardLeaders   ?? [])
              setLoading(false)
            }
            return
          }
        }
      } catch (_) {}

      try {
        const data   = await fetchEspnScoreboard()
        const goals   = {}
        const assists = {}
        const yellows = {}
        const reds    = {}

        for (const event of (data.events ?? [])) {
          for (const competition of (event.competitions ?? [])) {
            const teamMap = {}
            for (const comp of (competition.competitors ?? [])) {
              if (comp.team?.id) teamMap[comp.team.id] = comp.team.displayName ?? ''
            }

            for (const detail of (competition.details ?? [])) {
              const athlete = detail.athletesInvolved?.[0]
              if (!athlete) continue
              const name = athlete.displayName ?? athlete.fullName
              if (!name) continue

              const teamId   = athlete.team?.id ?? detail.team?.id
              const teamName = teamMap[teamId] ?? ''
              const headshot = athlete.headshot ?? null
              const key      = `${name}|${teamId}`

              if (detail.scoringPlay && !detail.ownGoal) {
                upsert(goals, key, name, teamName, headshot)
                goals[key].goals++

                // Second athlete credited with the assist
                if (detail.type?.text === 'Goal' && (detail.athletesInvolved?.length ?? 0) > 1) {
                  const ast     = detail.athletesInvolved[1]
                  const aName   = ast.displayName ?? ast.fullName
                  if (aName) {
                    // Use the scorer's teamId as the assist event's team reference
                    const aTeamId = detail.team?.id
                    const aTeam   = teamMap[aTeamId] ?? teamMap[ast.team?.id] ?? ''
                    const aKey    = `${aName}|${ast.team?.id ?? aTeamId}`
                    upsert(assists, aKey, aName, aTeam, ast.headshot ?? null)
                    assists[aKey].assists++
                  }
                }
              }

              if (detail.yellowCard) {
                upsert(yellows, key, name, teamName, headshot)
                yellows[key].yellowCards++
              }

              if (detail.redCard) {
                upsert(reds, key, name, teamName, headshot)
                reds[key].redCards++
              }
            }
          }
        }

        const cardMap = {}
        for (const [k, p] of Object.entries(yellows)) cardMap[k] = { ...p }
        for (const [k, p] of Object.entries(reds)) {
          if (cardMap[k]) cardMap[k].redCards = p.redCards
          else cardMap[k] = { ...p }
        }

        const gl = Object.values(goals).sort((a, b) => b.goals - a.goals)
        const al = Object.values(assists).sort((a, b) => b.assists - a.assists)
        const cl = Object.values(cardMap).sort((a, b) =>
          (b.yellowCards + b.redCards) - (a.yellowCards + a.redCards)
        )

        if (!cancelled) {
          setGoalLeaders(gl)
          setAssistLeaders(al)
          setCardLeaders(cl)
          setLoading(false)
          sessionStorage.setItem(CACHE_KEY, JSON.stringify({
            data: { goalLeaders: gl, assistLeaders: al, cardLeaders: cl },
            ts: Date.now(),
          }))
        }
      } catch (_espnErr) {
        try {
          const gl = await fetchZafronixGoals(2026)
          if (!cancelled) {
            setGoalLeaders(gl)
            setAssistLeaders([])
            setCardLeaders([])
            setLoading(false)
            sessionStorage.setItem(CACHE_KEY, JSON.stringify({
              data: { goalLeaders: gl, assistLeaders: [], cardLeaders: [] },
              ts: Date.now(),
            }))
          }
        } catch (_zErr) {
          if (!cancelled) { setError('Could not load leaderboard data'); setLoading(false) }
        }
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  return { goalLeaders, assistLeaders, cardLeaders, loading, error }
}
