# Playback synchronization foundation

The playback migration was deployed to the existing Supabase project on November 2, 2026. Version 1.2.0 is installed on the Pixel and adds a room client and a bounded native host/follower test. Actual Netflix behavior remains unverified because Netflix currently exits before login/playback. This is not proof of Netflix support or a movie-length background session.

## Components

- supabase/migrations/202611020002_playback_timeline.sql adds one current timeline per room, authenticated member reads, host-only commands, server timestamps, revision checks, and a bounded per-minute command limit. It reuses the existing room-update realtime signal.
- src/playbackSync.ts validates replies and plans playback corrections using a monotonic request timer. It refuses other rooms, stale revisions, unknown/different content, missing controls, buffering, and stale or slow clock samples. It avoids small drift corrections and rate-limits repeated corrections for the same revision.
- tests/playback-database.test.mjs exercises both migrations in embedded PostgreSQL, room permissions and expiry, revision conflicts, and two simulated players.
- tests/playback-sync.test.mjs exercises clock differences, jitter, buffering, mismatched content, malformed data, out-of-order replies, and correction cooldown.

## Backend deployment

Migration 202611020002_playback_timeline.sql is already applied to the existing hosted project through the authenticated Management API. The original room schema was confirmed first. Hosted checks verified host publishing, stale revisions, outsider denial and role grants; temporary test data was rolled back. The public API denies signed-out playback reads. The owner's previously signed-in Google account was separately approved for rooms. Do not rerun either migration on this project or blindly use db push against a manually provisioned schema. For a new project only, apply migration 001 and then 002 in order; neither enables Netflix controls.

Do not place service-role keys, database passwords, or Netflix credentials into the app or this chat.

## Intended integration

1. Authorized clients read orbit_get_playback(p_room_id). Measure request start/end with performance.now(); use only fresh successful authorized responses.
2. The host sends orbit_set_playback(p_room_id, p_content_id, p_playing, p_position_ms, p_expected_revision). The content ID is a public Netflix catalog identifier, not a stream URL. The initial expected revision is zero. On conflict, reread; never retry a stale command blindly.
3. Feed replies into one PlaybackSynchronizer per joined room. All players, including the host, must follow the server timeline. Destroy it on sign-out, departure, or authorization loss. Serialize native actions and do not keep issuing commands from a cached timeline after an RPC failure.
4. Before execution, verify the actual player is on the intended title/episode, has a usable position and supports the required controls. The current Netflix probe does not provide a verified catalog/episode identity. Never copy the room ID into the player snapshot and treat that as content confirmation.
5. Connect a user-started Android background session with a visible stop control and test long background operation, reconnection, ads, buffering, title changes and revocation. This service is not implemented yet.

The TypeScript planner returns actions. The new Android planner and bounded test runner can request controls only after verifying the actual numeric Netflix media identifier, room response and capabilities. The runner stops if controls are not acknowledged within three seconds. Its simulated players are test objects and do not pretend to be Netflix. The embedded database tests do not exercise two simultaneous PostgreSQL connections; real deployment needs a concurrent-client check as well as the tested sequential revision-conflict checks.

## Emulator-only development

Only Android emulators are currently available. Netflix was installed from Play Store and the owner enabled Orbit's optional controls permission. Netflix currently exits before sign-in/playback; a standard 4 KB image comparison with Orbit absent and a Pixel restart did not resolve startup. See [NETFLIX_STARTUP_INVESTIGATION.md](NETFLIX_STARTUP_INVESTIGATION.md). Do not change certification, protected playback or device identity checks to make it work.

Even if Netflix plays on the emulator, report that result as emulator behavior. Two real Android phones remain an eventual validation step for the intended product. Orbit development can continue with local authorization and simulated-player tests meanwhile.

Run npm.cmd run test:playback for the focused tests, or npm.cmd test for the complete suite. Lint and TypeScript checks also remain required.

## Version 1.2.0 room test

After applying migration 002, approve and sign in both accounts, create/join a room, and grant optional Netflix-controls access on both devices. The host selects a public Netflix catalog ID or official title/watch link and starts the host test. Start the follower test after the host publishes playback. Each device opens the official Netflix app, waits eight seconds, and runs a one-minute native test. Changing Netflix playback on the host should update the room; the follower requests matching controls.

The native adapter must independently read a strictly numeric media ID matching the selected catalog item. A pasted title link does not override missing or mismatched native identity. If Netflix does not expose that identity or supported controls, automatic control remains blocked. No fallback collects credentials or bypasses DRM.

The test uses a fresh, short-lived Orbit access token in native memory to call only this project’s playback RPCs. It neither reads Netflix authentication nor persists the Orbit token. It does not refresh tokens or provide a foreground service, so movie-length operation still requires separate implementation.
