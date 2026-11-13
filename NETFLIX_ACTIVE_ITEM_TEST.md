# Netflix active-item identity investigation

November 12, 2026. Included in the pending 1.3.4 build; not present in the delivered 1.3.3 APK.

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

Lint/typecheck and all 78 JavaScript/database tests pass. All 36 pure Kotlin tests pass, including unique selection, absent/changing/duplicate keys, queue bounds, zero-valued keys, opaque numeric description IDs, conflicting fields/metadata, malicious links and raw-data exclusion. No new native APK compilation or phone verification is claimed for this increment.

The [delivered 1.3.3 display-label test](NETFLIX_DISPLAY_LABEL_TEST.md) now supplies same-item and changed-episode evidence. Version 1.3.4 combines active-item inspection with retaining the separate standard TITLE, whose series context has not been observed. Native build and physical checks are pending. The installed 1.3.3 app cannot return queueEvidence; absence in its report is expected, not evidence that Netflix has no queue.
