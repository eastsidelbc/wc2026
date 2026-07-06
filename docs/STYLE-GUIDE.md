# UI Style Guide — wc2026 Design System

This document captures every design decision in this app so you can replicate the exact look and feel in any other project.

---

## Design Philosophy

- **Dark, premium, sports-app feel** — like ESPN or a high-end fantasy sports app
- **Mobile-first, max 600px** — everything is designed for a phone screen
- **No images or illustrations** — flag emojis do all the visual heavy lifting
- **Gold as the hero color** — used for active states, rankings, and anything important
- **Information density** — small text, tight spacing, lots of data without feeling cluttered

---

## Color Palette

Paste this into your `:root {}` in your global CSS file. These are the only colors used across the entire app.

```css
:root {
  --bg:      #0a0e1a;   /* Page background — near black with a blue tint */
  --surface: #111827;   /* Slightly lighter surface, used for strips/bars */
  --card:    #1a2235;   /* Card background — blue-dark grey */
  --border:  #2a3450;   /* All borders and dividers */
  --gold:    #f5c842;   /* Primary accent — active states, rankings, headings */
  --green:   #22c55e;   /* Success, wins, advancing */
  --red:     #ef4444;   /* Errors, losses, live indicator, red cards */
  --blue:    #3b82f6;   /* Info, scores, links */
  --muted:   #6b7280;   /* Tertiary text, placeholders, disabled */
  --text:    #f1f5f9;   /* Primary text — off-white */
  --subtext: #94a3b8;   /* Secondary text — blue-grey */
  --fire:    #ff6b35;   /* Hot/featured content accent — orange */
}
```

### How the colors layer

```
Page bg (#0a0e1a) → Surface (#111827) → Card (#1a2235) → Border (#2a3450)
```
Each layer is slightly lighter. Never use pure black or pure white.

### Semantic color usage

| Color | Use it for |
|---|---|
| `--gold` | Active tab, #1 rank, advancing teams, key labels, left-border accents |
| `--green` | Win results, qualifying status, form dot W |
| `--red` | Live indicator, errors, loss results, red cards, Live Buzz border |
| `--blue` | Scores, info banners, trivia labels |
| `--fire` | Hot/featured matches, fire emoji accent |
| `--muted` | Metadata, arrows, rank numbers (non-top), venue text |
| `--subtext` | Body text in cards, secondary info |
| `--text` | Headlines, team names, primary content |

---

## Typography

```css
font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
font-size: 15px; /* base */
```

No Google Fonts, no custom fonts. System fonts only — loads instantly.

### Type scale used in the app

| Size | Weight | Use |
|---|---|---|
| `10px` + `letter-spacing: 2px` + `text-transform: uppercase` | 700 | Section labels, category tags, column headers |
| `11px` | 500–700 | Metadata, venue, timestamps, badges, sub-labels |
| `12px` | 600 | Chips/filter buttons, info bar text, odds values |
| `13px` | 400–600 | Body text in cards, player names, match recaps |
| `14px` | 600 | Primary row content (team names, player names) |
| `15px` | 700 | Card titles (storylines, rankings) |
| `18px` | 900 | Rank numbers, group letters |
| `20px` | 800 | App title |
| `22px` | 900 | Large rank numbers |
| `26–28px` | — | Flag emojis, trophy icon |

### Typography rules

- **Headings are never `<h2>` styled** — use small-caps section labels instead (`10px`, `700`, `letter-spacing: 2px`, `uppercase`, `color: var(--gold)`)
- **Numbers use tabular numerals**: `font-variant-numeric: tabular-nums` on any score, stat, or ranking so digits don't shift width
- **Tight letter-spacing on titles**: `letter-spacing: -0.3px` on the main app title to make bold text look more premium
- **Line height**: Body text uses `line-height: 1.55–1.6`. Titles use `line-height: 1.1–1.3`

---

## Global Resets

```css
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  -webkit-tap-highlight-color: transparent; /* removes blue flash on mobile tap */
}

button {
  font-family: inherit;
  cursor: pointer;
  border: none;
  background: none;
}

a {
  color: inherit;
  text-decoration: none;
}
```

### Scrollbar styling
```css
::-webkit-scrollbar { width: 4px; height: 4px; }
::-webkit-scrollbar-track { background: var(--bg); }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
```
Makes scrollbars thin and dark — matches the overall aesthetic.

---

## Layout

```css
/* Page wrapper */
.app {
  min-height: 100vh;
  background: var(--bg);
}

/* Content area */
.main {
  padding: 16px;
  max-width: 600px;
  margin: 0 auto;
  padding-bottom: 40px; /* breathing room above the bottom */
}
```

