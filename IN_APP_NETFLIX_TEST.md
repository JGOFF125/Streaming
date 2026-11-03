# In-app Netflix playback experiment

Orbit 1.3.0, Android versionCode 7. Implemented November 2, 2026 (UTC). The initial standalone APK is finished; the reported phone result is Netflix sign-in followed by its app-required page. The newer 1.3.1 screen and entry-point test are documented in PHONE_TEST_SETUP.md.

## Purpose and limits

This is the first bounded test of the required video-inside-Orbit experience. It uses Android's normal system WebView and Netflix's official website, without a desktop user agent, provider app embedding, protected-stream extraction or altered content protection. Netflix may reject this browser. Rendering a page, signing in, or observing a trailer is not proof that a full movie or episode plays.

The panel is deliberately separate from the existing external Netflix diagnostics and room timeline. It does not expose a player identity, position or control interface and cannot publish automatic synchronization. An observation marked Movie played is explicitly user-reported; titleIdentityVerified and automaticSyncVerified remain false. Do not replace the native external adapter's missing identity with a room selection.

No two-phone synchronization, fullscreen/landscape support, subtitles/audio-selection verification, chat or voice is delivered by this experiment. The first surface is portrait and inline. Fullscreen requests are declined with a visible explanation. Closing Orbit or leaving its foreground destroys the experimental browser rather than silently running it in the background. Reopening starts from the official sign-in page and may use remembered provider authentication. Switching to email or another app during Netflix sign-in also ends this bounded test.

## Physical Pixel test

1. Install the finished 1.3.0 standalone APK over the existing Orbit app. It does not need Expo Go, a QR code or a computer server.
2. Open Netflix inside Orbit, then Test Netflix inside Orbit. It does not require Orbit Google sign-in, room membership or notification access; this isolates the playback feasibility test from backend setup.
3. Sign in only through the official Netflix page in the panel, if it permits sign-in. Orbit has no Netflix credential form. Keep passwords and login codes out of chat.
4. Select a full movie or episode using Netflix's own page. If Android requests protected-media permission, Orbit offers Allow protected playback or Decline, with its device-identifier implication explained. This is not a microphone or notification grant.
5. Check whether real movie video and sound remain inside the Orbit panel. A prompt to install/open the Netflix app, a browser-not-supported message or a separate-app launch is not success. Do not alter device identity or protections to work around rejection.
6. Select Movie played, Sign-in / page only, or Netflix blocked playback. The small selectable report contains only your observation and a fixed browser status; it is kept in app memory and is not uploaded.
7. If blocked, report the short provider error code/message and which stage failed, with no password, cookie, login code or authentication URL. Repeated login attempts are not the next step after a consistent compatibility rejection.
8. Close the player. Use Clear Netflix browser sign-in to clear cookies and site storage inside Orbit when desired. It does not sign out Netflix's separate app or erase credentials saved by the Android password manager.

A real-device success would establish only foreground embedded playback. Next gates remain reliable title/episode identity, permitted controls with observed acknowledgments, paused-state-preserving seeks and two independently authorized physical players.

## Privacy and implementation boundary

The native surface lives in the authored local Expo module, not generated root Android files. Its initial URL is fixed to https://www.netflix.com/login. Top-level navigation permits only HTTPS netflix.com or its subdomains, with no user-info or nonstandard port. Lookalikes, HTTP, file/content/data/javascript URLs, external app intents and popup windows are rejected. HTTPS subresources may use Netflix's normal third-party dependencies; this is not a promise that Netflix itself performs no analytics.

There is no JavaScript bridge, injected script, DOM/form read, cookie getter, arbitrary source/header prop or network-body interception. Browser callbacks export fixed status codes and two booleans only; no authentication URLs, page titles, cookies, form values or provider console output reach JavaScript, Supabase, logs or diagnostics. The browser stores provider-managed cookies/site data in Orbit's app-private Android WebView storage. Orbit code does not extract them. Cleanup uses native deletion APIs without reading their values. The cleanup action is app-local, not a guarantee of deleting DRM provisioning or Android password-manager records.

File/content access, mixed HTTP content, third-party cookies, file uploads, downloads and website geolocation are disabled. Camera/microphone and unknown website permission requests are denied. Only a Netflix-origin request containing the protected-media resource alone can reach explicit in-app consent. Certificate failures are cancelled. Native background/destruction handlers dispose the surface and pending permission request. No new Android manifest permission or npm dependency is added.

The normal browser engine may reject features under these deliberately restrictive settings. A failure records this candidate's constraints, not a claim that all legitimate Netflix integrations are impossible.

## Validation

