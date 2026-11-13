# Local Netflix catalog recognition — 1.3.5

## Physical 1.3.5 result — November 13, 2026

The user supplied a v4 report with installed Orbit 1.3.5 / code 12. The on-phone candidate check returned series 80997085, candidate episode 80130308, season 1 episode 5, from 2 reference series / 72 unique episodes. The active playing player reports position 21391 ms and duration 4078000 ms. This confirms the local lookup ran in the actual app. identityVerified and commandsAllowed remain false.

All ALBUM/ARTIST/ALBUM_ARTIST presence and usable flags are false; distinctContextPresent is false and matchedContextSeriesCount is zero. Standard title equals preferred display title, metadata ID/URI remain absent and no active queue key is reported. This snapshot supplies no independent series context or trusted movie ID. lastTest is null: no new play/pause/seek acknowledgment was tested. Unchanged remembered-label flags are not an episode-transition failure without a known comparison baseline. No repeat of this same metadata test is requested.


November 13, 2026. Signed build and binary audit passed; physical test pending. This increment makes automatic local candidate matching visible; it does not enable trusted identity or automatic synchronization.

## Current verified APK — 1.3.5, November 13, 2026

The [Orbit 1.3.5 standalone APK](https://expo.dev/artifacts/eas/NqXW_052iDqGIz72-kIWeFG6qpDm9O0L4w5uw0nT0AM.apk) ([successful build](https://expo.dev/accounts/jgoff/projects/orbit/builds/5625c7ba-5626-43bc-aead-37f32f35df6f)) passed full native compilation, the non-skipped native test task, release assembly and the final binary audit. Source 40d122601f976828c117d9dcc8ce2391c0a2dc45; Android code 12. Local lint/typecheck, all 104 JavaScript/database tests, all 42 pure Kotlin tests and Android Metro/Hermes export passed.

APK size 91913337 bytes; SHA-256 7550604abd0be842a9042a1aca1b2827d3f0e227fa55f2f47ab040d50788459d. Its signing certificate matches prior Orbit APKs. The standalone app, ARM64, disabled backup, non-debuggable release, keyboard adjustResize and Google callback scheme were verified. Declared permissions remain only INTERNET and the app-scoped DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION. The existing optional broad Android notification-listener grant remains separate; no overlay, microphone or foreground-service permission was added. Inspection of the actual bundled JavaScript confirms v4 (not v3), the automatic local candidate panel, context evidence and installed-build reporting.

The new local check runs automatically on fresh active-player snapshots against two public development reference series (Narcos: Mexico and Stranger Things), 72 unique episode IDs / 144 localized records in Spanish and English. It reports episode candidates and distinct-context support/conflicts, with every identityVerified and commandsAllowed flag remaining false. Standard ALBUM/ARTIST/ALBUM_ARTIST context is inspected locally but its availability/series meaning on the physical phone is unknown. Raw labels are excluded from shared reports, and no phone labels are uploaded to a backend or search engine by this feature. The actual-ID native playback gate is unchanged.

Next phone action: install the 1.3.5 update, play a reference-series episode in official Netflix, Home into PiP, Orbit → Netflix controls check → Refresh check → Share diagnostic result. The panel should say v4 / installed 1.3.5 / build 12; inspect catalogRecognition and contextEvidence, and ask whether any additional local label actually names the series. Remember labels is not needed. This is not the earlier v3 active-queue test. Physical local recognition/context, automatic unique movie identity, embedded Netflix rendering and real two-device synchronization are still unverified. See [NETFLIX_RECOGNITION_TEST.md](NETFLIX_RECOGNITION_TEST.md).

No live build watcher or artifact verifier remains. The checkout and GitHub are synchronized after this record. No Google/Supabase settings, database schema, streaming account, dependency or service was changed.

## What changed

The diagnostic panel runs the existing pure matcher on each fresh successful snapshot. It checks the observed episode title, S1:E3-style subtitle, season/episode numbering and exact duration against a deliberately small public reference catalog. The source data contains two series, 72 unique episode IDs and 144 localized Spanish/English records. Names come from matching public TVSeries structured-data records, with explicit source URLs. The asset contains public catalog metadata only; no user history or raw phone reports are included.

The reference catalogs are Narcos: Mexico and Stranger Things. Other series are outside this test's coverage. This scope is visible on screen. The reference builder reads already inspected public-catalog files under ignored .expo/catalog-evidence and validates source, IDs, numbering and cross-locale consistency. It performs no automatic crawl. Four fresh bounded public page reads were used: /mx/title/80997085, /ca/title/80997085, /mx/title/80057281 and /ca/title/80057281.

The optional Netflix controller now reads three additional standard text fields: ALBUM, ARTIST and ALBUM_ARTIST. Android documents these as generic media/artist fields, not as Netflix series identity; their presence and meaning on the phone are unknown. [Android metadata fields](https://developer.android.com/reference/android/media/MediaMetadata). The same bounds/generic-label/Unicode cleanup apply, object logs omit raw values, and shared reports contain presence flags only. No notification text, custom keys, artwork, credentials or session extras are read. Additional context stays local.

The recognizer ignores repeated episode labels as independent context, reports conflicts/ambiguity, and never authorizes controls. Even context_supports_candidate retains identityVerified false and commandsAllowed false. It never populates snapshot.contentId, writes a timeline or starts playback. The native control planner continues using only its original metadata identity and skips context/queue evidence reads. There is no manual same-movie confirmation fallback.

Native snapshots also include this app's installed package version/code, available without the optional controls permission. The panel and v4 report display it. [Android package version](https://developer.android.com/reference/android/content/pm/PackageInfo). No device identifier is included.

## Checks and delivery gate

Lint/typecheck, all 104 JavaScript/database tests and all 42 pure Kotlin tests pass. Tests cover lost/ambiguous players, changing episodes, repeated/contradictory context, cross-series collisions, localization deduplication, all 144 bundled records, safe catalog aliases, installed-version reporting and raw-label exclusion in top/before/after reports. Android Metro/Hermes export passed. Full native cloud build, the non-skipped native test task, release assembly and signed-artifact audit passed. Physical recognition/context checks are pending.

No permissions, dependencies, Google/Supabase settings, database schema or foreground service changed. The optional Android notification-listener grant remains broad, and is required only for the external Netflix diagnostics. Protected Netflix playback inside Orbit and real two-phone synchronization remain unverified.

## One-phone acceptance after APK verification

1. Install the verified 1.3.5 update linked above; no uninstall or Expo Go is needed. Check that the panel says report v4, installed Orbit 1.3.5 and build 12.
2. Start an episode from either reference series in official Netflix, go Home into PiP, return to Orbit and tap Refresh check. The candidate check runs automatically; Remember labels is not required.
3. Share diagnostic result. Inspect catalogRecognition, contextEvidence and appBuild. If Additional labels published by Netflix shows useful text, check locally whether any line actually names the series. Raw values stay out of the report.
4. Only if needed to validate transition handling, switch episodes and refresh; the candidate must change or disappear, and must never remain as a trusted previous identity. A paused or playing snapshot can be inspected; buffering/unavailable players yield no candidate.

One phone is sufficient to evaluate this recognition step. Neither a successful candidate nor matching context proves the two-person synchronization or intended embedded-player experience.
