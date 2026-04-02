# Beat Past You - Delivery Plan

**Date:** 2026-04-02  
**Status:** Active implementation roadmap

## 1. Current Implementation Status

### Implemented

- product copy reframed around challenge, session, result, and sharing
- generic exercise catalog in code with pushups enabled first
- Supabase schema and repository foundation
- seeded Supabase test data and connectivity scripts
- public coach directory
- public coach pages with business details
- portrait pushup challenge surface
- front-camera session flow with setup guidance
- live pose overlay using MediaPipe
- live rep count, elapsed time, tracking state, and side elevator
- countdown before live mode
- elapsed time beginning on first valid movement instead of setup time
- result card generation
- native share-sheet integration for result sharing
- burned-in session video export with local download
- MP4-first session video export when supported, with WebM fallback
- cancel and reset behavior that discards the active recording

### Partially Implemented / Needs Improvement

- pushup counting reliability is still heuristic-based and needs real-device tuning
- video export compatibility still depends on browser support for MP4 recording
- account, history, coach, and admin surfaces exist but remain scaffolded in places

### Not Yet Implemented

- production auth UI and sign-in flow
- coach attach, remove, and replace actions
- coach application submission flow
- admin approve and reject mutations
- multi-exercise UI beyond pushups
- competitions
- Teams and gym entities

## 2. Immediate Priorities

### Priority 1: Challenge Quality

- tune pushup counting against real captured sessions
- reduce false positives from setup and unrelated movement
- reduce false negatives during valid pushups
- improve user feedback when tracking quality is poor

### Priority 2: Auth and Persistence Completion

- add signup and login UI
- connect authenticated identity cleanly to account and history surfaces
- tighten save behavior and empty states for registered users

### Priority 3: Coach Platform Completion

- add coach application submission
- add attach, remove, and replace coach actions
- add admin approval and rejection actions

## 3. Next Delivery Slices

1. Improve rep-counting reliability using recorded real-device sessions.
2. Complete auth UI and session-aware user flows.
3. Finish coach relationship mutations and coach application write paths.
4. Finish admin operations for coach review and approval.
5. Expand challenge metrics and polish the result/share experience.
6. Add more exercises on top of the generic exercise model.

## 4. Validation Checklist

- pushup challenge works on a real phone in portrait mode
- elapsed time excludes setup time
- rep counts are believable on repeated real-world tests
- result card sharing works from the mobile share sheet
- session video export is playable and shareable on target devices
- registered users can save and later view session history
- public coach directory and coach pages reflect only approved, visible coaches

## 5. Ongoing Documentation Rule

When implementation changes affect shipped behavior, the following should be updated in the same branch or PR:

- `README.md` for current-state accuracy
- PRD if product requirements changed
- design spec if live UX or export behavior changed
- delivery plan if roadmap status changed
