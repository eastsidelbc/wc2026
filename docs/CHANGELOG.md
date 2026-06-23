# Changelog — wc2026

Format: [Date] — What changed and why

---

## [2026-06-23] — Schedule UX, Group Position Badges, Tab Reorder

### Group position badges on match cards
- `Schedule.jsx`: imported `useStandings`; built flat `positionMap` (`{ teamName → position }`) from standings data; `getPosition(zName)` helper; each team name now shows current group position as a small badge (e.g. `🇺🇸 USA 1`)
- `Schedule.module.css`: added `.teamPos` — small muted badge, matches goal type badge style
- Position hides gracefully while standings load and for knockout matches

### Schedule default to today + future
- "Today" tab now shows today's matches followed by all future dates in one continuous scroll (Google-style)— no separate "Future" tab needed
- `parseScheduleDate()` helper converts static formatted date strings (`"Jun 23 (Mon)"`) to Date objects for `>=` comparison
- Today chip shows whenever any matches remain; disappears after tournament ends
- Default filter is "Today" during tournament, falls back to "All" after

### Schedule first tab + default landing
- `App.jsx`: moved Schedule to first position in TABS array; default `activeTab` changed from `'power'` to `'schedule'`
- Power Rankings moved to third position

---

## [2026-06-23] — Schedule Overhaul: API Audit, Goal Split, 4 New Features, Today Filter

### Bug fix: USA vs Australia showing as USA vs Turkey
- Root cause: `fixtures` was built entirely from Zafronix data — bad `awayTeam` from their API corrupted the display
- Fix: static `schedule` is now the permanent source of truth for team names/dates/groups; Zafronix only enriches scores/venues/goals
- `Schedule.jsx`: removed Zafronix-driven fixture mapping; `getZMatch` always uses `zLookup` via `teamKey` (no more `_zm` shortcut)

### Bug fix: recap headlines missing on USA matches
- Root cause: Zafronix calls USA `"USA"`, ESPN calls them `"United States"` — headline map lookup was missing
- Fix: added `ESPN_NAME_MAP` in `Schedule.jsx` mapping Zafronix API names → ESPN displayNames; `getHeadline` and new `getGoalType` both use it

### API field name corrections
- `fetchZafronixGoals` in `api.js`: fixed to use real field names (`g.scorer` not `g.player`, `g.type === 'own_goal'` not `g.ownGoal`, `g.team` = `"home"`/`"away"` not team name)
- `/scorers` endpoint removed from proxy ALLOWED list — Zafronix 404s on it (confirmed via live curl)

### Split goals layout in accordion
- Goals now render in two columns: home team left, away team right, separated by a center divider
- Stoppage time shown as `90+4'` using `addedMinute` field
- Penalty (`P`) and own goal (`OG`) badges shown inline
- Falls back to flat list if `g.team` field is absent

### Feature: goal type badges (ESPN)
- `useEspnHeadlines.js`: extended to also return `goalTypes` map (`"TeamA|TeamB"` → `{ [minute]: typeText }`) and `teamForms` map (`"ESPN displayName"` → form string)
- Accordion shows `Header`, `Volley`, `FK` pill badge next to scorer for special goal types; sourced from ESPN `details[].type.text`

### Feature: form dots (ESPN)
- 3 colored dots per team on each match card showing last 3 results (🟢 W · ⚫ D · 🔴 L)
- Sourced from ESPN `competitors[].form` — reflects recent international form, not just WC

### Feature: drama score (Zafronix)
- Completed matches auto-labeled `💥 Chaos`, `🔥 Thriller`, or `⚡ Lively` based on: red cards (×2), late goals 80+ min (×2), score margin (draw +3, one-goal +1), 4+ total goals (+2)
- Drama label replaces kickoff time on completed match cards; time still shows for upcoming matches

