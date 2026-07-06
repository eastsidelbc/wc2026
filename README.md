# wc2026

> **Updated: 2026-06-19**

A mobile-first live dashboard for the 2026 FIFA World Cup. Tracks scores, group standings, player stats, and tournament storylines in real time during the tournament (June 11 – July 19, 2026).

**Live demo:** https://wc2026-vert-delta.vercel.app

---

## Tech Stack

| Tool | Why it's here |
|---|---|
| React 18 | Component model for tab-based UI |
| Vite 5 | Fast dev server + production bundler |
| Bun | Package manager and script runner (replaces npm/npx/yarn entirely) |
| CSS Modules | Scoped styles per component — no Tailwind, no compiler needed |
| Vercel (free) | Hosting + serverless functions that proxy API calls |
| Zafronix API | Primary data source: matches, standings, rosters, trivia (250 req/day free tier) |
| ESPN Hidden API | Goals, assists, cards, live scores — no key needed |
| openfootball/worldcup.json | GitHub raw JSON fallback for match data when Zafronix is down |

---

## Project Structure

```
wc2026/
├── index.html                     # Vite HTML shell; references /trophy.svg favicon
├── package.json                   # deps: react, react-dom; devDeps: vite, @vitejs/plugin-react
├── vite.config.js                 # Dev server on :3000, proxies /api → :3001
├── vercel.json                    # SPA rewrite, CORS headers, Bun runtime declaration
├── bun.lock                       # Bun lockfile
├── .env.local                     # API keys — NEVER commit this file
│
├── src/
│   ├── main.jsx                   # React entry: ReactDOM.createRoot
│   ├── App.jsx                    # Root: activeTab state, renders 6 tab components
│   ├── App.module.css             # max-width 600px centered layout
│   ├── index.css                  # Global CSS custom properties + resets
│   │
│   ├── components/
│   │   ├── Header.jsx             # Trophy, title, subtitle, tab nav bar
│   │   ├── PowerRankings.jsx      # Static: hardcoded odds strip + tiered team accordion
│   │   ├── Groups.jsx             # Hybrid: static group info + live Zafronix standings
│   │   ├── Schedule.jsx           # Hybrid: static fixtures + live scores + match recap
│   │   ├── Leaderboard.jsx        # Live: Goals / Assists / Cards / Clean Sheets tabs
│   │   ├── Storylines.jsx         # Static: editorial narrative cards
│   │   ├── FunFacts.jsx           # Live: On This Day + Tournament Trivia from Zafronix
│   │   └── *.module.css           # One CSS Module per component
│   │
│   ├── hooks/
│   │   ├── useMatches.js          # Zafronix matches, 5-min cache, openfootball fallback
│   │   ├── useStandings.js        # Zafronix standings, 5-min cache
│   │   ├── useLiveScores.js       # ESPN scoreboard, polls every 45 s during live windows only
│   │   ├── useEspnLeaderboard.js  # ESPN → goals/assists/cards leaders, 3-min cache
│   │   ├── useEspnHeadlines.js    # ESPN → match headline map keyed by team pair, 5-min cache
│   │   ├── useCleanSheets.js      # Derived from useMatches (no extra API call), 5-min cache
│   │   ├── useRoster.js           # Zafronix /teams/{team}/roster, 10-min cache
│   │   └── useScorers.js          # Placeholder — currently fetches Argentina roster
│   │
│   ├── services/
│   │   └── api.js                 # All fetch functions + isMatchWindowActive helper
│   │
│   └── data/
│       └── static.js              # Hardcoded: powerRankings, groups, schedule, storylines
│
├── api/                           # Vercel serverless functions
│   ├── zafronix/
│   │   └── [...path].js           # Catch-all proxy: hides API key, adds cache headers
│   └── espn/
│       └── live.js                # ESPN proxy: fixes CORS, adds 30s cache header
│
├── docs/
│   ├── PROJECT.md
│   ├── ARCHITECTURE.md
│   ├── CHANGELOG.md
│   └── agents/                    # Claude Code agent instruction files
│       ├── AGENT-MASTER.md
│       ├── AGENT-UI.md
│       ├── AGENT-DATA.md
│       ├── AGENT-CONTENT.md
│       └── AGENT-REVIEW.md
│
└── dist/                          # Vite build output (committed for reference)
```

