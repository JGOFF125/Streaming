# Orbit Netflix playback requirement and evidence

Updated November 2, 2026 (UTC).

## Required experience

The user requires the movie to play inside Orbit's room alongside text and voice, like the experience they describe in Rave. Opening and controlling a separate Netflix app is an optional diagnostic, not completion of that product requirement. This is now recorded in AGENTS.md.

## Physical-device result

The user installed Orbit 1.2.1 on a real Pixel 10 Pro XL with Android 17. Official Netflix playback and Orbit launch work. Their shared diagnostic records an active Netflix session, position reporting, advertised play/pause/seek capabilities and an observed seek. The seek also changed the reported state from paused to playing; it is not evidence of state-preserving seeking or independently verified play/pause commands.

The adapter returned contentId: null before and after the seek. This means no accepted numeric catalog identity reached Orbit. The raw media-ID value was not collected, so the report does not distinguish absent metadata from an unsupported format. The native host/follower window intentionally stops with identity_unavailable. Do not replace actual identity with the room's selected title, infer it from duration, or label this report automatic synchronization. No two-device result exists.

The raw report is retained only in ignored local diagnostic storage; this repository records the minimal engineering conclusions.

## Integration feasibility

The current native adapter provides Android transport controls for the external Netflix package. It cannot render Netflix's video in Orbit.

Netflix's published browser support lists computer browsers, iPad Safari and Meta Quest; it does not establish Android WebView playback support. A generic embedded browser, public landing-page load or successful login is not proof that protected movies will play, remain authorized and accept supported synchronization commands.

Rave's FAQ says its users can sign into subscription providers inside Rave. It does not publish the implementation, player integration contract or permission model. Its product behavior does not establish an integration available to Orbit. No documented, usable embedded Netflix Android player integration was established in this investigation; this remains an open feasibility blocker, not a claim that every conceivable integration is impossible or that a particular partnership is mandatory.

Android cross-app activity embedding also requires the embedded app to opt in or trust the host certificate. All seven public manifests in the officially installed Netflix 9.89.0 APK/split set were checked, with no embedding opt-in attributes found. This rules out simply embedding that inspected app through the documented normal cross-app mechanism; it does not establish the configuration of every Netflix version or a different player integration. No private app data was read.

The next Netflix implementation gate is a verified in-app playback and authentication path on the real device, with a reliable content identity and supported controls. Preserve provider protections and do not collect streaming credentials/cookies or fabricate a player around extracted protected streams. No embedded Netflix implementation or full-movie synchronization is currently delivered.

## Permissions

Android's external-session APIs require privileged media access or an owner-enabled notification listener. A Netflix-specific query can reduce reads on Android 17, but it does not narrow the notification-access grant itself. Core Orbit Google sign-in and rooms must continue to work with this grant off. Notification text is ignored and all listener notification categories remain disabled.

Version 1.2.2 removes unused overlay, legacy external storage, vibration and install-referrer permissions, and uses the Android 17 Netflix-specific session query. The finished signed APK and native test task passed; binary inspection confirmed the five grants are absent. See [ANDROID_PERMISSIONS.md](ANDROID_PERMISSIONS.md). On older Android versions it filters the legacy session list before reading metadata. The current optional grant remains broad and must be explained accurately, with an obvious review/revoke route. This is privacy cleanup of a diagnostic, not an embedded-player implementation.

## Primary sources

