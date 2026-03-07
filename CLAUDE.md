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
- **Anthropic API:** The generate endpoint uses `tool_choice: { type: "tool" }` to force structured output (summary, tools[], mermaid diagram, buildSteps[], tradeoffs[]). Model: `claude-sonnet-4-20250514`.
- **Mermaid diagrams:** Rendered client-side via dynamic import. Initialized with dark theme. Falls back to raw `<pre>` on render failure.
- **Shared stacks:** Stored with nanoid(10) IDs in `shared_stacks` table. Shareable at `/stack/[id]`.
- **GitHub Actions:** `.github/workflows/collect-data.yml` runs both collectors daily at 6am UTC. Requires `DATABASE_URL` and `GITHUB_TOKEN` secrets.

### Environment Variables

All required in `.env.local` (see `.env.example`):

- `DATABASE_URL` — Neon Postgres connection string
- `GITHUB_TOKEN` — GitHub fine-grained PAT (no special permissions, just for rate limits)
- `ANTHROPIC_API_KEY` — for architecture generator

## Development Workflow

### Planning First

- **Use plan mode for anything non-trivial.** Before writing code, explore the relevant files, understand what exists, and present an approach. "Non-trivial" = touches more than 2-3 files, adds a new feature, changes data flow, or has multiple valid approaches.
- **Ask clarifying questions** rather than assuming intent. A wrong assumption wastes more time than a quick question.
- **Identify what changes and what doesn't.** Most tasks only need to touch a small surface area — find it before writing anything.

### Incremental Changes

- **One logical change at a time.** Don't combine a refactor with a feature addition. Don't fix a bug while adding something new. Each change should be independently understandable.
- **Build → verify → commit → next thing.** After every meaningful change: run `npm run build` to catch type errors, visually verify in the browser if it's a UI change, then commit. Don't stack up multiple uncommitted changes.
- **Commit messages should say why, not what.** The diff shows what changed. The message explains the intent.

### Avoiding AI Slop

- **Read before writing.** Always read the files being modified first. Match the existing patterns, naming conventions, and style — don't introduce new abstractions or utilities that duplicate what's already there.
- **Don't over-abstract.** If something is used once, it doesn't need its own file, utility function, or abstraction layer. Inline it. Extract only when there's actual duplication.
- **No placeholder or demo code.** Every line should be functional. Don't add TODO comments for things that should just be built now, and don't leave stub implementations.
- **Minimal dependencies.** Before adding an npm package, check if the functionality can be achieved in <20 lines of code. Fewer dependencies = less maintenance.
- **Delete code that isn't needed.** Unused imports, commented-out blocks, dead functions — remove them. The git history preserves everything.

### Verification

- **`npm run build` is the primary check.** TypeScript compilation catches most issues. Run it after every change.
- **`npm run lint` for style issues.** Run before committing.
- **Test data pipeline changes** with `npm run collect:github` (or `collect:hn`) against the real DB. The scripts are idempotent — safe to re-run.
- **Browser-check UI changes.** Screenshots and snapshots catch layout issues that types can't.
