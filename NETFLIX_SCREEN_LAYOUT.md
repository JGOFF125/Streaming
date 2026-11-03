# Netflix screen layout and entry-point test

Orbit 1.3.1, Android versionCode 8. November 3, 2026 (UTC).

## Screenshot finding

The user-supplied image shows Netflix's signed-in mobile landing page, headed "Netflix is better with the app" and saying its app is needed to watch on mobile. This is an app-required page, not a demonstrated movie player or a player/DRM error code. The image does not reveal the authenticated page URL, so do not invent its path. The older v1 background_closed field describes Orbit lifecycle cleanup and cannot identify Netflix's reason.

The original embedded surface also lost width to two surrounding panels and used a fixed 540-point height inside the main scroll view. This made provider forms and controls cramped.

## Implemented change

- A dedicated /netflix screen uses Expo Router, with the existing room screen as home.
- The browser fills the available safe-area width and remaining screen height. It is not nested inside the home scroll view.
- Back, reload and close stay outside the provider page. Details/results use a separate scrollable overlay; protected-media consent appears above the browser.
- Android window layout explicitly resizes for the keyboard. Native WebView supports normal viewport sizing and pinch zoom without changing its real user agent.
- The prior v2 diagnostic fix ships with this screen: page/blocking history is separate from background closure; observations are frozen when selected; only bounded fixed event codes leave the native surface.
- Router paths are allowlisted to home and /netflix. OAuth callback parameters are not stored in navigation state; the existing independent WebBrowser flow still validates the original callback, S256 PKCE and state.
- Expo-compatible navigation, safe-area and screen packages were installed using expo install. Web packages support local layout verification; the Netflix browser remains Android-only.
- No provider passwords, cookies, DOM, network bodies, certification data or protected streams are read or exported. No new app permission is requested by this feature.

## Separate page-routing experiment

After opening Netflix and signing in, Details offers its normal public browse page or a public title/watch link. The existing catalog parser strips URL parameters and accepts only official links or a positive numeric ID. Native code validates again and constructs only https://www.netflix.com/browse or https://www.netflix.com/watch/ followed by 1–12 digits. Arbitrary URLs, credentials, paths and query strings cannot enter this command.

This may still return Netflix's app-required page. It is a bounded entry-point comparison, not a claim of supported Android browser playback, a DRM workaround or automatic sync. Diagnostics export only login/browse/watch_link labels, not the user's title link or catalog ID. A selected ID never overrides actual player identity; titleIdentityVerified and automaticSyncVerified remain false.

## Verification

Lint and typecheck pass. The complete app/database suites passed; the added entry-point diagnostic test also passed after the initial run. Fifteen pure Kotlin tests pass locally, including seven provider boundary tests and eight existing planner tests. Expo's dependency compatibility check passes.

Local web layout preview measured the browser stage at 412×788 in a 412×915 viewport and 320×441 in a 320×568 viewport, with no horizontal overflow. Details open/dismiss and navigation back home were checked; a disposable local notes value survived navigation and was cleared afterwards. These are web layout checks only. No streaming login page was captured during QA, no account was used and no sign-in request was submitted.

The Android cloud build, native test task and release assembly passed. The signed APK passed the permission/backup/signature/bundled-app audit; its manifest declares MainActivity adjustResize and the existing Google callback scheme. Real keyboard behavior, Google sign-in after routing changes and Netflix page-routing results are separate physical-device gates still pending feedback. Movie playback and two-device sync remain unresolved.

## Verified standalone APK

[Download Orbit 1.3.1](https://expo.dev/artifacts/eas/Q9D5EyjGtrEoHwyJsO2lAUERXnDS6xbvl_uQzQbQWZc.apk) · [Build](https://expo.dev/accounts/jgoff/projects/orbit/builds/b44e514e-a32e-4ce4-a92c-33755c7507d5). Source ab6c2c3, Android versionCode 8. Size 91886957 bytes. SHA-256 2b87a1d0a78656a25b635df4e35c42114ad54317f0cf517d4b12173124be4c84. The certificate matches the previously installed Orbit APK; no Expo Go or local server is required. Artifact verification does not establish Netflix compatibility.
