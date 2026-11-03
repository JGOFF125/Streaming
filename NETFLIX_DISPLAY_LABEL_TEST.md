# Netflix display-label evidence — 1.3.3

November 3, 2026 (UTC). This increment reads provider display metadata; it does not implement a Netflix renderer or declare automatic movie identification/sync verified.

## Device evidence driving this change

The 1.3.2 physical Pixel report has an active playing Netflix session and position/duration/play/pause/seek capability, but neither MEDIA_ID nor MEDIA_URI is present. Parsing more formats cannot recover absent input. The user declined one-time manual movie confirmation and requires automatic movie identification. They then confirmed Android’s expanded Netflix media controls show the actual movie/episode name.

That notification observation is a lead for standard display metadata; it does not prove which field Netflix publishes or that it uniquely identifies an episode. Android documents TITLE, DISPLAY_TITLE, DISPLAY_SUBTITLE and DISPLAY_DESCRIPTION as display fields. [Android MediaMetadata](https://developer.android.com/reference/android/media/MediaMetadata).

## Implemented

The Netflix-only native snapshot now reads those four standard fields. The local screen prefers a useful DISPLAY_TITLE, then TITLE, and shows subtitle/description separately. Blank, excessive-length and known generic Netflix labels are handled conservatively; Unicode is normalized, control/bidi formatting removed and labels bounded to 512 code points. The snapshot carries fixed presence/source evidence as well as local labels.

Remember labels for comparison stores the current labels in screen memory only. After a different item starts, comparison reports whether title, subtitle or description changed. Forget removes the remembered baseline. This sends no playback command, reads no notification text or custom session extras and adds no dependency or permission.

Shared diagnostics v2 export only fixed presence/source flags and comparison booleans, including within before/after snapshots. Raw labels and arbitrary fields are excluded. Labels are not sent to Supabase and cannot become a catalog ID. The existing actual-ID synchronization gate, server schema, native planner and control acknowledgment remain intact. A matching name/duration or manual confirmation cannot satisfy the user’s required automatic movie identification.

## Verification

Lint/typecheck, 14 Netflix diagnostic/operation tests and 27 playback/client/database tests pass. All 28 pure Kotlin policy/identity/planner/display tests pass, including Unicode bounds, generic-label handling and accidental object-log privacy. The [signed native build](https://expo.dev/accounts/jgoff/projects/orbit/builds/d5822f62-814f-4850-83df-1020cf085282) is submitted from source 11598a93d5bfbd475c01c2d96cc506547ca252be. Cloud native tests, release assembly and binary audit are pending; do not offer an unverified APK. Physical label capture and episode discrimination are untested.

## Physical Pixel acceptance, after a verified APK is available

1. Install 1.3.3. Start an actual Netflix movie, go Home into its floating window, open Orbit → Netflix controls check → Refresh check. Check locally whether Netflix’s labels match the current item. Do not paste raw titles or screenshots of account details.
2. For an available series, start one episode and refresh Orbit. Tap Remember labels for comparison.
3. Open a different episode of that same series in Netflix, return and refresh. Inspect which label fields changed. Different labels alone do not prove a globally unique identity; unchanged/generic labels cannot establish episode discrimination.
4. Share diagnostic result exports the fixed evidence and comparison booleans, not raw titles. A phone report must determine the next adapter change; no automatic sync claim follows from a successful build.

The approved room layout remains a prototype; each viewer chooses portrait/chat or full-screen independently. Only one physical phone is available. Netflix, Disney+ and Prime Video rendering inside Orbit and actual two-device synchronization remain incomplete.
