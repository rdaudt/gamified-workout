# Beat Past You

Beat Past You is a mobile-first social fitness challenge platform. The current product slice is a pushup challenge flow designed for phone use: set the phone in portrait, enable the front camera, run a pushup session with pose overlay and live counters, then share the result.

## Current State

What works today:

- portrait, front-camera pushup challenge flow
- live pose overlay with MediaPipe
- live rep count, elapsed time, tracking indicator, and side elevator
- countdown before the session starts
- elapsed time starts on first valid movement, not on setup time
- result-card image export and mobile share-sheet flow
- burned-in session video export with full challenge HUD
- MP4-first session video export when the browser supports it, with WebM fallback
- Supabase-backed persistence for saved sessions
- public coach directory
- public coach pages with business details
- account, history, coach, and admin surfaces scaffolded on top of the data model
- local Supabase seed and connectivity test scripts

What is still actively in progress:

- pushup rep counting quality and real-device threshold tuning
- auth UI and session-aware sign-in flow
- coach attach/remove flows
- admin approve/reject mutations

## Product Direction

Beat Past You is not being built as a generic workout tracker. The intended product is:

- challenge-first
- share-first
- coach-visibility-aware
- pushups-first in the UI, but generic enough for future exercises

Near-term product boundaries:

- no Teams yet
- no public user profiles
- no in-app social feed
- no backend storage of raw video

## Stack

- Next.js 14 App Router
- React 18
- Tailwind CSS
- Supabase for auth and data
- MediaPipe Tasks Vision for client-side pose detection
- Vitest for tests
- Vercel for hosting and preview deployments

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` with the Supabase values used by the app:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Notes:

- the app prefers `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` when present
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` is still supported
- `SUPABASE_SERVICE_ROLE_KEY` must stay server-only

3. Apply the initial schema in Supabase from:

- `supabase/migrations/202604011830_platform_foundation.sql`

4. Optional: seed demo/test data:

```bash
npm run seed:supabase
```

5. Start the app:

```bash
npm run dev
```

## Useful Scripts

```bash
npm run dev
npm run build
npm run test:run
npm run test:supabase
npm run seed:supabase
```

What they do:

- `test:run`: unit/integration-style repo tests
- `test:supabase`: verifies Supabase connectivity and table access
- `seed:supabase`: creates demo users and platform data for manual testing

## Roadmap

### Shipped foundation

- generic exercise catalog in code with pushups enabled first
- session persistence model on top of the existing `workouts` table
- branding snapshot model for app-vs-coach attribution
- coach directory visibility and public coach pages
- result-card generation
- session-video export

### Next implementation slices

1. Improve pushup counting reliability using real captured sessions
2. Add real signup/login UI
3. Add attach/remove/replace coach actions
4. Add coach application submission flow
5. Add admin approve/reject actions
6. Extend exercise support beyond pushups

### Later product work

- friendly competitions
- stronger sharing flows
- richer coach/business conversion surfaces
- additional exercises such as pullups and burpees
- Teams / gym entities

## Testing and Preview Workflow

Recommended workflow:

1. branch from `main`
2. implement the change
3. push the branch
4. open a GitHub PR
5. test the Vercel preview deployment on a real phone
6. merge into `main` only after preview validation

This repo is already connected to Vercel, so pushed branches and PRs create preview deployments automatically.

## README Maintenance Rule

This README should be treated as a living project entry point, not a one-time document.

When a change affects any of the following, update `README.md` in the same branch or PR:

- user-visible features
- setup steps or environment variables
- Supabase schema/bootstrap expectations
- scripts or developer workflow
- deployment/testing workflow
- roadmap priorities

If the app behavior and the README disagree, the README is outdated and should be corrected immediately.
