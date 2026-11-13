# Netflix display-label evidence — 1.3.3

The two November 12 phone reports below complete this increment’s same-item/different-episode label comparison. The next test uses the [verified 1.3.4 active-item and alternate-title APK](NETFLIX_ACTIVE_ITEM_TEST.md). These observations do not establish a catalog resolver or automatic sync.

## Different-episode result — November 12, 2026

The user supplied the follow-up 1.3.3 report after the requested episode change. The remembered-label comparison is available: titleChanged and subtitleChanged are true; descriptionChanged is false (description remains absent). The new playing session has position 15869 ms and duration 4087000 ms; the earlier same-episode report had duration 3492000 ms. Both reports expose useful DISPLAY_TITLE and subtitle fields, no MEDIA_ID/MEDIA_URI and null contentId.

This establishes observed label discrimination across these two tested episodes on this phone. It does not establish globally unique identity, cross-language matching, a catalog resolver, embedded Netflix playback or two-device sync. No raw names were included. The pending local-title clarification asks whether the labels also identify the series; no series identity is inferred from season/episode numbers alone.


## Physical label result — November 12, 2026

The user reports the 1.3.3 local display shows the episode name, season and episode number. The supplied v2 report confirms DISPLAY_TITLE was selected, title/display-title/subtitle fields are present, description is absent and the title is usable. The playing session reports position 27440 ms, duration 3492000 ms and play/pause/seek support. MEDIA_ID and MEDIA_URI remain absent; contentId is null.

All three comparison flags are false. The user explicitly clarified they stayed on the same episode after remembering the labels, so this is the expected unchanged-item result, not a failed episode-change test. Capture of useful episode labels is user-confirmed; cross-episode discrimination, unique catalog mapping, embedded playback and real two-device sync remain unverified. No raw titles were supplied or retained.

Next phone action: keep the remembered baseline, play a different episode of that same series, return and refresh, then share the report and say whether the visible name/number updated. Do not press Remember again before exporting the comparison. The active-item diagnostic added in source is not installed in 1.3.3, so its missing queueEvidence field is expected.


November 3, 2026 (UTC). This increment reads provider display metadata; it does not implement a Netflix renderer or declare automatic movie identification/sync verified.

## Device evidence driving this change

The 1.3.2 physical Pixel report has an active playing Netflix session and position/duration/play/pause/seek capability, but neither MEDIA_ID nor MEDIA_URI is present. Parsing more formats cannot recover absent input. The user declined one-time manual movie confirmation and requires automatic movie identification. They then confirmed Android’s expanded Netflix media controls show the actual movie/episode name.

That notification observation is a lead for standard display metadata; it does not prove which field Netflix publishes or that it uniquely identifies an episode. Android documents TITLE, DISPLAY_TITLE, DISPLAY_SUBTITLE and DISPLAY_DESCRIPTION as display fields. [Android MediaMetadata](https://developer.android.com/reference/android/media/MediaMetadata).

## Implemented

The Netflix-only native snapshot now reads those four standard fields. The local screen prefers a useful DISPLAY_TITLE, then TITLE, and shows subtitle/description separately. Blank, excessive-length and known generic Netflix labels are handled conservatively; Unicode is normalized, control/bidi formatting removed and labels bounded to 512 code points. The snapshot carries fixed presence/source evidence as well as local labels.

Remember labels for comparison stores the current labels in screen memory only. After a different item starts, comparison reports whether title, subtitle or description changed. Forget removes the remembered baseline. This sends no playback command, reads no notification text or custom session extras and adds no dependency or permission.

Shared diagnostics v2 export only fixed presence/source flags and comparison booleans, including within before/after snapshots. Raw labels and arbitrary fields are excluded. Labels are not sent to Supabase and cannot become a catalog ID. The existing actual-ID synchronization gate, server schema, native planner and control acknowledgment remain intact. A matching name/duration or manual confirmation cannot satisfy the user’s required automatic movie identification.

## Verification

Lint/typecheck, 14 Netflix diagnostic/operation tests and 27 playback/client/database tests pass. All 28 pure Kotlin policy/identity/planner/display tests pass, including Unicode bounds, generic-label handling and accidental object-log privacy. The signed native build, cloud native test task, release assembly and artifact audit have now passed.

The [Orbit 1.3.3 standalone APK](https://expo.dev/artifacts/eas/SxPOeZ9g3XBE8WCwhQD7tVZeu2TqFmrI11mpbXTAqO4.apk) ([successful build](https://expo.dev/accounts/jgoff/projects/orbit/builds/d5822f62-814f-4850-83df-1020cf085282)) is verified, from source 11598a93d5bfbd475c01c2d96cc506547ca252be. The cloud native test task ran without being skipped, Gradle and release assembly succeeded, and binary inspection verified the same signing certificate, bundled app, ARM64 support, disabled backup, keyboard adjustResize and the Google callback scheme. The declared permissions remain INTERNET and the app-scoped DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION; the existing optional broad notification-listener grant remains separate. APK size 91889833 bytes; SHA-256 a6cf257940136736b7093f067576113776471cc690b089eb1993ba18bbbe6feb. The November 12 phone result above confirms useful label capture. Episode discrimination, reliable automatic movie/episode identification, embedded Netflix playback and two-device sync remain unverified.

## Physical Pixel acceptance for the delivered APK

1. Install 1.3.3. Start an actual Netflix movie, go Home into its floating window, open Orbit → Netflix controls check → Refresh check. Check locally whether Netflix’s labels match the current item. Do not paste raw titles or screenshots of account details.
2. For an available series, start one episode and refresh Orbit. Tap Remember labels for comparison.
3. Open a different episode of that same series in Netflix, return and refresh. Inspect which label fields changed. Different labels alone do not prove a globally unique identity; unchanged/generic labels cannot establish episode discrimination.
4. Share diagnostic result exports the fixed evidence and comparison booleans, not raw titles. A phone report must determine the next adapter change; no automatic sync claim follows from a successful build.

The approved room layout remains a prototype; each viewer chooses portrait/chat or full-screen independently. Only one physical phone is available. Netflix, Disney+ and Prime Video rendering inside Orbit and actual two-device synchronization remain incomplete.
