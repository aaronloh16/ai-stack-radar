# Launch Readiness Plan

## Feedback Triage

### Signal (worth doing)

| # | Item | Why it matters | Effort |
|---|------|---------------|--------|
| **P0-1** | Missing OSS files (LICENSE, CONTRIBUTING, etc.) | No license = legally unusable. 10min to add MIT + boilerplate. | Trivial |
| **P0-2** | Rate limiting on `/api/generate` | Real risk — one curl loop drains your Anthropic budget. | Medium |
| **P0-4** | Secret naming (GH_PAT vs GITHUB_TOKEN in docs) | Confirmed: workflow maps `secrets.GH_PAT` → env `GITHUB_TOKEN`. Docs say `GITHUB_TOKEN`. Not broken, but the `.env.example` should mention `GH_PAT` is the Actions secret name. | Trivial |
| **P1-1** | Tool seeding doesn't sync updates | Real issue: after first run, editing `tools.json` does nothing. Need upsert. | Medium |
| **P1-2** | N+1 query pattern (3 locations) | 121 DB queries per page load with 60 tools. Will get worse as tools grow. This is the biggest perf win available. | Medium |
| **P1-3** | Hardcoded production URL | Blocks self-hosters. Use `NEXT_PUBLIC_APP_URL` or relative URLs. | Trivial |
| **P1-4** | Silent failure paths | Home/leaderboard return empty arrays on DB error with no logging. At minimum add `console.error`. | Trivial |
| **P1-5** | No CI for PRs | Only scheduled workflow exists. Need lint/test/build on PR. | Small |
| **P1-6** | Dependency vulns | 4 moderate via drizzle-kit/esbuild — dev deps only, low real risk. Worth noting but not blocking. | Trivial |

### Noise (skip or defer indefinitely)

| # | Item | Why it's noise |
|---|------|---------------|
| **P0-3** | Share endpoint retention policy / privacy compliance | You're storing a prompt + generated output with a random ID. There's no PII collection, no auth, no user accounts. This is the same as any pastebin. If this becomes a real product with users, revisit. For launch? Non-issue. |
| **P2-1** | Methodology page | Nice-to-have product feature, not launch-blocking. The scoring is in the README already. |
| **P2-2** | Historical trend UX / sparklines | Product roadmap item. Not a fix. |
| **P2-3** | HN scoring noise | Theoretical concern. You'd need evidence of actual false positives before optimizing. |
| **P2-4** | Unused `/api/leaderboard` endpoint | It's a few lines of code. Keep it — it's a useful public API for others to consume. Removing it saves nothing. |
| **Abuse protection on `/api/share`** | It's a write of ~2KB to Postgres. Not an expensive operation. Rate limiting `/api/generate` (the Anthropic call) is what matters. |
| **CONTRIBUTING / CODE_OF_CONDUCT** | For a solo project, a LICENSE is essential. The rest is ceremony — add them when you actually want contributors. |

### Testing strategy (since you're solo + vibecoding)

The feedback says "add tests" but doesn't say *what* to test. For a solo developer, the highest-value tests are:

1. **API route tests** — mock the DB, test that `/api/generate` validates input, streams correctly, handles errors. Mock Anthropic SDK. These catch regressions when you refactor.
2. **Data collection script tests** — test the scoring math, upsert logic, edge cases (first run vs subsequent). These are pure functions, easy to test.
3. **Query helper tests** — once you fix N+1, test the new joined query returns correct shape.
4. **Skip UI component tests for now** — Vitest + React Testing Library for components is high effort, low value at this stage. Visual verification via preview tools is faster.

---

## Execution Plan

### Phase 1: Foundations (testing + CI)
*Do this first so everything after is verified.*

1. **Add CI workflow** — `.github/workflows/ci.yml` running `lint`, `test`, `build` on PR
2. **Add API route tests** — test input validation, error responses, SSE stream format for `/api/generate` and `/api/share`
3. **Add scoring logic tests** — extract scoring math from collect scripts into testable pure functions, write unit tests
4. **Add query tests** — will be written alongside the N+1 fix in Phase 2

### Phase 2: Fix real bugs
*Highest-impact code changes.*

5. **Fix N+1 queries** — replace per-tool subqueries with proper SQL joins in all 4 locations (home, leaderboard, `/api/generate`, `/api/leaderboard`). Write tests for the new query helpers.
6. **Fix tool seeding to upsert** — change `collect-github.ts` seeding to insert new tools, update changed metadata, handle removed tools. Add test.
7. **Add rate limiting to `/api/generate`** — IP-based rate limit (e.g., 10 requests/hour). Use in-memory store for simplicity (no Redis needed at this scale). Consider Vercel's built-in rate limiting if deployed there.
8. **Add error logging** — replace silent catch blocks with `console.error` in home + leaderboard pages.

### Phase 3: Launch hygiene
*Quick wins, do right before posting.*

9. **Add MIT LICENSE** file
10. **Fix hardcoded URLs** — use env var or `headers().get('host')` for share URLs
11. **Update `.env.example`** — clarify that `GH_PAT` is the GitHub Actions secret name
12. **Run `npm audit` and document** — note that vulns are in dev deps only

### Not doing (and why)
- **Share retention/privacy policy** — premature for launch scope
- **Methodology page** — product feature, not launch-blocking
- **Sparklines/trend charts** — roadmap, not fix
- **HN scoring refinement** — no evidence of actual problem
- **CONTRIBUTING/CODE_OF_CONDUCT** — add when seeking contributors
- **Dependabot/CodeQL** — overkill for solo project, CI lint/test/build is sufficient
