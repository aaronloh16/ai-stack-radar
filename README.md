# AI Stack Radar

AI dev tool leaderboard + architecture generator backed by live developer sentiment data.

## Features

### Momentum Leaderboard

Ranks AI dev tools by real developer sentiment using:

- GitHub star velocity
- Hacker News activity

Updated daily via GitHub Actions.

### Architecture Generator

Describe what you want to build and get back:

- Recommended tech stack based on live sentiment data
- Mermaid.js architecture diagram
- Step-by-step build instructions

Powered by Anthropic's Claude with live leaderboard data as context.

## Tech Stack

- **Frontend**: Next.js 16 + Tailwind CSS v4
- **Database**: Neon Postgres + Drizzle ORM
- **Data Collection**: TypeScript scripts (GitHub API, HN Algolia API)
- **Automation**: GitHub Actions (daily cron)
- **AI**: Anthropic API (Claude with structured output)

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

Open source scoring algorithm to maintain community trust and drive adoption. Deployed product provides the value-add services on top.

---

Built in public.