- Lint and TypeScript pass.
- All 62 JavaScript/database checks and 14 pure Kotlin tests passed locally (six browser-policy tests and eight existing planner tests). These are automated logic checks, not a real movie test.
- Six Kotlin boundary tests cover official URLs, deceptive domains/user-info, external intents, malformed inputs, HTTPS dependencies and protected-media origin/resource restrictions.
- Native compilation, the cloud testDebugUnitTest task and release assembly passed in the finished preview build. The native task was not skipped or NO-SOURCE.
- The finished signed artifact passed the binary permission/disabled-backup audit, signature and standalone bundle checks.
- Neither compiler/tests nor an emulator page load establishes real Netflix movie playback. Physical-device feedback is pending.

## Documentation consulted

- [Expo SDK 58](https://docs.expo.dev/versions/v58.0.0/)
- [Expo native view tutorial](https://docs.expo.dev/modules/native-view-tutorial/)
- [Expo module lifecycle/API](https://docs.expo.dev/modules/module-api/)
- [Android unsafe URI loading guidance](https://developer.android.com/privacy-and-security/risks/unsafe-uri-loading)
- [Android WebChromeClient](https://developer.android.com/reference/android/webkit/WebChromeClient)
- [Android website permission requests](https://developer.android.com/reference/android/webkit/PermissionRequest)
- [Netflix browser support](https://help.netflix.com/en/node/30081)

## Provider browser backup boundary (1.3.0)

The new browser keeps Netflix-managed sign-in state in app-private WebView storage until cleared. Android app backup is explicitly disabled through app.json android.allowBackup=false. The finished 1.3.0 APK passed the binary check with --require-no-backup. This setting concerns Android application backup; it is not a claim about Android password-manager records or every OEM device-transfer behavior.

## Verified APK

[Orbit 1.3.0 standalone APK](https://expo.dev/artifacts/eas/o4C3M1fMeDL6vvq1gtyDKqFRuQitqZXy2X1ezJT8_tw.apk) · [Build](https://expo.dev/accounts/jgoff/projects/orbit/builds/8419489c-93bc-4cf8-9854-2e05d7c59954). Source c0527d1, Android versionCode 7, minimum API 24, target API 36. Size 67547938 bytes. Signature verified with the same certificate as the previously installed app. SHA-256: e0c12a46c216ec717a453f05b1192933048ac7659b7ec178ba87ef0b0c490ae7. The app is not debuggable and contains assets/index.android.bundle. This is artifact verification, not a physical Netflix movie result.

## Reported outcome and next source revision

November 3: the user reports sign-in succeeds in the 1.3.0 panel, but Netflix requests its app; no full movie played inside Orbit. Chrome Desktop site on the same phone also failed to play. The original v1 report overwrote page context with background_closed. The v2 reporting fix retains a bounded allowlisted event trace and separates page/blocking events from lifecycle closure; observations are frozen when selected. It also names the user-reported app_required outcome. This fix passes lint, typecheck and five new regression tests, alongside five existing Netflix diagnostic/operation tests. It does not change the renderer or solve playback, and is now shipped in 1.3.1 alongside the larger screen and constrained official-page comparison. The received screenshot shows the mobile app-required page with no player error code. See NETFLIX_EMBEDDED_FEASIBILITY.md.

## Screenshot and 1.3.1 screen update

November 3: the supplied screenshot confirms Netflix’s signed-in mobile app-required landing page, not a movie player or an exact DRM/player error. Its authenticated URL is unknown. The cramped 540-point nested browser is being replaced by a full-width dedicated screen with keyboard resizing, separate details/results and normal viewport/zoom support. A constrained official browse/watch-link entry-point test is included; it preserves normal authentication and protection and may still return the app-required page. This does not establish playback or identity. See [NETFLIX_SCREEN_LAYOUT.md](NETFLIX_SCREEN_LAYOUT.md). The 1.3.1 Android build/native tests and binary audit passed. The full-width layout, keyboard and official-page comparison still require device feedback.

## Current 1.3.1 instructions

Use [the 1.3.1 APK](https://expo.dev/artifacts/eas/Q9D5EyjGtrEoHwyJsO2lAUERXnDS6xbvl_uQzQbQWZc.apk). Open Netflix inside Orbit → Open Netflix test screen. The website fills the dedicated screen; Details contains cleanup, official browse/title-link controls and observation reports. Start the website first to enable page controls. A public title link goes only to Netflix’s normal watch page, with parameters removed. Copying a public link from another app before opening the test avoids ending this foreground-only experiment. Check Google sign-in as well after the new navigation is installed. The current binary audit passed; Netflix playback and automatic sync have not been verified.

## Confirmed 1.3.1 phone feedback

November 3: the user confirms the larger screen and keyboard layout work, and Orbit Google sign-in works. The official browse/title-page comparison still asks for Netflix’s app or blocks playback; the answer does not isolate each route or give an error code. No movie playback, canonical player identity or two-device sync is verified. The system-WebView route remains unsuccessful in the reported configuration. GeckoView is being reviewed as a distinct engine candidate, with no dependency added or Netflix compatibility claimed; see [ANDROID_PLAYER_NEXT_STEP.md](ANDROID_PLAYER_NEXT_STEP.md). The current APK remains 1.3.1.
