# Beat Past You - Product Design Spec

**Date:** 2026-04-01
**Working title:** Beat Past You
**Status:** Rewritten for multi-coach MVP
**Primary platform:** Mobile web

---

## 1. Product Definition

Beat Past You is a free browser-based workout platform for four user groups:

- **Guests** who want to try the workout flow without registration
- **Trainees** who want persistent history, cards, and optional coach connection
- **Coaches** who want discovery, invitations, and branded attribution on coached sessions
- **Admins** who operate the service, approve coaches, and manage platform continuity

The app uses the device camera to count reps, analyze form, and generate shareable performance cards. The core mechanic remains the same: the user competes against their own history, not against other people.

### Core value by audience

| Audience | Core value |
|----------|------------|
| Trainees | Free rep tracking, progress visibility, workout cards, optional connection to a coach |
| Coaches | Public discoverability, trainee invitations, branded attribution on coached sessions, future conversion path |
| Admins | Central moderation and continuity for a multi-coach platform |

---

## 2. Identity and Roles

The app uses **one account per person**. Roles are additive, not exclusive.

- A user may be a **trainee**
- A user may apply to become a **coach**
- A user may be promoted to **admin**
- The same account may hold multiple roles at once

### Authentication

- MVP authentication is **email + password**
- Social auth is deferred to a future iteration
- There is a **13+ age gate**
- MVP does not implement parental consent flows

---

## 3. Guest vs Registered Behavior

### Guest behavior

Guests can:

- complete workout sessions
- view session results
- generate cards
- download and share cards

Guests do **not** persist:

- workout history
- cards
- profile data
- coach relationships
- location data tied to an account

Guest functionality is intentionally full-featured during a session, but completely stateless after the session ends or the page is refreshed.

### Registered trainee behavior

Registered trainees can:

- persist workout history
- persist account/profile data
- attach or remove a coach
- keep cards and historical results

---

## 4. Coach Relationship Model

A trainee may have **zero or one current coach** in MVP.

### Relationship rules

- A trainee can exist without any coach
- A trainee can attach a coach by:
  - an invite/referral link
  - selecting a coach from the public directory
- A trainee can remove or replace their coach at any time
- Manual coach selection per session/card is out of scope

### Attribution rules

- Future sessions use the coach that is current at the time of the session
- If a trainee removes a coach, future sessions immediately stop using that coach
- Past workouts and cards keep the branding and attribution they had when they were created

---

## 5. Coach Discovery and Visibility

Approved coaches may choose whether they appear in the public coach directory.

### Directory behavior

- The coach directory is searchable and browsable
- Approval and directory visibility are separate concerns
- A coach can be approved but hidden from the directory
- Trainees may attach a coach from the directory if they do not already have one

### No-coach experience

If a trainee has no current coach:

- cards use **app branding**
- no coach-specific booking CTA is shown
- the UI may show a softer prompt to browse the directory

---

## 6. Coach Application and Approval

Coach access is not automatic. A user applies for the coach role from an existing account.

### Application states

- `pending`
- `approved`
- `rejected`

### MVP policy

- Approval uses admin judgment
- Pending or rejected coach applicants continue using the app as trainees
- Final required-vs-optional validation rules for coach applications are intentionally deferred
- The schema should stay flexible enough to evolve without significant migration pain

---

## 7. Profiles and Public Data

### Shared account/profile layer

Required:

- `user_name`
- `email`

Optional:

- `first_name`
- `last_name`
- `nationality`

### Coach personal/profile layer

Required:

- `first_name`
- `last_name`
- `nickname`
- `user_name`
- `email`
- `phone_number`
- `picture`

Optional:

- `short_bio`
- `professional_credentials`

### Coach business layer

All optional in MVP:

- `business_name`
- `business_motto`
- `business_logo`
- `business_location`
- `business_phone_number`
- `business_email`
- social links for:
  - Instagram
  - YouTube
  - Facebook
  - LinkedIn

### Public data policy

- Public profile/business fields may be shown in the directory and on coached surfaces
- Personal contact data remains private by default unless future product decisions expose it

---

## 8. Workout, Card, and Attribution Rules

Each exercise remains an independent performance stream.

### Session data

Persisted workouts should include:

- exercise type
- timestamp
- rep count
- good-form rep count
- form score
- effort score
- duration
- session classification
- attribution snapshot

### Attribution snapshot

Each persisted workout/card stores a snapshot of branding used at save time:

- `branding_source = app | coach`
- nullable coach identifier
- coach/app display values needed to preserve history after later coach changes

### Card behavior

- If a current coach exists, the card may use that coach's branding
- If no current coach exists, the card uses app branding
- Guests can generate, download, and share cards locally
- Guest cards are not stored after the session
- Manual workout photo support, when implemented, is local-only by default

---

## 9. Workout AI and Session Flow

The workout engine remains client-first:

- pose detection runs on-device
- rep counting runs on-device
- form analysis runs on-device
- no video or raw pose stream is stored

### Session flow

1. Open app as guest or registered user
2. Select exercise
3. Position device
4. Start session
5. Run live pose detection and rep counting
6. End session
7. Show result summary and card
8. Download/share immediately
9. Persist only if the user is registered and chooses to save

---

## 10. Coach CTA Logic

`CTA` means **call to action**: a prompt or action intended to drive the next step.

Examples:

- "Book a free assessment with Coach X"
- "Browse coaches"

### Coach CTA rules

- Coach-specific CTA appears only when a current coach exists and branding source is `coach`
- If no coach is assigned, no coach booking CTA is shown
- The no-coach state may show a discovery prompt to browse the directory instead
- Historical workouts/cards keep their original CTA context through attribution snapshotting

---

## 11. Admin Model

Admins are service operators, not a separate account type.

### Admin rules

- The first admin is seeded directly in the backend
- Admins can promote backup admins
- Admins can approve or reject coach applications
- Admins can moderate coach role state
- Admins can trigger password recovery flows
- Admin impersonation and edit-on-behalf are out of scope for MVP

An admin account may also hold trainee and/or coach roles.

---

## 12. Privacy and Location

The app does **not** store:

- video
- camera feed
- raw pose landmarks
- audio

Optional location capture is coarse only:

- city
- region

Exact coordinates are not stored in MVP.

---

## 13. Scope Boundaries for MVP

### In scope

- free mobile-first web app
- guest sessions with no persistence
- registered trainee accounts
- additive user roles
- coach applications and admin approval
- public coach directory with coach-controlled visibility
- optional trainee-to-coach attachment
- per-workout attribution snapshots
- app-branded and coach-branded cards
- basic admin operations

### Out of scope

- teams
- events
- social auth
- sophisticated coach verification workflows
- simultaneous multi-coach attachment for trainees
- manual coach selection per session/card
- exact location storage
- parental consent flows

---

## 14. Infrastructure Direction

| Concern | MVP choice |
|---------|------------|
| Frontend | Next.js App Router |
| Hosting | Vercel |
| Auth + DB | Supabase |
| Pose detection | MediaPipe client-side |
| Quote generation | Server-side API |
| Card generation | Browser-side rendering/export |

The main architectural difference from the earlier version is that branding and CTA behavior are now **per-coach and per-workout snapshot**, not global singleton configuration.
