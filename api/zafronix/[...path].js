// api/zafronix/[...path].js
// Vercel serverless function — proxies all Zafronix requests.
// Keeps the API key server-side, never exposed to the browser.
// AGENT-DATA is responsible for changes to this file.

const ZAFRONIX_BASE = 'https://api.zafronix.com/fifa/worldcup/v1'

export default async function handler(req, res) {
  const { path = [] } = req.query
  const endpoint = Array.isArray(path) ? path.join('/') : path

  // Map our internal route to Zafronix endpoint
  const routeMap = {
    'matches':   'matches',
    'standings': 'standings',
    'scorers':   'scorers',
    'players':   'players',
    'teams':     'teams',
  }

  const zafronixPath = routeMap[endpoint]
  if (!zafronixPath) {
    return res.status(404).json({ error: 'Unknown endpoint' })
  }

  // Forward query params (year, group, etc.)
  const params = new URLSearchParams(req.query)
  params.delete('path') // remove our routing param

  const url = `${ZAFRONIX_BASE}/${zafronixPath}?${params.toString()}`

  try {
    const upstream = await fetch(url, {
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

    // Cache headers — standings/scorers change slowly
    const isSlowEndpoint = ['standings', 'scorers'].includes(endpoint)
    res.setHeader('Cache-Control', isSlowEndpoint
      ? 's-maxage=300, stale-while-revalidate=60'   // 5 min
      : 's-maxage=60, stale-while-revalidate=30'    // 1 min
    )

    return res.status(200).json(data)
  } catch (err) {
    console.error('Zafronix proxy error:', err)
    return res.status(500).json({ error: 'Upstream request failed' })
  }
}
