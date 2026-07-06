---
name: session-end
description: End-of-session wrap-up for wc2026 — updates docs/CHANGELOG.md with what changed and refreshes the status table in docs/PROJECT.md. Use when the user says they're done for the session, asks to wrap up, or asks to update the changelog/project docs.
---

# wc2026 Session End

Run this at the end of a working session, per the project's `CLAUDE.md` "End of Every Session" rule.

## Steps

1. Gather what changed this session:
   - `git status` and `git diff` (staged + unstaged)
   - `git log` since the last CHANGELOG entry if commits were made
   - Your own memory of what was done this conversation (bug fixes, features, decisions)

2. Update `docs/CHANGELOG.md`:
   - Prepend a new `## [YYYY-MM-DD] — <short title>` section directly under the `---` divider at the top (most recent first, do not touch older entries)
   - Use today's actual date
   - Break changes into `###` subsections by feature/fix, one per logical change — match the terse, factual style of existing entries (root cause → fix, file names in backticks, no fluff)
   - If nothing meaningfully changed, say so instead of writing a filler entry

3. Update `docs/PROJECT.md`:
   - If any tab's status changed (e.g. went from 🔲 to ✅, or a data source was wired up), update the `Tabs / Features` table
   - If any `Current Status` checklist item was completed, check it off or remove it once done
   - Don't touch sections unrelated to this session's work

4. Report back a short summary of what was written to both files — don't just say "done."

## Notes
- Never fabricate changes that didn't happen — only document what actually occurred this session
- Keep entries factual and concise; this is a technical changelog, not marketing copy
- If the user has uncommitted changes they haven't decided to keep, still document them (changelog reflects work done, not just commits)
