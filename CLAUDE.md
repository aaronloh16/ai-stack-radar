# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev              # Start Next.js dev server
npm run build            # Production build
npm run lint             # ESLint
npm run test             # Vitest (run once)
npm run test:watch       # Vitest (watch mode)
npm run db:push          # Push Drizzle schema to Neon Postgres (no migration files)
npm run db:generate      # Generate Drizzle migration files
npm run db:migrate       # Apply migrations
npm run db:studio        # Open Drizzle Studio for DB inspection
npm run collect:github   # Fetch GitHub stars/forks for all tools, compute momentum scores
npm run collect:hn       # Fetch HN mentions (7d), update momentum scores with HN boost
npm run collect:all      # Run both collectors sequentially
```

Collection scripts also seed the `tools` table from `src/data/tools.json` on first run.

## Architecture

**Two-feature product:** a momentum leaderboard (daily-updated tool rankings) and an architecture generator (Claude-powered stack recommendations using live leaderboard data as context).

### Data Flow

1. **tools.json** → master list of ~60 AI tools with GitHub repos, categories, HN search terms
2. **collect-github.ts** → GitHub API → `github_snapshots` table → computes `star_velocity` → writes `momentum_scores`
3. **collect-hn.ts** → HN Algolia API → `hn_snapshots` table → adds HN boost to `momentum_scores`
4. **Leaderboard page** → SSR queries latest `momentum_scores` + `github_snapshots` per tool
5. **Architecture generator** → fetches all tools with scores as context → sends to Claude with tool_use for structured output → renders Mermaid diagram client-side

### Scoring Algorithm

```
star_velocity = (stars_new - stars_old) / days_between_snapshots
hn_boost = (hn_points_7d × 0.1) + (hn_mentions_7d × 2)
overall_score = star_velocity + hn_boost
```

### Key Patterns

- **Database:** Drizzle ORM with `postgres` driver connecting to Neon Postgres. Schema in `src/lib/schema.ts`. All snapshot tables use unique `(toolId, collectedAt)` indices for time-series data. Latest values are queried via `orderBy(desc(collectedAt)).limit(1)`.
- **Anthropic API:** The generate endpoint uses a two-stage pipeline: Stage 1 selects tools + describes architecture via `tool_use`, Stage 2 generates focused Mermaid code. Model: `claude-sonnet-4-20250514`.
- **Mermaid diagrams:** Rendered client-side via dynamic import with svg-pan-zoom for interactivity. Server-side validation via `mermaid.parse()` with auto-repair loop (up to 3 attempts). Falls back to raw `<pre>` on render failure.
- **SSE streaming:** The generate endpoint streams progress via Server-Sent Events. Client uses `useGenerateStream` hook with `parseSSEBuffer` for progressive UI updates.
- **Shared stacks:** Stored with nanoid(10) IDs in `shared_stacks` table. Shareable at `/stack/[id]`.
- **Stack health analysis:** `/analyze` page fetches repo dependency files via GitHub API, cross-references against momentum leaderboard, generates health report with Claude.
- **GitHub Actions:** `.github/workflows/collect-data.yml` runs both collectors daily at 6am UTC. Requires `DATABASE_URL` and `GITHUB_TOKEN` secrets.

### Environment Variables

All required in `.env.local` (see `.env.example`):

- `DATABASE_URL` — Neon Postgres connection string
- `GITHUB_TOKEN` — GitHub fine-grained PAT (no special permissions, just for rate limits)
- `ANTHROPIC_API_KEY` — for architecture generator

## Verification

- **`npm run test` after any code change.** Always run the test suite after modifying source files. Tests must pass before committing. If tests fail, fix them before moving on — never leave broken tests for a later commit.
- **`npm run build` is the primary type-check.** TypeScript compilation catches most issues. Run it after every change.
- **`npm run lint` for style issues.** Run before committing.
- **Test data pipeline changes** with `npm run collect:github` (or `collect:hn`) against the real DB. The scripts are idempotent — safe to re-run.
- **Browser-check UI changes.** Screenshots and snapshots catch layout issues that types can't.
- **When refactoring shared code** (e.g., extracting helpers, changing function signatures), check and update the corresponding test mocks. Tests that mock the old interface will break silently or fail in CI.