### Feature: elevation badge (Zafronix stadiums)
- Matches at Estadio Azteca (2,287m) and Estadio Akron (1,671m) show `⛰️ 2,287m` on the venue line
- `STADIUM_ELEVATION` map added to `static.js` — verified from live `/stadiums?tournament=2026` call

### Feature: Today filter chip
- Schedule opens on "Today" tab by default showing today's matches + all future dates in one continuous scroll (Google-style)
- "All" tab shows full history including past results
- Today chip disappears automatically when tournament ends (no future matches remain)
- Uses `parseScheduleDate()` to compare formatted date strings (`"Jun 23 (Mon)"`) as real Date objects

### API documentation (new files)
- `docs/ZAFRONIX-API.md`: full verified endpoint + field reference from live curl calls; includes real goals shape, confirmed dead `/scorers` endpoint, what's Pro+ only, ETag optimization opportunity, "what we could build" table
- `docs/ESPN-API.md`: reverse-engineered field reference for undocumented ESPN scoreboard; all detail event types, competitor stats, form/records fields, broadcast info
- `docs/agents/AGENT-DATA.md`: added pointers to both new doc files

---

## [2026-06-18] — Consistency Audit: Bun Commands + Env Var Docs

### Bun command consistency
- `CLAUDE.md`: replaced incorrect rule 7 (`bun vercel dev` / `bunx run dev`) with canonical Bun commands — dev `bun run dev`, build `bun run build`, install `bun install`; never `vercel dev`/npm/npx/yarn
- `docs/PROJECT.md`: `npm install` → `bun install` in status checklist
- `docs/CHANGELOG.md`: `npm install` → `bun install` and `npm run dev` → `bun run dev` in scaffold next-steps
- `package.json` left unchanged — `bunx --bun vite` scripts are functional and used by the working prod deploy

### Env var documentation
- Code verified correct: serverless uses `process.env.ZAFRONIX_API_KEY`, client dev uses `import.meta.env.VITE_ZAFRONIX_KEY` — no code changes
- Fixed doc gap: client dev path requires `VITE_ZAFRONIX_KEY` but no doc mentioned it; `.env.local` needs BOTH keys
- `CLAUDE.md` (new rule 8), `docs/PROJECT.md` (API Keys), `docs/agents/AGENT-DATA.md` (source table) now document both keys and their consumers

---

## [2026-06-18] — Leaderboard Clean Sheets Tab + ESPN Date Range Fix

### ESPN scoreboard date range
- `src/services/api.js`: `fetchEspnScoreboard` now appends `?limit=200&dates=20260611-{today}` in dev mode so all tournament matches are returned, not just today's
- `api/espn/live.js`: same date range computed server-side so production proxy covers full tournament history
- `src/hooks/useEspnLeaderboard.js`: cache TTL bumped from 2 min to 3 min to match larger response

### Schedule headline name bridge
- `src/components/Schedule.jsx`: added `REVERSE_NAME_MAP` (inversion of `NAME_MAP`); `getHeadline` now normalizes Zafronix team names → ESPN displayNames before map lookup, fixing namespace mismatch that caused all headlines to miss

### Leaderboard Clean Sheets tab
- `src/hooks/useCleanSheets.js`: new hook — consumes `useMatches` (no extra API call); walks completed matches, awards clean sheets to whichever side conceded 0; finds starting GK from `lineups.home/.away` where `position === 'GK' && starter === true`; caches result 5 min under `wc2026_cleansheets`; handles 0-0 draws (both teams get +1)
- `src/components/Leaderboard.jsx`: added 'Clean Sheets' to TABS; imports `useCleanSheets` and `groups`; builds `FLAG_MAP` covering both static display names and Zafronix aliases; Clean Sheets tab renders flag emoji, goalkeeper name, team, count badge (🧤); loading state switches between ESPN and clean-sheets loading per active tab

---

## [2026-06-18] — Feature Sprint: Leaderboard, Groups, Fun Facts, Schedule Recap

