# Android Netflix player: next integration gate

Updated November 3, 2026 (UTC).

## Confirmed 1.3.1 phone result

The user confirms the larger Netflix screen and keyboard layout work, and Orbit Google sign-in still works after the navigation change. These are physical-device, user-reported results in addition to the existing binary/code checks.

The user reports that the official-page comparison still asks for Netflix's app or blocks playback. Their answer does not distinguish the individual browse and watch-link routes or supply a new error code; do not claim both routes were independently tested. No movie frames/audio inside Orbit, actual player identity or two-device synchronization have been established.

Keep the verified 1.3.1 APK as the current build. The tested system-WebView approach has not passed the Netflix playback gate. A repeated viewport or user-agent-only build has no new supporting evidence.

## Distinct candidate under review: GeckoView

Mozilla documents GeckoView as an embeddable Android browser engine that is separate from the system WebView. Its media-session API exposes play, pause and seekTo, along with activation, supported-feature and position events. This is a potentially useful app-local control interface, rather than access to another app's notifications. It is not evidence of Netflix acceptance or of Rave's implementation.

The reviewed API documentation is from mozilla-central. No stable library version, artifact, dependency or integration has been selected or added. Pin and verify a stable vendor artifact before implementing any candidate; do not infer release compatibility from nightly documentation.

Mozilla's position state uses seconds and includes playback rate and duration. Existing Orbit room timing uses milliseconds, so any eventual adapter must normalize units, validate finite/fresh state and preserve the existing clock/revision/acknowledgment rules.

The documented metadata class contains display fields, and its title may be backfilled from the document title. It does not supply a documented Netflix catalog/episode identifier. A page title, pasted movie link or matching duration cannot be promoted into verified player identity. Reliable provider/player identity binding remains a separate gate even after playback/control works.

## Lowest-cost preliminary check

The user reports that Firefox on the same Pixel also asks for Netflix’s app or blocks playback. The exact Firefox version, browser mode and provider error were not supplied. This is a failed baseline result in the reported configuration, not proof that every GeckoView integration is impossible.

The Firefox comparison did not provide a successful playback baseline. GeckoView remains technically embeddable, but its controls API is not sufficient evidence to ship it as a Netflix fix. Do not add an engine dependency or issue another browser-only APK without new playback evidence.

If evidence supports an engine experiment, require actual authorized movie frames/audio inside the candidate, observed supported play/pause/seek acknowledgments, paused-state preservation, safe session cleanup and a validated identity source before attaching the shared timeline. Keep provider content and authentication outside the room backend. Ordinary DRM/content protection remains enabled; an API's existence is not Netflix playback authorization.

## Other sources reviewed

Netflix's supported-browser requirements do not establish Android embedded-browser playback support. Netflix's device-partner SDK articles discuss its own device ecosystem and TV/console integration; they do not provide an Android embedding API usable by Orbit. Generic Widevine support likewise does not provide Netflix authentication, media access or a canonical identity contract. No mandatory partnership requirement has been established from these sources.

No new APK, account, permission, backend change, dependency or player engine was created for this review. The Netflix-first delivery order remains unchanged. Text/voice and other provider implementations have not been substituted for the requested Netflix experience.

## Primary sources

- [Mozilla GeckoView overview](https://mozilla.github.io/geckoview/)
- [GeckoView media-session controls](https://mozilla.github.io/geckoview/javadoc/mozilla-central/org/mozilla/geckoview/MediaSession.html)
- [Media-session events](https://mozilla.github.io/geckoview/javadoc/mozilla-central/org/mozilla/geckoview/MediaSession.Delegate.html)
- [Position state and units](https://mozilla.github.io/geckoview/javadoc/mozilla-central/org/mozilla/geckoview/MediaSession.PositionState.html)
- [Metadata limitations](https://mozilla.github.io/geckoview/javadoc/mozilla-central/org/mozilla/geckoview/MediaSession.Metadata.html)
- [GeckoView architecture and permissions](https://firefox-source-docs.mozilla.org/mobile/android/geckoview/contributor/geckoview-architecture.html)
- [Netflix browser requirements](https://help.netflix.com/en/node/30081)
- [Netflix device-partner testing context](https://netflixtechblog.com/automated-testing-on-devices-fc5a39f47e24)
- [Widevine overview](https://www.widevine.com/solutions/widevine-drm)

## Current decision after Firefox feedback

The tested Orbit system-WebView routes, Chrome Desktop site comparison and Firefox comparison have not produced a movie inside a browser on the user’s phone. UI sizing, keyboard behavior and Orbit Google sign-in are confirmed working. Keep 1.3.1 as the current verified artifact; Netflix video, canonical player identity and two-device sync remain blocked/unverified.

A usable player integration or a demonstrated working engine/provider path is required before Netflix synchronization can be completed. This investigation has not identified one that Orbit can deploy. Do not turn that knowledge limit into a claim that all Android embedding is impossible or that a specific paid partnership is mandatory. No new APK, dependency, permission or account change is justified by this Firefox result alone.

The user explicitly chose continued Netflix integration investigation. They subsequently reported Netflix movie playback inside the official Rave Android app on the same Pixel. This is a working comparator, not evidence of Rave’s engine or an integration available to Orbit. Do not repeat the priority question or infer universal Android incompatibility. See [NETFLIX_NATIVE_INTEGRATION.md](NETFLIX_NATIVE_INTEGRATION.md) for the native-player/MSL review, rejected SDK leads and prepared integration questions. No new player or APK was created.
