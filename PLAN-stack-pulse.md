# Stack Pulse — Revised Plan

## Design Principles

- **Clean and informative.** No gamification, no notification noise, no AI for the sake of AI.
- **Useful enough to bookmark.** The data should be the draw, not gimmicks.
- **One shareable artifact** that's genuinely interesting — a stack card with real data.

---

## Phase 1: My Stack

No login. Cookie-based anonymous identity. Users pick the tools they actually use from the leaderboard.

### 1A. Cookie identity + `user_stacks` table

```sql
user_stacks (
  id            serial PRIMARY KEY,
  visitor_id    varchar(32) NOT NULL,      -- nanoid, httpOnly cookie, 1yr expiry
  tool_id       integer REFERENCES tools,
  added_at      timestamp DEFAULT now(),
  UNIQUE(visitor_id, tool_id)
)
```

**Files:**
- `src/lib/schema.ts` — add `userStacks` table
- `src/lib/visitor.ts` — read/set visitor cookie via Next.js `cookies()` API
- `src/app/api/my-stack/route.ts` — GET (list saved tools with scores), POST (add), DELETE (remove)

### 1B. Save button on leaderboard

Small bookmark icon per tool row. Filled = saved, outline = not saved. No animation, no toast — just a quiet toggle.

**Files:**
- `src/components/save-tool-button.tsx` — client component
- `src/app/leaderboard/page.tsx` — add button to each row, pass saved tool IDs from cookie

### 1C. `/my-stack` page

Simple table of your saved tools with their current data: rank, stars, velocity, score, category. Sorted by score. A "Browse leaderboard to add tools" link if empty.

Below the table: a one-line summary like "5 tools tracked · Average rank #12 · Strongest: LangChain (#2)"

**Files:**
- `src/app/my-stack/page.tsx` — server component, reads cookie, joins against momentum data
- Add "My Stack" link to nav bar

---

## Phase 2: Stack Card (the shareable thing)

A server-rendered PNG image of your stack — clean, dark-themed, data-dense. Generated via `@vercel/og` (Satori). No AI involved — just data and good typography.

### What the card shows

```
┌──────────────────────────────────────────┐
│  AI STACK RADAR                          │
│                                          │
│  My Stack · 5 tools · March 2026         │
│                                          │
│  #2   LangChain        ★ 102k   ↑ 42/d  │
│  #5   Ollama           ★ 89k    ↑ 38/d   │
│  #11  ChromaDB         ★ 18k    ↑ 12/d   │
│  #14  LangGraph        ★ 9k     ↑ 8/d    │
│  #23  Instructor       ★ 7k     ↑ 4/d    │
│                                          │
│  Avg rank #11 · Top category: LLM        │
│  aistackradar.com                        │
└──────────────────────────────────────────┘
```

Dark background matching the site aesthetic. Syne + JetBrains Mono fonts. Rank, tool name, star count, velocity. Clean and legible at Twitter/LinkedIn card size (1200×630).

### 2A. OG image route

`src/app/api/stack-card/route.tsx` — accepts a `visitor_id` or a `tools` query param (comma-separated tool IDs). Returns a PNG via `@vercel/og`.

This doubles as:
- **OG image** for `/my-stack` (auto-embedded via metadata)
- **Download button** on `/my-stack` page ("Download card")
- **Direct shareable link** — `/api/stack-card?tools=1,5,11,14,23`

### 2B. Share flow on `/my-stack`

Two buttons below the stack table:
- **"Copy link"** — copies a URL like `aistackradar.com/my-stack?tools=1,5,11,14,23` (tool IDs in URL so it works without cookies)
- **"Download card"** — fetches the PNG and triggers download

The `/my-stack` page accepts an optional `?tools=` query param so shared links work for anyone — they see the stack even without the cookie.

**Files:**
- `src/app/api/stack-card/route.tsx` — Satori image generation
- `src/app/my-stack/page.tsx` — add share/download buttons, handle `?tools=` param
- `package.json` — add `@vercel/og` dependency

---

## Phase 3: Tool Submissions

### 3A. `tool_submissions` table

```sql
tool_submissions (
  id            serial PRIMARY KEY,
  github_repo   varchar(255) NOT NULL UNIQUE,
  name          varchar(100) NOT NULL,
  category      varchar(50) NOT NULL,
  description   text,
  status        varchar(20) DEFAULT 'pending',  -- pending | approved | rejected
  submitted_at  timestamp DEFAULT now()
)
```

No visitor tracking on submissions — keep it simple.

### 3B. Submission form

Minimal form at `/submit`:
1. Paste a GitHub repo URL (e.g., `github.com/owner/repo`)
2. On blur/submit, auto-fetch repo metadata via GitHub API: name, description, stars
3. User picks a category from existing categories dropdown
4. Submit

**Validation:**
- Repo must exist on GitHub
- Repo must not already be tracked (check against `tools` table)
- Repo must not already be submitted (check against `tool_submissions`)
- Must have at least 100 stars (filters out personal projects)

**Files:**
- `src/lib/schema.ts` — add `toolSubmissions` table
- `src/app/api/submit-tool/route.ts` — POST with GitHub API validation
- `src/app/submit/page.tsx` — form page
- `src/components/tool-submit-form.tsx` — client form component

### 3C. Review via Drizzle Studio

No admin UI. Review pending submissions in Drizzle Studio (`npm run db:studio`). Approved tools get manually added to `tools.json` and picked up on next collector run.

Later, if volume warrants it, add a simple `/admin/submissions` page behind a password.

---

## Phase 4: Release Detection

This is pure data — no AI, just facts. "LangChain shipped v0.3.1 two days ago" is more useful than an AI summary of what it means.

### 4A. `tool_releases` table + collector

```sql
tool_releases (
  id            serial PRIMARY KEY,
  tool_id       integer REFERENCES tools,
  tag           varchar(100) NOT NULL,
  title         text,
  published_at  timestamp,
  release_url   text,
  collected_at  timestamp DEFAULT now(),
  UNIQUE(tool_id, tag)
)
```

New script `scripts/collect-releases.ts`:
- Hit `GET /repos/{owner}/{repo}/releases?per_page=1` for each tool
- If the tag is new, insert it
- Run daily after the other collectors

### 4B. Release badges on leaderboard + my-stack

If a tool shipped a release in the last 7 days, show a small "v2.1" badge next to the name. Links to the GitHub release page. Simple, informative, no noise.

### 4C. Releases in daily digest

Feed new releases into the existing `generate-digest.ts` as additional context. The digest script already calls Claude — just give it more signal. No new AI calls, no new tables.

---

## Implementation Order

| PR | What | Scope |
|----|------|-------|
| **PR 1** | My Stack MVP (1A + 1B + 1C) | Schema, API, cookie, leaderboard save buttons, `/my-stack` page, nav link |
| **PR 2** | Stack Card (2A + 2B) | `@vercel/og` image route, share/download on `/my-stack` |
| **PR 3** | Tool Submissions (3A + 3B + 3C) | Schema, API, `/submit` form page |
| **PR 4** | Release Detection (4A + 4B + 4C) | Schema, collector script, badges, digest integration |

Each PR is independently shippable. No PR depends on a later one.

---

## What we're NOT building

- ~~Notification bell / alerts system~~ — adds complexity, most users won't configure rules
- ~~Personalized AI digests per user~~ — expensive (Claude call per active user per day), overkill
- ~~Email notifications~~ — need auth, deliverability concerns, premature
- ~~Auto-triage submissions with Claude~~ — unnecessary for the volume we'll see initially
- ~~Gamification~~ — no streaks, badges, points, or leaderboards of users
