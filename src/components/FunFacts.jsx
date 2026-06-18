import { useState, useEffect } from 'react'
import { fetchOnThisDay, fetchTrivia } from '../services/api.js'
import styles from './FunFacts.module.css'

const OTD_CACHE_KEY   = 'wc2026_on_this_day'
const TRIVIA_CACHE_KEY = 'wc2026_trivia'
const CACHE_TTL        = 60 * 60 * 1000 // 1 hour

function useOnThisDay() {
  const [matches, setMatches] = useState([])
  const [facts,   setFacts]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const cached = sessionStorage.getItem(OTD_CACHE_KEY)
        if (cached) {
          const { data, ts } = JSON.parse(cached)
          if (Date.now() - ts < CACHE_TTL) {
            if (!cancelled) { setMatches(data.matches ?? []); setFacts(data.facts ?? []); setLoading(false) }
            return
          }
        }
      } catch (_) {}
      try {
        const data = await fetchOnThisDay()
        const m = data.matches ?? []
        const f = data.facts   ?? []
        if (!cancelled) {
          setMatches(m); setFacts(f); setLoading(false)
          sessionStorage.setItem(OTD_CACHE_KEY, JSON.stringify({ data: { matches: m, facts: f }, ts: Date.now() }))
        }
      } catch (_) {
        if (!cancelled) { setError('On This Day data unavailable'); setLoading(false) }
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  return { matches, facts, loading, error }
}

function useTrivia() {
  const [trivia,  setTrivia]  = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const cached = sessionStorage.getItem(TRIVIA_CACHE_KEY)
        if (cached) {
          const { data, ts } = JSON.parse(cached)
          if (Date.now() - ts < CACHE_TTL) {
            if (!cancelled) { setTrivia(data); setLoading(false) }
            return
          }
        }
      } catch (_) {}
      try {
        const data = await fetchTrivia(2026)
        const list = Array.isArray(data) ? data : (data.facts ?? data.trivia ?? [])
        if (!cancelled) {
          setTrivia(list); setLoading(false)
          sessionStorage.setItem(TRIVIA_CACHE_KEY, JSON.stringify({ data: list, ts: Date.now() }))
        }
      } catch (_) {
        if (!cancelled) { setError('Trivia unavailable'); setLoading(false) }
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  return { trivia, loading, error }
}

export default function FunFacts() {
  const otd    = useOnThisDay()
  const trivia = useTrivia()

  return (
    <div>
      {/* ── On This Day ── */}
      <div className={styles.sectionLabel}>On This Day</div>

      {otd.loading && (
        <div className={styles.state}><div className={styles.spinner} /><span>Loading...</span></div>
      )}
      {otd.error && !otd.loading && (
        <div className={styles.errorState}>⚠️ {otd.error}</div>
      )}

      {!otd.loading && !otd.error && otd.matches.length === 0 && otd.facts.length === 0 && (
        <div className={styles.state}>No historical data for today.</div>
      )}

      {otd.matches.map((m, i) => (
        <div key={i} className={styles.otdCard}>
          <div className={styles.otdYear}>{m.year}</div>
          <div className={styles.otdMatch}>
            <span className={styles.otdTeam}>{m.homeTeam ?? m.home}</span>
            <span className={styles.otdScore}>{m.homeScore} – {m.awayScore}</span>
            <span className={styles.otdTeam}>{m.awayTeam ?? m.away}</span>
          </div>
          {m.stadium && <div className={styles.otdVenue}>{m.stadium}</div>}
        </div>
      ))}

      {otd.facts.map((f, i) => (
        <div key={i} className={styles.factQuote}>
          <div className={styles.factQuoteMark}>"</div>
          <div className={styles.factText}>{f.text ?? f.fact ?? f}</div>
        </div>
      ))}

      {/* ── Tournament Trivia ── */}
      <div className={styles.sectionLabel} style={{ marginTop: 28 }}>Tournament Trivia</div>

      {trivia.loading && (
        <div className={styles.state}><div className={styles.spinner} /><span>Loading...</span></div>
      )}
      {trivia.error && !trivia.loading && (
        <div className={styles.errorState}>⚠️ {trivia.error}</div>
      )}

      {!trivia.loading && !trivia.error && trivia.trivia.length === 0 && (
        <div className={styles.state}>No trivia yet.</div>
      )}

      {trivia.trivia.map((item, i) => (
        <div key={i} className={styles.triviaCard}>
          {item.category && <div className={styles.triviaCategory}>{item.category}</div>}
          <div className={styles.triviaText}>{item.text ?? item.fact ?? item}</div>
        </div>
      ))}
    </div>
  )
}
