# Orbit — sign-in and room access check

Current status (November 2, 2026): Supabase is online again and Google is enabled.
See [PROJECT_STATUS.md](PROJECT_STATUS.md) for the current build and local server.
The findings below are the historical check from October 22, 2026 (UTC).

## What is confirmed

- Your screenshot shows a signed-in Orbit session after the Google login you performed.
- The linked Expo project has a finished Android development build:
  d899602d-cb83-433b-82ea-323d5e3aebf3, created October 22, 2026.
- The live Supabase public settings report Google enabled and anonymous sign-in disabled.
- Signed-out reads of orbit_rooms and calls to orbit_restore_room are rejected.
- Current local lint, TypeScript, invitation/error tests, Google callback/token tests,
  database authorization tests, and Android/Hermes export pass.

These checks do not establish that the signed-in account is approved for rooms.
The public publishable key cannot read the private approval table. There is no
connected signed-in Supabase admin browser available in this chat.

## Why the room request needs another step

The server deliberately treats sign-in and room approval separately. Google
proves the account's identity; orbit_private.allowed_users decides who can use rooms.
The screenshot's generic message obscured whether the request failed due to that
approval, a server permission problem, session verification, or connectivity.

Missing account approval is the leading explanation, but it is not yet confirmed
against the live private table. I have not changed live database permissions.

Also, the numeric example in the screenshot is not a valid Orbit invitation.
Use the twelve-character code returned by Create private room. Invitation codes
use the restricted alphabet in src/room.ts; 0 and 1 are excluded.

## Changes made during this check

- src/roomErrors.ts: classifies known backend errors into safe approval, setup,
  session, busy-server and fallback messages, without exposing raw SQL details.
- src/components/PrivateRoomPanel.tsx: waits for confirmed room authorization
  before presenting room actions; adds Check room access again so approval can
  be retried without deliberately signing out; improves invitation guidance.
- tests/room-errors.test.mjs: covers those error distinctions and detail redaction.
- package.json: includes the new tests in the existing unit-test command.

No room authorization rule was weakened. The existing server access list, RLS
and ten-person limits remain enforced. The new screen behavior has been checked
by type/lint/bundle checks; its live signed-in interaction still needs your retry.

## Next steps

1. In this project's Supabase SQL Editor, run the prepared local file:
   .expo/admin/approve_signed_in_account.sql

   It authorizes only the Google account from your screenshot and returns
   room_access_enabled. The expected result is one row with true. The file is
   kept under the Git-ignored .expo folder so your personal email is not added
   to repository source files. If it reports no matching account, confirm that
   the Google email and selected Supabase project are correct.

2. Load the updated JavaScript in the installed development app. Start the
   development server with npm.cmd run start:dev if needed, reload the app,
   and sign in again if prompted. Orbit sessions currently stay in memory only.

3. Use Check room access again if it is shown. Then enter your nickname and tap
   Create private room. Share its generated invitation privately with the second
   intended tester.

4. Authorize the second account separately using the same existing setup process.
   Verify that both devices show both members, that leaving updates the other
   device, and that the host ending the room invalidates its invitation.

5. Public new-user signups are still enabled in the latest live settings check.
   After the intended accounts exist, disable Allow new users to sign up in
   Authentication → Sign In / Providers. Room approval is already separate,
   but restricting account creation matches the intended private app.

6. After the two-account room checks pass, proceed to LiveKit voice. Voice,
   playback synchronization, streaming integrations and screen sharing remain
   unfinished.

## Remaining limits

- Live account approval, authenticated RPC behavior, Realtime publication settings
  and two-device behavior still need verification on the configured backend.
- The current npm dependency audit reports 18 findings: 15 high and 3 moderate.
  It does not flag the Supabase/Google browser/crypto packages in this check.
  The remaining dependency findings still need supported fixes/review before release.
- The app has no persistent secure sign-in session storage yet.
- This check does not constitute a production security audit.
