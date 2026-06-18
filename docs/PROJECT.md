# wc2026 — Project Overview

## What This Is
A live World Cup 2026 dashboard. Mobile-first, shareable, real data.
Built to be used during the tournament (Jun 11 – Jul 19, 2026).

## Stack
| Layer | Tech |
|---|---|
| Frontend | React + Vite |
| Hosting | Vercel (free) |
| API Proxy | Vercel Serverless Functions |
| Primary Data | Zafronix (free, 250 req/day) |
| Live Scores | ESPN Hidden API (no key, server-proxied) |
| Fallback | openfootball/worldcup.json (GitHub raw) |
| Memory | This Obsidian vault in /docs |
| IDE | Cursor + WSL + Claude Code |

## API Keys
- Zafronix (serverless): `.env.local` → `ZAFRONIX_API_KEY` — used by `api/` functions via `process.env`
- Zafronix (client dev): `.env.local` → `VITE_ZAFRONIX_KEY` — used by `src/services/api.js` via `import.meta.env` in dev mode
- Both keys hold the same Zafronix value; the `VITE_` prefix is required for Vite to expose it client-side — DO NOT commit `.env.local`
- ESPN: no key needed
- Vercel env vars: add `ZAFRONIX_API_KEY` (Production + Preview) in Vercel dashboard settings

## Tabs / Features
| Tab | Data Source | Status |
|---|---|---|
| Power Rankings | Static (`src/data/static.js`) | ✅ Done |
| Groups | Static + Zafronix standings | ✅ Live standings + verdict badges wired |
| Schedule | Static + Zafronix + ESPN | ✅ Scores, venue, match recap accordion |
| Leaderboard | ESPN scoreboard | ✅ Goals / Assists / Cards live from ESPN |
| Storylines | Static | ✅ Done |
| Fun Facts | Zafronix on-this-day + trivia | ✅ Done |

## Current Status
🔲 Project scaffolded, not yet pushed to GitHub
🔲 `bun install` not yet run
🔲 Zafronix key not yet added to .env.local
🔲 Vercel not yet connected

## Repo
- GitHub: https://github.com/YOUR_USERNAME/wc2026
- Vercel: https://wc2026.vercel.app (once connected)

## How to Start a Session
1. Open this file + the relevant AGENT file in Obsidian
2. Tell Claude Code: "Read docs/PROJECT.md and docs/agents/AGENT-[NAME].md. Here's what I want to do today: [task]"
3. End every session by asking Claude Code to update CHANGELOG.md
