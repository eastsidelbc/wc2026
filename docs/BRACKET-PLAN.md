# WC2026 — Bracket Feature Plan
**Written:** 2026-07-06
**Updated:** 2026-07-06 (switched to API-driven approach after Claude Code inspection)
**Status:** Ready for Claude Code
**Agents:** AGENT-DATA (API + hook) then AGENT-UI (component)

---

## Goal
Add full knockout bracket to the app as a new "Bracket" tab. All rounds, all completed results, all upcoming fixtures, live scores when applicable. Tournament is LIVE RIGHT NOW in Round of 16 (ends Jul 7). QF Jul 9. Final Jul 19.

---

## Approach — API-driven (Zafronix `/bracket`)

**Data source:** Zafronix `/bracket?year=2026` endpoint (purpose-built, pre-shaped by round, handles placeholder resolution).

**No static bracket data.** Everything comes from the API.

**Why not filter `/matches` by stage:**
- Would reimplement round-grouping client-side
- Would reimplement placeholder resolution (France/Paraguay winner, etc.)
- `/bracket` already returns exactly the shape we need

**Why not static hardcoded data:**
- Results change during the tournament
- Manual updates every day = defeats the purpose
- Sets up the loop-engineering handoff nicely (auto-refresh via API cache)

---

## API Response Shape (verified via live curl per Claude Code)

```
GET /api/zafronix/bracket?year=2026

{
  stages: {
    round_of_32: [ /* match objects */ ],
    round_of_16: [...],
    quarter_final: [...],
    semi_final: [...],
    third_place: [...],
    final: [...]
  }
}
```

**Match object fields (available from Zafronix):**
- `id`, `matchNo`, `date`, `kickoff`, `kickoffUtc`
- `homeTeam`, `awayTeam` (strings, resolved once known)
- `homeRef`, `awayRef` (placeholders like `"1A"` or `"W73"` before resolution)
- `homeScore`, `awayScore` (int or null)
- `winner`, `loser` (strings, populated when match complete)
- `result` (string or null)
- `extraTime`, `penalties`
- `stadium`, `stadiumId`, `city`, `country`
- `status` — `finished` | `live` | `scheduled` | `postponed`
- Optional: `goals[]`, `cards[]`, `attendance`, `referee`

**Match `stageNormalized` values:** `group_a`, `round_of_32`, `round_of_16`, `quarter_final`, `semi_final`, `third_place`, `final`

---

## Current Code State

- `useMatches` — already fetching all matches (group + knockout). Not filtered.
- `useLiveScores` — polls ESPN during active windows.
- `useStandings` — group standings only.
- `api/zafronix/[...path].js` — allowlist does NOT include `bracket` yet.
- `src/services/api.js` — has fetchMatches, fetchStandings, etc. No fetchBracket.
- No Bracket component. No knockout tab.

---

## What to Build

### Step 1 — Wire the API (AGENT-DATA)
Three files:
1. `api/zafronix/[...path].js` — add `'bracket'` to the `ALLOWED` set. Add `'bracket'` to `SLOW` set (5-min CDN cache).
2. `src/services/api.js` — add `fetchBracket(year = 2026)` mirroring `fetchMatches` pattern.
3. `src/hooks/useBracket.js` — new hook mirroring `useMatches.js` structure. Cache key `wc2026_bracket`, 5-minute sessionStorage TTL, fallback via `useMatches` filtered by `stageNormalized`.

### Step 2 — Build the component (AGENT-UI)
Two files:
1. `src/components/Bracket.jsx`
2. `src/components/Bracket.module.css`

### Step 3 — Wire into App.jsx
- Import Bracket
- Add tab entry `{ id: 'bracket', label: 'Bracket' }` between Schedule and Groups
- Add render condition

---

## Data Flow

```
Zafronix /bracket?year=2026
        ↓
api/zafronix/[...path].js (proxy, adds API key, s-maxage=300)
        ↓
src/services/api.js — fetchBracket()
        ↓
src/hooks/useBracket.js — sessionStorage cache 5min, fallback to filtered useMatches
        ↓
src/components/Bracket.jsx — reads data.stages, renders round chips + match cards
```

For LIVE match scores during a match window:
```
useLiveScores (ESPN, polls every 45s)
        ↓
Bracket.jsx overlays live score on matches with status = 'live'
```

---

## Bracket.jsx — Component Spec

**Layout (mobile-first, max 600px):**
- Round chips at top: derived from `Object.keys(data.stages)` in this order:
  `round_of_32` → `round_of_16` → `quarter_final` → `semi_final` → `third_place` → `final`
- Display labels: `R32` `R16` `QF` `SF` `3rd` `Final`
- Default active round: first round that has any match with `status !== 'finished'`, else `final`
- Match cards stacked vertically per round

