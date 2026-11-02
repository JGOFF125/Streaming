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
