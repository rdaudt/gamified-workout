# Beat Past You - Product Design Spec

**Date:** 2026-04-01  
**Working title:** Beat Past You  
**Status:** Challenge-first MVP  
**Primary platform:** Mobile web

## 1. Product Definition

Beat Past You is a social fitness challenge platform built around self-improvement, visibility, and shareability. The product is not a generic workout tracker. The first production experience is a pushup challenge session designed to be performed on a phone, reviewed instantly, and shared externally.

Primary audiences:

- guests who want to try the challenge flow immediately
- registered challengers who want saved history and coach attachment
- coaches who want visibility, discovery, and branded challenge attribution
- admins who approve coaches and keep the platform operable

## 2. Core Product Shape

The first enabled activity is pushups, but the product should model exercises generically so pullups, burpees, and other movements can be added later without rethinking the data model.

Core v1 flow:

1. user opens the app on a phone
2. user sets the phone low in front of them
3. front camera preview opens in portrait orientation
4. user starts the pushup challenge manually
5. the app shows pose overlay, live rep count, and a side elevator that reflects body height
6. user stops manually
7. the app shows a shareable result card
8. the user shares through the mobile native share sheet

The top HUD bar shown in the visual reference is out of scope for v1.

## 3. Roles and Identity

Beat Past You uses one account per person. Roles are additive, not exclusive.

- a user may be a challenger
- a user may apply to become a coach
- a user may be promoted to admin
- the same account may hold multiple roles

MVP authentication remains email and password. Social auth is deferred.

## 4. Guest vs Registered Behavior

Guests can:

- run the full pushup challenge
- see live pose overlay and rep counting
- view the result card
- share through the system share sheet
- download the card

Guests do not persist:

- challenge history
- cards
- profile data
- coach relationships

Registered challengers can:

- persist challenge history
- persist account and profile data
- attach or remove a coach
- keep result history with frozen branding snapshots

## 5. Coach Relationship Model

A challenger may have zero or one current coach in MVP.

Relationship rules:

- coach attachment is optional
- a coach can be attached from the public directory or by invite later
- removing or replacing a coach affects future sessions only
- manual coach selection per session is out of scope
- past saved sessions keep their original coach or app attribution

## 6. Coach Visibility

Coach visibility is a core product goal.

Approved coaches should have:

- a public directory entry
- a dedicated public coach page
- business details rendered on that public page

Directory rules:

- approval and directory visibility are separate states
- a coach can be approved but hidden
- only approved, visible coaches appear publicly

Ordinary users do not have public profiles in this phase.

Teams and gym entities are explicitly out of scope for the current implementation slices.

## 7. Challenge Session Design

The first live session is portrait-only and front-camera-first.

Required live elements:

- camera preview
- pose skeleton overlay
- live rep counter
- elapsed time
- side elevator showing body height
- manual controls for start, pause, resume, and stop

Rep counting should use basic depth and lockout thresholds with tunable heuristics. It does not need advanced form-gating in v1.

Persisted session data must include at least:

- exercise
- occurred timestamp
- elapsed time
- rep count
- attribution snapshot

## 8. Sharing

Sharing is as important as performing for the intended audience.

V1 sharing behavior:

- generate a mobile-first result card image
- primary action opens the mobile native share sheet
- keep Download as a fallback

Explicitly out of scope for v1:

- direct Instagram posting
- Instagram Stories API work
- in-app feed mechanics
- video export
- captions over the result card

## 9. Branding and Attribution

Branding is frozen per saved result.

If a current coach exists, saved results may use coach branding. If no current coach exists, results use app branding.

Each saved session must retain enough attribution data to preserve the original state even if the user's coach changes later.

## 10. Privacy

The app does not store:

- video
- camera feed
- raw pose landmarks
- audio

Only saved result metrics and attribution metadata persist for registered users.

## 11. MVP Scope

In scope:

- pushup-first mobile challenge flow
- guest challenge sessions
- registered challenge history
- generic exercise catalog with pushups enabled first
- public coach directory
- public coach pages
- coach application and approval foundation
- result card generation
- native share-sheet integration

Out of scope:

- Teams
- public user profiles
- in-app social feed
- direct Instagram publishing
- multi-exercise UI beyond pushups
- advanced events or competition systems

## 12. Infrastructure Direction

| Concern | MVP choice |
|---------|------------|
| Frontend | Next.js App Router |
| Hosting | Vercel |
| Auth + DB | Supabase |
| Pose detection | MediaPipe client-side |
| Result card generation | Browser-side canvas export |
| Sharing | Web Share API with download fallback |

The key architectural direction is challenge-first, share-first, and coach-visibility-aware rather than generic workout tracking.
