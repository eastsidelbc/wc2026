# wc2026 — Architecture

## Folder Structure
```
wc2026/
├── src/
│   ├── components/         # UI components (AGENT-UI owns this)
│   │   ├── Header.jsx
│   │   ├── PowerRankings.jsx
│   │   ├── Groups.jsx
│   │   ├── Schedule.jsx
│   │   ├── Leaderboard.jsx
│   │   ├── Storylines.jsx
│   │   └── *.module.css    # CSS modules, one per component
│   ├── hooks/              # Data fetching hooks (AGENT-DATA owns this)
│   │   ├── useMatches.js
│   │   ├── useLiveScores.js
│   │   └── useScorers.js
│   ├── services/
│   │   └── api.js          # All fetch logic (AGENT-DATA owns this)
│   ├── data/
│   │   └── static.js       # Power rankings, groups, schedule, storylines (AGENT-CONTENT owns this)
│   ├── App.jsx             # Root, tab routing
│   ├── App.module.css
│   ├── index.css           # Global CSS variables + resets
│   └── main.jsx            # React entry point
├── api/                    # Vercel serverless (AGENT-DATA owns this)
│   ├── zafronix/
│   │   └── [...path].js    # Zafronix proxy (hides API key)
│   └── espn/
│       └── live.js         # ESPN live scores proxy (fixes CORS)
├── docs/                   # This Obsidian vault
│   ├── PROJECT.md
│   ├── ARCHITECTURE.md
│   ├── CHANGELOG.md
│   └── agents/
│       ├── AGENT-MASTER.md
│       ├── AGENT-UI.md
│       ├── AGENT-DATA.md
│       └── AGENT-CONTENT.md
├── public/
├── .env.local              # API keys — NEVER commit
├── .gitignore
├── index.html
├── package.json
├── vercel.json
└── vite.config.js
```

## Data Flow
```
User Browser
    │
    ├── Static data   → src/data/static.js (instant, no network)
    │
    └── Live data     → Vercel Serverless Functions (api/)
                              │
                              ├── /api/zafronix/* → api.zafronix.com
                              │     (key hidden server-side)
                              │
                              └── /api/espn/live  → site.api.espn.com
                                    (CORS fixed server-side)
```

## Rate Limit Strategy
- Zafronix free tier = 250 req/day
- We cache aggressively in sessionStorage
- Matches: 5 min cache
- Standings: 5 min cache
- Scorers: 10 min cache
- ESPN live scores: only polled during active match windows (kickoff ± 120 min)
- Poll interval: 45 seconds during live windows only

## Key Decisions
- CSS Modules (not Tailwind) — keeps styles scoped, no compiler needed
- No router library — tab state in App.jsx useState is sufficient
- Vercel serverless for all API calls — protects keys, fixes CORS, adds caching headers
- sessionStorage for caching — survives tab switches, cleared on close (no stale data issues)
- Static data in static.js — easy to edit without touching component logic
