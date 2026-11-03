# Orbit — current status

## Current integration blocker: November 3, 2026 (UTC)

Development is blocked on an obtainable provider-authorized Android in-app playback/session integration. The same condition was revalidated across three consecutive goal turns. The current checkout and origin/main matched c8d0de0 with a clean tree before this status update. All four inquiry threads still contain only the sent messages, and the targeted reply/bounce search returned no matches. No live build, device test or other running process is being waited on.

Netflix, Disney+ and Prime Video movie playback inside Orbit, player-bound identity/acknowledged controls and two-device automatic synchronization remain incomplete. Resume implementation when an available SDK/API with usable authentication/playback documentation, or a reproducible authorized Android playback path, supplies the missing player contract. A generic DRM library, desktop-only extension, vendor marketing claim or another wrapper build does not supply it. See [NETFLIX_NATIVE_INTEGRATION.md](NETFLIX_NATIVE_INTEGRATION.md) and [the outreach record](NETFLIX_INTEGRATION_OUTREACH.md). Orbit remains 1.3.1. No repeated inquiries, purchases, new permissions or runtime changes were made.


## Provider SDK review: November 3, 2026 (UTC)

The expanded investigation found Disney’s documented ADK/proprietary native-video-engine program for licensed distributors. Its availability for an Android watch-party app and a separately embeddable player remain unestablished. Amazon’s Prime APIs serve content submissions and analytics, not subscriber playback. The user has no Prime Video access, so the phone browser comparison was not performed. Inquiry threads currently contain only the sent messages. See [the expanded provider review](NETFLIX_NATIVE_INTEGRATION.md#expanded-provider-review-november-3-2026). Netflix, Disney+ and Prime playback inside Orbit and two-device sync remained incomplete at that checkpoint; see the current blocker above. No new APK or runtime changes were made.


## Integration outreach: November 3, 2026 (UTC)

The user authorized outreach beyond Rave. Gmail returned SENT for separate inquiries to Rave, Hearo, Teleparty and Watchly at contacts verified through official sites/listings. This confirms submission, not delivery or a reply. The expanded review found a historical Hearo business/white-label venue lead but no currently deployable Netflix SDK. See [NETFLIX_INTEGRATION_OUTREACH.md](NETFLIX_INTEGRATION_OUTREACH.md) for sources, scope and follow-up questions. No player/API integration has been obtained and no new APK was built; Orbit Netflix playback and two-device synchronization remain blocked.


## Native integration investigation: November 3, 2026 (UTC)

The user reaffirmed Netflix as the next priority and reports Netflix movie playback inside the official Rave app on the same Pixel. This is a working comparison, not an Orbit result or a verified explanation of Rave’s implementation. The public Netflix MSL framework and Android DRM-player documentation do not supply a usable Netflix player/session integration for Orbit. Namesake social SDKs, watch-history APIs and app launchers were reviewed and do not fill that gap. See [NETFLIX_NATIVE_INTEGRATION.md](NETFLIX_NATIVE_INTEGRATION.md) for sources, acceptance requirements and the original inquiry, now sent with the user’s authorization. The current APK remains 1.3.1; no dependency, permission, backend or account changes were made. Actual Orbit Netflix playback and two-device synchronization remain blocked.

## Firefox comparison result

November 3, 2026 (UTC): the user reports Firefox also asks for the Netflix app or blocks playback. The exact Firefox mode/version and error were not specified. Together with the earlier Orbit and Chrome results, this supplies no working browser baseline for a GeckoView replacement. The larger screen, keyboard and Google sign-in remain user-confirmed working; Netflix movie playback and automatic sync are blocked/unverified. Keep 1.3.1 as the current APK and do not ship another speculative browser wrapper. See [ANDROID_PLAYER_NEXT_STEP.md](ANDROID_PLAYER_NEXT_STEP.md). The user subsequently reaffirmed Netflix integration; the newer Rave comparison and native-player findings are recorded above.


## Current verified APK: 1.3.1

The [Orbit 1.3.1 standalone APK](https://expo.dev/artifacts/eas/Q9D5EyjGtrEoHwyJsO2lAUERXnDS6xbvl_uQzQbQWZc.apk) ([successful build](https://expo.dev/accounts/jgoff/projects/orbit/builds/b44e514e-a32e-4ce4-a92c-33755c7507d5)) is finished. The cloud native tests and release assembly passed. Binary inspection verified the same signing certificate as the prior APK, the standalone app bundle, ARM64 support, disabled backup, no extra declared permissions, the Google callback scheme and MainActivity keyboard adjustResize setting. The user confirms the larger screen, keyboard layout and Google sign-in work on the physical phone. Their official-page comparison still asks for Netflix’s app or blocks playback; the exact route/error was not specified. Movie playback and sync remain unverified. See [ANDROID_PLAYER_NEXT_STEP.md](ANDROID_PLAYER_NEXT_STEP.md) for the next integration gate and [NETFLIX_SCREEN_LAYOUT.md](NETFLIX_SCREEN_LAYOUT.md).

Open Netflix inside Orbit → Open Netflix test screen. Open the website, then use Details for the official browse page or a public Netflix title/watch link. The route test may still show Netflix’s app-required page. A selected link is not verified player identity. Source ab6c2c3. APK size 91886957 bytes; SHA-256 2b87a1d0a78656a25b635df4e35c42114ad54317f0cf517d4b12173124be4c84.


## Latest device result: November 3, 2026 (UTC)

The user tested the shipped 1.3.0 APK: Netflix sign-in works, but the website asks for its separate app. Chrome with Desktop site on the same phone also requests the app or blocks playback. Embedded movie playback is therefore not working in either reported test. The v1 report ends in background_closed, which records lifecycle cleanup and does not identify the provider restriction or establish a crash. The screenshot received later shows Netflix’s signed-in mobile app-required landing page; no player error code is shown. See NETFLIX_EMBEDDED_FEASIBILITY.md.

The v2 reporting fix is included in 1.3.1, together with the larger screen and official-page comparison controls. All eleven Netflix diagnostic/operation tests pass, plus authentication routing, room/database tests, lint and typecheck. The older 1.3.0 artifact below remains history. No movie-playback or sync fix has been verified, and no account, database or Google Cloud configuration was changed.


Updated November 3, 2026 (UTC). Build/artifact checks and confirmed layout/keyboard/Google phone results are separate from the unresolved Netflix movie-playback gate.

## Current development increment

Version 1.3.0 (Android versionCode 7) adds an isolated native Netflix website surface inside Orbit, separate from the external media controls and room timeline. It has no injected scripts, page/cookie reads or new manifest permissions/dependencies; explicit protected-media consent and browser-sign-in cleanup are included. Lint/typecheck, all 62 JavaScript/database checks and 14 pure Kotlin tests pass. The [Orbit 1.3.0 standalone APK](https://expo.dev/artifacts/eas/o4C3M1fMeDL6vvq1gtyDKqFRuQitqZXy2X1ezJT8_tw.apk) ([build](https://expo.dev/accounts/jgoff/projects/orbit/builds/8419489c-93bc-4cf8-9854-2e05d7c59954)) is finished: cloud native tests and assembly passed, the signature matches the previous APK, the app bundle is embedded, no extra declared permissions were found and application backup is disabled. Source c0527d1. Real Netflix movie playback, actual player identity and automatic sync remain unverified. See [IN_APP_NETFLIX_TEST.md](IN_APP_NETFLIX_TEST.md). Earlier build/device records below are history.

## Checkout and earlier emulator record

- Work remains in the VS Code project at C:/Users/jessu/Downloads/Orbit/Orbit phase 1/orbit.
- Earlier checks installed Orbit 1.2.0 (Android versionCode 4) on the Pixel emulator with a local development server at http://127.0.0.1:8081. No ADB device was connected at the latest check in this session; no 1.3.0 device installation or runtime UI test has been claimed.
- Earlier development-server logs are in .expo/dev-server.log and .expo/dev-server-error.log; .expo/dev-server.pid is historical until rechecked. The new standalone APK needs no server.
- In the earlier 1.2.0 runtime check, the native sync method was present and the app showed Room sync test is installed. No AndroidRuntime or ReactNativeJS launch error appeared. Known SafeAreaView and Supabase lock deprecation warnings remain.
- GitHub is connected at https://github.com/JGOFF125/Streaming, branch main. The user authorized pushing this work and future verified milestones. Local environment files, private configuration, signing material, APKs and CLI/build caches remain ignored.

For future local development, run npm.cmd run start:dev -- --android from the project folder, using the existing server if port 8081 is already occupied.

## Earlier standalone phone build: 1.2.1

The user now has a real Android phone available and confirmed Orbit Google sign-in works; the reset concerns Netflix. Standalone Orbit 1.2.1 (versionCode 5) is finished under the preview profile, without Expo Go or a local development server. [Download the APK](https://expo.dev/artifacts/eas/Z6Tod6xtqFvATUCTLZiSsrqPrOENmiVCNWlnrWD4rqY.apk) or view the [successful build](https://expo.dev/accounts/jgoff/projects/orbit/builds/d1f6aad9-83dd-4626-a2a0-5d97ab28b71b). The physical test phone is a Google Pixel 10 Pro XL on Android 17. The user confirmed the official Netflix app plays a movie normally on that phone. The native planner test task and release assembly passed. Artifact inspection verified the signature, embedded app bundle, minimum API 24 and ARM phone libraries. The user confirmed that Orbit 1.2.1 installs and opens on the physical phone. The user supplied a local observed-seek diagnostic. The adapter reports no usable numeric content ID, and real room synchronization remains unverified. See [PHONE_TEST_SETUP.md](PHONE_TEST_SETUP.md). The additional Android 16 emulator comparison was stopped in favor of physical-device validation; no Android 16 Netflix result exists.

## Product requirement and privacy update: 1.2.2 history

The intended experience is video inside Orbit with text and voice. The 1.2.2 Netflix adapter controls a separate app and does not implement that experience. The user's real-phone report records an observed seek but contentId is null, which blocks the current native identity gate. A supported in-app Netflix integration remains unestablished; see [NETFLIX_EMBEDDED_FEASIBILITY.md](NETFLIX_EMBEDDED_FEASIBILITY.md). Version 1.2.2 is finished: [download the privacy-cleanup APK](https://expo.dev/artifacts/eas/2L2zW_K9yTM3Z8RepteDbj4XJ6FpAAbiSwSldOTTuz0.apk). Native tests and assembly passed; the signed merged APK passed the minimal-permission check and contains its standalone app bundle. The five unused overlay/storage/vibration/install-referrer grants are absent. Android 17 now queries Netflix sessions only, and the optional-access/revocation UI is clearer. The notification grant itself remains broad. The new query path has not yet been tested on the physical phone. See [ANDROID_PERMISSIONS.md](ANDROID_PERMISSIONS.md).

## Earlier external-player sync increment

The new signed-in room panel supports a bounded one-minute host/follower test. The host selects a public Netflix catalog identifier and publishes observed playback from Netflix; a follower attempts matching pause/play/seek controls. Both devices open the official Netflix app and wait eight seconds before the test begins.

The native runner calls only this project's authenticated playback RPCs using its own Orbit access token in memory. It verifies the actual Netflix media ID, session, playback state, position, timing and capabilities before control requests; rechecks identity before each action; and stops when controls are not acknowledged. Failed requests do not replay cached commands. The test has cancellation and automatically ends after about one minute, subject to an in-flight network timeout.

**Automatic Netflix compatibility and cross-device playback are not verified. This is not a full-movie background session.** If Netflix does not expose a supported numeric catalog ID or usable controls, the route intentionally stops. Ads and nonstandard playback rates are outside the test contract; use normal 1× playback.

The earlier 1.2.0 development build finished successfully: [Orbit 1.2.0](https://expo.dev/accounts/jgoff/projects/orbit/builds/11042537-beb5-4d00-ae1a-45842b29c7a6). Its source commit was 3f1fa48. The native planner's Kotlin unit tests ran successfully before APK assembly. The later UI labels, instructions and cache exclusion changes do not alter the native binary and are loaded through the development server.

## Checks and remaining access

- Dependency compatibility, all JavaScript/database tests, lint and TypeScript passed. Android compilation and native planner unit tests passed in EAS; Pixel installation and native-method availability were verified.
- Supabase CLI sign-in is working and the target project reports ACTIVE_HEALTHY. Migration 002 was applied through the Management API after confirming the existing private-room schema; do not rerun either migration on this project.
- The previously signed-in Google account now has room access. No other accounts were approved. Public Auth settings returned HTTP 200 with Google enabled. The user confirmed that Orbit Google sign-in works and that the reset concerns Netflix streaming, rather than Orbit authentication.
- Hosted verification passed for host publish/read, stale revision rejection, outsider RLS/RPC denial and grants. Its temporary room and timeline were rolled back. Anonymous playback access returned HTTP 401 / PostgreSQL code 42501 through the public API. Direct member table writes and anonymous RPC execution are denied.
- Netflix is installed, and the user granted Orbit's optional controls permission. Netflix repeatedly exits before login/playback, including on a separate standard-page emulator with Orbit absent. Restarting the Pixel did not fix startup. See [NETFLIX_STARTUP_INVESTIGATION.md](NETFLIX_STARTUP_INVESTIGATION.md); the cause remains unknown and automatic playback is still unverified.
- The original Pixel/server were restored during the earlier emulator investigation. Today’s 1.3.0 build does not depend on either; no ADB device was connected at the latest check. Orbit sessions remain memory-only. A live signed-in room check is still pending user feedback.
- The new room playback UI has not been tested with a live signed-in room. Automated tests exercise database authorization, timing, stale revisions, content matching and simulated players; these are not real Netflix results.
- The package audit still reports 24 moderate and one high finding. The high finding is a transitive zod dependency in ESLint development tooling. No forced major dependency upgrades were applied.

## Delivery order

1. Establish actual Netflix playback inside Orbit on the physical Pixel, then verify actual player identity/controls and two-device synchronization. The emulator startup issue and external controls are historical diagnostics, not completion of the required player.
2. Add YouTube, Prime Video and Disney+ adapters, reusing shared room and timing code while verifying each provider separately.
3. Add room text chat and realtime voice.

No other-platform synchronization or text/voice chat is implemented yet. See [PLAYBACK_SYNC_SETUP.md](PLAYBACK_SYNC_SETUP.md) and [NETFLIX_ANDROID_TEST.md](NETFLIX_ANDROID_TEST.md) for the current protocol and test contract.

## Latest public authentication health check

The configured Supabase public Auth settings returned HTTP 200 with Google enabled during this development session. No Google Cloud, account-approval or database settings were changed for the in-app browser experiment. Existing hosted database verification above is prior evidence; this health check does not substitute for a real signed-in room/device test.
