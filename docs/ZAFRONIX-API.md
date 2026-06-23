# Zafronix API — Verified Field Reference

> Last verified: 2026-06-23 via live curl calls against real API responses.
> Re-verify: `source .env.local && curl -s "https://api.zafronix.com/fifa/worldcup/v1/me/usage" -H "X-API-Key: $ZAFRONIX_API_KEY"`
> Re-scrape docs: `WebFetch https://api.zafronix.com/docs`

---

## Account Status (as of 2026-06-23)

- **Tier:** Free
- **Quota:** 250 req/day
- **Used today:** 22 / 250
- **30-day total:** 123 requests
- **Key prefix:** `zwc_free_` (read-only — no POST/PATCH/DELETE)
- **Peak day:** 58 req on June 18

---

## Base Config

- **Base URL:** `https://api.zafronix.com/fifa/worldcup/v1`
- **Auth:** `X-API-Key` header (server-side only — never expose in frontend)
- **Format:** JSON always
- **Same key works on:** `/fifa/womens-worldcup/v1`, `/uefa/euro/v1`, `/uefa/champions-league/v1`

---

## Rate Limit Headers (every response)

| Header | Meaning |
|---|---|
| `X-RateLimit-Limit` | 250 |
| `X-RateLimit-Remaining` | Requests left today |
| `X-RateLimit-Reset` | Epoch seconds when window resets |

- 429 on overage → check `Retry-After` header
- **304 responses (ETag hits) do NOT count against 250/day** — biggest free-tier optimization available, not yet implemented

---

## Cache Defaults (server-side CDN)

| Endpoint | max-age |
|---|---|
| `/tournaments`, `/teams`, `/stadiums`, `/trivia` | 3600s (1 hour) |
| Most endpoints incl. `/matches` | 60s |
| `/matches/live` | 10s (Pro+ only anyway) |

---

## Endpoint Map — What Works, What Doesn't

| Endpoint | Status | Notes |
|---|---|---|
| `GET /matches?year=2026` | ✅ Works | Returns all 104 matches |
| `GET /matches/{id}` | ✅ Works | Single match — much richer data |
| `GET /matches/{id}?denormalize=true` | ✅ Works | Inlines full stadiumDetails object |
| `GET /standings?year=2026` | ✅ Works | All groups, fully computed |
| `GET /bracket?year=2026` | ✅ Works | Full knockout tree |
| `GET /teams/{name}/roster?year=2026` | ✅ Works | Squad list |
| `GET /stadiums?tournament=2026` | ✅ Works | All 16 venues |
| `GET /trivia?year=2026` | ✅ Works | Curated facts |
| `GET /on-this-day` | ✅ Works | Today's historical matches |
| `GET /me/usage` | ✅ Works | Our quota status |
| `GET /search?q=…` | ✅ Works | Cross-entity search |
| `GET /players?q=…` | ✅ Works | Player substring search |
| `GET /scorers?year=2026` | ❌ **404 — does not exist** | Docs mention it but it's dead. Use goals[] from /matches instead. Remove from our proxy ALLOWED list. |
| `GET /matches/live` | ❌ Pro+ only | We use ESPN instead |
| `GET /matches/stream` | ❌ Pro+ only | SSE stream |
| POST/PATCH/DELETE | ❌ Write key required | Invite-only, we don't have one |

---

## `/matches?year=2026` — List Response

**Top level:** `{ year, count, data[] }`

**Each match in data[]:** (verified from 104 real matches)

