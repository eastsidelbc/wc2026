# AGENT-CONTENT — wc2026

Read this when updating power rankings, storylines, group verdicts, or schedule notes.

## What You Own
- `src/data/static.js` — the single source of truth for all static content

## What You Never Touch
- Any `.jsx` component files
- Any `.css` files
- Any hook or service files
- Any `api/` serverless files

## What's in static.js

### powerRankings
Array of tier objects. Each tier has a `teams` array with:
- `rank` — number
- `flag` — emoji
- `name` — team name
- `note` — one-liner shown in collapsed state
- `badge` — label shown in badge
- `badgeClass` — `tier1 | tier2 | tier3 | tier4`
- `summary` — full paragraph shown when card is expanded

### groups
Array of group objects (A–L). Each has:
- `letter` — A through L
- `hot` — boolean, adds 🔥 to group preview
- `teams` — array with flag, name, sub (note), verdict (`lock|likely|bubble|out`), label

### schedule
Array of match objects with:
- `date` — display string e.g. "Jun 11 (Thu)"
- `group` — single letter
- `home` / `away` — flag + team name string
- `time` — CST time string
- `hot` — boolean, adds 🔥 to match card

### storylines
Array of story objects with:
- `type` — `default | hot | injury | host`
- `tag` — shown in small caps above title
- `title` — headline
- `body` — paragraph text

## How to Update
- **Power ranking moved up/down**: change `rank` number, reorder in array if needed
- **New storyline**: add object to `storylines` array with type, tag, title, body
- **Group verdict changed**: update `verdict` and `label` for the team
- **Score note**: update `sub` field in groups teams, or `note` in powerRankings
- Always update `docs/CHANGELOG.md` after changes
