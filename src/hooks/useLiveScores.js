import { useState, useEffect, useRef } from 'react'
import { fetchLiveScores, isMatchWindowActive } from '../services/api.js'

// ── useLiveScores ────────────────────────────────────────────
// Polls ESPN hidden API every 45 seconds ONLY during live windows.
// Stops polling automatically when no match is active.
// This protects against accidental rate limit abuse.

const POLL_INTERVAL = 45 * 1000 // 45 seconds

export function useLiveScores(matches = []) {
  const [liveScores, setLiveScores] = useState([])
  const [isLive, setIsLive]         = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)
  const intervalRef = useRef(null)

  useEffect(() => {
    const active = isMatchWindowActive(matches)
    setIsLive(active)

    if (!active) {
      clearInterval(intervalRef.current)
      return
    }

    async function poll() {
      try {
        const data = await fetchLiveScores()
        const events = data?.events || []
        setLiveScores(events)
        setLastUpdated(new Date())
      } catch (err) {
        console.warn('Live scores poll failed:', err.message)
      }
    }

    poll() // immediate first call
    intervalRef.current = setInterval(poll, POLL_INTERVAL)

    return () => clearInterval(intervalRef.current)
  }, [matches])

  return { liveScores, isLive, lastUpdated }
}
