# ESPN API — Verified Field Reference

> Last verified: 2026-06-23 via live curl calls.
> No auth required. No official docs — this is reverse-engineered from real responses.
> Endpoint is public but undocumented and could break without notice.

---

## Endpoint

```
GET https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard
  ?limit=200
  &dates=20260611-{YYYYMMDD}
```

- No API key needed
- `dates` param controls date range — we pass from tournament start to today
- `limit=200` gets all matches in range
- Proxied through `/api/espn/live` to fix CORS in production
- Our proxy caches 30s (short — used for live scores)

---

## Top Level

```json
{ "leagues": [...], "events": [...], "provider": {...} }
```

Only `events` is useful. `leagues` has tournament metadata (name, season). `provider` is ESPN branding.

---

## Event

Each item in `events[]`:

| Field | Type | Notes |
|---|---|---|
| `id` | string | ESPN match ID |
| `date` | string | ISO UTC e.g. `"2026-06-11T19:00Z"` |
| `name` | string | `"South Africa at Mexico"` |
| `shortName` | string | `"RSA @ MEX"` |
| `season.slug` | string | `"group-stage"` |
| `status` | object | see status shape below |
| `venue.displayName` | string | stadium name |
| `competitions[]` | array | always 1 item — the actual match data |

### Status shape

| Field | Notes |
|---|---|
| `status.clock` | float seconds elapsed |
| `status.displayClock` | `"9'"`, `"90'+8'"`, `"HT"` |
| `status.period` | 1 or 2 |
| `status.type.state` | `"pre"`, `"in"`, `"post"` |
| `status.type.completed` | bool |
| `status.type.description` | `"Full Time"`, `"Half Time"`, `"Scheduled"`, `"In Progress"` |
| `status.type.detail` | `"FT"`, `"HT"`, `"45'"` |
| `status.type.shortDetail` | same as detail usually |

---

## Competition (competitions[0])

| Field | Type | Always? | Notes |
|---|---|---|---|
| `attendance` | int | ❌ | 0 or absent for future matches |
| `venue.fullName` | string | ✅ | real stadium name |
| `venue.address.city` | string | ✅ | |
| `venue.address.country` | string | ✅ | |
| `altGameNote` | string | ✅ | `"FIFA World Cup, Group A"` |
| `broadcast` | string | ❌ | often empty string |
| `geoBroadcasts[]` | array | ❌ | TV networks by region — see below |
| `playByPlayAvailable` | bool | ✅ | true on completed matches |
| `wasSuspended` | bool | ✅ | |
| `competitors[]` | array | ✅ | always 2 — home first, away second |
| `details[]` | array | ❌ | match events timeline (goals, cards) — only on completed matches |
| `headlines[]` | array | ❌ | recap sentence — only on completed matches |
| `odds[]` | array | ❌ | always null in our responses — not available |

### geoBroadcasts shape

```json
{
  "type": { "shortName": "TV" },
  "market": { "type": "National" },
  "media": { "shortName": "FS1" },
  "lang": "en",
  "region": "us"
}
```

Multiple entries for different regions/languages. Filter by `lang: "en"` and `region: "us"` to get US broadcast.

---

## Competitors

Each team in `competitors[]`:

| Field | Type | Always? | Notes |
|---|---|---|---|
| `homeAway` | string | ✅ | `"home"` or `"away"` |
| `winner` | bool | ❌ | only on completed matches |
| `advance` | bool | ❌ | true if team advanced from group |
| `score` | string | ✅ | `"2"` or `"0"` — string not int |
| `form` | string | ✅ | last 5 results e.g. `"WWWWW"`, `"DLWDL"` — W/D/L chars |
| `records[0].summary` | string | ✅ | tournament record e.g. `"1-0-0"` (W-D-L) |
| `team.displayName` | string | ✅ | `"United States"` (NOT "USA" — differs from Zafronix) |
| `team.abbreviation` | string | ✅ | `"USA"`, `"MEX"` |
| `team.color` | string | ✅ | hex without # e.g. `"006847"` |
| `team.alternateColor` | string | ✅ | hex without # |
| `team.logo` | string | ✅ | ESPN CDN URL e.g. `"https://a.espncdn.com/i/teamlogos/countries/500/mex.png"` |
| `statistics[]` | array | ❌ | team stats — see below |

### Team Statistics (per competitor)

| `name` | `abbreviation` | Notes |
|---|---|---|
| `possessionPct` | `PP` | float string e.g. `"60.5"` |
| `totalShots` | `SHOT` | |
| `shotsOnTarget` | `SOG` | |
| `totalGoals` | `G` | |
| `goalAssists` | `A` | |
| `foulsCommitted` | `FC` | |
| `wonCorners` | `CW` | |
| `shotAssists` | `SHAST` | |