---

## Data Layer

### API Sources

| Source | Base URL | Auth | Rate Limit | What It Provides |
|---|---|---|---|---|
| Zafronix | `https://api.zafronix.com/fifa/worldcup/v1` | `X-API-Key` header | **250 req/day** (free tier) | Matches, standings, rosters, on-this-day, trivia |
| ESPN | `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard` | None | Unofficial, unknown | Goals, assists, cards, headlines, live scores |
| openfootball | `https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json` | None | None | Match fallback |

### Zafronix Endpoints Used

| Endpoint | Query Params | Cache-Control (Vercel) | Consumer |
|---|---|---|---|
| `GET /matches` | `year=2026` | `s-maxage=60` | `useMatches`, `useCleanSheets` |
| `GET /standings` | `year=2026` | `s-maxage=300` | `useStandings` |
| `GET /teams/{team}/roster` | `year=2026` | `s-maxage=60` | `useRoster` |
| `GET /on-this-day` | none | `s-maxage=60` | `FunFacts` |
| `GET /trivia` | `year=2026` | `s-maxage=60` | `FunFacts` |
| `GET /scorers` | `year=2026` | `s-maxage=300` | defined in api.js, not yet wired |
| `GET /players` | `year=2026` | `s-maxage=60` | defined in api.js, not yet wired |

The Zafronix proxy (`api/zafronix/[...path].js`) allowlists only these first path segments: `matches`, `standings`, `scorers`, `players`, `teams`, `on-this-day`, `trivia`. All other paths return 404.

### ESPN Endpoint

```
GET https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard
    ?limit=200&dates=20260611-{YYYYMMDD_today}
```

Returns all tournament matches from June 11 to today. Each event has a `details[]` array with per-goal and per-card entries including `athletesInvolved`, `scoringPlay`, `yellowCard`, `redCard`, and `ownGoal` flags. The second athlete in `athletesInvolved` on a `type.text === 'Goal'` entry is credited with the assist.

### Full Request Lifecycle (production)

```
Browser
  │
  │  1. Check sessionStorage cache
  │     ├─ Hit and fresh → render immediately, no network call
  │     └─ Miss or stale → proceed
  │
  ▼
Vercel Serverless Function  (/api/zafronix/* or /api/espn/live)
  │  - Injects API key (Zafronix only)
  │  - Sets Cache-Control response headers
  │  - Forwards query params
  │
  ▼
External API  (api.zafronix.com or site.api.espn.com)
  │
  ▼
Vercel CDN edge cache  (s-maxage: 30–300 s depending on endpoint)
  │
  ▼
React hook  (useState + useEffect)
  │  - Normalizes response shape
  │  - Writes to sessionStorage with timestamp
  │  - Returns { data, loading, error, source }
  │
  ▼
Component  (renders data or loading/error state)
```

### Polling and Caching

| Hook | sessionStorage Key | TTL | Poll Interval |
|---|---|---|---|
| `useMatches` | `wc2026_matches` | 5 min | none |
| `useStandings` | `wc2026_standings` | 5 min | none |
| `useLiveScores` | none | none | **45 s**, only during active match window |
| `useEspnLeaderboard` | `wc2026_espn_leaderboard` | 3 min | none |
| `useEspnHeadlines` | `wc2026_espn_headlines` | 5 min | none |
| `useCleanSheets` | `wc2026_cleansheets` | 5 min | none (derived) |
| On This Day (FunFacts) | `wc2026_on_this_day` | 1 hour | none |
| Trivia (FunFacts) | `wc2026_trivia` | 1 hour | none |
| `useRoster` | `wc2026_roster_{team}` | 10 min | none |

