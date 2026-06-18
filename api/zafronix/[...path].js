// api/zafronix/[...path].js
// Vercel serverless function — proxies all Zafronix requests.
// Keeps the API key server-side, never exposed to the browser.
// AGENT-DATA is responsible for changes to this file.

const ZAFRONIX_BASE = 'https://api.zafronix.com/fifa/worldcup/v1'

// Allowed first path segments — prevents open-proxy abuse
const ALLOWED = new Set(['matches', 'standings', 'scorers', 'players', 'teams', 'on-this-day', 'trivia'])

// Endpoints where we can afford a longer CDN cache
const SLOW = new Set(['standings', 'scorers'])

export default async function handler(req, res) {
  // Parse path + query from the URL directly — works on both Node and Bun
  // runtimes (Bun does not populate req.query for [...path] catch-all routes).
  const url = new URL(req.url, `http://${req.headers.host}`)
  const segments = url.pathname.replace(/^\/api\/zafronix\/?/, '').split('/').filter(Boolean)
  const firstSegment = segments[0]

  if (!ALLOWED.has(firstSegment)) {
    return res.status(404).json({ error: 'Unknown endpoint' })
  }

  // Support multi-segment paths (e.g. teams/argentina/roster)
  const zafronixPath = segments.join('/')

  // Forward query params (year, group, etc.)
  const params = new URLSearchParams(url.searchParams)
  params.delete('path')

  const upstreamUrl = `${ZAFRONIX_BASE}/${zafronixPath}?${params.toString()}`

  try {
    const upstream = await fetch(upstreamUrl, {
      headers: {
        'X-API-Key': process.env.ZAFRONIX_API_KEY,
        'Content-Type': 'application/json',
      },
    })

    if (!upstream.ok) {
      const text = await upstream.text()
      return res.status(upstream.status).json({ error: text })
    }

    const data = await upstream.json()

    res.setHeader('Cache-Control', SLOW.has(firstSegment)
      ? 's-maxage=300, stale-while-revalidate=60'   // 5 min
      : 's-maxage=60, stale-while-revalidate=30'    // 1 min
    )

    return res.status(200).json(data)
  } catch (err) {
    console.error('Zafronix proxy error:', err)
    return res.status(500).json({ error: 'Upstream request failed' })
  }
}
