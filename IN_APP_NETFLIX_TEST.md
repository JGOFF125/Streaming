# In-app Netflix playback experiment

Orbit 1.3.0, Android versionCode 7. Implemented November 2, 2026 (UTC). APK build/device results are tracked separately below and in PHONE_TEST_SETUP.md.

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
- Six Kotlin boundary tests cover official URLs, deceptive domains/user-info, external intents, malformed inputs, HTTPS dependencies and protected-media origin/resource restrictions.
- The preview cloud build runs both the existing planner tests and these policy tests before APK assembly.
- The finished artifact must pass the existing binary permission checker, signature check and standalone bundle check.
- Neither compiler/tests nor an emulator page load establishes real Netflix movie playback. Physical-device feedback is pending.

## Documentation consulted

- [Expo SDK 58](https://docs.expo.dev/versions/v58.0.0/)
- [Expo native view tutorial](https://docs.expo.dev/modules/native-view-tutorial/)
- [Expo module lifecycle/API](https://docs.expo.dev/modules/module-api/)
- [Android unsafe URI loading guidance](https://developer.android.com/privacy-and-security/risks/unsafe-uri-loading)
- [Android WebChromeClient](https://developer.android.com/reference/android/webkit/WebChromeClient)
- [Android website permission requests](https://developer.android.com/reference/android/webkit/PermissionRequest)
- [Netflix browser support](https://help.netflix.com/en/node/30081)