**Rule:** Everything is centered, max 600px. On desktop it looks like a phone app in the center of the screen. This is intentional — it's a mobile-first dashboard.

---

## Header / Sticky Nav

```css
.header {
  background: linear-gradient(135deg, #0a0e1a 0%, #1a0a2e 100%);
  padding: 20px 16px 16px;
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 100;
}
```

The header uses a subtle **diagonal gradient** from dark blue-black to dark purple-black. This gives depth without being flashy. It's sticky so tabs are always accessible.

### Tab navigation buttons

```css
.navBtn {
  flex-shrink: 0;
  background: var(--card);
  border: 1px solid var(--border);
  color: var(--subtext);
  padding: 7px 14px;
  border-radius: 20px;       /* pill shape */
  font-size: 13px;
  font-weight: 600;
  transition: all 0.15s;
  white-space: nowrap;
}

/* Active tab */
.navBtn.active {
  background: var(--gold);
  color: #0a0e1a;            /* dark text on gold — high contrast */
  border-color: var(--gold);
}
```

Active tab fills solid gold with dark text. Inactive tabs are dark cards with muted text.

### LIVE badge

```css
.liveBadge {
  background: var(--red);
  color: white;
  font-size: 10px;
  font-weight: 700;
  padding: 3px 7px;
  border-radius: 4px;
  letter-spacing: 1px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.6; }
}
```

---

## Cards

Cards are the core building block. All cards share the same base:

```css
.card {
  background: var(--card);       /* #1a2235 */
  border: 1px solid var(--border); /* #2a3450 */
  border-radius: 12px;
  padding: 13px 14px;
  margin-bottom: 8px;
}
```

**Border radius rule:** Cards use `12px`. Inner elements (badges, chips) use `5–10px`. Buttons use `16–20px` (pill). Small pills use `3–5px`.

### Card variants

**Accent left-border card** (Storylines / editorial):
```css
.card {
  border-left: 3px solid var(--gold);
  border-radius: 0 12px 12px 0; /* flat on left where border is */
}
.card.hot    { border-left-color: var(--fire); }
.card.urgent { border-left-color: var(--red); }
.card.info   { border-left-color: var(--blue); }
```

**Clickable card** (match accordion, rankings):
```css
.card { cursor: pointer; transition: border-color 0.15s; }
.card:active { opacity: 0.85; }
.card.open { border-color: rgba(245,200,66,0.25); } /* gold glow when open */
```

**Highlighted row** (advancing team, top position):
```css
.row.advanced { background: rgba(245,200,66,0.04); } /* very subtle gold tint */
```

---

## Badges & Pills

Small inline labels used everywhere to classify content.

### Verdict / status badge
```css
.badge {
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 5px;
  flex-shrink: 0;
}

/* Color variants */
.gold   { background: rgba(245,200,66,0.15); color: var(--gold); }
.blue   { background: rgba(59,130,246,0.12); color: #60a5fa; }
.green  { background: rgba(34,197,94,0.12);  color: #4ade80; }
.muted  { background: rgba(107,114,128,0.1); color: var(--muted); }
.red    { background: rgba(239,68,68,0.12);  color: #fca5a5; }
```

**Pattern:** Every badge uses `rgba(color, 0.12–0.15)` for the background and the lighter shade of the same color for text. Never full opacity backgrounds.

### Position position badge (group standings)
```css
.posAdvancing {
  color: var(--gold);
  background: rgba(245,200,66,0.1);
  border: 1px solid rgba(245,200,66,0.3);
  font-size: 10px;
  font-weight: 700;
  border-radius: 3px;
  padding: 0 4px;
}
.posFading {
  color: var(--muted);
  background: rgba(255,255,255,0.04);
  border: 1px solid var(--border);
  opacity: 0.5;
}
```

### Position-specific role badges (GK, DEF, MID, FWD)
```css
.gk  { background: rgba(245,200,66,0.12); color: var(--gold); }
.def { background: rgba(59,130,246,0.12); color: #60a5fa; }
.mid { background: rgba(34,197,94,0.12);  color: #4ade80; }
.fwd { background: rgba(239,68,68,0.12);  color: #fca5a5; }
```

---

## Filter Chips (horizontal scroll row)

Used for tab-within-tab filtering (Schedule, Leaderboard, Storylines).

```css
.chips {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  scrollbar-width: none;
  margin-bottom: 14px;
}
.chips::-webkit-scrollbar { display: none; }

.chip {
  flex-shrink: 0;
  background: var(--card);
  border: 1px solid var(--border);
  color: var(--subtext);
  padding: 5px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 600;
  transition: all 0.15s;
}

.chip.active {
  background: rgba(245,200,66,0.1);
  border-color: var(--gold);
  color: var(--gold);
}
```