- [Netflix browser support](https://help.netflix.com/en/node/30081)
- [Netflix Android setup](https://help.netflix.com/en/node/23939)
- [Rave FAQ](https://rave.io/faq)
- [Android MediaSessionManager](https://developer.android.com/reference/android/media/session/MediaSessionManager)
- [Android activity embedding](https://developer.android.com/develop/ui/views/layout/activity-embedding)
- [Expo permission removal](https://docs.expo.dev/guides/permissions/)

## Competitor workflow research

See [WATCH_PARTY_RESEARCH.md](WATCH_PARTY_RESEARCH.md) for the November 2 public workflow/UI comparison. The recommended next experiment is a legitimate isolated in-app provider playback surface, rather than embedding the Netflix Android activity or expanding notification-based external control. Competitor mobile workflows justify testing that candidate but do not prove that a generic WebView will play Netflix. Missing public SDK documentation is not a substitute for a bounded physical-device feasibility test.

## Implemented candidate: 1.3.0

The normal Android browser candidate is now implemented as an isolated native surface, with no JS bridge or provider data extraction. It is not connected to the room timeline and is not a verified Netflix player. See [IN_APP_NETFLIX_TEST.md](IN_APP_NETFLIX_TEST.md) for boundaries and physical-device acceptance steps. Success requires actual movie playback rather than page/authentication success.

## Physical-device result: November 3, 2026 (UTC)

The user reports that Orbit 1.3.0 allows Netflix sign-in but then asks for the separate Netflix app. Their v1 diagnostic selected sign_in_only, with background_closed as its final browserEvent and both verification flags false. This is evidence of unsuccessful embedded movie playback in this tested configuration. The final lifecycle code does not establish why Netflix requested the app, a browser/DRM error, or a crash. The screenshot received later shows Netflix’s signed-in mobile app-required landing page, with no player error code. Its authenticated page URL was not collected.

The user also reports that Netflix in Chrome on the same phone, with Desktop site enabled, still requests the app or blocks playback. This does not establish a successful alternative renderer. Do not issue a user-agent-only Orbit rebuild on the assumption that desktop mode fixes it. Netflix's published browser page covers computers, iPad and Meta Quest; its Android setup guide directs users to its app. These sources are consistent with a compatibility limitation, but neither proves every conceivable Android integration impossible.

The ordinary system-WebView candidate has not passed the first movie-playback gate. A usable Android in-app integration, actual player identity, transport controls and two-device synchronization are still unestablished. Rave's public workflow description and Netflix device-partner SDK articles do not supply an Android app embedding implementation Orbit can deploy. No mandatory partnership requirement has been established either. The received screenshot classifies this attempt as a mobile app-required landing page. The user reports that the 1.3.1 page-entry comparison still asks for its app or blocks playback; individual route outcomes are not isolated; preserve normal authentication and content protection.

Source changes after the shipped APK improve reporting only: v2 keeps a bounded allowlisted event trace, page/blocking events separate from lifecycle closure, freezes observations when selected and names app_required explicitly. Lint, typecheck and all ten Netflix diagnostic/operation tests pass. These changes are absent from the older 1.3.0 APK and are now included in 1.3.1. Its layout, viewport and constrained page-entry changes retain the ordinary system WebView; no new playback engine or verified movie support is claimed.

Sources: [Netflix browser requirements](https://help.netflix.com/en/node/30081), [Netflix Android setup](https://help.netflix.com/en/node/23939), [Chrome desktop mode](https://developer.chrome.com/blog/desktop-mode), [Rave FAQ](https://rave.io/faq), [Netflix device testing background](https://netflixtechblog.com/automated-testing-on-devices-fc5a39f47e24). The device SDK article concerns Netflix's partner/device testing and is not evidence of a publicly usable Android embedding API.

## Screenshot and 1.3.1 screen update

November 3: the supplied screenshot confirms Netflix’s signed-in mobile app-required landing page, not a movie player or an exact DRM/player error. Its authenticated URL is unknown. The cramped 540-point nested browser is being replaced by a full-width dedicated screen with keyboard resizing, separate details/results and normal viewport/zoom support. A constrained official browse/watch-link entry-point test is included; it preserves normal authentication and protection and may still return the app-required page. This does not establish playback or identity. See [NETFLIX_SCREEN_LAYOUT.md](NETFLIX_SCREEN_LAYOUT.md). The 1.3.1 Android build/native tests and binary audit passed. The user confirms the full-width layout, keyboard and Google sign-in work, while the official-page comparison still does not play a movie.

## Confirmed 1.3.1 phone feedback

November 3: the user confirms the larger screen and keyboard layout work, and Orbit Google sign-in works. The official browse/title-page comparison still asks for Netflix’s app or blocks playback; the answer does not isolate each route or give an error code. No movie playback, canonical player identity or two-device sync is verified. The system-WebView route remains unsuccessful in the reported configuration. GeckoView is being reviewed as a distinct engine candidate, with no dependency added or Netflix compatibility claimed; see [ANDROID_PLAYER_NEXT_STEP.md](ANDROID_PLAYER_NEXT_STEP.md). The current APK remains 1.3.1.

## Firefox comparison result

November 3, 2026 (UTC): the user reports Firefox also asks for the Netflix app or blocks playback. The exact Firefox mode/version and error were not specified. Together with the earlier Orbit and Chrome results, this supplies no working browser baseline for a GeckoView replacement. The larger screen, keyboard and Google sign-in remain user-confirmed working; Netflix movie playback and automatic sync are blocked/unverified. Keep 1.3.1 as the current APK and do not ship another speculative browser wrapper. See [ANDROID_PLAYER_NEXT_STEP.md](ANDROID_PLAYER_NEXT_STEP.md). The user reaffirmed Netflix investigation, then reported Netflix movie playback inside the official Rave Android app on this Pixel. Orbit’s tested browser route remains unsuccessful; this does not mean the phone cannot support any in-app Netflix integration. See [NETFLIX_NATIVE_INTEGRATION.md](NETFLIX_NATIVE_INTEGRATION.md) for the native-player investigation and remaining provider-session requirements.