| Field | Type | Always? | Example |
|---|---|---|---|
| `id` | string | ✅ | `"2026-001"` |
| `matchNo` | int | ✅ | `1` |
| `date` | string | ✅ | `"2026-06-11"` |
| `kickoff` | string | ✅ | `"13:00"` (local time) |
| `kickoffUtc` | string | ✅ | `"2026-06-11T19:00:00.000Z"` |
| `stage` | string | ✅ | `"group_a"`, `"r32"`, `"r16"`, `"qf"`, `"sf"`, `"thirdPlace"`, `"final"` |
| `stageNormalized` | string | ✅ | `"group_a"`, `"round_of_32"`, `"round_of_16"`, `"quarter_final"`, `"semi_final"`, `"third_place"`, `"final"` |
| `homeTeam` | string | ✅ | `"USA"`, `"Korea Republic"`, `"Türkiye"` |
| `awayTeam` | string | ✅ | same naming |
| `homeScore` | int\|null | ✅ | null if not played |
| `awayScore` | int\|null | ✅ | null if not played |
| `result` | string\|null | ✅ | `"2-0"` or null |
| `extraTime` | bool\|null | ✅ | false for group games |
| `penalties` | null | ✅ | null until knockout rounds |
| `stadium` | string | ✅ | FIFA sponsor name e.g. `"Mexico City Stadium"` |
| `stadiumId` | string | ✅ | kebab slug e.g. `"estadio-azteca"` |
| `city` | string | ✅ | `"Ciudad de México"` |
| `country` | string | ✅ | `"Mexico"` |
| `attendance` | int\|null | ✅ | null for future matches |
| `referee` | object\|null | ✅ | `{ name, country }` or null |
| `status` | string | ✅ | `"finished"`, `"live"`, `"scheduled"`, `"postponed"` |
| `homeRef` | string | ✅ | real name when played, placeholder like `"1A"` or `"W73"` when not |
| `awayRef` | string | ✅ | same |
| `goals[]` | array | ❌ | only on completed matches — see goals shape below |
| `cards[]` | array | ❌ | only on completed matches — see cards shape below |
| `weather` | object | ❌ | ~85% coverage — see weather shape below |
| `fairPlay` | object | ❌ | `{ home: -5, away: -10 }` — computed from cards |

> **Note:** `lineups`, `substitutions`, `statistics`, `formations`, `managers` are **NOT in the list endpoint**. You must call `/matches/{id}` individually to get those.

### Goals shape (verified)

| Field | Type | Always? | Notes |
|---|---|---|---|
| `minute` | int | ✅ | |
| `scorer` | string | ✅ | Only field name — `player`/`playerName` do NOT exist |
| `team` | string | ✅ | `"home"` or `"away"` — never the team name |
| `type` | string | ❌ | `"penalty"` or `"own_goal"` only — omitted for regular goals |
| `addedMinute` | int | ❌ | Stoppage time only — e.g. `minute: 90, addedMinute: 4` → display as `90+4'` |
| `bodyPart` | — | ❌ | In docs, not in real 2026 data |
| `assist` | — | ❌ | In docs, not in real 2026 data |
| `note` | — | ❌ | In docs, not in real 2026 data |

### Cards shape (verified)

| Field | Type | Always? | Notes |
|---|---|---|---|
| `minute` | int | ✅ | |
| `addedMinute` | int | ❌ | Stoppage time only |
| `team` | string | ✅ | `"home"` or `"away"` |
| `player` | string | ✅ | player name |
| `color` | string | ✅ | `"yellow"` or `"red"` |

> No `"second_yellow"` type — a second yellow just becomes `"red"` in the data.

### Weather shape (verified)

| Field | Type | Notes |
|---|---|---|
| `tempC` | float | Celsius |
| `humidityPct` | int | 0–100 |
| `precipitationMm` | float | |
| `windKmh` | float | |
| `code` | int | WMO weather code (53 = drizzle, etc.) |

---

## `/matches/{id}` — Single Match (denormalize=true)

Everything from the list endpoint PLUS:

### Lineups

```
lineups.home[] and lineups.away[]
```

| Field | Type | Always? | Notes |
|---|---|---|---|
| `player` | string | ✅ | |
| `number` | int | ✅ | jersey number |
| `position` | string | ✅ | `"GK"`, `"CB"`, `"RB"`, `"LB"`, `"DM"`, `"CM"`, `"RM"`, `"LM"`, `"RF"`, `"LF"`, `"CF"`, `"RWB"`, `"LWB"` |
| `starter` | bool | ✅ | false = bench |
| `captain` | bool | ❌ | only on the captain |

### Formations, Managers

| Field | Type | Example |
|---|---|---|
| `formations.home` | string | `"4-3-3"` |
| `formations.away` | string | `"5-3-2"` |
| `managers.home` | string | `"Javier Aguirre"` |
| `managers.away` | string | `"Hugo Broos"` |

### Substitutions

```
substitutions[]
```

| Field | Type | Always? |
|---|---|---|
| `minute` | int | ✅ |
| `team` | string | ✅ `"home"` or `"away"` |
| `on` | string | ✅ player coming on |
| `off` | string | ✅ player going off |

### Match Statistics

```
statistics.home and statistics.away
```

