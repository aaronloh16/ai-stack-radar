# Portfolio Pulse — Personalized AI Tool Tracking

## Vision

Turn AI Stack Radar from a leaderboard you visit into a portfolio you check daily — like following stocks, but for the AI tools in your stack. You define what you use, we tell you what changed and what you should care about.

---

## Phase 1: My Stack (identity without auth)

No login required. Use a cookie-based anonymous identity with an optional upgrade path later.

### 1A. `user_stacks` table + cookie identity

**Schema addition:**
```sql
user_stacks (
  id            serial PRIMARY KEY,
  visitor_id    varchar(32) NOT NULL,      -- nanoid stored in httpOnly cookie
  tool_id       integer REFERENCES tools,
  added_at      timestamp DEFAULT now(),
  UNIQUE(visitor_id, tool_id)
)
```

- On first visit, set a `visitor_id` cookie (nanoid, 32 chars, httpOnly, 1 year expiry)
- No signup friction — users can start saving tools immediately
- Later: optional email attachment for cross-device sync (Phase 3)

**Files to create/modify:**
- `src/lib/schema.ts` — add `userStacks` table
- `src/app/api/my-stack/route.ts` — GET (list), POST (add tool), DELETE (remove tool)
- `src/lib/visitor.ts` — helper to read/set visitor cookie via `cookies()` API

### 1B. "Save to My Stack" UI on leaderboard

Add a bookmark/star icon next to each tool on the leaderboard. Clicking it saves the tool to the user's stack via the API. Visual feedback: filled icon for saved tools.

**Files to modify:**
- `src/app/leaderboard/page.tsx` — add save button per row
- New client component: `src/components/save-tool-button.tsx`

### 1C. `/my-stack` page

A dedicated page showing:
- Tools the user is tracking (with current scores, velocity, rank)
- A mini version of the daily digest filtered to just their tools
- "Add more tools" link to leaderboard

**Files to create:**
- `src/app/my-stack/page.tsx` — server component, reads cookie, queries DB
- `src/components/my-stack-list.tsx` — client component for interactive list

---

## Phase 2: Portfolio Digest (personalized daily updates)

### 2A. `portfolio_digests` table

```sql
portfolio_digests (
  id            serial PRIMARY KEY,
  visitor_id    varchar(32) NOT NULL,
  headline      text NOT NULL,
  body          text NOT NULL,
  highlights    jsonb NOT NULL,
  generated_at  timestamp DEFAULT now()
)
```

### 2B. On-demand portfolio digest generation

When a user visits `/my-stack`, if no digest exists for today:
1. Query their saved tools + latest deltas
2. Call Claude with their specific tool set as context
3. Generate a personalized digest: "Here's what changed in YOUR stack today"
4. Cache in `portfolio_digests` for the rest of the day

This is demand-driven (not cron) — only generate for active users. Use the same Claude prompt pattern as `generate-digest.ts` but scoped to the user's tools.

**Files to create:**
- `src/app/api/my-stack/digest/route.ts` — generates or returns cached portfolio digest
- Reuse digest generation logic from `scripts/generate-digest.ts` (extract shared utility)

### 2C. Portfolio Pulse UI

On the `/my-stack` page, show:
- **Personalized headline** (e.g., "LangChain shipped v0.3 — your RAG stack just got faster")
- **Per-tool cards** with sparkline-style indicators (score trend over last 7 days)
- **Alerts** for big movements: tool entered/left top 10, score changed >20%, new HN discussion

---

## Phase 3: Tool Submissions

### 3A. `tool_submissions` table

```sql
tool_submissions (
  id            serial PRIMARY KEY,
  visitor_id    varchar(32),
  github_repo   varchar(255) NOT NULL UNIQUE,
  name          varchar(100) NOT NULL,
  category      varchar(50) NOT NULL,
  reason        text,                        -- "why should we track this?"
  status        varchar(20) DEFAULT 'pending', -- pending | approved | rejected
  submitted_at  timestamp DEFAULT now()
)
```

### 3B. Submit tool flow

A simple form: GitHub repo URL (required), name, category (dropdown of existing categories), and an optional reason field.

**Validation on submit:**
- Verify the GitHub repo exists (hit GitHub API)
- Check it's not already in `tools.json` or previously submitted
- Auto-extract: name (from repo), description, star count

**Files to create:**
- `src/app/api/submit-tool/route.ts` — POST handler with GitHub validation
- `src/app/submit/page.tsx` — submission form page
- `src/components/tool-submit-form.tsx` — client form component

### 3C. Auto-triage with Claude

When a tool is submitted, run a quick Claude call to:
- Categorize it (confirm or suggest better category)
- Assess relevance ("is this an AI/ML dev tool?")
- Write a one-line description
- Flag if it overlaps with an existing tracked tool

