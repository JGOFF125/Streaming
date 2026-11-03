# Netflix identity and paused-seek corrections — 1.3.2

November 3, 2026 (UTC). This update adds no permissions, player engine, overlay or service.

## Concrete code gap

The prior native adapter accepted only a positive numeric MEDIA_ID and ignored MEDIA_URI. Android documents both as provider-defined content identifiers. Orbit now also recognizes a canonical HTTPS Netflix /watch/ID link in either field. A recognizable conflict between the fields returns no identity. Raw fields, queries and fragments are not exported or retained in diagnostics. [Android metadata contract](https://developer.android.com/reference/android/media/MediaMetadata).

Accepted hosts are netflix.com and www.netflix.com, with HTTPS and the normal HTTPS port only. IDs are 1–12 positive ASCII digits without leading zeroes. Series/title pages, credentials, lookalikes, encoded paths, query-only IDs, opaque strings and malformed or excessive-length URLs are rejected.

This may explain some prior contentId:null results, but the user's raw metadata was never collected, so the actual explanation is unknown. Do not claim Netflix supplies MEDIA_URI, that a movie identity has been recovered on the phone, or that automatic synchronization now works.

## Privacy and synchronization

The report adds only a fixed identity-source label and two field-presence booleans. It does not include raw metadata, URLs, watch titles, account details or provider session data. The backend and native synchronization identity gates are retained; a pasted room link cannot become player identity.

The one-minute room test remains in place. Its follower now waits for a paused seek to reach the observed target, then restores pause and requires full acknowledgment. The planner requires pause capability even if the player was initially paused. This addresses the earlier real-phone seek-induced resume observation; the corrected sequence still needs physical-device confirmation. The standalone local seek test continues to test one seek command. This is not a movie-length sync service.

## Verification and device acceptance

Six new pure Kotlin tests cover recognized identity formats, conflict rejection, malformed and credential-bearing inputs, bounded IDs, and non-export of query/opaque data. Two additional native timing tests cover paused seek restoration and the necessary pause capability. All 23 native policy/identity/planner tests pass. A JavaScript regression checks export filtering; two playback regressions simulate seek-induced resume and unavailable pause. Lint/typecheck, the earlier full app/database suite and the updated 27 playback checks pass. The signed Android build, its native test task and the artifact audit have now passed.

On the physical Pixel: install 1.3.2, start a movie in official Netflix, go Home into its floating window, open Orbit → Netflix controls check → Refresh check → Share diagnostic result. The user has already confirmed Netflix keeps playing above Orbit for 15 seconds. The new presence flags determine whether the provider exposes candidate identity fields without exporting their contents. A non-null ID is not by itself two-device sync proof. If it remains null, do not relax the gate or substitute a user-selected title.

The current source version is 1.3.2, Android code 9. The first queued build 3a257bc3-25c6-46ea-8a16-8dcc642af164 was canceled before delivery to incorporate the paused-seek correction. The replacement build finished and its artifact audit passed. Do not offer the canceled artifact.

The [Orbit 1.3.2 standalone APK](https://expo.dev/artifacts/eas/ltfsvYqAod5cbz3ZZOltRAS-dFVfYm7VYcUDoJXRFcg.apk) ([successful build](https://expo.dev/accounts/jgoff/projects/orbit/builds/36b6d4da-15a8-44c9-b000-eadbb91e28fd)) is verified, from source aee10176cb346bdfe4c1971a23f5c19dad17a823. The cloud native test task ran without being skipped, Gradle and release assembly succeeded, and binary inspection verified the same signing certificate, the bundled app and ARM64 support, disabled backup, keyboard adjustResize and the Google callback scheme. The only declared permissions are INTERNET and the app-scoped DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION; the existing optional broad notification-listener grant remains a separate Android setting. No overlay, microphone or foreground-service permission was added. APK size 91887613 bytes; SHA-256 b65a507c66471b5b95bad7a0ac9d704c13e989be3d9b5a65231edbba7d83c569. Real-phone identity recovery, corrected paused-seek behavior and two-device synchronization remain unverified.

## Current UI direction

The user asks for two geographically separated viewers, visible chat in portrait, and hidden chat during full-screen viewing. They approved the layout and require each viewer to choose portrait/chat or full screen independently; only one physical phone is currently available. They are not yet sure whether the final player should be embedded or use the overlapping-app approach. The normal WebView remains unsuccessful for Netflix.

An overlay compatibility experiment was proposed. Automatic approval review rejected adding SYSTEM_ALERT_WINDOW because the user had not clearly authorized that persistent capability. The rejected command did not run. No overlay implementation or permission change is included in this update. The concrete UI/permission proposal is recorded in [ROOM_EXPERIENCE.md](ROOM_EXPERIENCE.md). Netflix-owned PiP is confirmed by the user on this Pixel and is the next independent compatibility check; it needs no Orbit overlay permission. Neither presentation nor the identity/paused-seek corrections establish two-phone synchronization.
