# Beat Past You - Implementation Plan

## Goal

Turn the repo into a working multi-coach platform foundation that matches the rewritten product model:

- free mobile-first web app
- guest sessions with no persistence
- one account with additive roles
- optional trainee-to-coach relationship
- coach approval and directory visibility model
- per-workout branding snapshot rules

This plan replaces the earlier singleton-trainer architecture.

---

## Phase 0: Documentation Reset

Deliverables:

- rewritten product spec aligned with the platform model
- rewritten implementation plan aligned with the platform model

Completed changes should establish the new source of truth for:

- account and role model
- guest vs registered behavior
- coach relationship lifecycle
- coach approval and visibility
- app branding vs coach branding
- frozen historical attribution

---

## Phase 1: Platform Foundation

Deliverables:

- Next.js App Router project scaffold
- TypeScript and Tailwind configured
- base route structure for guest, trainee, coach, and admin surfaces
- shared role and branding types
- profile-first data model definitions

### Required foundations

- `app` directory scaffold
- `lib/types` for public domain models
- mobile-first layout shell
- email/password auth placeholders
- guest-safe state boundaries

### Core public types

Define these explicitly in code:

- `UserRole = 'trainee' | 'coach' | 'admin'`
- `CoachApplicationStatus = 'pending' | 'approved' | 'rejected'`
- `BrandingSource = 'app' | 'coach'`
- `CurrentCoachRelationship`
- `WorkoutAttributionSnapshot`
- `CoachProfile`
- `CoachBusinessProfile`
- `CoachDirectorySettings`

---

## Phase 2: Data Model and Auth

Deliverables:

- database-facing model definitions for the platform
- auth-compatible profile layer
- zero-or-one current coach relationship model

### Replace singleton trainer configuration

Do **not** use a single `admin_config` table for trainer branding.

Use platform entities instead:

- `profiles`
- `user_roles`
- `coach_profiles`
- `coach_business_profiles`
- `coach_applications`
- `trainee_coach_relationships`
- `coach_directory_settings`
- optional `coach_invite_links`

### Workout persistence rules

Persist workouts only for registered users.

Saved workouts must carry attribution snapshot fields sufficient to preserve history even after a coach change:

- `branding_source`
- nullable `coach_id`
- coach/app display values used at save time

---

## Phase 3: Routing and Product Surfaces

Deliverables:

- account/profile settings
- coach self-service pages
- admin operations pages
- public coach directory

### Route groups

- public/guest workout entry
- authenticated trainee surfaces
- coach application and coach profile management
- service admin pages

### UX constraints

- phone-first layout and interaction model
- desktop supported secondarily
- no guest persistence beyond session scope

---

## Phase 4: Coach Platform

Deliverables:

- coach application flow
- coach self-service profile editing
- business profile editing
- directory visibility toggle
- invite-link scaffolding

### Rules

- users apply for coach role from existing accounts
- coach applications have states:
  - `pending`
  - `approved`
  - `rejected`
- approved coaches can choose directory visibility independently
- pending/rejected users still operate as trainees

Validation for coach application fields is provisional and should remain easy to evolve.

---

## Phase 5: Trainee Relationship Layer

Deliverables:

- current coach attach flow
- current coach replace flow
- current coach remove flow
- invite-link auto-attach support

### Rules

- zero-or-one current coach per trainee
- coach assignment optional
- coach can be attached from directory or invite
- no manual coach choice per card/session
- removing a coach affects future sessions immediately
- past sessions/cards retain original attribution

---

## Phase 6: Workout Core

Deliverables:

- camera workout session flow
- pose detection wrapper
- rep counting pipeline
- result screen shell

### Behavioral rules

- guests and registered users get the same functional workout experience during a session
- guests do not persist workouts after session end
- registered users may persist results and history

---

## Phase 7: Cards and CTA Logic

Deliverables:

- card generation for app-branded and coach-branded sessions
- no-coach discovery prompt behavior
- attribution snapshot storage path for registered users

### Card rules

- if current coach exists, use coach branding
- if no current coach exists, use app branding
- guests can download/share cards locally
- guest cards are not stored after the session

### CTA rules

`CTA` means call to action.

- coach-specific CTA only appears when a current coach exists
- no-coach state should not show a coach booking CTA
- no-coach state may show a coach directory prompt
- saved history must preserve the CTA context that existed when the workout was created

---

## Phase 8: Admin Operations

Deliverables:

- coach approval queue
- approve/reject actions
- admin promotion workflow
- basic moderation hooks

### Admin rules

- initial admin is seeded manually in backend
- admins can create backup admins
- admins can approve/reject coach applications
- admins can promote users to admin
- admins can moderate coach role state
- password recovery entry points should exist
- impersonation/edit-on-behalf remains out of scope

---

## Phase 9: Growth and Discovery

Deliverables:

- simple share/referral link model
- no-coach directory prompts
- public coach discovery surface

### Constraints

- keep invite and referral model simple in MVP
- do not build full roster management yet
- keep teams/events fully out of current implementation

---

## Initial File and Module Targets

Create or maintain these groups of files as the first implementation slice:

- project scaffold files:
  - `package.json`
  - `tsconfig.json`
  - `next.config.ts`
  - `tailwind.config.ts`
- app shell:
  - `app/layout.tsx`
  - `app/page.tsx`
  - `app/workout/page.tsx`
  - `app/history/page.tsx`
  - `app/coaches/page.tsx`
  - `app/account/page.tsx`
  - `app/coach/page.tsx`
  - `app/admin/page.tsx`
- domain models:
  - `lib/types/domain.ts`
  - `lib/platform/mock-data.ts`
- shared UI:
  - `components/layout/AppShell.tsx`
  - `components/coaches/CoachDirectory.tsx`
  - `components/account/RoleBadges.tsx`

---

## Test Plan

Verify these behaviors as implementation grows:

- guest can complete a session, view result, and download/share a card without persistence
- registered trainee can save workout history
- user with no coach gets app branding and a directory prompt, not a coach-specific CTA
- coach invite link can attach the current coach
- trainee can attach a coach from the directory
- trainee can remove or replace a coach and future sessions switch immediately
- historical workouts/cards keep original attribution after coach changes
- pending/rejected coach applicants still function as trainees
- approved coach can toggle directory visibility independently from approval state
- admin can approve/reject coaches and promote admins
- one account can carry multiple roles
- optional location is coarse-only when present

---

## Defaults and Assumptions

- email/password only in MVP
- guest flows are stateless but otherwise feature-complete
- coach application strict validation remains provisional
- exact location is never stored
- no manual per-session/per-card coach selection
- no multi-coach simultaneous trainee relationships
- teams and events remain future work
