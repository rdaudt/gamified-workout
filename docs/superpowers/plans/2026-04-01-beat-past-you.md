# Beat Past You: Revised Product and Delivery Plan

## Summary

Beat Past You is a social fitness challenge platform built around self-improvement, visibility, and shareability, not a generic workout tracker. The first real experience is a portrait, front-camera, pushup challenge session that tracks live reps and elapsed time, then produces a shareable result card opened through the mobile native share sheet.

The near-term product optimizes for:

- pushups only in the UI, with a generic exercise model underneath
- external sharing as a first-class feature
- public coach discovery and public coach pages
- no Teams yet
- no public user profiles
- no in-app feed
- manual start and stop session flow
- saved session metrics in Supabase

## Key Product Decisions

- Keep Beat Past You as the working name.
- Frame the product as a social self-challenge platform, not a generic workout app.
- Treat sharing as equally important to performing the session.
- Model exercises generically, but enable only pushups in the first release.
- The first live session uses:
  - portrait orientation
  - front camera
  - phone propped low in front
  - pose overlay
  - rep counter
  - side elevator showing body height
- Omit the top HUD bar shown in the reference for v1.
- Use manual stop instead of target-based or timer-based completion.
- Persist rep count and elapsed time so future derived metrics can be computed later.
- Use a result card image as the first share artifact, not a clip.
- Use the mobile native share sheet for v1 sharing.
- Do not implement direct Instagram publishing in the near term.
- Do not include caption text on result cards in v1.
- Coach visibility includes:
  - directory listing
  - public coach page
  - business details rendered on that page
- Teams and gym entities are explicitly deferred.

## Implementation Changes

### Product and copy

- Rewrite product copy, metadata, and planning language around challenge, session, result, share, and visibility.
- Remove generic workout-tracker framing from user-facing surfaces where it shapes expectations.

### Domain and data model

- Introduce a generic exercise catalog and seed pushups as the first enabled exercise.
- Shift app-facing concepts toward challenge session terminology while keeping the existing `workouts` table as the first persistence boundary.
- Persist session records with at least:
  - exercise reference
  - occurred timestamp
  - elapsed time
  - rep count
  - attribution snapshot
- Preserve the existing attribution model for app-vs-coach branding.
- Keep Teams out of the immediate schema and UI plan.

### Live pushup session

- Build the first session screen specifically for portrait mobile.
- Use front camera capture with setup guidance for low propped placement.
- Render:
  - live camera preview
  - pose skeleton overlay
  - live pushup rep count
  - side elevator that tracks vertical pushup position
  - manual controls to start, pause, resume, and stop
- Use basic depth and lockout thresholds with tunable heuristics for rep counting.
- Persist both reps and elapsed time for authenticated users. Guests remain stateless.

### Result and sharing

- Generate a mobile-first result card image after session completion.
- Provide a primary Share action that invokes the system share sheet on mobile.
- Keep Download as a fallback action.
- Do not implement:
  - direct Instagram feed publishing
  - Stories-specific API work
  - session video export
  - in-app post or feed mechanics

### Coach visibility

- Keep the public coach directory.
- Add a dedicated public coach page that combines:
  - coach identity and profile
  - business profile details
  - business branding where available
- Keep ordinary users private in-app. Do not add public user profile pages yet.

## Recommended Delivery Order

1. Rewrite the spec and plan around challenge-first terminology.
2. Introduce the generic exercise and session model while keeping pushups as the only enabled exercise.
3. Implement the live pushup session shell and portrait challenge UI.
4. Implement pushup pose tracking, rep counting, and elapsed-time capture.
5. Persist session results for authenticated users.
6. Generate result cards and integrate native share-sheet flow.
7. Add public coach pages and connect them to directory entries.
8. Continue auth, account, and history surfaces around the saved session model.

## Test Plan

- Pushup session opens in portrait and uses the expected front-camera setup flow.
- Manual start and stop record elapsed time accurately.
- Rep counting increments only on valid pushup cycles using depth and lockout heuristics.
- Side elevator reflects the athlete's live vertical position.
- Guests can complete a session and share or download a result card without persistence.
- Registered users can save a session and later view it in history.
- Saved sessions persist:
  - exercise
  - elapsed time
  - rep count
  - attribution snapshot
- Mobile share action opens the native or system share sheet successfully.
- Result cards are visually suitable for mobile sharing destinations.
- Public coach directory shows only approved, visible coaches.
- Public coach page renders coach data and business details correctly.
- No public user profile or in-app feed behavior is introduced.

## Assumptions and Defaults

- Beat Past You remains the working product name.
- Pushups are the only enabled exercise in the first release.
- The underlying data model still supports future exercises.
- Teams are deferred entirely from the next implementation slices.
- External sharing via the native share sheet is the correct v1 sharing solution.
- Direct Instagram posting is explicitly deferred.
- Caption overlays are excluded from v1 result cards.
- The top session HUD bar is excluded from v1 until it has a clear product meaning.
