# Beat Past You - Design Spec

**Date:** 2026-04-02  
**Working title:** Beat Past You  
**Status:** Active MVP UX spec  
**Primary platform:** Mobile web

## 1. Design Intent

The product should feel like a focused challenge experience, not a generic tracker dashboard. The live session needs to communicate three things clearly:

- the app is actually seeing the body
- the rep count is grounded in visible motion
- the result is worth sharing

The visual and interaction design should prioritize confidence, immediacy, and shareability on a phone.

## 2. Primary Live Session Flow

1. user opens the pushup challenge on a phone
2. user enables the front camera
3. user props the phone low in front of them
4. user taps `Get ready`
5. a short countdown appears
6. the session enters live mode
7. elapsed time starts only when the first valid pushup movement is detected
8. the user sees live overlay, rep count, elapsed time, tracking status, and side elevator
9. user pauses, resumes, stops, or cancels as needed
10. when finished, the app shows result and export actions

The top HUD bar from the original reference remains out of scope.

## 3. Camera and Framing

- portrait orientation is required for the first live experience
- front camera is the default capture mode
- the phone should be placed low and facing the user from the front
- the framing should favor full-body visibility during a pushup plank
- setup guidance should encourage enough distance for the full motion to remain visible

## 4. Live Challenge Surface

The live session surface should include:

- camera preview as the primary visual layer
- pose skeleton overlay aligned to the athlete
- a visible rep counter
- an elapsed-time display
- a tracking indicator
- a side elevator that reflects vertical body movement
- controls for readiness, pause, resume, stop, and cancel

The screen should feel usable while the phone is on the floor and viewed from a short distance.

## 5. Timing and Counting Behavior

- `Get ready` begins the pre-session state, not the measured effort
- a visible countdown bridges setup and live mode
- elapsed time must begin only on first valid movement so setup time is excluded
- rep counting uses tunable heuristics based on pushup posture, depth, and lockout
- the UI should make it obvious whether the system is tracking correctly

## 6. Result Experience

After the session ends, the user should get a compact result experience that emphasizes:

- rep count
- elapsed time
- branding attribution
- quick export options

The first result artifact remains the shareable result card image.

## 7. Session Video Export

The app supports a downloadable session video that burns in the live challenge presentation.

The exported video should include:

- camera feed
- pose overlay
- countdown
- rep count
- elapsed time
- tracking status
- side elevator

The export should represent the challenge itself, not the surrounding page chrome or result screen.

Export behavior:

- recording begins at `Get ready`
- recording stops when the challenge stops or finishes
- cancel and reset discard the current recording
- export stays local in-browser only
- prefer MP4 when the browser supports it, with WebM fallback

## 8. Sharing UX

Sharing should feel fast and phone-native.

Required sharing behavior:

- result card image is the primary sharing artifact
- primary share action invokes the mobile native share sheet
- download remains available as fallback
- no direct Instagram publishing flow is required

The experience should optimize for real phone behavior rather than ideal browser demos.

## 9. Coach Discovery UX

Coach visibility should feel public and useful without turning users into public profiles.

Required coach surfaces:

- public coach directory
- public coach profile page
- business details shown on the public page

Only approved, visible coaches should appear publicly.

## 10. Privacy and Persistence UX Boundaries

- guests can use the challenge flow without persistence
- registered users can save challenge history
- the backend does not store raw video, camera feed, raw pose landmarks, or audio
- local video export is allowed as a user-controlled download

## 11. Design Boundaries for the Current MVP

Out of scope for this design slice:

- public user profiles
- in-app social feed
- Teams or gym entities
- multi-exercise UI beyond pushups
- advanced competition systems
