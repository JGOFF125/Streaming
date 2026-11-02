# Playback synchronization foundation

This increment is local source code and automated tests. It is not deployed to Supabase, included as a user-facing feature in the 1.1.0 APK, connected to the Android Netflix adapter, or proof of Netflix playback support.

## Components

- supabase/migrations/202611020002_playback_timeline.sql adds one current timeline per room, authenticated member reads, host-only commands, server timestamps, revision checks, and a bounded per-minute command limit. It reuses the existing room-update realtime signal.
- src/playbackSync.ts validates replies and plans playback corrections using a monotonic request timer. It refuses other rooms, stale revisions, unknown/different content, missing controls, buffering, and stale or slow clock samples. It avoids small drift corrections and rate-limits repeated corrections for the same revision.
- tests/playback-database.test.mjs exercises both migrations in embedded PostgreSQL, room permissions and expiry, revision conflicts, and two simulated players.
- tests/playback-sync.test.mjs exercises clock differences, jitter, buffering, mismatched content, malformed data, out-of-order replies, and correction cooldown.

## Backend deployment

The new migration is prepared but has not been applied to the hosted project. Apply only 202611020002_playback_timeline.sql through Supabase SQL Editor as the project administrator after confirming the original private-room migration is present. Do not rerun the original migration. The new migration creates new playback objects; it does not approve accounts or enable Netflix control.

Do not place service-role keys, database passwords, or Netflix credentials into the app or this chat.

## Intended integration

1. Authorized clients read orbit_get_playback(p_room_id). Measure request start/end with performance.now(); use only fresh successful authorized responses.
2. The host sends orbit_set_playback(p_room_id, p_content_id, p_playing, p_position_ms, p_expected_revision). The content ID is a public Netflix catalog identifier, not a stream URL. The initial expected revision is zero. On conflict, reread; never retry a stale command blindly.
3. Feed replies into one PlaybackSynchronizer per joined room. All players, including the host, must follow the server timeline. Destroy it on sign-out, departure, or authorization loss. Serialize native actions and do not keep issuing commands from a cached timeline after an RPC failure.
4. Before execution, verify the actual player is on the intended title/episode, has a usable position and supports the required controls. The current Netflix probe does not provide a verified catalog/episode identity. Never copy the room ID into the player snapshot and treat that as content confirmation.
5. Connect a user-started Android background session with a visible stop control and test long background operation, reconnection, ads, buffering, title changes and revocation. This service is not implemented yet.

The planner returns actions; it does not execute them. Its simulated players are test objects and do not pretend to be Netflix. The embedded database tests do not exercise two simultaneous PostgreSQL connections; real deployment needs a concurrent-client check as well as the tested sequential revision-conflict checks.

## Emulator-only development

The user currently has an Android emulator available, without a physical test phone. The existing Pixel_10_Pro_XL configuration enables Google Play. Try Netflix only from the official Play Store listing and sign in only inside Netflix. A direct emulator check found Netflix is not installed, and Google Play opens its unauthenticated activity with Updating Google apps / Sign in. Sign in manually in Google Play before checking Netflix installation and playback. No sign-in was attempted by the agent. Do not change certification, protected playback, or identity checks to make it work.

Even if Netflix plays on the emulator, report that result as emulator behavior. Two real Android phones remain an eventual validation step for the intended product. Orbit development can continue with local authorization and simulated-player tests meanwhile.

Run npm.cmd run test:playback for the focused tests, or npm.cmd test for the complete suite. Lint and TypeScript checks also remain required.
