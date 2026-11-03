# Orbit room experience: portrait, full screen and two locations

November 3, 2026 (UTC).

## User requirement

Two users may be in different countries. Automatic synchronization is required. Chat must be visible in portrait and hidden during full-screen viewing. The user has not yet selected embedded video versus an overlapping-app presentation; do not treat their uncertainty as approval of a persistent Android permission.

## Current UI evidence

Rave's official Android Netflix promotion shows a participant/tool row above video, conversation beneath it and message/microphone controls at the bottom. This was visually inspected in the official store's screenshot viewer. [Rave Android listing](https://play.google.com/store/apps/details?id=com.wemesh.android).

Hearo's official iPhone promotions show Start Party/Join and a provider grid, portrait video above conversation with a keyboard, and landscape viewing with participant avatars. These are promotional screenshots on another platform, not a test of current Android navigation, player engines or synchronization. [Hearo App Store listing](https://apps.apple.com/us/app/hearo-watch-together/id1385627895).

## Recommended Orbit experience

- **Portrait:** a private-room header, video area, readiness/participant row, conversation and message composer. Separate voice and movie volume. Voice starts muted and requests microphone access only when joined.
- **Full screen:** video-first viewing with chat/composer hidden. Keep a clear way back to the room and optional compact mute/member controls. Restoring portrait preserves conversation, scroll context and the unsent draft.
- **Before play:** each participant signs into the provider on their own device and loads the actual same movie/episode. Show signing in, loading, ready, buffering and reconnecting separately.
- **Across locations:** each device plays its own authorized stream. Shared room events carry clock-anchored position, playing/paused state, revision, readiness and content identity. Network reconnection must join the latest timeline, not replay old control commands. Existing automated timing/database tests are not two-country Netflix proof.
- **Add-ons later:** private invitations, episode queue, subtitle/audio choices per viewer, reactions and opt-in voice. Keep provider authentication and media out of the room backend.

The initial prototype uses a fictional title and explicitly local demo messages/timing. It illustrates the desired layout and a proposed buffering policy, not live video, voice, chat, backend transport or verified Netflix sync. Open [design/room-experience.html](design/room-experience.html) locally. Portrait/full-screen toggles preserve drafts; demo messages mirror between the two views. Small-width and interactive browser checks were performed.

## Presentation candidates

| Candidate | Match to the requested layout | Remaining issue |
|---|---|---|
| Provider player inside Orbit | Orbit can reserve video space above chat and hide chat in full screen. | A working Netflix player/authentication integration is still missing. |
| Netflix-owned Android PiP above Orbit | Official Netflix video may stay visible while Orbit displays the room, without Orbit acquiring SYSTEM_ALERT_WINDOW. | Android/Netflix own the window size and placement. Netflix PiP on the Pixel is user-confirmed. Exact room placement and final acceptance of this presentation remain to be reviewed. |
| Orbit floating above full-screen Netflix | A room panel can potentially be shown above the official player. | It covers the underlying app rather than reserving layout space; Netflix can reject overlays. Persistent special access needs explicit approval and is not added. |

Netflix's own PiP guide documents Android support, entering PiP when switching apps, dragging/resizing and returning to full-size playback. The guide's ad-supported limitation is stated for iPhone/iPad; do not import forum claims that it necessarily applies to Android. The user initially reported no floating window, then corrected that answer: Netflix does become a small playing window above other apps when they go Home. Treat the initial negative result as withdrawn. This confirms user-reported Netflix PiP on the Pixel; an observed Orbit room/two-phone sync test is still pending. This is a distinct supported presentation path, not an Orbit overlay-permission workaround. [Netflix PiP guide](https://help.netflix.com/en/node/588724338955364).

Android documents application overlays and a separate mechanism apps can use to hide them. FLAG_SECURE and overlay rejection are different protections. We will respect both. The Subly repository is a concrete public overlay example, but its position tracking relies on accessibility, so its implementation is not being copied into Orbit. [Android overlay windows](https://developer.android.com/reference/android/view/WindowManager.LayoutParams#TYPE_APPLICATION_OVERLAY), [Android secure windows](https://developer.android.com/security/fraud-prevention/activities), [Subly source](https://github.com/CyberTKR/Subly).

## Concrete overlay proposal awaiting approval

The proposed compatibility test would add SYSTEM_ALERT_WINDOW to the APK and remove that permission from Orbit's blocked list. Android's display-over-other-apps authorization would remain optional and off until the user grants it; the capability persists in that APK and any grant persists until revoked. The test panel would draw above other apps, so it could obscure controls or sensitive pages. It would not inspect those screens.

The proposed panel is explicitly labeled Orbit, small and draggable, cannot accept text or keyboard focus, includes Close, stops on lock/revocation/module destruction, and expires after 60 seconds. No boot receiver, restart, screen capture, accessibility control, foreground service, microphone permission or provider-data collection is proposed for this compatibility test. A movie-length room/service would require a separate implementation and review.

Automatic approval review rejected the permission expansion because that exact persistent capability was not clearly authorized. The rejected command did not run. No overlay implementation or grant was added. The independent metadata-identity fix and normal browser-based UI prototype do not add this capability. Prefer testing the provider-owned PiP path before introducing Orbit's broader special access.

## What is actually implemented

The room design is a local, clickable prototype. Version 1.3.2 recognizes additional provider-published watch-link identity formats, reports fixed field-presence flags and restores pause after an acknowledged paused seek, while retaining the existing synchronization gate. Its corrected signed Android build is being prepared; see [NETFLIX_IDENTITY_TEST.md](NETFLIX_IDENTITY_TEST.md). Neither the design prototype nor the identity parser proves working two-device Netflix synchronization.
