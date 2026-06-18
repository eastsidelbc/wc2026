# Changelog — wc2026

Format: [Date] — What changed and why

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