Store Claude's assessment in a `triage_notes` jsonb column. This helps with manual review but doesn't auto-approve.

### 3D. Admin review (simple)

No admin UI needed initially. Review submissions via Drizzle Studio (`npm run db:studio`) or a simple API route that lists pending submissions. Approved tools get added to `tools.json` and seeded on next collector run.

---

## Phase 4: Notifications & Alerts

### 4A. `alert_rules` table

```sql
alert_rules (
  id            serial PRIMARY KEY,
  visitor_id    varchar(32) NOT NULL,
  tool_id       integer REFERENCES tools,
  rule_type     varchar(30) NOT NULL,        -- 'rank_change' | 'score_spike' | 'hn_mention' | 'release'
  threshold     real,                        -- e.g., 5.0 for "score changed by 5+"
  created_at    timestamp DEFAULT now()
)

alert_events (
  id            serial PRIMARY KEY,
  visitor_id    varchar(32) NOT NULL,
  tool_id       integer REFERENCES tools,
  rule_id       integer REFERENCES alert_rules,
  title         text NOT NULL,
  body          text NOT NULL,
  seen          boolean DEFAULT false,
  created_at    timestamp DEFAULT now()
)
```

### 4B. Alert generation (cron step)

Add a new script `scripts/generate-alerts.ts` that runs after the digest:
1. For each user with alert rules, check if any thresholds were crossed
2. Generate `alert_events` for triggered rules
3. Claude summarizes each alert into a human-readable title + body

### 4C. Notification bell UI

- Bell icon in nav bar with unread count badge
- Dropdown showing recent alerts
- Mark-as-read on click
- Link to the relevant tool on the leaderboard

**Files to create:**
- `src/components/notification-bell.tsx` — client component
- `src/app/api/alerts/route.ts` — GET (list), PATCH (mark read)
- `scripts/generate-alerts.ts` — cron script

### 4D. Optional email digest (future)

Allow users to attach an email to their visitor ID. Send a weekly email rollup of their portfolio changes. Uses Resend or similar transactional email service.

---

## Phase 5: Release Detection

### 5A. GitHub Releases collector

New script `scripts/collect-releases.ts`:
- For each tracked tool, hit `GET /repos/{owner}/{repo}/releases?per_page=1`
- Compare latest release tag against stored value
- If new: store release info, flag for digest inclusion

```sql
tool_releases (
  id            serial PRIMARY KEY,
  tool_id       integer REFERENCES tools,
  tag           varchar(100) NOT NULL,
  title         text,
  body          text,
  published_at  timestamp,
  collected_at  timestamp DEFAULT now(),
  UNIQUE(tool_id, tag)
)
```

### 5B. Release integration into digests

When the daily digest runs, include release data:
- "LangChain v0.3.0 shipped yesterday — here's what it means for your stack"
- Claude gets release notes as context, writes a developer-friendly summary

### 5C. Release badges on leaderboard

Show a "NEW" badge next to tools that shipped a release in the last 7 days. Links to the GitHub release page.

---

## Implementation Order

| Step | What | Effort | Dependencies |
|------|------|--------|-------------|
| 1A | Cookie identity + `user_stacks` table | Small | None |
| 1B | Save button on leaderboard | Small | 1A |
| 1C | `/my-stack` page | Medium | 1A, 1B |
| 3A-B | Tool submission form + table | Medium | None (parallel with 1) |
| 2A-B | Portfolio digest generation | Medium | 1C |
| 2C | Portfolio pulse UI | Medium | 2B |
| 3C | Auto-triage submissions with Claude | Small | 3B |
| 5A | Release detection collector | Medium | None (parallel) |
| 5B-C | Release integration into digests + badges | Small | 5A, existing digest |
| 4A-C | Alert rules + notification bell | Large | 1A, 2B |
| 4D | Email notifications | Medium | 4C |

**Recommended first PR:** 1A + 1B + 1C (My Stack MVP) — gives users a reason to come back daily.
**Recommended second PR:** 3A + 3B (Tool Submissions) — grows the tool catalog via community.
**Recommended third PR:** 2A + 2B + 2C (Portfolio Digest) — the killer feature that makes it sticky.

---

## What this unlocks (product)

- **Retention loop:** User saves stack → gets personalized daily updates → comes back daily
- **Growth loop:** User submits tool → tool gets tracked → tool's community discovers the site
- **Content flywheel:** More tools × more users × daily Claude digests = unique daily content that no competitor has
- **Future monetization:** Premium alerts (real-time instead of daily), team dashboards, "powered by AI Stack Radar" badges for READMEs
