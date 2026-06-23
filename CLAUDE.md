# wc2026 — Claude Code Instructions

## Read First (every session, before any task)
1. Read all memory files listed in `~/.claude/projects/-mnt-c-Users-Soy-Documents-Repos-wc2026/memory/MEMORY.md` — start with the index, then read each linked file
2. docs/CHANGELOG.md — what changed last session
3. docs/PROJECT.md — current status table
4. docs/ARCHITECTURE.md — only if doing structural work

## Agent System
Before any task, identify which agent applies and read its file:
- UI work → docs/agents/AGENT-UI.md
- API/data work → docs/agents/AGENT-DATA.md  
- Content/rankings/storylines → docs/agents/AGENT-CONTENT.md
- Planning/reviewing → docs/agents/AGENT-MASTER.md

## Golden Rules
1. Never commit .env.local
2. API keys never in frontend code — always through api/ serverless functions
3. ESPN only polled during active match windows
4. Zafronix has 250 req/day — always cache in sessionStorage
5. CSS Modules only — no inline styles, no Tailwind
6. Mobile first — max width 600px
7. Bun only — local dev `bun run dev`, build `bun run build`, install `bun install`; never `vercel dev`, `npm`, `npx`, or `yarn`
8. Env keys in `.env.local`: `ZAFRONIX_API_KEY` (serverless, `process.env`) AND `VITE_ZAFRONIX_KEY` (client dev, `import.meta.env`)

## End of Every Session
Update docs/CHANGELOG.md with what changed and why.
Update status table in docs/PROJECT.md.