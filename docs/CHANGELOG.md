# Changelog — wc2026

Format: [Date] — What changed and why

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
- [ ] Run `npm install` in project root
- [ ] Add Zafronix key to `.env.local`
- [ ] Push to GitHub
- [ ] Connect Vercel to GitHub repo
- [ ] Add `ZAFRONIX_API_KEY` to Vercel environment variables
- [ ] Test `npm run dev` locally
- [ ] Wire live Zafronix data into Groups standings
- [ ] Wire live Zafronix data into Leaderboard
