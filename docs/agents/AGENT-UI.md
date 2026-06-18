# AGENT-UI — wc2026

Read this when doing any UI, styling, or component work.

## What You Own
- `src/components/*.jsx`
- `src/components/*.module.css`
- `src/App.jsx` and `src/App.module.css`
- `src/index.css` (global variables only — do not add component styles here)

## What You Never Touch
- `src/hooks/` — data fetching logic
- `src/services/api.js` — API calls
- `api/` — Vercel serverless functions
- `src/data/static.js` — content

## Design System
All colors are CSS variables defined in `src/index.css`:
```
--bg: #0a0e1a       background
--surface: #111827  slightly lighter surface
--card: #1a2235     card backgrounds
--border: #2a3450   borders
--gold: #f5c842     primary accent, active states
--green: #22c55e    success
--red: #ef4444      danger, live badge
--blue: #3b82f6     info
--muted: #6b7280    muted text
--text: #f1f5f9     primary text
--subtext: #94a3b8  secondary text
--fire: #ff6b35     hot matches accent
```

## Rules
- Mobile-first always. Max content width 600px centered.
- Use CSS Modules (`.module.css`) — one file per component
- No inline styles
- No Tailwind
- Touch targets minimum 44px height
- Smooth transitions on interactive elements: `transition: all 0.15s`
- Sticky header — `position: sticky; top: 0; z-index: 100`
- Horizontal scrolling nav/chips: `overflow-x: auto; scrollbar-width: none`
- Accordion pattern: max-height 0 → value + opacity 0 → 1 transition

## Component Patterns
- Cards: `background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 13px 14px`
- Section labels: `font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: var(--gold)`
- Badges: small pill, colored by tier (gold/blue/green/muted)
- Loading: spinner animation in --gold color
- Error: red-tinted card with warning icon

## Adding a New Component
1. Create `ComponentName.jsx` in `src/components/`
2. Create `ComponentName.module.css` alongside it
3. Import and add to `App.jsx` tab list
4. Update `docs/CHANGELOG.md`
