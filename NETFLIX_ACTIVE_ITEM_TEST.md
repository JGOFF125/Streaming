# Netflix active-item identity investigation

November 12, 2026. Included in the verified 1.3.4 APK; physical results are pending. The prior 1.3.3 APK does not include this diagnostic.

## Current verified APK — 1.3.4, November 12, 2026

The [Orbit 1.3.4 standalone APK](https://expo.dev/artifacts/eas/kr4Un0yU-CVd0rxNq28Jkgug96udFXP_VFvcX4RmV4c.apk) ([finished cloud build](https://expo.dev/accounts/jgoff/projects/orbit/builds/474dd23a-6fdf-4ceb-81fa-8d04ca160aaf)) passed native compilation, the non-skipped native test task, release assembly and binary audit. Source cda81ffaac4e1df4c7ef5efc8bc07cd2429eb840; Android code 11. Local lint/typecheck, all 79 JavaScript/database tests and all 37 pure Kotlin tests passed. APK size 91891281 bytes; SHA-256 2ab2b9264d791ff2c4eadc49a7674cc873942c27dd6a5069291a38ee72753ffa. The signature matches previous Orbit releases; ARM64, the bundled app, disabled backup, keyboard adjustResize and the Google callback scheme were verified. Only INTERNET and the app-scoped DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION are declared. The existing optional broad notification-access grant remains separate; no overlay, microphone or foreground-service permission was added.

The user's 1.3.3 phone reports confirm useful episode labels, no changes while staying on the same episode, and changed title/subtitle after the requested different-episode test. Both catalog metadata fields remain absent. Version 1.3.4 adds diagnostic-only active-item inspection and retains the separate standard TITLE locally. A queue candidate or label alone cannot populate contentId or enable synchronization. Shared v3 reports omit raw labels/URLs. Physical 1.3.4 availability and series context are pending; actual catalog identity, embedded playback and two-device sync remain unverified.

Next phone action: install 1.3.4 as an update, play a Netflix episode in PiP above Orbit, then Netflix controls check → Refresh check → Share diagnostic result. Inspect queueEvidence and displayEvidence, and ask whether any alternate title identifies the series. No repeat of the 1.3.3 comparison is needed just to establish that its title/subtitle changed. No new control commands are requested by this read-only check.

The public Supabase Auth settings endpoint returned HTTP 200 with Google enabled during this session. This is an endpoint/configuration health check, not a fresh signed-in room or Google callback test. The four existing vendor-inquiry threads still contain only their sent inquiries; no reply, duplicate inquiry or follow-up was sent. No live build watcher remains.

## Why inspect the active item

The physical 1.3.2 session publishes neither metadata MEDIA_ID nor MEDIA_URI. Version 1.3.3 phone results now confirm useful labels and title/subtitle changes across two tested episodes. No catalog ID was reported. Android documents a current play queue and an active item key. The key identifies a session-local queue entry, not a Netflix catalog title. A canonical watch URL on that specific entry could supply a candidate, if Netflix actually publishes it. Availability remains unobserved. [MediaController queue](https://developer.android.com/reference/android/media/session/MediaController#getQueue()), [PlaybackState active item](https://developer.android.com/reference/android/media/session/PlaybackState#getActiveQueueItemId()).

## Implemented boundaries

- Inspect only the already authorized, Netflix-filtered controller; no new permission or service.
- Do not fetch the queue when no active key is reported. Refuse queues exceeding 100 entries.
- Read the description only when exactly one entry matches the active key. Never choose the first entry or read other descriptions.
- Recheck the key after fetching the queue and again after reading the description. Discard evidence across an observed item change.
- Accept canonical HTTPS Netflix watch URLs in the active description's media ID or media URI. Numeric-only description IDs are treated as opaque. Reuse the existing bounded host/path validation.
- Reject conflicting recognized description fields and conflicts with recognized current metadata.
- Export fixed status/presence flags and a bounded candidate catalog ID only. No raw URLs, queries, descriptions, queue keys or arbitrary errors in reports.
- Keep the result diagnostic. It cannot populate snapshot.contentId or authorize controls. The playback planner still uses only its existing metadata identity path and skips queue inspection.

A candidate is not proof of current-video identity: even a stable queue key can accompany stale provider data. Physical observations must compare actual episodes and transition behavior before any control integration is considered. This does not render protected video inside Orbit or implement automatic sync.

## Validation and next decision

Lint/typecheck and all 79 JavaScript/database tests pass. All 37 pure Kotlin tests pass, including unique selection, absent/changing/duplicate keys, queue bounds, zero-valued keys, opaque numeric description IDs, conflicting fields/metadata, malicious links and raw-data exclusion. Cloud native compilation, the native test task and the signed APK audit passed for 1.3.4. Physical phone verification of this increment is pending.

The [delivered 1.3.3 display-label test](NETFLIX_DISPLAY_LABEL_TEST.md) now supplies same-item and changed-episode evidence. Version 1.3.4 combines active-item inspection with retaining the separate standard TITLE, whose series context has not been observed. The native build and binary audit passed; physical checks are pending. The installed 1.3.3 app cannot return queueEvidence; absence in its report is expected, not evidence that Netflix has no queue.