> All values are **strings** not ints — parse with `parseFloat()`/`parseInt()`.

---

## Details (match event timeline)

`details[]` — only present on completed matches.

| Field | Type | Always? | Notes |
|---|---|---|---|
| `type.text` | string | ✅ | see goal types below |
| `clock.displayValue` | string | ✅ | `"9'"`, `"90'+3'"` |
| `clock.value` | float | ✅ | seconds from kickoff |
| `team.id` | string | ✅ | ESPN team ID — match against competitor `id` |
| `scoreValue` | int | ✅ | 1 for goals, 0 for cards |
| `scoringPlay` | bool | ✅ | true only for goals |
| `redCard` | bool | ✅ | |
| `yellowCard` | bool | ✅ | |
| `penaltyKick` | bool | ✅ | |
| `ownGoal` | bool | ✅ | |
| `shootout` | bool | ✅ | penalty shootout goal |
| `athletesInvolved[]` | array | ✅ | always 1 athlete per event — **no assists yet in 2026 data** |

### Goal type values (all verified from real 2026 data)

| `type.text` | Meaning |
|---|---|
| `"Goal"` | Regular goal |
| `"Goal - Header"` | Headed goal |
| `"Goal - Volley"` | Volley |
| `"Goal - Free-kick"` | Direct free kick |
| `"Penalty - Scored"` | Penalty |
| `"Own Goal"` | Own goal |
| `"Yellow Card"` | Yellow card |
| `"Red Card"` | Red card (includes second yellows) |

### Athlete shape (in athletesInvolved[])

| Field | Type | Always? | Notes |
|---|---|---|---|
| `id` | string | ✅ | ESPN player ID |
| `displayName` | string | ✅ | `"Julián Quiñones"` |
| `shortName` | string | ✅ | `"J. Quiñones"` |
| `fullName` | string | ✅ | same as displayName |
| `jersey` | string | ✅ | jersey number as string |
| `position` | string | ✅ | `"LM"`, `"CM-R"`, `"GK"` |
| `team.id` | string | ✅ | ESPN team ID |
| `headshot` | string | ❌ | ESPN CDN URL — **only ~12% of players have one** |
| `links[0].href` | string | ✅ | ESPN player page URL |

---

## Headlines

`headlines[]` — only on completed matches, usually 1 item:

| Field | Notes |
|---|---|
| `description` | Full recap sentence e.g. `"Mexico's misery in World Cup opening games was finally ended as they secured a 2-0 win over South Africa..."` |
| `type` | `"Recap"` |
| `shortLinkText` | Short headline e.g. `"Mexico kick off WC with win over SA ft. 3 red cards"` |

---

## What We Currently Use

| Data | Field path | Used in |
|---|---|---|
| Match headline | `headlines[0].description` | Schedule accordion |
| Goal scorers (leaderboard) | `details[].scoringPlay + athletesInvolved[0]` | Leaderboard |
| Cards (leaderboard) | `details[].yellowCard / redCard + athletesInvolved[0]` | Leaderboard |
| Live score | `competitors[].score` | Live score bar |

---

## What We're NOT Using (but could)

| Data | Field | Value |
|---|---|---|
| Goal type | `details[].type.text` | "Header", "Volley", "Free-kick", "Penalty" |
| TV broadcast | `geoBroadcasts[].media.shortName` | "FS1", "Telemundo" |
| Team colors | `competitors[].team.color` | hex string |
| Team logo (ESPN CDN) | `competitors[].team.logo` | PNG URL |
| Player headshot | `athletesInvolved[].headshot` | PNG URL (12% coverage) |
| Team form | `competitors[].form` | "WWWWW" |
| Tournament record | `competitors[].records[0].summary` | "2-0-0" |
| Short headline | `headlines[0].shortLinkText` | 1-line summary |
| Possession % | `statistics[possessionPct].displayValue` | "60.5" |
| xG / shots on goal | `statistics[shotsOnTarget]` | per team |

---

## Naming Differences vs Zafronix

| Zafronix `homeTeam` | ESPN `team.displayName` |
|---|---|
| `"USA"` | `"United States"` |
| `"Korea Republic"` | `"South Korea"` |
| `"Türkiye"` | `"Turkey"` (or `"Türkiye"` — verify) |
| `"IR Iran"` | `"Iran"` |

This mismatch is why `ESPN_NAME_MAP` exists in `Schedule.jsx`.
