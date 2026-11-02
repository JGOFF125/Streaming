# Netflix integration checkpoint

Updated November 2, 2026 (UTC).

The requirement is automatic Netflix synchronization between two Android devices in Orbit. Manual countdown is not an accepted substitute. Full-movie operation remains unfinished.

Orbit 1.2.0 now contains a one-minute native host/follower test connected to the private-room playback protocol. The running Pixel app exposes this method, and Android planner unit tests passed before its EAS build completed. The host publishes observed Netflix playback; the follower can request pause/play/seek adjustments after strict identity, timing, capability and room-access checks. Unacknowledged controls stop the test. This is implemented test code, not verified Netflix support.

The playback migration is deployed and the owner's previously signed-in Google account is approved for rooms. Hosted host-publish, stale-write, outsider-denial and grants checks passed; signed-out public API access is denied. Netflix controls permission is enabled, but Netflix exits before sign-in/playback. This also reproduced on a standard-page emulator with Orbit absent. The original Pixel is restored. See [NETFLIX_STARTUP_INVESTIGATION.md](NETFLIX_STARTUP_INVESTIGATION.md). No two-device Netflix result exists.

The current integration requires Netflix to expose a strictly numeric media ID matching the selected public catalog item. An official title link does not override absent native identity. If the required metadata or controls are unavailable, do not claim automatic Netflix sync works or bypass the gate.

Use [NETFLIX_ANDROID_TEST.md](NETFLIX_ANDROID_TEST.md) for the test procedure. The next gate is real playback behavior, followed by reliable movie-length background execution and authentication handling. Other providers, text chat and voice follow Netflix under the user's delivery order.

Never collect Netflix credentials or session cookies, bypass DRM, capture protected streams, or use accessibility automation to control Netflix.
