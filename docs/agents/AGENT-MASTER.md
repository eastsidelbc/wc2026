# AGENT-MASTER — wc2026

Read this at the start of any Claude Code session where you're planning, reviewing, or making cross-cutting decisions.

## Project Summary
Live World Cup 2026 dashboard. React + Vite + Vercel. Mobile-first.
Data: Zafronix (primary) + ESPN hidden API (live scores) + openfootball (fallback).

## The Three Agents
| Agent | File | Owns |
|---|---|---|
| AGENT-UI | docs/agents/AGENT-UI.md | src/components/ |
| AGENT-DATA | docs/agents/AGENT-DATA.md | src/hooks/, src/services/, api/ |
| AGENT-CONTENT | docs/agents/AGENT-CONTENT.md | src/data/static.js |

## Golden Rules
1. Never commit `.env.local` — Zafronix key lives there only
2. API keys never touch the frontend — always go through `api/` serverless functions
3. ESPN is only polled during active match windows — enforced in `useLiveScores.js`
4. Zafronix has 250 req/day — respect caching TTLs in hooks
5. CSS Modules only — no inline styles, no Tailwind
6. Update CHANGELOG.md at the end of every session
7. Static data (`src/data/static.js`) is the source of truth for power rankings, groups, schedule, and storylines until Zafronix data is wired in

## Current Architecture (quick ref)
```
Browser → Vercel Serverless (api/) → Zafronix / ESPN
                                    ↓
Browser ← JSON ← hooks (cached in sessionStorage) ← components
```

## How to End a Session
Ask Claude Code:
> "Update docs/CHANGELOG.md with what we did today and update the status table in docs/PROJECT.md"
