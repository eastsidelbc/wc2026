# AGENT-DATA — wc2026

Read this when doing any data fetching, API, caching, or serverless function work.

## What You Own
- `src/hooks/` — all React data hooks
- `src/services/api.js` — all fetch functions
- `api/` — Vercel serverless proxy functions

## What You Never Touch
- `src/components/` — UI
- `src/data/static.js` — content
- `src/index.css` — styling

## API Sources
| Source | URL | Key | Use |
|---|---|---|---|
| Zafronix | api.zafronix.com | `.env.local`: `ZAFRONIX_API_KEY` (serverless, `process.env`) + `VITE_ZAFRONIX_KEY` (client dev, `import.meta.env`) | Matches, standings, scorers, players |
| ESPN | site.api.espn.com | None | Live scores only |
| Fallback | raw.githubusercontent.com/openfootball | None | Last resort for matches |

## Rate Limit Rules — CRITICAL
- Zafronix free tier = **250 requests/day**
- Cache everything in sessionStorage
- Cache TTLs: matches=5min, standings=5min, scorers=10min
- ESPN: **ONLY poll during active match windows** (kickoff ± 120 min)
- ESPN poll interval: 45 seconds minimum
- Never poll ESPN in a useEffect without checking `isMatchWindowActive()` first

## Serverless Function Rules
- All API keys must go through `api/` functions — never in frontend code
- Set `Cache-Control` headers on all responses
- Slow endpoints (standings, scorers): `s-maxage=300`
- Fast endpoints (live scores): `s-maxage=30`
- Always handle upstream errors gracefully — return a JSON error, never crash

## Hook Pattern
Every hook follows this pattern:
1. Check sessionStorage cache → return if fresh
2. Fetch from primary source (Zafronix)
3. On error: try fallback
4. On fallback error: set error state
5. Always set loading=false in finally
6. Return `{ data, loading, error, source }`

## Zafronix Endpoint Map
```
/api/zafronix/matches    → /fifa/worldcup/v1/matches?year=2026
/api/zafronix/standings  → /fifa/worldcup/v1/standings?year=2026
/api/zafronix/scorers    → /fifa/worldcup/v1/scorers?year=2026
/api/zafronix/players    → /fifa/worldcup/v1/players?year=2026
```

## ESPN Endpoint
```
/api/espn/live → site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard
```
Response shape: `{ events: [{ id, name, status, competitors: [{score}] }] }`

## Adding a New Hook
1. Create `useXxx.js` in `src/hooks/`
2. Follow the hook pattern above
3. Add fetch function to `src/services/api.js`
4. Add serverless proxy to `api/` if new external source
5. Update `docs/CHANGELOG.md`
