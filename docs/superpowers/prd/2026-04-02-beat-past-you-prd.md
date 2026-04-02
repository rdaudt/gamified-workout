# Beat Past You - Product Requirements Document

**Date:** 2026-04-02  
**Working title:** Beat Past You  
**Status:** Active MVP definition  
**Primary platform:** Mobile web

## 1. Product Summary

Beat Past You is a mobile-first social fitness challenge platform focused on self-improvement, visibility, and shareability. It is not a generic workout tracker. The first product slice is a pushup challenge flow designed to be performed on a phone, measured live, and shared externally.

The product is built around two complementary goals:

- give challengers a fast, fun way to perform and share measurable fitness results
- give coaches and fitness businesses more visibility through public discovery and branded attribution

## 2. Problem

Many people, especially in fitness-oriented social demographics, care not only about performing but also about showing what they achieved. Existing fitness products often optimize for logging or programming, while social products optimize for content without credible measurement.

Beat Past You is intended to close that gap by making challenge performance, measurable output, and external sharing part of a single experience.

## 3. Product Goals

- Make it fast to run a challenge on a phone.
- Make the result easy to share externally.
- Create a result format that feels credible enough to be worth sharing.
- Give approved coaches public visibility inside the product.
- Leave room for future exercise expansion without redesigning the data model.

## 4. Non-Goals

- Building a generic workout logging app
- Building a full in-app social feed
- Building public user profiles in the MVP
- Building Teams or gym entities in the MVP
- Supporting direct Instagram publishing in the MVP
- Supporting multi-exercise UI in the first release

## 5. Primary Users

### Challengers

People who want to test themselves, improve over time, and share results externally.

### Coaches

Fitness coaches who want discoverability, branded visibility, and eventual conversion opportunities through the product.

### Admins

Operators who approve coaches, manage directory quality, and keep the platform operable.

## 6. MVP Scope

### In Scope

- pushup-first challenge flow on mobile web
- guest challenge sessions
- registered user history and persistence
- generic exercise model with pushups enabled first
- public coach directory
- public coach pages with business details
- result card generation
- share-sheet-based result sharing
- session video export for local download and sharing
- Supabase-backed persistence for registered results

### Out of Scope

- Teams and gym entities
- public user profiles
- in-app social feed
- direct Instagram publishing
- backend video storage
- audio capture
- multi-exercise UI beyond pushups
- competitions as part of the current implementation slice

## 7. Core Product Requirements

### Challenge Session

- The app must support a portrait, front-camera-first pushup challenge session on a phone.
- The user must be able to set the phone down before the measured effort begins.
- The experience must provide live visual feedback during the challenge.
- The measured session must record at minimum rep count and elapsed time.

### Timing and Measurement

- Setup time must not be mixed into the challenge time.
- The user must be able to manually end the session.
- The product must support a future speed metric derived from elapsed time and rep count.

### Sharing

- The app must generate a shareable result artifact after a session.
- The primary sharing path must use the mobile native share sheet.
- The product must support downloadable share assets for platforms that do not accept direct web-share payloads consistently.

### Trust and Credibility

- The challenge experience must display enough live instrumentation to make the result feel grounded in actual performance.
- The product should reduce obvious opportunities for inflated counts caused by setup movement or unrelated motion.

### Coach Visibility

- Approved visible coaches must appear in a public directory.
- Each approved coach must have a public page with identity and business details.
- Saved results must preserve frozen branding attribution even if the user's coach changes later.

### Persistence

- Guests may use the challenge flow without persistence.
- Registered users must be able to save results and view past sessions.
- Persisted session records must support future exercise expansion.

## 8. Constraints

- Mobile web is the primary product surface.
- The first live experience is pushups only.
- Camera and pose analysis happen client-side.
- Raw video is not stored in the backend.
- Sharing should be optimized for real phone behavior, especially iPhone constraints.

## 9. Success Criteria for the Current MVP

- A new user can open the app and complete a pushup challenge on a phone.
- The app produces a measurable result with rep count and elapsed time.
- The user can share a result externally with minimal friction.
- Registered users can save results and see history.
- Approved coaches gain public visibility through the directory and coach pages.

## 10. Future Expansion Direction

- additional bodyweight exercises such as pullups and burpees
- friendly competitions
- stronger sharing flows and richer share assets
- more coach and business conversion surfaces
- Teams and gym entities