| Field | Type | Notes |
|---|---|---|
| `possessionPct` | int | |
| `shotsTotal` | int | |
| `shotsOnGoal` | int | |
| `shotsOffGoal` | int | |
| `shotsBlocked` | int | |
| `shotsInsideBox` | int | |
| `shotsOutsideBox` | int | |
| `corners` | int | |
| `offsides` | int | |
| `fouls` | int | |
| `yellowCards` | int | |
| `redCards` | int | |
| `goalkeeperSaves` | int | |
| `passesTotal` | int | |
| `passesAccurate` | int | |
| `passesPct` | int | |
| `expectedGoals` | float | xG |

### Stadium Details (with denormalize=true)

Full stadium object inlined as `stadiumDetails`:

| Field | Type | Notes |
|---|---|---|
| `id` | string | kebab slug |
| `name` | string | real name e.g. `"Estadio Azteca"` |
| `city` | string | |
| `country` | string | |
| `iso` | string | ISO-3166-1 alpha-2 e.g. `"mx"` |
| `coords.lat` | float | |
| `coords.long` | float | |
| `capacity` | int | |
| `opened` | int | year |
| `demolished` | int\|null | |
| `tournaments` | int[] | WC years hosted e.g. `[1970, 1986, 2026]` |
| `isOpenAir` | bool | |
| `notes` | string | editorial note |
| `fifaNames` | object | year-keyed sponsor name e.g. `{"2026": "Mexico City Stadium"}` |
| `elevationM` | int | meters above sea level |

---

## `/standings?year=2026`

**Top level:** `{ year, groups: { A: [], B: [], … L: [] } }`

**Each team entry (verified):**

| Field | Type | Notes |
|---|---|---|
| `team` | string | team name |
| `played` | int | |
| `won` | int | |
| `drawn` | int | |
| `lost` | int | |
| `goalsFor` | int | |
| `goalsAgainst` | int | |
| `goalDifference` | int | |
| `points` | int | |
| `fairPlay` | int | negative number; yellow −1, indirect red −3, direct red −4 |
| `position` | int | 1–4 within group |
| `advanced` | bool | ❌ only present when true — absence means eliminated or not yet determined |

> FIFA tiebreaker order: points → GD → GF → head-to-head → fair play → drawing of lots.

**What you CAN build:** group tables, advancement indicators, best-3rd-place tracking.  
**What you CANNOT build:** individual match-by-match form (use /matches for that).

---

## `/bracket?year=2026`

**Top level:** `{ year, stages: { round_of_32: [], round_of_16: [], quarter_final: [], semi_final: [], third_place: [], final: [] } }`

**Each bracket entry (verified):**

| Field | Type | Notes |
|---|---|---|
| `matchId` | string | e.g. `"2026-073"` |
| `matchNo` | int | |
| `stage` | string | canonical stage name |
| `stageRaw` | string | legacy stage name e.g. `"r32"` |
| `homeRef` | string | resolved team name OR placeholder e.g. `"1A"`, `"W73"`, `"3ABCDF"` |
| `awayRef` | string | same |
| `home` | string | resolved team name once known, else placeholder |
| `away` | string | same |
| `kickoffUtc` | string | ISO timestamp |
| `stadium` | string | FIFA sponsor name |
| `city` | string | |
| `homeScore` | int\|null | null until played |
| `awayScore` | int\|null | null until played |
| `winner` | string\|null | null until played |
| `loser` | string\|null | null until played |

**Placeholder keys:**
- `"1A"` = Group A winner
- `"2B"` = Group B runner-up
- `"W73"` = Winner of match 73
- `"3ABCDF"` = Best 3rd-place from groups A, B, C, D, F

**What you CAN build:** full knockout bracket UI with advancement arrows.  
**What you CANNOT build:** penalty shootout detail (need /matches/{id} for that).

---

## `/teams/{name}/roster?year=2026`

Returns array directly (no wrapper object).

**Each player (verified — all real fields for USA 2026):**

| Field | Type | Always? | Notes |
|---|---|---|---|
| `jersey` | int | ✅ | |
| `name` | string | ✅ | |
| `position` | string | ✅ | `"GK"`, `"DF"`, `"MF"`, `"FW"` |
| `born` | string | ✅ | `"YYYY-MM-DD"` |
| `ageAtTournament` | int | ✅ | |
| `club.name` | string | ✅ | |
| `club.country` | string | ✅ | |
| `goals` | int | ✅ | tournament goals |
| `captain` | bool | ✅ | |
| `yellowCards` | int | ❌ | only present when > 0 |

