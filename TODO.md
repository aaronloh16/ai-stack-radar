# Roadmap — Post-MVP

Track these as GitHub issues when ready to start work. Each is independently shippable.

---

## 1. My Stack — cookie-based tool saving + /my-stack page
**Priority: First**

Let users save tools from the leaderboard to a personal stack. No login required.

- [ ] `user_stacks` table (visitor_id + tool_id, unique constraint)
- [ ] `visitor_id` cookie (nanoid, httpOnly, 1yr expiry) via `src/lib/visitor.ts`
- [ ] `GET/POST/DELETE /api/my-stack`
- [ ] Bookmark icon on each leaderboard row
- [ ] `/my-stack` page with saved tools + rank, stars, velocity, score
- [ ] Nav link

See `PLAN-stack-pulse.md` Phase 1.

---

## 2. Stack Card — shareable PNG image via @vercel/og
**Priority: Second (depends on #1)**

Generate a dark-themed PNG card of your stack with live data. Shareable on Twitter/LinkedIn.

- [ ] `@vercel/og` dependency
- [ ] `GET /api/stack-card?tools=1,5,11` route returning PNG
- [ ] OG metadata on `/my-stack`
- [ ] "Copy link" + "Download card" buttons
- [ ] `/my-stack?tools=1,5,11` query param for cookieless sharing

See `PLAN-stack-pulse.md` Phase 2.

---

## 3. Tool Submissions — community-driven catalog growth
**Priority: Third (independent)**

Let users submit tools we aren't tracking. GitHub API validation, manual review.

- [ ] `tool_submissions` table
- [ ] `POST /api/submit-tool` with validation (repo exists, >100 stars, not duplicate)
- [ ] `/submit` page with form
- [ ] Review via Drizzle Studio, approved tools added to `tools.json`

See `PLAN-stack-pulse.md` Phase 3.

---

## 4. Release Detection — GitHub releases collector + badges
**Priority: Fourth (independent)**

Track new releases. Show version badges. Feed into daily digest.

- [ ] `tool_releases` table
- [ ] `scripts/collect-releases.ts` (GitHub Releases API)
- [ ] GitHub Actions step after collectors
- [ ] "v2.1" badge on leaderboard for releases in last 7 days
- [ ] Pass releases as context to `generate-digest.ts`

See `PLAN-stack-pulse.md` Phase 4.