**Match card visual:**
```
┌───────────────────────────────────────┐
│ 🇫🇷 France             3 – 0          │  ← winner: gold text, bold
│ 🇸🇪 Sweden                            │  ← loser: muted
│ Jun 30 · Gillette Stadium             │
│ [🚨 Upset]  [✅ Done]                 │
└───────────────────────────────────────┘
```

**Team name resolution:**
- When `homeTeam`/`awayTeam` are strings → render them
- When only `homeRef`/`awayRef` present (`"W73"`, `"1A"`) → render as `TBD` with the ref shown small underneath, e.g. `TBD (W73)`

**Flag lookup:**
- Import `TEAM_NAME_MAP` and reuse the flag map used in Groups/Schedule
- If team not in map → render name without flag (no crash)

**Status badges:**
- `🔴 LIVE` — red pill, shown when `status === 'live'`, overlay live score from `useLiveScores`
- `✅ Done` — muted pill when `status === 'finished'`
- `🕐 {kickoff}` — muted pill when `status === 'scheduled'`, formatted local time
- `🚨 Upset` — computed client-side: compare winner rank vs loser rank using power rankings tier (title contenders/strong contenders being upset by mid tier)

**Winner highlight:**
- Winner: `color: var(--gold)`, `font-weight: 600`
- Loser: `color: var(--muted)`
- Live and scheduled: both teams `color: var(--text)`

**Extra time / penalties:**
- Show `(AET)` next to score if `extraTime === true` and no penalties
- Show `(PKs {home}-{away})` if `penalties` object present, e.g. `(PKs 3-4)`

**Reuse existing patterns from Schedule.jsx:**
- Card base: `background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 13px 14px`
- Chip pattern: reuse from Schedule filter chips
- Design tokens: `var(--gold)`, `var(--red)`, `var(--muted)`, `var(--text)`, `var(--card)`, `var(--border)`

**Loading + error + empty states:**
- Loading: skeleton or "Loading bracket…"
- Error: "Bracket data unavailable" + retry note
- Empty (round with no matches): "TBD — pending previous round"

**Rules:**
- CSS Modules only, no inline styles, no Tailwind
- Mobile-first, max width 600px
- No new API calls beyond `useBracket` and `useLiveScores` (already exists)
- Handle null `homeScore`/`awayScore` gracefully
- Handle missing `winner` gracefully (e.g., live or scheduled)

---

## App.jsx Change

```js
import Bracket from './components/Bracket.jsx'

const TABS = [
  { id: 'schedule',    label: 'Schedule' },
  { id: 'bracket',     label: 'Bracket' },   // ← NEW
  { id: 'groups',      label: 'Groups' },
  { id: 'power',       label: 'Power Rankings' },
  { id: 'leaderboard', label: 'Leaderboard' },
  { id: 'storylines',  label: 'Storylines' },
  { id: 'funfacts',    label: 'Fun Facts' },
]

{activeTab === 'bracket' && <Bracket />}
```

---

## Files to Touch (in this order)

1. `api/zafronix/[...path].js` — allowlist + SLOW set
2. `src/services/api.js` — `fetchBracket()`
3. `src/hooks/useBracket.js` — new file
4. `src/components/Bracket.jsx` — new file
5. `src/components/Bracket.module.css` — new file
6. `src/App.jsx` — tab entry + render

**Do NOT touch:**
- Schedule.jsx
- Any other existing hooks
- .env.local
- static.js (no static knockout data — everything from API)

---

## Fallback Strategy

If `/bracket` fails:
1. `useBracket` falls back to filtering `useMatches` by `stageNormalized`
2. Groups matches into stages client-side
3. Shows a small "using fallback data" hint at the top of Bracket tab

If both fail:
- Show "Bracket data unavailable — check back soon" empty state
- Do not crash the tab

---

## Stop Conditions (done = every box green)

- [ ] `bracket` in ALLOWED set of proxy
- [ ] `fetchBracket()` exists and returns data.stages
- [ ] `useBracket` hook works, caches, has fallback path
- [ ] Bracket tab visible in nav between Schedule and Groups
- [ ] All 6 rounds show correct data from API
- [ ] Completed matches show score + winner in gold
- [ ] Live matches show 🔴 LIVE badge and pull live score
- [ ] Upcoming matches show TBD or team name + kickoff time
- [ ] Extra time and penalties render correctly
- [ ] Upset badge appears on notable upsets
- [ ] Mobile-first, max 600px, no horizontal overflow
- [ ] CSS Modules only, no inline styles
- [ ] `bun run build` passes clean
- [ ] Loading and error states handled without crashing

---

## Notable Upsets So Far (for upset-detection logic reference)

- 🚨 Germany → Paraguay (PKs) — R32
- 🚨 Netherlands → Morocco (PKs) — R32
- 🚨 Australia → Egypt (PKs) — R32
- 🚨 Brazil → Norway (Haaland brace) — R16 — biggest shock so far
- 🚨 Canada → Morocco 0-3 — R16

---

## Session Handoff Prompts (see project doc for terminal-friendly versions)

Step order: Wire API → build component → wire tab → verify.