Active chip gets a **transparent gold tint** (not solid gold — that's reserved for the main nav). The inactive chips are dark cards with muted text.

---

## Info / Disclaimer Banner

Blue info box used for context-setting messages.

```css
.infoBar {
  background: rgba(59,130,246,0.08);
  border: 1px solid rgba(59,130,246,0.2);
  border-radius: 8–10px;
  padding: 8–10px 12–13px;
  font-size: 11–12px;
  color: #93c5fd;             /* light blue text */
  margin-bottom: 12–16px;
  line-height: 1.5;
}
```

---

## Scores

### Live score (in-progress match)
```css
.liveScore {
  background: rgba(239,68,68,0.15);
  color: #fca5a5;
  font-size: 12px;
  font-weight: 800;
  padding: 2px 7px;
  border-radius: 5px;
  font-variant-numeric: tabular-nums;
}
```

### Final score (completed match)
```css
.finalScore {
  background: rgba(59,130,246,0.12);
  color: #93c5fd;
  font-size: 12px;
  font-weight: 800;
  padding: 2px 7px;
  border-radius: 5px;
  font-variant-numeric: tabular-nums;
}
```

Red = live/hot. Blue = final/done.

---

## Accordion (expand/collapse)

Used for match recaps and rankings detail.

```css
/* Arrow indicator */
.arrow {
  color: var(--muted);
  font-size: 11px;
  flex-shrink: 0;
  transition: transform 0.2s;
}
.card.open .arrow { transform: rotate(180deg); }

/* Expanding panel */
.expand {
  max-height: 0;
  overflow: hidden;
  opacity: 0;
  transition: max-height 0.28s ease, opacity 0.2s ease;
}
.card.open .expand {
  max-height: 400px;
  opacity: 1;
}

/* Content inside panel */
.expandInner {
  border-top: 1px solid var(--border);
  padding: 10px 0 2px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
```

**Rule:** `max-height` animation, not `height`. Set `max-height` high enough that content is never clipped (typically 300–400px for cards, 600px for big panels).

---

## Spinner / Loading State

```css
.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid var(--border);
  border-top-color: var(--gold);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 40–50px 0;
  color: var(--muted);
  font-size: 14px;
}
```

---

## Error State

```css
.errorState {
  background: rgba(239,68,68,0.08);
  border: 1px solid rgba(239,68,68,0.2);
  border-radius: 10px;
  padding: 14px;
  font-size: 13px;
  color: #fca5a5;   /* light red text */
  line-height: 1.5;
}
```

---

## Section Label (used before every section)

```css
.sectionLabel {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--gold);
  margin-bottom: 12px;
  padding-left: 2px;
}
```

This is the app's main visual rhythm marker. Every major section starts with one. Always gold, always uppercase, always small.

---

## Horizontal Divider with Text

Used in Power Rankings tier separators:

```css
.tierHeader {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.tierLine {
  flex: 1;
  height: 1px;
  background: var(--border);
}
.tierTitle {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--subtext);
  white-space: nowrap;
}
```

Pattern: line — text — line. Both lines use `flex: 1` so they fill equally.

---

## Row Layout Pattern

Used for every data row (players, standings, matches):

```css
.row {
  display: flex;
  align-items: center;
  gap: 10–12px;
  padding: 10–11px 14px;
  border-bottom: 1px solid var(--border);
}
.row:last-child { border-bottom: none; }

/* Inside a row: */
.rankNum   { width: 24–28px; text-align: right; flex-shrink: 0; }
.flag      { font-size: 20–26px; flex-shrink: 0; }
.info      { flex: 1; min-width: 0; } /* flex:1 fills remaining space */
.badge     { flex-shrink: 0; }        /* shrink: 0 so it never collapses */
```

**Rule:** One item gets `flex: 1` (fills all remaining space). Everything else is `flex-shrink: 0` (never shrinks). Use `min-width: 0` on the flex:1 item so text truncation with `overflow: hidden` works.

---

## Odds / Horizontal Scroll Strip

```css
.strip {
  background: var(--surface);   /* slightly lighter than card */
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 12px 14px;
  margin-bottom: 14px;
  display: flex;
  gap: 12px;
  overflow-x: auto;
  scrollbar-width: none;
}
.strip::-webkit-scrollbar { display: none; }
```

Used for any horizontally scrollable content strip. `--surface` instead of `--card` makes it slightly recessed vs cards.

---

## Quote / Headline Style

Used for match recaps and editorial pullquotes:

```css
.quote {
  font-size: 12px;
  font-style: italic;
  color: var(--subtext);
  line-height: 1.5;
  border-left: 2px solid var(--gold);
  padding-left: 8px;
}
```

Gold left border + italic text = instantly recognizable quote style.

### Big decorative quote mark
```css
.quoteMark {
  font-size: 36px;
  line-height: 1;
  color: var(--gold);
  opacity: 0.3;
  position: absolute;
  top: 6px;
  left: 10px;
  font-family: Georgia, serif; /* serif for the quote mark only */
}
```

---

## Transitions

Only two transition values used across the entire app:

```css
transition: all 0.15s;            /* hover states, chip/tab active */
transition: transform 0.2s;       /* rotating arrows */
transition: max-height 0.28s ease, opacity 0.2s ease; /* accordions */
transition: max-height 0.3s ease, opacity 0.3s ease;  /* larger panels */
```

Never use `all` on accordion transitions — it's slow. Always specify `max-height` and `opacity` separately.

---

## Form Dots (W/D/L indicators)

```css
.dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}
.dotW { background: #4ade80; }   /* green */
.dotD { background: var(--subtext); }  /* grey */
.dotL { background: #f87171; }   /* red */
```

---

## Background Tint Pattern

Throughout the app, colored backgrounds are **never solid** — always a very low-opacity tint of the color:

```
Gold tint:   rgba(245,200,66, 0.04–0.15)
Blue tint:   rgba(59,130,246, 0.08–0.15)
Green tint:  rgba(34,197,94,  0.08–0.15)
Red tint:    rgba(239,68,68,  0.08–0.15)
White tint:  rgba(255,255,255,0.02–0.06)
```

And borders use the same color at slightly higher opacity:

```
Gold border:   rgba(245,200,66, 0.2–0.35)
Blue border:   rgba(59,130,246, 0.2)
Red border:    rgba(239,68,68,  0.2–0.3)
```

---

## Spacing System

No formal spacing scale — but these values appear consistently:

| Value | Used for |
|---|---|
| `4px` | Gap between inline elements, tight rows |
| `6px` | Gap between chips/tabs |
| `8px` | Margin between cards, gap in rows |
| `10–12px` | Padding inside small components, row gaps |
| `13–14px` | Padding inside cards (both axes) |
| `16px` | Main content padding, section gaps |
| `20px` | Section margin-bottom |
| `40–50px` | Empty state padding |

---

## Complete Starter Template

Paste this into a new project's `index.css` and `App.css` to instantly get the design system:

```css
/* index.css */
:root {
  --bg:      #0a0e1a;
  --surface: #111827;
  --card:    #1a2235;
  --border:  #2a3450;
  --gold:    #f5c842;
  --green:   #22c55e;
  --red:     #ef4444;
  --blue:    #3b82f6;
  --muted:   #6b7280;
  --text:    #f1f5f9;
  --subtext: #94a3b8;
  --fire:    #ff6b35;
}

* { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
html, body { background: var(--bg); color: var(--text); font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; font-size: 15px; min-height: 100vh; }
button { font-family: inherit; cursor: pointer; border: none; background: none; }
a { color: inherit; text-decoration: none; }
::-webkit-scrollbar { width: 4px; height: 4px; }
::-webkit-scrollbar-track { background: var(--bg); }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

/* Card */
.card { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 13px 14px; margin-bottom: 8px; }

/* Badge */
.badge { font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 5px; }
.badge-gold  { background: rgba(245,200,66,0.15); color: #f5c842; }
.badge-blue  { background: rgba(59,130,246,0.12); color: #60a5fa; }
.badge-green { background: rgba(34,197,94,0.12);  color: #4ade80; }
.badge-muted { background: rgba(107,114,128,0.1); color: #6b7280; }
.badge-red   { background: rgba(239,68,68,0.12);  color: #fca5a5; }

/* Section label */
.section-label { font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: var(--gold); margin-bottom: 12px; }

/* Chip */
.chip { background: var(--card); border: 1px solid var(--border); color: var(--subtext); padding: 5px 12px; border-radius: 16px; font-size: 12px; font-weight: 600; transition: all 0.15s; }
.chip.active { background: rgba(245,200,66,0.1); border-color: var(--gold); color: var(--gold); }

/* Spinner */
.spinner { width: 18px; height: 18px; border: 2px solid var(--border); border-top-color: var(--gold); border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Info bar */
.info-bar { background: rgba(59,130,246,0.08); border: 1px solid rgba(59,130,246,0.2); border-radius: 8px; padding: 8px 12px; font-size: 12px; color: #93c5fd; margin-bottom: 12px; }

/* Error */
.error { background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); border-radius: 10px; padding: 14px; font-size: 13px; color: #fca5a5; }

/* Layout */
.main { padding: 16px; max-width: 600px; margin: 0 auto; padding-bottom: 40px; }
```
