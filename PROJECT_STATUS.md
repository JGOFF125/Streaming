# Orbit — current status

Verified November 2, 2026 (UTC).

## Current development increment

Version 1.3.0 (Android versionCode 7) adds an isolated native Netflix website surface inside Orbit, separate from the external media controls and room timeline. It has no injected scripts, page/cookie reads or new manifest permissions/dependencies; explicit protected-media consent and browser-sign-in cleanup are included. Lint/typecheck pass; a fresh cloud build/native policy test run and binary inspection are required before publishing an APK link. Real Netflix movie playback, actual player identity and automatic sync remain unverified. See [IN_APP_NETFLIX_TEST.md](IN_APP_NETFLIX_TEST.md). Earlier build/device records below are history.

## Current local app and source

- Work remains in the VS Code project at C:/Users/jessu/Downloads/Orbit/Orbit phase 1/orbit.
- Orbit 1.2.0 (Android versionCode 4) is installed and running on the Pixel emulator against the local development server at http://127.0.0.1:8081.
- The server is a background process. Logs are in .expo/dev-server.log and .expo/dev-server-error.log; the process ID is in .expo/dev-server.pid. The VS Code terminal can remain idle while this server runs.
- The new native sync method is present: the running app shows Room sync test is installed. No AndroidRuntime or ReactNativeJS launch error appeared. Known SafeAreaView and Supabase lock deprecation warnings remain.
- GitHub is connected at https://github.com/JGOFF125/Streaming, branch main. The user authorized pushing this work and future verified milestones. Local environment files, private configuration, signing material, APKs and CLI/build caches remain ignored.

For future local development, run npm.cmd run start:dev -- --android from the project folder, using the existing server if port 8081 is already occupied.

## Standalone phone build

The user now has a real Android phone available and confirmed Orbit Google sign-in works; the reset concerns Netflix. Standalone Orbit 1.2.1 (versionCode 5) is finished under the preview profile, without Expo Go or a local development server. [Download the APK](https://expo.dev/artifacts/eas/Z6Tod6xtqFvATUCTLZiSsrqPrOENmiVCNWlnrWD4rqY.apk) or view the [successful build](https://expo.dev/accounts/jgoff/projects/orbit/builds/d1f6aad9-83dd-4626-a2a0-5d97ab28b71b). The physical test phone is a Google Pixel 10 Pro XL on Android 17. The user confirmed the official Netflix app plays a movie normally on that phone. The native planner test task and release assembly passed. Artifact inspection verified the signature, embedded app bundle, minimum API 24 and ARM phone libraries. The user confirmed that Orbit 1.2.1 installs and opens on the physical phone. The user supplied a local observed-seek diagnostic. The adapter reports no usable numeric content ID, and real room synchronization remains unverified. See [PHONE_TEST_SETUP.md](PHONE_TEST_SETUP.md). The additional Android 16 emulator comparison was stopped in favor of physical-device validation; no Android 16 Netflix result exists.

## Product requirement and privacy update

The intended experience is video inside Orbit with text and voice. The current Netflix code controls a separate app and does not implement that experience. The user's real-phone report records an observed seek but contentId is null, which blocks the current native identity gate. A supported in-app Netflix integration remains unestablished; see [NETFLIX_EMBEDDED_FEASIBILITY.md](NETFLIX_EMBEDDED_FEASIBILITY.md). Version 1.2.2 is finished: [download the privacy-cleanup APK](https://expo.dev/artifacts/eas/2L2zW_K9yTM3Z8RepteDbj4XJ6FpAAbiSwSldOTTuz0.apk). Native tests and assembly passed; the signed merged APK passed the minimal-permission check and contains its standalone app bundle. The five unused overlay/storage/vibration/install-referrer grants are absent. Android 17 now queries Netflix sessions only, and the optional-access/revocation UI is clearer. The notification grant itself remains broad. The new query path has not yet been tested on the physical phone. See [ANDROID_PERMISSIONS.md](ANDROID_PERMISSIONS.md).

## Netflix increment

The new signed-in room panel supports a bounded one-minute host/follower test. The host selects a public Netflix catalog identifier and publishes observed playback from Netflix; a follower attempts matching pause/play/seek controls. Both devices open the official Netflix app and wait eight seconds before the test begins.

The native runner calls only this project's authenticated playback RPCs using its own Orbit access token in memory. It verifies the actual Netflix media ID, session, playback state, position, timing and capabilities before control requests; rechecks identity before each action; and stops when controls are not acknowledged. Failed requests do not replay cached commands. The test has cancellation and automatically ends after about one minute, subject to an in-flight network timeout.

**Automatic Netflix compatibility and cross-device playback are not verified. This is not a full-movie background session.** If Netflix does not expose a supported numeric catalog ID or usable controls, the route intentionally stops. Ads and nonstandard playback rates are outside the test contract; use normal 1× playback.

The current development build finished successfully: [Orbit 1.2.0](https://expo.dev/accounts/jgoff/projects/orbit/builds/11042537-beb5-4d00-ae1a-45842b29c7a6). Its source commit was 3f1fa48. The native planner's Kotlin unit tests ran successfully before APK assembly. The later UI labels, instructions and cache exclusion changes do not alter the native binary and are loaded through the development server.

## Checks and remaining access

- Dependency compatibility, all JavaScript/database tests, lint and TypeScript passed. Android compilation and native planner unit tests passed in EAS; Pixel installation and native-method availability were verified.
- Supabase CLI sign-in is working and the target project reports ACTIVE_HEALTHY. Migration 002 was applied through the Management API after confirming the existing private-room schema; do not rerun either migration on this project.
- The previously signed-in Google account now has room access. No other accounts were approved. Public Auth settings returned HTTP 200 with Google enabled. The user confirmed that Orbit Google sign-in works and that the reset concerns Netflix streaming, rather than Orbit authentication.
- Hosted verification passed for host publish/read, stale revision rejection, outsider RLS/RPC denial and grants. Its temporary room and timeline were rolled back. Anonymous playback access returned HTTP 401 / PostgreSQL code 42501 through the public API. Direct member table writes and anonymous RPC execution are denied.
- Netflix is installed, and the user granted Orbit's optional controls permission. Netflix repeatedly exits before login/playback, including on a separate standard-page emulator with Orbit absent. Restarting the Pixel did not fix startup. See [NETFLIX_STARTUP_INVESTIGATION.md](NETFLIX_STARTUP_INVESTIGATION.md); the cause remains unknown and automatic playback is still unverified.
- The original Pixel and local development server are running again. Orbit sessions remain memory-only, so sign in again after restart and create a room to verify the actual app path. A live signed-in room check is pending user feedback.
- The new room playback UI has not been tested with a live signed-in room. Automated tests exercise database authorization, timing, stale revisions, content matching and simulated players; these are not real Netflix results.
- The package audit still reports 24 moderate and one high finding. The high finding is a transitive zod dependency in ESLint development tooling. No forced major dependency upgrades were applied.

## Delivery order

1. Resolve Netflix startup, verify actual controls and identity, test the deployed host/follower path, then implement reliable movie-length background operation and authentication lifecycle handling.
2. Add YouTube, Prime Video and Disney+ adapters, reusing shared room and timing code while verifying each provider separately.
3. Add room text chat and realtime voice.

No other-platform synchronization or text/voice chat is implemented yet. See [PLAYBACK_SYNC_SETUP.md](PLAYBACK_SYNC_SETUP.md) and [NETFLIX_ANDROID_TEST.md](NETFLIX_ANDROID_TEST.md) for the current protocol and test contract.
