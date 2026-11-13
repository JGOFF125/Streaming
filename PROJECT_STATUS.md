# Orbit — current status

## Current verified APK — 1.3.5, November 13, 2026

The [Orbit 1.3.5 standalone APK](https://expo.dev/artifacts/eas/NqXW_052iDqGIz72-kIWeFG6qpDm9O0L4w5uw0nT0AM.apk) ([successful build](https://expo.dev/accounts/jgoff/projects/orbit/builds/5625c7ba-5626-43bc-aead-37f32f35df6f)) passed full native compilation, the non-skipped native test task, release assembly and the final binary audit. Source 40d122601f976828c117d9dcc8ce2391c0a2dc45; Android code 12. Local lint/typecheck, all 104 JavaScript/database tests, all 42 pure Kotlin tests and Android Metro/Hermes export passed.

APK size 91913337 bytes; SHA-256 7550604abd0be842a9042a1aca1b2827d3f0e227fa55f2f47ab040d50788459d. Its signing certificate matches prior Orbit APKs. The standalone app, ARM64, disabled backup, non-debuggable release, keyboard adjustResize and Google callback scheme were verified. Declared permissions remain only INTERNET and the app-scoped DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION. The existing optional broad Android notification-listener grant remains separate; no overlay, microphone or foreground-service permission was added. Inspection of the actual bundled JavaScript confirms v4 (not v3), the automatic local candidate panel, context evidence and installed-build reporting.

The new local check runs automatically on fresh active-player snapshots against two public development reference series (Narcos: Mexico and Stranger Things), 72 unique episode IDs / 144 localized records in Spanish and English. It reports episode candidates and distinct-context support/conflicts, with every identityVerified and commandsAllowed flag remaining false. Standard ALBUM/ARTIST/ALBUM_ARTIST context is inspected locally but its availability/series meaning on the physical phone is unknown. Raw labels are excluded from shared reports, and no phone labels are uploaded to a backend or search engine by this feature. The actual-ID native playback gate is unchanged.

Next phone action: install the 1.3.5 update, play a reference-series episode in official Netflix, Home into PiP, Orbit → Netflix controls check → Refresh check → Share diagnostic result. The panel should say v4 / installed 1.3.5 / build 12; inspect catalogRecognition and contextEvidence, and ask whether any additional local label actually names the series. Remember labels is not needed. This is not the earlier v3 active-queue test. Physical local recognition/context, automatic unique movie identity, embedded Netflix rendering and real two-device synchronization are still unverified. See [NETFLIX_RECOGNITION_TEST.md](NETFLIX_RECOGNITION_TEST.md).

No live build watcher or artifact verifier remains. The checkout and GitHub are synchronized after this record. No Google/Supabase settings, database schema, streaming account, dependency or service was changed.


## 1.3.5 build submitted — November 13, 2026

Build 5625c7ba-5626-43bc-aead-37f32f35df6f is building version 1.3.5 (Android code 12) from source 40d122601f976828c117d9dcc8ce2391c0a2dc45. Local checks and Android/Hermes export passed. Cloud native tests, release assembly and the pinned APK audit remain pending. The artifact is not yet verified for delivery. Private build files are in .expo/recognition-build; do not resubmit this build just to check its status.

## 1.3.5 prepared — local automatic candidates and provider context

November 13, 2026. Version 1.3.5 (Android code 12) now connects the public-catalog matcher to the phone diagnostic panel. It automatically checks fresh player snapshots against two explicit development reference series, with 72 unique episodes / 144 localized Spanish-English records. Context fields ALBUM, ARTIST and ALBUM_ARTIST are read only through the existing authorized Netflix-filtered MediaController; they are generic media fields, not documented Netflix series IDs. A distinct standard title can also supply context evidence. Missing, repeated, contradictory or ambiguous context cannot establish identity. The native control planner skips the extra evidence fields and still requires its original actual catalog ID.

The local panel shows candidate public IDs, scope and context status without a confirmation fallback or backend upload. Shared v4 diagnostics export fixed evidence/status flags and public candidate IDs, excluding all raw provider labels. They also report Android's actual installed app version/code, read from this app's own package record, to resolve future old-build reports. No device identifier, notification text, custom session extras, account data, new dependency or permission was added.

Checks passed: lint/typecheck; all 104 JavaScript/database tests; all 42 pure Kotlin tests; Android Metro/Hermes export. Native cloud compilation, signed APK and physical checks are pending. Latest verified delivered APK remains 1.3.4. Actual automatic identity, embedded Netflix playback, two-device sync, text and voice are unfinished. See [NETFLIX_RECOGNITION_TEST.md](NETFLIX_RECOGNITION_TEST.md).


## New public-catalog reader — November 13, 2026

A concrete new source was recovered: Netflix's public title-page markup contains literal SeasonsConnection / EpisodesConnection records with canonical episode videoId, explicit season numbering, episode number, localized title and exact runtimeSec. Earlier JSON-only inspection missed them because the public payload uses JavaScript string escapes. The new tool parses only bounded public catalog syntax using the existing TypeScript compiler; it never executes site scripts or reads account/playback objects.

Live verification succeeded on two official reference catalogs: series 80997085 (3 seasons / 30 episodes) and 80057281 (5 seasons / 42 episodes). In the first catalog, episode 3 of season 1 has canonical ID 80130306 and runtime 4087 seconds. The locally retained observed labels/number/duration produce that candidate; the user independently confirmed the reference series for this development test. This is a successful one-case catalog lookup, not production series binding or globally verified automatic identity.

Source additions: scripts/lib/netflix-public-catalog.mjs, scripts/inspect-netflix-catalog.mjs and src/netflixCatalog.ts. The reusable matcher requires the supported observed subtitle format, consistent episode title/numbering and exact duration, returns ambiguity for cross-series collisions, and always leaves identityVerified and commandsAllowed false. No new native module, dependency, permission, server schema or APK was created. Neither the catalog tool nor matcher is wired into the shipped mobile app. Lint/typecheck and all 91 application/database tests pass. See [NETFLIX_CATALOG_IDENTITY.md](NETFLIX_CATALOG_IDENTITY.md).

Next engineering work: establish independent series context and adequate catalog coverage, then design a validated binding to the actual player before allowing controls. Runtime/localization equality and a single match in a partial index are insufficient proof. Netflix's robots file publishes /sitemap/index; a bounded exploratory read exceeded its 1 MiB cap and was stopped. No child sitemap, background crawler, room upload or global index was started. A desktop-profile/WebView API review still supplies no new Netflix playback evidence, so no speculative browser build was made.


## First 1.3.4 phone result — November 13, 2026

The supplied v3 report confirms ready access, one active playing Netflix session, position 299771 ms, duration 4087000 ms and reported play/pause/seek capability. contentId remains null; both metadata ID fields are absent. The active-item diagnostic returns no_active_item, so its guard does not read a queue description. This does not establish that Netflix never publishes a queue; it establishes no usable active queue key in this snapshot. The standard title is usable but matches the preferred display title, so it supplies no additional series context in this test. No control test was run (lastTest null).

The earlier version mismatch is resolved. Do not ask the user to reinstall 1.3.4 or repeat the same check. The report and supplied local labels are preserved only in ignored device-test files. The actual-ID control gate remains unchanged.


## Phone version clarified — November 13, 2026

The user supplied another v2 report and the two local display lines. Those lines contain an episode title plus a season/episode designation with the same episode title; no series name is present. Raw user-supplied labels are stored only in ignored local device-test evidence. No series, catalog identity or cross-user match was inferred.

The report has null labelComparison, no catalog metadata IDs, no alternate-title evidence and no queueEvidence. Inspection of assets/index.android.bundle in both previously audited APKs confirms 1.3.3 contains the v2 marker and no alternate-title/queue markers; 1.3.4 contains the v3 marker and both new markers, with no v2 marker. The user then checked Android app info and selected 1.3.3 or earlier. This is an installed-version mismatch, not a failed 1.3.4 Netflix test. There is no need for another build or uninstall.

Next action: install the existing verified [1.3.4 APK](https://expo.dev/artifacts/eas/kr4Un0yU-CVd0rxNq28Jkgug96udFXP_VFvcX4RmV4c.apk) using Android's Update action, launch Orbit from its icon, play Netflix in PiP, refresh and share a fresh v3 report. If installation fails, ask for its error text before changing signing/version configuration. Physical active-item/alternate-title evidence is still pending. Actual movie identity, embedded playback and real sync remain unverified.


## Current verified APK — 1.3.4, November 12, 2026

The [Orbit 1.3.4 standalone APK](https://expo.dev/artifacts/eas/kr4Un0yU-CVd0rxNq28Jkgug96udFXP_VFvcX4RmV4c.apk) ([finished cloud build](https://expo.dev/accounts/jgoff/projects/orbit/builds/474dd23a-6fdf-4ceb-81fa-8d04ca160aaf)) passed native compilation, the non-skipped native test task, release assembly and binary audit. Source cda81ffaac4e1df4c7ef5efc8bc07cd2429eb840; Android code 11. Local lint/typecheck, all 79 JavaScript/database tests and all 37 pure Kotlin tests passed. APK size 91891281 bytes; SHA-256 2ab2b9264d791ff2c4eadc49a7674cc873942c27dd6a5069291a38ee72753ffa. The signature matches previous Orbit releases; ARM64, the bundled app, disabled backup, keyboard adjustResize and the Google callback scheme were verified. Only INTERNET and the app-scoped DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION are declared. The existing optional broad notification-access grant remains separate; no overlay, microphone or foreground-service permission was added.

The user's 1.3.3 phone reports confirm useful episode labels, no changes while staying on the same episode, and changed title/subtitle after the requested different-episode test. Both catalog metadata fields remain absent. Version 1.3.4 adds diagnostic-only active-item inspection and retains the separate standard TITLE locally. A queue candidate or label alone cannot populate contentId or enable synchronization. Shared v3 reports omit raw labels/URLs. Physical 1.3.4 availability and series context are pending; actual catalog identity, embedded playback and two-device sync remain unverified.

Next phone action: install 1.3.4 as an update, play a Netflix episode in PiP above Orbit, then Netflix controls check → Refresh check → Share diagnostic result. Inspect queueEvidence and displayEvidence, and ask whether any alternate title identifies the series. No repeat of the 1.3.3 comparison is needed just to establish that its title/subtitle changed. No new control commands are requested by this read-only check.

The public Supabase Auth settings endpoint returned HTTP 200 with Google enabled during this session. This is an endpoint/configuration health check, not a fresh signed-in room or Google callback test. The four existing vendor-inquiry threads still contain only their sent inquiries; no reply, duplicate inquiry or follow-up was sent. No live build watcher remains.


## 1.3.4 build submitted — November 12, 2026

Cloud build 474dd23a-6fdf-4ceb-81fa-8d04ca160aaf is building version 1.3.4 (Android code 11) from cda81ffaac4e1df4c7ef5efc8bc07cd2429eb840. Local lint/typecheck, 79 application/database tests and 37 pure Kotlin tests passed before submission. Native cloud compilation and the final APK/signature/permissions audit are pending. No new download is verified yet. Build status and inspection files are kept locally under .expo/active-queue-build, with exact build/source/version/certificate checks prepared. The next phone report should use the new v3 diagnostic only after artifact verification.


## Next native build — 1.3.4 (code 11)

Prepared from the episode-change evidence. The previous source-only active-item diagnostic is included. The standard metadata TITLE is now retained separately from the preferred display title so that provider-published series context, if present, is not silently discarded. It is shown locally when different; shared v3 diagnostics export only presence, equality and change flags. This adds no identity fallback, permissions, services or dependencies, and makes no raw-label uploads. The pre-existing local settings-help note is preserved in intent with corrected spelling and a clear experimental-test statement.

Lint/typecheck and all 79 JavaScript/database tests pass; all 37 pure Kotlin tests pass. The cloud Android build and binary audit are pending. The latest verified delivered APK remains 1.3.3 until those checks succeed. No actual player catalog ID or automatic sync is verified.


## Different-episode result — November 12, 2026

The user supplied the follow-up 1.3.3 report after the requested episode change. The remembered-label comparison is available: titleChanged and subtitleChanged are true; descriptionChanged is false (description remains absent). The new playing session has position 15869 ms and duration 4087000 ms; the earlier same-episode report had duration 3492000 ms. Both reports expose useful DISPLAY_TITLE and subtitle fields, no MEDIA_ID/MEDIA_URI and null contentId.

This establishes observed label discrimination across these two tested episodes on this phone. It does not establish globally unique identity, cross-language matching, a catalog resolver, embedded Netflix playback or two-device sync. No raw names were included. The pending local-title clarification asks whether the labels also identify the series; no series identity is inferred from season/episode numbers alone.


## Physical label result — November 12, 2026

The user reports the 1.3.3 local display shows the episode name, season and episode number. The supplied v2 report confirms DISPLAY_TITLE was selected, title/display-title/subtitle fields are present, description is absent and the title is usable. The playing session reports position 27440 ms, duration 3492000 ms and play/pause/seek support. MEDIA_ID and MEDIA_URI remain absent; contentId is null.

All three comparison flags are false. The user explicitly clarified they stayed on the same episode after remembering the labels, so this is the expected unchanged-item result, not a failed episode-change test. Capture of useful episode labels is user-confirmed; cross-episode discrimination, unique catalog mapping, embedded playback and real two-device sync remain unverified. No raw titles were supplied or retained.

Next phone action: keep the remembered baseline, play a different episode of that same series, return and refresh, then share the report and say whether the visible name/number updated. Do not press Remember again before exporting the comparison. The active-item diagnostic added in source is not installed in 1.3.3, so its missing queueEvidence field is expected.


## Resumed November 12, 2026 — active-item identity evidence

The user resumed development. The latest saved source commit matched GitHub main at ff5fbb0 before this increment. An existing local edit in NetflixCheckPanel.tsx was preserved and is not part of this increment. The previously generated native Gradle cache is now ignored.

Added diagnostic-only inspection of Android's active queue item. It reads only the uniquely matching active description, bounds queue size, checks the active key again after reading, accepts only canonical Netflix watch URLs as candidate catalog IDs, and rejects conflicting metadata. Queue keys, numeric-only description IDs, labels and duration never become verified identity. It does not change the playback identity gate or add permissions. Shared reports export only a bounded candidate ID and fixed status/presence flags; raw queue values stay out of reports. The control planner does not query the queue.

Verification: lint/typecheck and all 78 JavaScript/database tests passed; all 36 pure Kotlin tests passed. This increment has not been compiled into a new Android APK or exercised on the phone. Orbit 1.3.3 remains the latest verified delivered APK, and its pending episode-label check below is still the next phone action. A new build should combine useful findings from that report rather than replace the missing physical evidence with another speculative release. No embedded Netflix playback or two-device synchronization is verified. See [NETFLIX_ACTIVE_ITEM_TEST.md](NETFLIX_ACTIVE_ITEM_TEST.md).


## Saved for resuming — November 3, 2026

The user asked to save everything and pause for sleep. No 1.3.3 physical-phone result was supplied; the answers to the pending test questions were requests to continue later, not test outcomes. The full Netflix/Disney+/Prime Video integration goal remains unfinished.

When the user returns, show the [verified Orbit 1.3.3 APK](https://expo.dev/artifacts/eas/SxPOeZ9g3XBE8WCwhQD7tVZeu2TqFmrI11mpbXTAqO4.apk) and resume here:

1. Play a TV episode in official Netflix, go Home into PiP, open Orbit → Netflix controls check → Refresh check. Check whether local labels show the actual series and episode.
2. Tap Remember labels for comparison, start a different episode of the same series in Netflix, return and refresh.
3. Share diagnostic result and inspect the fixed label-presence/change flags. Do not infer a unique catalog ID or successful synchronization from changed text alone.

Current code is 1.3.3 (Android code 10); its build, native test task and binary audit passed. Local checks passed: lint/typecheck, 14 Netflix reporting/operation tests, 27 playback/client/database tests and 28 pure Kotlin tests. The source checkout is C:/Users/jessu/Downloads/Orbit/Orbit phase 1/orbit and is synchronized with GitHub after this checkpoint. The build is terminal; no build watcher needs restarting.

The approved independent-view room prototype is saved in design/room-experience.html. Its preview was open at http://127.0.0.1:8094/; this local address depends on its preview helper being running. The saved HTML and source remain available if a reboot closes it. Retain the requirements: each viewer chooses full screen or portrait chat independently; only one physical phone is available; automatic movie identification is required; no manual identity fallback or unapproved overlay permission.

## Latest increment: provider display metadata, 1.3.3

The user’s 1.3.2 report confirms both candidate catalog-ID values are absent. They require automatic movie identification and declined a manual confirmation fallback. They also confirm Android’s Netflix media controls display the actual movie/episode name. Version 1.3.3 (code 10) now reads standard display labels locally and compares changes across items while exporting only fixed flags. Native/reporting/playback tests, lint and typecheck pass; the signed build and binary audit have passed. Physical label capture and episode discrimination are pending. No identity gate or permission was relaxed. See [NETFLIX_DISPLAY_LABEL_TEST.md](NETFLIX_DISPLAY_LABEL_TEST.md). The current verified APK is 1.3.3 below.

## Renewed investigation and room design: November 3, 2026 (UTC)

The user requested continued investigation, including overlapping apps, then clarified portrait chat, full-screen chat hiding and viewers in different locations. The final embedded-versus-companion presentation is not selected. The user corrected their initial response and confirms Netflix’s own PiP works on the Pixel above other apps; it needs no Orbit overlay permission. The user then confirms Netflix keeps playing in PiP above Orbit for 15 seconds. This establishes user-reported app co-existence, not working room controls or two-phone synchronization. The user approved the layout direction: each viewer independently chooses portrait chat or full screen. Only one physical phone is available now; design and tests must retain the two-person experience. A clickable local room-design prototype and source review are in [ROOM_EXPERIENCE.md](ROOM_EXPERIENCE.md).

A concrete identity-parser gap was fixed: the prior native adapter ignored MEDIA_URI and watch-link-form MEDIA_ID values. Version 1.3.2 (code 9) adds recognized provider watch links with conflict/privacy checks and now restores pause after a settled paused seek, with no new permissions. The first queued APK build 3a257bc3-25c6-46ea-8a16-8dcc642af164 was canceled before delivery to include this correction. The replacement build finished successfully and its APK audit passed; see the current APK below. The app/database checks, lint/typecheck, updated 27 playback checks and all 23 pure Kotlin tests pass. The new physical-phone report shows neither candidate ID field is present; no catalog ID was recovered. The user declined manual confirmation and requires automatic movie identification. Two-device sync remains unverified. See [NETFLIX_IDENTITY_TEST.md](NETFLIX_IDENTITY_TEST.md).

Automatic approval review rejected the proposed SYSTEM_ALERT_WINDOW expansion; that command did not run. No overlay source, permission or service was added. The concrete optional test design is documented for review; the safer PiP comparison is being pursued independently.


## Current verified APK: 1.3.3

The [Orbit 1.3.3 standalone APK](https://expo.dev/artifacts/eas/SxPOeZ9g3XBE8WCwhQD7tVZeu2TqFmrI11mpbXTAqO4.apk) ([successful build](https://expo.dev/accounts/jgoff/projects/orbit/builds/d5822f62-814f-4850-83df-1020cf085282)) is verified, from source 11598a93d5bfbd475c01c2d96cc506547ca252be. The cloud native test task ran without being skipped, Gradle and release assembly succeeded, and binary inspection verified the same signing certificate, bundled app, ARM64 support, disabled backup, keyboard adjustResize and the Google callback scheme. The declared permissions remain INTERNET and the app-scoped DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION; the existing optional broad notification-listener grant remains separate. APK size 91889833 bytes; SHA-256 a6cf257940136736b7093f067576113776471cc690b089eb1993ba18bbbe6feb. Physical label capture, reliable automatic movie/episode identification, embedded Netflix playback and two-device sync are not yet verified.

The physical Pixel test asks whether the local labels match a series/episode, then remembers a baseline and compares a different episode of the same series. Shared diagnostics contain only fixed presence/source/change flags. The user declined a manual confirmation fallback; the actual-ID control gate remains intact. See [NETFLIX_DISPLAY_LABEL_TEST.md](NETFLIX_DISPLAY_LABEL_TEST.md).

## Prior verified APK: 1.3.2

The [Orbit 1.3.2 standalone APK](https://expo.dev/artifacts/eas/ltfsvYqAod5cbz3ZZOltRAS-dFVfYm7VYcUDoJXRFcg.apk) ([successful build](https://expo.dev/accounts/jgoff/projects/orbit/builds/36b6d4da-15a8-44c9-b000-eadbb91e28fd)) is verified, from source aee10176cb346bdfe4c1971a23f5c19dad17a823. The cloud native test task ran without being skipped, Gradle and release assembly succeeded, and binary inspection verified the same signing certificate, the bundled app and ARM64 support, disabled backup, keyboard adjustResize and the Google callback scheme. The only declared permissions are INTERNET and the app-scoped DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION; the existing optional broad notification-listener grant remains a separate Android setting. No overlay, microphone or foreground-service permission was added. APK size 91887613 bytes; SHA-256 b65a507c66471b5b95bad7a0ac9d704c13e989be3d9b5a65231edbba7d83c569. The new physical-phone report returned no catalog ID and reported both candidate ID fields absent. Corrected paused-seek behavior and two-device synchronization remain unverified.

Install it, then start a movie in Netflix, go Home into PiP, open Orbit → Netflix controls check → Refresh check → Share diagnostic result. The fixed-source label and field-presence flags diagnose the identity gap without exporting raw provider metadata. One physical phone is sufficient for this check; it does not verify remote synchronization.

## Historical integration blocker before renewed investigation: November 3, 2026 (UTC)

At this earlier checkpoint, development was blocked on an obtainable provider-authorized Android in-app playback/session integration. The same condition was revalidated across three consecutive goal turns. The current checkout and origin/main matched c8d0de0 with a clean tree before this status update. All four inquiry threads still contain only the sent messages, and the targeted reply/bounce search returned no matches. No live build, device test or other running process is being waited on.

Netflix, Disney+ and Prime Video movie playback inside Orbit, player-bound identity/acknowledged controls and two-device automatic synchronization remain incomplete. Resume implementation when an available SDK/API with usable authentication/playback documentation, or a reproducible authorized Android playback path, supplies the missing player contract. A generic DRM library, desktop-only extension, vendor marketing claim or another wrapper build does not supply it. See [NETFLIX_NATIVE_INTEGRATION.md](NETFLIX_NATIVE_INTEGRATION.md) and [the outreach record](NETFLIX_INTEGRATION_OUTREACH.md). Orbit remains 1.3.1. No repeated inquiries, purchases, new permissions or runtime changes were made.


## Provider SDK review: November 3, 2026 (UTC)

The expanded investigation found Disney’s documented ADK/proprietary native-video-engine program for licensed distributors. Its availability for an Android watch-party app and a separately embeddable player remain unestablished. Amazon’s Prime APIs serve content submissions and analytics, not subscriber playback. The user has no Prime Video access, so the phone browser comparison was not performed. Inquiry threads currently contain only the sent messages. See [the expanded provider review](NETFLIX_NATIVE_INTEGRATION.md#expanded-provider-review-november-3-2026). Netflix, Disney+ and Prime playback inside Orbit and two-device sync remained incomplete at that checkpoint; see the current blocker above. No new APK or runtime changes were made.


## Integration outreach: November 3, 2026 (UTC)

The user authorized outreach beyond Rave. Gmail returned SENT for separate inquiries to Rave, Hearo, Teleparty and Watchly at contacts verified through official sites/listings. This confirms submission, not delivery or a reply. The expanded review found a historical Hearo business/white-label venue lead but no currently deployable Netflix SDK. See [NETFLIX_INTEGRATION_OUTREACH.md](NETFLIX_INTEGRATION_OUTREACH.md) for sources, scope and follow-up questions. No player/API integration has been obtained and no new APK was built; Orbit Netflix playback and two-device synchronization remain blocked.


## Native integration investigation: November 3, 2026 (UTC)

The user reaffirmed Netflix as the next priority and reports Netflix movie playback inside the official Rave app on the same Pixel. This is a working comparison, not an Orbit result or a verified explanation of Rave’s implementation. The public Netflix MSL framework and Android DRM-player documentation do not supply a usable Netflix player/session integration for Orbit. Namesake social SDKs, watch-history APIs and app launchers were reviewed and do not fill that gap. See [NETFLIX_NATIVE_INTEGRATION.md](NETFLIX_NATIVE_INTEGRATION.md) for sources, acceptance requirements and the original inquiry, now sent with the user’s authorization. The current APK remains 1.3.1; no dependency, permission, backend or account changes were made. Actual Orbit Netflix playback and two-device synchronization remain blocked.

## Firefox comparison result

November 3, 2026 (UTC): the user reports Firefox also asks for the Netflix app or blocks playback. The exact Firefox mode/version and error were not specified. Together with the earlier Orbit and Chrome results, this supplies no working browser baseline for a GeckoView replacement. The larger screen, keyboard and Google sign-in remain user-confirmed working; Netflix movie playback and automatic sync are blocked/unverified. Keep 1.3.1 as the current APK and do not ship another speculative browser wrapper. See [ANDROID_PLAYER_NEXT_STEP.md](ANDROID_PLAYER_NEXT_STEP.md). The user subsequently reaffirmed Netflix integration; the newer Rave comparison and native-player findings are recorded above.


## Prior verified APK: 1.3.1

The [Orbit 1.3.1 standalone APK](https://expo.dev/artifacts/eas/Q9D5EyjGtrEoHwyJsO2lAUERXnDS6xbvl_uQzQbQWZc.apk) ([successful build](https://expo.dev/accounts/jgoff/projects/orbit/builds/b44e514e-a32e-4ce4-a92c-33755c7507d5)) is finished. The cloud native tests and release assembly passed. Binary inspection verified the same signing certificate as the prior APK, the standalone app bundle, ARM64 support, disabled backup, no extra declared permissions, the Google callback scheme and MainActivity keyboard adjustResize setting. The user confirms the larger screen, keyboard layout and Google sign-in work on the physical phone. Their official-page comparison still asks for Netflix’s app or blocks playback; the exact route/error was not specified. Movie playback and sync remain unverified. See [ANDROID_PLAYER_NEXT_STEP.md](ANDROID_PLAYER_NEXT_STEP.md) for the next integration gate and [NETFLIX_SCREEN_LAYOUT.md](NETFLIX_SCREEN_LAYOUT.md).

Open Netflix inside Orbit → Open Netflix test screen. Open the website, then use Details for the official browse page or a public Netflix title/watch link. The route test may still show Netflix’s app-required page. A selected link is not verified player identity. Source ab6c2c3. APK size 91886957 bytes; SHA-256 2b87a1d0a78656a25b635df4e35c42114ad54317f0cf517d4b12173124be4c84.


## Latest device result: November 3, 2026 (UTC)

The user tested the shipped 1.3.0 APK: Netflix sign-in works, but the website asks for its separate app. Chrome with Desktop site on the same phone also requests the app or blocks playback. Embedded movie playback is therefore not working in either reported test. The v1 report ends in background_closed, which records lifecycle cleanup and does not identify the provider restriction or establish a crash. The screenshot received later shows Netflix’s signed-in mobile app-required landing page; no player error code is shown. See NETFLIX_EMBEDDED_FEASIBILITY.md.

The v2 reporting fix is included in 1.3.1, together with the larger screen and official-page comparison controls. All eleven Netflix diagnostic/operation tests pass, plus authentication routing, room/database tests, lint and typecheck. The older 1.3.0 artifact below remains history. No movie-playback or sync fix has been verified, and no account, database or Google Cloud configuration was changed.


Updated November 3, 2026 (UTC). Build/artifact checks and confirmed layout/keyboard/Google phone results are separate from the unresolved Netflix movie-playback gate.

## Current development increment

Version 1.3.0 (Android versionCode 7) adds an isolated native Netflix website surface inside Orbit, separate from the external media controls and room timeline. It has no injected scripts, page/cookie reads or new manifest permissions/dependencies; explicit protected-media consent and browser-sign-in cleanup are included. Lint/typecheck, all 62 JavaScript/database checks and 14 pure Kotlin tests pass. The [Orbit 1.3.0 standalone APK](https://expo.dev/artifacts/eas/o4C3M1fMeDL6vvq1gtyDKqFRuQitqZXy2X1ezJT8_tw.apk) ([build](https://expo.dev/accounts/jgoff/projects/orbit/builds/8419489c-93bc-4cf8-9854-2e05d7c59954)) is finished: cloud native tests and assembly passed, the signature matches the previous APK, the app bundle is embedded, no extra declared permissions were found and application backup is disabled. Source c0527d1. Real Netflix movie playback, actual player identity and automatic sync remain unverified. See [IN_APP_NETFLIX_TEST.md](IN_APP_NETFLIX_TEST.md). Earlier build/device records below are history.

## Checkout and earlier emulator record

- Work remains in the VS Code project at C:/Users/jessu/Downloads/Orbit/Orbit phase 1/orbit.
- Earlier checks installed Orbit 1.2.0 (Android versionCode 4) on the Pixel emulator with a local development server at http://127.0.0.1:8081. No ADB device was connected at the latest check in this session; no 1.3.0 device installation or runtime UI test has been claimed.
- Earlier development-server logs are in .expo/dev-server.log and .expo/dev-server-error.log; .expo/dev-server.pid is historical until rechecked. The new standalone APK needs no server.
- In the earlier 1.2.0 runtime check, the native sync method was present and the app showed Room sync test is installed. No AndroidRuntime or ReactNativeJS launch error appeared. Known SafeAreaView and Supabase lock deprecation warnings remain.
- GitHub is connected at https://github.com/JGOFF125/Streaming, branch main. The user authorized pushing this work and future verified milestones. Local environment files, private configuration, signing material, APKs and CLI/build caches remain ignored.

For future local development, run npm.cmd run start:dev -- --android from the project folder, using the existing server if port 8081 is already occupied.

## Earlier standalone phone build: 1.2.1

The user now has a real Android phone available and confirmed Orbit Google sign-in works; the reset concerns Netflix. Standalone Orbit 1.2.1 (versionCode 5) is finished under the preview profile, without Expo Go or a local development server. [Download the APK](https://expo.dev/artifacts/eas/Z6Tod6xtqFvATUCTLZiSsrqPrOENmiVCNWlnrWD4rqY.apk) or view the [successful build](https://expo.dev/accounts/jgoff/projects/orbit/builds/d1f6aad9-83dd-4626-a2a0-5d97ab28b71b). The physical test phone is a Google Pixel 10 Pro XL on Android 17. The user confirmed the official Netflix app plays a movie normally on that phone. The native planner test task and release assembly passed. Artifact inspection verified the signature, embedded app bundle, minimum API 24 and ARM phone libraries. The user confirmed that Orbit 1.2.1 installs and opens on the physical phone. The user supplied a local observed-seek diagnostic. The adapter reports no usable numeric content ID, and real room synchronization remains unverified. See [PHONE_TEST_SETUP.md](PHONE_TEST_SETUP.md). The additional Android 16 emulator comparison was stopped in favor of physical-device validation; no Android 16 Netflix result exists.

## Product requirement and privacy update: 1.2.2 history

The intended experience is video inside Orbit with text and voice. The 1.2.2 Netflix adapter controls a separate app and does not implement that experience. The user's real-phone report records an observed seek but contentId is null, which blocks the current native identity gate. A supported in-app Netflix integration remains unestablished; see [NETFLIX_EMBEDDED_FEASIBILITY.md](NETFLIX_EMBEDDED_FEASIBILITY.md). Version 1.2.2 is finished: [download the privacy-cleanup APK](https://expo.dev/artifacts/eas/2L2zW_K9yTM3Z8RepteDbj4XJ6FpAAbiSwSldOTTuz0.apk). Native tests and assembly passed; the signed merged APK passed the minimal-permission check and contains its standalone app bundle. The five unused overlay/storage/vibration/install-referrer grants are absent. Android 17 now queries Netflix sessions only, and the optional-access/revocation UI is clearer. The notification grant itself remains broad. The new query path has not yet been tested on the physical phone. See [ANDROID_PERMISSIONS.md](ANDROID_PERMISSIONS.md).

## Earlier external-player sync increment

The new signed-in room panel supports a bounded one-minute host/follower test. The host selects a public Netflix catalog identifier and publishes observed playback from Netflix; a follower attempts matching pause/play/seek controls. Both devices open the official Netflix app and wait eight seconds before the test begins.

The native runner calls only this project's authenticated playback RPCs using its own Orbit access token in memory. It verifies the actual Netflix media ID, session, playback state, position, timing and capabilities before control requests; rechecks identity before each action; and stops when controls are not acknowledged. Failed requests do not replay cached commands. The test has cancellation and automatically ends after about one minute, subject to an in-flight network timeout.

**Automatic Netflix compatibility and cross-device playback are not verified. This is not a full-movie background session.** If Netflix does not expose a supported numeric catalog ID or usable controls, the route intentionally stops. Ads and nonstandard playback rates are outside the test contract; use normal 1× playback.

The earlier 1.2.0 development build finished successfully: [Orbit 1.2.0](https://expo.dev/accounts/jgoff/projects/orbit/builds/11042537-beb5-4d00-ae1a-45842b29c7a6). Its source commit was 3f1fa48. The native planner's Kotlin unit tests ran successfully before APK assembly. The later UI labels, instructions and cache exclusion changes do not alter the native binary and are loaded through the development server.

## Checks and remaining access

- Dependency compatibility, all JavaScript/database tests, lint and TypeScript passed. Android compilation and native planner unit tests passed in EAS; Pixel installation and native-method availability were verified.
- Supabase CLI sign-in is working and the target project reports ACTIVE_HEALTHY. Migration 002 was applied through the Management API after confirming the existing private-room schema; do not rerun either migration on this project.
- The previously signed-in Google account now has room access. No other accounts were approved. Public Auth settings returned HTTP 200 with Google enabled. The user confirmed that Orbit Google sign-in works and that the reset concerns Netflix streaming, rather than Orbit authentication.
- Hosted verification passed for host publish/read, stale revision rejection, outsider RLS/RPC denial and grants. Its temporary room and timeline were rolled back. Anonymous playback access returned HTTP 401 / PostgreSQL code 42501 through the public API. Direct member table writes and anonymous RPC execution are denied.
- Netflix is installed, and the user granted Orbit's optional controls permission. Netflix repeatedly exits before login/playback, including on a separate standard-page emulator with Orbit absent. Restarting the Pixel did not fix startup. See [NETFLIX_STARTUP_INVESTIGATION.md](NETFLIX_STARTUP_INVESTIGATION.md); the cause remains unknown and automatic playback is still unverified.
- The original Pixel/server were restored during the earlier emulator investigation. Today’s 1.3.0 build does not depend on either; no ADB device was connected at the latest check. Orbit sessions remain memory-only. A live signed-in room check is still pending user feedback.
- The new room playback UI has not been tested with a live signed-in room. Automated tests exercise database authorization, timing, stale revisions, content matching and simulated players; these are not real Netflix results.
- The package audit still reports 24 moderate and one high finding. The high finding is a transitive zod dependency in ESLint development tooling. No forced major dependency upgrades were applied.

## Delivery order

1. Establish actual Netflix playback inside Orbit on the physical Pixel, then verify actual player identity/controls and two-device synchronization. The emulator startup issue and external controls are historical diagnostics, not completion of the required player.
2. Add YouTube, Prime Video and Disney+ adapters, reusing shared room and timing code while verifying each provider separately.
3. Add room text chat and realtime voice.

No other-platform synchronization or text/voice chat is implemented yet. See [PLAYBACK_SYNC_SETUP.md](PLAYBACK_SYNC_SETUP.md) and [NETFLIX_ANDROID_TEST.md](NETFLIX_ANDROID_TEST.md) for the current protocol and test contract.

## Latest public authentication health check

The configured Supabase public Auth settings returned HTTP 200 with Google enabled during this development session. No Google Cloud, account-approval or database settings were changed for the in-app browser experiment. Existing hosted database verification above is prior evidence; this health check does not substitute for a real signed-in room/device test.