**Docs claim these exist but NOT in real 2026 responses:**
- `heightCm`, `weightKg`, `dominantFoot`, `caps`, `nationalGoals`, `birthCountry`, `goalBreakdown`

**What you CAN build:** squad list, captain flag, position grouping (GK/DF/MF/FW), club country stats, bookings tracker.  
**What you CANNOT build:** physical stats display, dominant foot, international caps.

---

## `/stadiums?tournament=2026`

**Top level:** `{ count: 16, data[] }`

**Each stadium (verified — same shape as `stadiumDetails` in match response):**

| Field | Type | Always? | Notes |
|---|---|---|---|
| `id` | string | ✅ | kebab slug |
| `name` | string | ✅ | real name e.g. `"MetLife Stadium"` |
| `city` | string | ✅ | |
| `country` | string | ✅ | |
| `iso` | string | ✅ | ISO-3166-1 alpha-2 |
| `coords.lat` | float | ✅ | |
| `coords.long` | float | ✅ | |
| `capacity` | int | ✅ | |
| `opened` | int | ✅ | year |
| `demolished` | int\|null | ✅ | |
| `tournaments` | int[] | ✅ | all WC years hosted |
| `isOpenAir` | bool | ✅ | |
| `notes` | string | ✅ | editorial note |
| `fifaNames` | object | ✅ | `{ "2026": "sponsor name" }` |
| `elevationM` | int | ✅ | meters above sea level |

**What you CAN build:** venue page, capacity comparison, elevation context (Azteca at 2287m), indoor/outdoor indicator, historical WC hosting info.

---

## `/scorers?year=2026` — DEAD ENDPOINT

**Returns 404.** This endpoint does not exist despite being in the docs.

**Alternative:** Build scorers from `goals[]` on the `/matches` response. Filter `type !== 'own_goal'`, group by `scorer`, count. That's what `fetchZafronixGoals()` in `api.js` already does. Remove `scorers` from the proxy ALLOWED list.

---

## Team Name Conventions

Zafronix uses these names — they differ from common display names in some cases:

| Zafronix name | Common name |
|---|---|
| `"USA"` | United States |
| `"Korea Republic"` | South Korea |
| `"Türkiye"` | Turkey |
| `"IR Iran"` | Iran |
| `"Congo DR"` | DR Congo |
| `"Cabo Verde"` | Cape Verde |
| `"Bosnia and Herzegovina"` | Bosnia |

ESPN uses different names again (e.g. `"United States"` for USA) — handled in `ESPN_NAME_MAP` in `Schedule.jsx`.

---

## What We Could Build (Not Yet Built)

| Feature | Endpoint | Key Fields | Cost |
|---|---|---|---|
| Full lineup card per match | `/matches/{id}` | `lineups`, `formations`, `managers` | 1 req per match |
| Match stats (possession, xG, shots) | `/matches/{id}` | `statistics` | 1 req per match |
| Substitutions timeline | `/matches/{id}` | `substitutions[]` | 1 req per match |
| Bracket / knockout tree | `/bracket?year=2026` | all bracket fields | 1 req total |
| Venue explorer | `/stadiums?tournament=2026` | all stadium fields | 1 req total |
| Weather per match | `/matches?year=2026` or `/matches/{id}` | `weather` | already fetched |
| Cards/discipline table | `/matches?year=2026` | `cards[]`, `fairPlay` | already fetched |
| Referee info | `/matches?year=2026` | `referee.name`, `referee.country` | already fetched |
| Historical WC data (any year) | `/matches?year=YYYY` | same shape | 1 req per year |
| Player career search | `/players/{name}` | career across all WCs | 1 req per player |
| Squads for all teams | `/teams/{name}/roster?year=2026` | all roster fields | 1 req per team (32 teams = 32 req) |

---

## ETag Caching (Not Yet Implemented — Free Req Saver)

Every response includes an `ETag` header (16-char SHA-256 hash).  
On subsequent requests, send `If-None-Match: <etag>` → get 304 if unchanged → **free, no quota cost**.

Worth implementing in `useMatches` and `useStandings` hooks since those are our highest-traffic endpoints.
