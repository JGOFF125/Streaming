# Local Netflix catalog recognition — 1.3.5

November 13, 2026. Pending signed build and physical test. This increment makes automatic local candidate matching visible; it does not enable trusted identity or automatic synchronization.

## What changed

The diagnostic panel runs the existing pure matcher on each fresh successful snapshot. It checks the observed episode title, S1:E3-style subtitle, season/episode numbering and exact duration against a deliberately small public reference catalog. The source data contains two series, 72 unique episode IDs and 144 localized Spanish/English records. Names come from matching public TVSeries structured-data records, with explicit source URLs. The asset contains public catalog metadata only; no user history or raw phone reports are included.

The reference catalogs are Narcos: Mexico and Stranger Things. Other series are outside this test's coverage. This scope is visible on screen. The reference builder reads already inspected public-catalog files under ignored .expo/catalog-evidence and validates source, IDs, numbering and cross-locale consistency. It performs no automatic crawl. Four fresh bounded public page reads were used: /mx/title/80997085, /ca/title/80997085, /mx/title/80057281 and /ca/title/80057281.

The optional Netflix controller now reads three additional standard text fields: ALBUM, ARTIST and ALBUM_ARTIST. Android documents these as generic media/artist fields, not as Netflix series identity; their presence and meaning on the phone are unknown. [Android metadata fields](https://developer.android.com/reference/android/media/MediaMetadata). The same bounds/generic-label/Unicode cleanup apply, object logs omit raw values, and shared reports contain presence flags only. No notification text, custom keys, artwork, credentials or session extras are read. Additional context stays local.

The recognizer ignores repeated episode labels as independent context, reports conflicts/ambiguity, and never authorizes controls. Even context_supports_candidate retains identityVerified false and commandsAllowed false. It never populates snapshot.contentId, writes a timeline or starts playback. The native control planner continues using only its original metadata identity and skips context/queue evidence reads. There is no manual same-movie confirmation fallback.

Native snapshots also include this app's installed package version/code, available without the optional controls permission. The panel and v4 report display it. [Android package version](https://developer.android.com/reference/android/content/pm/PackageInfo). No device identifier is included.

## Checks and delivery gate

Lint/typecheck, all 104 JavaScript/database tests and all 42 pure Kotlin tests pass. Tests cover lost/ambiguous players, changing episodes, repeated/contradictory context, cross-series collisions, localization deduplication, all 144 bundled records, safe catalog aliases, installed-version reporting and raw-label exclusion in top/before/after reports. Android Metro/Hermes export passed. Full native cloud build and signed-artifact audit remain pending.

No permissions, dependencies, Google/Supabase settings, database schema or foreground service changed. The optional Android notification-listener grant remains broad, and is required only for the external Netflix diagnostics. Protected Netflix playback inside Orbit and real two-phone synchronization remain unverified.

## One-phone acceptance after APK verification

1. Install the verified 1.3.5 update once its APK link is recorded here; no uninstall or Expo Go is needed. Check that the panel says report v4, installed Orbit 1.3.5 and build 12.
2. Start an episode from either reference series in official Netflix, go Home into PiP, return to Orbit and tap Refresh check. The candidate check runs automatically; Remember labels is not required.
3. Share diagnostic result. Inspect catalogRecognition, contextEvidence and appBuild. If Additional labels published by Netflix shows useful text, check locally whether any line actually names the series. Raw values stay out of the report.
4. Only if needed to validate transition handling, switch episodes and refresh; the candidate must change or disappear, and must never remain as a trusted previous identity. A paused or playing snapshot can be inspected; buffering/unavailable players yield no candidate.

One phone is sufficient to evaluate this recognition step. Neither a successful candidate nor matching context proves the two-person synchronization or intended embedded-player experience.
