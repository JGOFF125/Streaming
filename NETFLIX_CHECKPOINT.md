# Netflix integration checkpoint

Updated November 2, 2026 (UTC).

The user requires Netflix video playing inside Orbit's room alongside text and voice, with automatic synchronization between two Android devices. An external app controller and manual countdown do not fulfill that experience. Embedded Netflix playback and full-movie operation remain unfinished. See [NETFLIX_EMBEDDED_FEASIBILITY.md](NETFLIX_EMBEDDED_FEASIBILITY.md).

The user installed Orbit 1.2.1 on a physical Pixel 10 Pro XL with Android 17. Their diagnostic reports an observed seek, an active Netflix session and advertised play/pause/seek capabilities. It also reports contentId: null and a paused-to-playing state change during seeking. This is evidence of a local control response, not independently verified play/pause, title identity, two-device sync or in-app rendering.

The one-minute external host/follower prototype remains behind its existing identity checks. With the reported null identity, it stops with identity_unavailable. Do not substitute a pasted title for actual player identity or infer content from duration. The raw report is not committed.

The Supabase playback migration is deployed and the owner's Google account is approved for rooms. Hosted host-publish, stale-write, outsider-denial and grants checks passed. The previous emulator Netflix startup failure is independent of the physical phone's working playback; no Android 16 comparison was completed.

Version 1.2.2 removes unused overlay, legacy storage, vibration and install-referrer grants and uses Android 17's Netflix-specific media-session query. Its notification-access grant remains broad, optional and limited by the app's behavior rather than an Android Netflix-only permission. Google sign-in and core rooms do not depend on it. The rebuilt signed APK passed the binary permissions check: only INTERNET and its app-scoped internal receiver permission remain in uses-permission records. The separate optional listener grant remains broad. Physical installation and the new Android 17 query path have not yet been retested. See [ANDROID_PERMISSIONS.md](ANDROID_PERMISSIONS.md) for the download and audit.

Next priority: establish a verified in-app Netflix playback/authentication integration and reliable content identity before expanding the external controller or claiming the intended movie-room experience is delivered. Other providers, text and voice remain later under the user's delivery order.
