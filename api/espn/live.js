// api/espn/live.js
// Vercel serverless — proxies ESPN hidden API for live scores.
// Fixes CORS issue that blocks direct browser requests in production.
// Only called during active match windows (enforced client-side too).
// AGENT-DATA is responsible for changes to this file.

const ESPN_URL =
  'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard'

export default async function handler(req, res) {
  try {
    const upstream = await fetch(ESPN_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; wc2026-dashboard/1.0)',
        'Accept': 'application/json',
      },
    })

    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: 'ESPN upstream failed' })
    }

    const data = await upstream.json()

    // Short cache — live scores need to be fresh
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=15')
    res.setHeader('Access-Control-Allow-Origin', '*')

    return res.status(200).json(data)
  } catch (err) {
    console.error('ESPN proxy error:', err)
    return res.status(500).json({ error: 'Live scores unavailable' })
  }
}