**Live window detection**: `isMatchWindowActive(matches)` returns `true` if the current timestamp falls between any match's `kickoff_utc` and `kickoff_utc + 120 minutes`. `useLiveScores` calls this on mount and does not start polling unless a match is active. The interval is torn down if no window is found.

**sessionStorage vs localStorage**: sessionStorage is intentional — it clears on browser close, preventing stale tournament data from persisting across days.

### Caching Strategy (layered)

```
sessionStorage (browser)      → first line of defense, survives tab switches
Vercel CDN (s-maxage headers) → shared across all users, reduces origin hits
Origin API                    → last resort, Zafronix rate limit applies here
```

### Fallback Strategy

| Data | Primary | Fallback |
|---|---|---|
| Match results + scores | Zafronix `/matches` | openfootball GitHub raw JSON |
| Group standings | Zafronix `/standings` | none |
| Goals leaderboard | ESPN `details[].scoringPlay` | Zafronix `matches[].goals[]` array |
| Assists leaderboard | ESPN (second `athletesInvolved`) | none |
| Cards leaderboard | ESPN `details[].yellowCard/redCard` | none |
| Live scores | ESPN scoreboard | none |
| Clean sheets | derived from Zafronix match scores | none |

---

## Environment Variables

| Variable | Where Used | Source |
|---|---|---|
| `ZAFRONIX_API_KEY` | `api/zafronix/[...path].js` via `process.env` (serverless) | [zafronix.com](https://zafronix.com) dashboard |
| `VITE_ZAFRONIX_KEY` | `src/services/api.js` via `import.meta.env` (local dev only) | Same Zafronix account key |

Both variables hold the same Zafronix API key value. The `VITE_` prefix is required for Vite to expose it to browser code during local development. In production, the browser never sees the key — only the serverless function does.

`.env.local` template:
```
ZAFRONIX_API_KEY=your_key_here
VITE_ZAFRONIX_KEY=your_key_here
```

---

## Local Dev Setup

```bash
# 1. Clone
git clone https://github.com/eastsidelbc/wc2026.git
cd wc2026

# 2. Install (Bun only — never npm/npx/yarn)
bun install

# 3. Add env vars
cp .env.local.example .env.local   # or create manually
# Edit .env.local with your Zafronix API key

# 4. Start dev server
bun run dev
# → http://localhost:3000

# 5. Build for production
bun run build

# 6. Preview production build
bun run preview
```

In dev mode, Zafronix is called directly from the browser with the `VITE_ZAFRONIX_KEY` header. ESPN is called directly from the browser (no CORS issue in dev). The Vite dev proxy (`/api → localhost:3001`) is present in `vite.config.js` but is not required for normal dev work.

---

## Vercel Deployment

### First deploy

1. Push the repo to GitHub
2. Connect the repo to Vercel at vercel.com/new
3. Vercel auto-detects Vite; build command is `bunx --bun vite build`, output dir is `dist`
4. Add environment variable in Vercel dashboard → Settings → Environment Variables:
   - `ZAFRONIX_API_KEY` = your key (set for Production and Preview)
5. Deploy

### Subsequent deploys

Push to `main` → Vercel auto-deploys.

### vercel.json behavior

```json
{
  "bunVersion": "1.x",
  "rewrites": [
    { "source": "/((?!api/).*)", "destination": "/index.html" }
  ],
  "headers": [
    { "source": "/api/(.*)", "headers": [CORS headers] }
  ]
}
```

- `bunVersion` pins serverless functions to run on Bun (not Node)
- The rewrite rule sends all non-API paths to `index.html` (SPA routing)
- CORS headers on `/api/*` allow the browser to call serverless functions from any origin

---

## Feature Overview

### Power Rankings tab
- **Data**: 100% static, hardcoded in `src/data/static.js`
- **Update frequency**: manual edit only
- **Features**: betting odds strip (hardcoded), 4 tiers (Title Contenders, Strong Contenders, Dark Horses, Mid), expandable accordion cards with editorial analysis per team

### Groups tab
- **Data**: static group structure + live Zafronix standings (`useStandings`)
- **Update frequency**: 5-min sessionStorage cache
- **Features**: 12 collapsible group cards (A–L), verdict badges (Lock / Likely / Bubble / Exit Expected), live standings when Zafronix data is available (P / GD / Pts), static team info as fallback

### Schedule tab
- **Data**: static fixtures + Zafronix match results + ESPN live scores + ESPN headlines
- **Update frequency**: Zafronix 5-min cache; live scores poll every 45 s during active windows
- **Features**: filter chips (All / Big Games / per Group), live score bar when matches are active, completed matches show final score and are clickable, match recap accordion shows venue, goalscorers with minute, own-goal flag, ESPN headline
- **Static data covers**: Matchday 1 (Jun 11–17) and partial Matchday 2 (Jun 18–23); Matchday 3 and knockout rounds not yet added

### Leaderboard tab
- **Data**: ESPN scoreboard for goals/assists/cards; Zafronix match data for clean sheets
- **Update frequency**: 3-min sessionStorage cache (ESPN); 5-min cache (clean sheets)
- **Tabs**: Goals (⚽), Assists (🎯), Cards (🟨🟥), Clean Sheets (🧤)
- **Goals fallback**: if ESPN is down, goals are derived from Zafronix `matches[].goals[]` arrays
- **Assists**: only available when ESPN returns `athletesInvolved[1]` data
- **Clean sheets**: derived client-side from match scores, no extra API call

### Storylines tab
- **Data**: 100% static, hardcoded in `src/data/static.js`
- **Update frequency**: manual edit only
- **Features**: 8 editorial cards with type-based styling (default / hot / injury / host)

### Fun Facts tab
- **Data**: Zafronix `/on-this-day` + `/trivia?year=2026`
- **Update frequency**: 1-hour sessionStorage cache
- **Features**: On This Day section (historical match cards + fact quotes for today's date), Tournament Trivia section (category-tagged fact cards)

---

## Data Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                     Browser (React SPA)                  │
│                                                          │
│  src/data/static.js ──────────────────────────────────► │
│  (powerRankings, groups, schedule, storylines)   instant │
│                                                          │
│  sessionStorage cache ────────────────────────────────► │
│  (keyed by data type, TTL 3–60 min)              instant │
│                                                          │
│  src/services/api.js (fetch)                            │
│       │                                                  │
│       ▼                        ▼                         │
│  /api/zafronix/*          /api/espn/live                │
└───────┼───────────────────────┼─────────────────────────┘
        │ (HTTPS)               │ (HTTPS)
        ▼                       ▼
┌───────────────────┐  ┌────────────────────────┐
│ Vercel Serverless │  │  Vercel Serverless      │
│ api/zafronix/     │  │  api/espn/live.js       │
│ [...path].js      │  │                         │
│                   │  │  Cache-Control:          │
│ Injects API key   │  │  s-maxage=30            │
│ Cache-Control:    │  └───────────┬────────────┘
│ s-maxage=60–300   │              │
└───────┬───────────┘              │
        │                         │
        ▼                         ▼
┌───────────────────┐  ┌──────────────────────────────────┐
│ api.zafronix.com  │  │ site.api.espn.com                │
│ /fifa/worldcup/v1 │  │ /apis/site/v2/sports/soccer/     │
│                   │  │  fifa.world/scoreboard            │
│ 250 req/day limit │  │ (hidden API, no key, no SLA)     │
└───────────────────┘  └──────────────────────────────────┘

        Fallback path (useMatches only):
        raw.githubusercontent.com/openfootball/worldcup.json
```

---

## Planned Features

- [ ] Matchday 3 and knockout bracket data in `static.js`
- [ ] Bracket / elimination tree view (Zafronix `/bracket` endpoint, not yet wired)
- [ ] Player detail modal (roster data via `useRoster` exists, no UI yet)
- [ ] Zafronix `/scorers` endpoint wired to Leaderboard as backup
- [ ] Trophy SVG favicon (referenced in `index.html`, file missing from `public/`)
- [ ] `useScorers.js` refactored away from Argentina placeholder

---

## Known Limitations

| Limitation | Detail |
|---|---|
| Zafronix 250 req/day | Aggressive sessionStorage caching mitigates this but a traffic spike could exhaust the free tier mid-day |
| ESPN is undocumented | No SLA, no rate limit documentation — could break without warning |
| ESPN assists data | Only available if ESPN populates `athletesInvolved[1]` on goal events — not guaranteed |
| Schedule is partial | Only Matchday 1 + partial Matchday 2 fixtures in `static.js`; later rounds need to be added manually |
| No real-time push | Live scores use 45-second polling (not WebSockets) — up to 45 s stale during live matches |
| Tab remount | Switching tabs unmounts components; sessionStorage prevents re-fetching but component state resets |
| Bun serverless | `bunVersion: "1.x"` in vercel.json runs functions on Bun — most Node APIs work, but there are subtle differences in `req.query` parsing (already worked around in the Zafronix proxy) |
| No auth | Dashboard is public read-only; no user accounts or personalization |

---

## Agents

The codebase uses a structured agent system for Claude Code sessions. Before starting any task, identify which agent applies and tell Claude Code to read that file. Each agent has hard ownership boundaries — it reads its own files and never touches files owned by another agent.

### How to start a session

```
Read docs/PROJECT.md and docs/agents/AGENT-[NAME].md. Here's what I want to do today: [task]
```

Replace `[NAME]` with `MASTER`, `UI`, `DATA`, `CONTENT`, or `REVIEW` depending on the work.

---

### AGENT-MASTER

**File:** `docs/agents/AGENT-MASTER.md`

**Use when:** Planning work, making cross-cutting architectural decisions, reviewing the overall project state, or starting a session where you're not sure which agent applies.

**Invocation:**
```
Read docs/PROJECT.md and docs/agents/AGENT-MASTER.md. Here's what I want to plan today: [task]
```

**Responsibilities:**
- High-level project orientation and architecture overview
- Enforcing golden rules across all agents
- Deciding which agent(s) should handle a given task
- Tracking session start/end (CHANGELOG + PROJECT.md status table updates)

**Rules it enforces:**
- Never commit `.env.local`
- API keys never touch the frontend — always through `api/` serverless functions
- ESPN only polled during active match windows
- Zafronix 250 req/day — respect caching TTLs
- CSS Modules only — no inline styles, no Tailwind
- `CHANGELOG.md` must be updated at the end of every session
- `src/data/static.js` is the source of truth for rankings, groups, schedule, and storylines until Zafronix data is wired in

**End-of-session prompt:**
```
Update docs/CHANGELOG.md with what we did today and update the status table in docs/PROJECT.md
```

---

### AGENT-UI

**File:** `docs/agents/AGENT-UI.md`

**Use when:** Building or editing components, styling, layout, animations, or any visual change.

**Invocation:**
```
Read docs/agents/AGENT-UI.md. I want to [build/change/fix] [component or visual thing].
```

**Owns:**
- `src/components/*.jsx`
- `src/components/*.module.css`
- `src/App.jsx` and `src/App.module.css`
- `src/index.css` (global variables only — no component styles here)

**Never touches:** `src/hooks/`, `src/services/api.js`, `api/`, `src/data/static.js`

**Design system (CSS variables defined in `src/index.css`):**

| Variable | Value | Use |
|---|---|---|
| `--bg` | `#0a0e1a` | Page background |
| `--surface` | `#111827` | Slightly lighter surface |
| `--card` | `#1a2235` | Card backgrounds |
| `--border` | `#2a3450` | Borders |
| `--gold` | `#f5c842` | Primary accent, active states |
| `--green` | `#22c55e` | Success states |
| `--red` | `#ef4444` | Danger, live badge |
| `--blue` | `#3b82f6` | Info |
| `--muted` | `#6b7280` | Muted text |
| `--text` | `#f1f5f9` | Primary text |
| `--subtext` | `#94a3b8` | Secondary text |
| `--fire` | `#ff6b35` | Hot match accent |

**UI rules:**
- Mobile-first always, max content width 600px centered
- One `.module.css` per component, no exceptions
- No inline styles
- Touch targets minimum 44px height
- Interactive transitions: `transition: all 0.15s`
- Header: `position: sticky; top: 0; z-index: 100`
- Horizontal chip/nav rows: `overflow-x: auto; scrollbar-width: none`
- Accordions: `max-height 0 → value` + `opacity 0 → 1` transition

**Standard card pattern:**
```css
background: var(--card);
border: 1px solid var(--border);
border-radius: 12px;
padding: 13px 14px;
```

**Adding a new component:**
1. Create `ComponentName.jsx` in `src/components/`
2. Create `ComponentName.module.css` alongside it
3. Import and add to `App.jsx` tab list
4. Update `docs/CHANGELOG.md`

---

### AGENT-DATA

**File:** `docs/agents/AGENT-DATA.md`

**Use when:** Adding or modifying API calls, hooks, caching logic, serverless functions, or data fetching behavior.

**Invocation:**
```
Read docs/agents/AGENT-DATA.md. I want to [add/fix/change] [hook or API or serverless function].
```

**Owns:**
- `src/hooks/` — all React data hooks
- `src/services/api.js` — all fetch functions
- `api/` — Vercel serverless proxy functions

**Never touches:** `src/components/`, `src/data/static.js`, `src/index.css`

**Rate limit rules (critical):**
- Zafronix free tier = **250 req/day**
- Cache everything in sessionStorage
- Cache TTLs: `matches` = 5 min, `standings` = 5 min, `scorers` = 10 min, `ESPN leaderboard` = 3 min
- ESPN: **only poll during active match windows** (`isMatchWindowActive()` check required)
- ESPN poll interval minimum: **45 seconds**
- Never call ESPN in a `useEffect` without checking `isMatchWindowActive()` first

**Serverless function rules:**
- All API keys go through `api/` functions — never in frontend code
- Always set `Cache-Control` headers
  - Slow endpoints (standings, scorers): `s-maxage=300`
  - Fast endpoints (live scores): `s-maxage=30`
- Always handle upstream errors gracefully — return JSON error, never crash

**Standard hook pattern:**
```
1. Check sessionStorage cache → return if still fresh
2. Fetch from primary source (Zafronix or ESPN)
3. On error: try fallback source
4. On fallback error: set error state
5. Always set loading=false
6. Return { data, loading, error, source }
```

**Zafronix endpoint map (via proxy):**

| Browser calls | Proxy forwards to |
|---|---|
| `GET /api/zafronix/matches?year=2026` | `https://api.zafronix.com/fifa/worldcup/v1/matches?year=2026` |
| `GET /api/zafronix/standings?year=2026` | `https://api.zafronix.com/fifa/worldcup/v1/standings?year=2026` |
| `GET /api/zafronix/scorers?year=2026` | `https://api.zafronix.com/fifa/worldcup/v1/scorers?year=2026` |
| `GET /api/zafronix/players?year=2026` | `https://api.zafronix.com/fifa/worldcup/v1/players?year=2026` |
| `GET /api/zafronix/teams/{team}/roster?year=2026` | `https://api.zafronix.com/fifa/worldcup/v1/teams/{team}/roster?year=2026` |
| `GET /api/zafronix/on-this-day` | `https://api.zafronix.com/fifa/worldcup/v1/on-this-day` |
| `GET /api/zafronix/trivia?year=2026` | `https://api.zafronix.com/fifa/worldcup/v1/trivia?year=2026` |

**ESPN endpoint (via proxy):**

```
GET /api/espn/live
→ https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard
  ?limit=200&dates=20260611-{YYYYMMDD_today}

Response shape: { events: [{ id, name, status, competitions: [{ competitors, details, headlines }] }] }
```

**Adding a new hook:**
1. Create `useXxx.js` in `src/hooks/`
2. Follow the hook pattern above
3. Add fetch function to `src/services/api.js`
4. Add serverless proxy to `api/` if new external source needed
5. Update `docs/CHANGELOG.md`

---

### AGENT-CONTENT

**File:** `docs/agents/AGENT-CONTENT.md`

**Use when:** Updating power rankings, team notes, group verdicts, storylines, schedule hot flags, or any editorial text.

**Invocation:**
```
Read docs/agents/AGENT-CONTENT.md. I want to update [power rankings / storylines / group verdicts / schedule].
```

**Owns:** `src/data/static.js` only

**Never touches:** any `.jsx`, `.css`, hook, service, or `api/` file

**What's in `static.js` and how to edit it:**

| Export | Shape | How to update |
|---|---|---|
| `powerRankings` | Array of tier objects, each with a `teams` array | Change `rank`, `note`, `badge`, `badgeClass`, or `summary` per team; reorder array entries to change tier membership |
| `groups` | Array of group objects A–L | Update `verdict` (`lock\|likely\|bubble\|out`) and `label` per team; set `hot: true` to flag the group |
| `schedule` | Array of match objects | Update `hot: true/false` per match; add new match entries for Matchday 3 and knockout rounds |
| `storylines` | Array of story objects | Add new objects with `type` (`default\|hot\|injury\|host`), `tag`, `title`, `body`; reorder to change display order |

**Team verdict values:**
- `lock` — almost certain to advance (shown in green)
- `likely` — probable to advance
- `bubble` — 50/50
- `out` — expected to be eliminated (shown in muted)

**Always update `docs/CHANGELOG.md` after content changes.**

---

### AGENT-REVIEW

**File:** `docs/agents/AGENT-REVIEW.md`

**Use when:** After any significant feature addition, before pushing to main, or when something feels off and you want a second opinion.

**Invocation:**
```
Act as AGENT-REVIEW. Audit the entire codebase and give me a full report.
```

Or scoped to specific files:
```
Act as AGENT-REVIEW. Review src/hooks/useEspnLeaderboard.js and api/espn/live.js.
```

**What it checks:**

| Category | Key checks |
|---|---|
| Architecture integrity | Components only import data through hooks; hooks never render JSX; static data only in `static.js`; `isDev` pattern used consistently |
| Redundancy | Duplicated fetch logic, duplicate CSS patterns, team name normalization in multiple places, colliding cache keys |
| Failure modes | Try/catch on every API call, loading + error + empty states all handled, ESPN fallback actually triggers, sessionStorage ops wrapped in try/catch |
| Performance | Unnecessary fetches, missing `useMemo` on expensive transforms, missing dependency arrays, missing React keys |
| Mobile quality | 44px tap targets, hidden horizontal scrollbars, no hardcoded pixel widths, long text doesn't overflow |
| Code hygiene | No `console.log` in `src/`, no commented-out code, no unused imports, no magic numbers |
| Security | No API keys in frontend code or git history, `VITE_` prefixed vars are browser-visible (only non-sensitive keys), no unsanitized user input |
| Syntax / duplicates | Special focus on `api/` files — syntax errors there cause silent prod failures while dev works fine (dev bypasses `api/` entirely via `isDev` flag) |

**Output format it returns:**
```
[One-paragraph overall health assessment]

🔴 CRITICAL — Fix Before Next Push
[FILE:LINE] Problem → Fix

🟡 WARNING — Fix This Week
[FILE:LINE] Problem → Fix

🟢 SUGGESTION — Nice To Have
[FILE] Suggestion

Health Score: X/10
Biggest Risk: [one sentence]
Top Priority Fix: [one sentence]
```

**Run after:** every major feature addition, before every push to `main`.
