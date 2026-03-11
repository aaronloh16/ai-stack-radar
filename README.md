# DevFlow

See how top engineers actually use AI to ship — real tool setups, techniques, and workflows from the developers building with it.

## Features

### Workflow Library

Community-submitted AI dev workflows — the exact tools, setups, and step-by-step techniques real engineers use day-to-day. Browse, upvote, and copy what works.

### Workflow Submission

Multi-step form for sharing your own AI workflow: describe your setup, select the tools you use, walk through the steps, and publish it for the community.

### Tool Leaderboard

Ranks AI dev tools by real developer momentum using:

- GitHub star velocity
- Hacker News activity
- npm/PyPI download trends

Updated daily via GitHub Actions.

### Architecture Generator

Describe what you want to build and get back:

- Recommended tech stack based on live momentum data
- Mermaid.js architecture diagram
- Step-by-step build instructions

Powered by Anthropic's Claude with live leaderboard data as context.

## Tech Stack

- **Frontend**: Next.js 16 + Tailwind CSS v4
- **Database**: Neon Postgres + Drizzle ORM
- **Data Collection**: TypeScript scripts (GitHub API, HN Algolia API)
- **Automation**: GitHub Actions (daily cron)
- **AI**: Anthropic API (Claude with structured output)
- **Fonts**: Syne (display) + JetBrains Mono (data)

## Setup

1. Clone the repo and install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and fill in your keys (see `.env.example` for details).

3. Push the database schema:

   ```bash
   npm run db:push
   ```

4. Run the first data collection:

   ```bash
   npm run collect:github
   ```

5. Start the dev server:
   ```bash
   npm run dev
   ```

## Project Philosophy

Open source scoring algorithm to maintain community trust. Community-driven workflow submissions to capture how developers actually work with AI tools — not theory, just what ships.

---

Built in public.