### Task 1 — Leaderboard Golden Boot
- `useEspnLeaderboard.js`: added `assistLeaders` — tracks second `athletesInvolved` entry on `type.text === 'Goal'` details; refactored `ensure` to module-level `upsert(map, key, team, headshot)` to avoid closure-in-loop antipattern; all three lists (goals, assists, cards) cached together; Zafronix fallback sets assists/cards to []
- `Leaderboard.jsx`: wired `assistLeaders`; Assists tab now shows real data sorted by assists desc; removed "coming soon" placeholder; cleaned up unused Squad/roster code; PlayerAvatar kept at 36px circular

### Task 2 — Groups Verdict Badges
- `Groups.jsx`: added `VERDICT_MAP` built from static groups data; live standings rows now show verdict badge (Lock / Likely / Bubble / Out) alongside played/GD/points — badge omitted gracefully if team name doesn't match static data

### Task 3 — Fun Facts Tab
- `src/services/api.js`: added `fetchOnThisDay()` and `fetchTrivia(year)` — Zafronix endpoints, dev mode uses direct URL + VITE_ZAFRONIX_KEY header
- `src/components/FunFacts.jsx`: new component with two inline hooks (useOnThisDay, useTrivia), 1-hour sessionStorage cache each; On This Day renders match cards (year, teams, score, stadium) + fact quote cards; Tournament Trivia renders category + text cards
- `src/components/FunFacts.module.css`: new stylesheet matching design system
- `src/App.jsx`: added Fun Facts tab (id: funfacts)

### Task 4 — Schedule Match Recap Accordion
- `src/hooks/useEspnHeadlines.js`: new hook — fetches ESPN scoreboard, builds `"HomeTeam|AwayTeam" → headline` map (both orientations), 5-min sessionStorage cache, silent on error
- `src/components/Schedule.jsx`: completed matches clickable; `openMatch` state toggles accordion per match; recap shows venue, goalscorers with minute (from Zafronix `goals[]`), own-goal flag, ESPN headline in italic quote style; arrow indicator rotates on open
- `src/components/Schedule.module.css`: added `.completed`, `.open`, `.matchArrow`, `.recapExpand` (max-height accordion transition), `.recapInner`, `.recapGoalRow`, `.recapMinute`, `.recapScorer`, `.recapHeadline`

### Task 5 — Cleanup
- Removed `console.warn` from `useMatches.js` (fallback path) and `useLiveScores.js` (poll error path)
- No console.* calls remain in `src/` (server-side `console.error` in `api/` retained for Vercel logs)

---

## [2026-06-18] — Initial Scaffold

### Added
- Full project structure: React + Vite + Vercel
- All 5 tabs: Power Rankings, Groups, Schedule, Leaderboard, Storylines
- Static data layer in `src/data/static.js`
- Zafronix proxy serverless function (`api/zafronix/[...path].js`)
- ESPN live scores proxy (`api/espn/live.js`)
- `useMatches`, `useLiveScores`, `useScorers` hooks with caching
- Obsidian vault (`docs/`) with PROJECT, ARCHITECTURE, CHANGELOG, and all 4 agent files
- CSS Modules for all components
- `.env.local` template
- `.gitignore` (excludes node_modules, .env.local, dist)
- `vercel.json` with rewrite rules and CORS headers

### Decisions
- CSS Modules over Tailwind: no compiler, scoped styles, easier for AI to reason about
- sessionStorage caching: protects 250 req/day Zafronix free tier
- ESPN polling only during active match windows: avoids rate limit abuse
- Static data separate from components: AGENT-CONTENT can update without touching logic

### Next Steps
- [ ] Run `bun install` in project root
- [ ] Add Zafronix key to `.env.local`
- [ ] Push to GitHub
- [ ] Connect Vercel to GitHub repo
- [ ] Add `ZAFRONIX_API_KEY` to Vercel environment variables
- [ ] Test `bun run dev` locally
- [ ] Wire live Zafronix data into Groups standings
- [ ] Wire live Zafronix data into Leaderboard
