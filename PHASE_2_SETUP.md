# Orbit Phase 2 — setup and verification

Current recovery status (November 2, 2026): Supabase is paused. See
[PROJECT_STATUS.md](PROJECT_STATUS.md) before following older setup steps.
Updated October 19, 2026.

Google sign-in was added on October 21, 2026. For its required Supabase return URL,
account authorization, and Android development-build steps, use
[GOOGLE_SIGN_IN_SETUP.md](GOOGLE_SIGN_IN_SETUP.md). Google is disabled in Expo Go.

The existing Phase 1 app was extended in place. The private-room implementation is
ready for backend setup; it has not been deployed or tested between two devices.
Voice, playback synchronization, provider integrations and screen sharing remain unfinished.

## 1. Use the real app folder

Work in:
`C:\Users\jessu\Downloads\Orbit\Orbit phase 1\orbit`

This chat began in a separate mirror of the Rave ChatGPT project. Synced sources
in that mirror are reference material. The changes described here are in the
actual Orbit app folder above.

To make the app folder the default for future Codex work, use a local project.
In the project menu, choose **Edit project**, then **Add folder**, select the
Orbit folder above, and make it primary. An alternative is to open this exact
folder in VS Code and use its Codex extension.
[Official project and folder guidance](https://learn.chatgpt.com/docs/projects).

Git already exists, with an initial commit on `master`. Phase 1 changes were
uncommitted when this work started. No changes were discarded, and no commit or
push was made during this increment. No GitHub remote was configured.

## 2. Create the Supabase development backend

1. Sign in at [Supabase](https://supabase.com/dashboard) and create a new development
   project, for example `orbit-dev`. Select your own organization and region.
   Keep the database password in your password manager. Check the plan shown
   before creating anything; this guide does not promise a permanently free service.
2. Open the SQL Editor. Run the entire contents of
   `supabase/migrations/202610190001_private_rooms.sql` once. It is transactional
   and intended for a new project. Do not re-run it after success.
3. Confirm that Realtime replication includes `public.orbit_rooms`.
   The migration adds it when the standard `supabase_realtime` publication exists.
   Only this table should be published for Orbit. Do not publish the private
   invitation/access tables or membership deletes.
4. Keep `orbit_private` OUT of exposed API schemas. Only public Orbit RPCs and
   RLS-protected room/member reads are intended for the app.
5. In Authentication, keep Email sign-in enabled, disable public user signups,
   and leave anonymous sign-in disabled. The app requests existing-account OTP
   sign-in with `shouldCreateUser: false`; the database additionally requires
   an explicit access-list entry.
6. In the Authentication user dashboard, create confirmed users for your own email
   and the second tester. If the dashboard requires a temporary password, use a
   new randomly generated Orbit-only password; the app never asks for it.
   Do not reuse a streaming password.
7. In the SQL Editor, authorize those users. Replace the example addresses below
   with the confirmed account emails:

```sql
insert into orbit_private.allowed_users (user_id)
select id from auth.users
where lower(email) in ('YOUR_EMAIL@example.com', 'SECOND_TESTER@example.com')
on conflict do nothing;

select count(*) as authorized_accounts from orbit_private.allowed_users;
```

The second query should report two after both users exist. The server permits a
maximum of ten authorized accounts. App authentication and Orbit authorization
are separate: an authenticated account outside this list cannot use rooms.

To revoke a user, run this in the SQL Editor as the project administrator:

```sql
delete from orbit_private.allowed_users
where user_id in (
  select id from auth.users where lower(email) = 'REVOKED_EMAIL@example.com'
);
```

Revocation blocks subsequent room reads and joins. Already received data cannot
be recalled. The app checks access again every five seconds while active.

## 3. Configure email codes

In Authentication email templates, change **Magic Link** to include the numeric
token, for example:

```html
<h2>Your Orbit sign-in code</h2>
<p>Enter this code in Orbit: {{ .Token }}</p>
```

Request a fresh sign-in code from Orbit after creating and confirming each user.
The app verifies a sign-in code using the `email` type; it does not consume
initial account-invitation or account-confirmation codes.

Configure **custom SMTP** in the Supabase dashboard before sending to your second
tester. The default Supabase email service restricts recipients to project team
addresses and has tight sending limits. Do not give a tester infrastructure/team
access just to work around email delivery. Store SMTP credentials only in the
Supabase dashboard; they must never go in the app.

Keep Supabase Auth rate limits enabled. This increment includes a one-minute UI
resend delay and per-account database limits for room creation/joining. It does not
replace Auth's server-side email delivery controls.

[Official email OTP guide](https://supabase.com/docs/guides/auth/auth-email-passwordless).
[Official SMTP restrictions and setup](https://supabase.com/docs/guides/auth/auth-smtp).

## 4. Add the public connection details locally

Copy `.env.example` to `.env.local` in the Orbit folder. Use the project's
HTTPS URL and its current **publishable** key from Supabase's Connect/API settings:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_PUBLIC_KEY
```

This implementation accepts hosted `https://PROJECT.supabase.co` URLs and
`sb_publishable_` keys. It intentionally does not accept legacy JWT keys,
service-role keys, or local HTTP endpoints. These two values are public and get
embedded in the Android bundle. All actual authorization is enforced by the server.

Never add a service-role key, secret API key, database password, SMTP password,
or LiveKit signing secret to an `EXPO_PUBLIC_` variable. All local env files are
ignored by Git; `.env.example` is the only exception.

Restart Expo after changing the environment. In PowerShell:

```powershell
Set-Location -LiteralPath 'C:\Users\jessu\Downloads\Orbit\Orbit phase 1\orbit'
npx.cmd expo start --clear
```

Use `npm.cmd` and `npx.cmd`; changing PowerShell execution policy is unnecessary.

## 5. Test two Android devices

1. Load the same configured app on two devices using separate authorized email
   accounts. For local Expo development, both devices must reach the development
   server. An emulator and a physical Android phone are sufficient for this step.
2. On device A, request an Orbit email code, sign in, enter a nickname and create
   a private room. A 12-character invitation appears, grouped for readability.
3. Sign in on B with its own account and join using A's code.
4. Verify that both devices list both nicknames and show two members.
   Realtime uses room revisions; an authorized roster is fetched again after a
   change. Five-second checks also handle missed events and expired/revoked access.
5. Leave on B. Verify A's roster changes, and B cannot read the former room.
6. Rejoin B, then end the room on A. B should leave the room view within a
   five-second check, and the old invitation should stop working.
7. Try a wrong code, an account without an access-list entry, app restart,
   temporary loss of connectivity, and account revocation. Confirm the expected
   error or removal rather than treating an old member list as online presence.
8. Before considering the cloud backend verified, also exercise simultaneous
   joins near capacity from independent sessions and direct unauthorized API
   requests. The embedded local tests do not simulate independent DB connections
   or Supabase JWT verification, PostgREST, Realtime or email delivery.

The first increment stores Orbit sessions in memory only. After an app restart,
sign in again; the backend restores your existing active room. Codes are not
stored in plaintext on the server, so a restored session cannot redisplay the old
invitation. Leave and create a fresh room if a new invitation is needed.

Members remain listed when the app closes. The roster is membership, not online
presence. A host leaving closes the room for everyone. Rooms expire after 24 hours.
Expired/closed records are logically inaccessible but are not automatically
deleted. To clean them up, run this administrator-only query when needed:

```sql
delete from public.orbit_rooms where closed or expires_at <= now();
```

Memberships and invitation hashes cascade with that deletion.

For the eventual PC-independent version, distribute an installed Android build
with these public backend settings. Local Expo/Metro testing still needs the PC;
it is not the final distribution method.

## 6. Connect a private GitHub repository

Create an empty repository named `orbit` in your own GitHub account:
[New private repository](https://github.com/new?name=orbit&visibility=private).

Confirm **Private** before creating it. Leave README, .gitignore and license
initialization unchecked because the local repository already contains files.
[GitHub's instructions](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-new-repository).

Then, from the real Orbit folder:

```powershell
git status --short
git check-ignore .env.local
git diff --check
git add .gitignore App.tsx package.json package-lock.json .env.example eslint.config.js src supabase tests PHASE_2_SETUP.md
git diff --cached --stat
git diff --cached
git commit -m "Add authenticated private room foundation"
git remote add origin https://github.com/YOUR_USERNAME/orbit.git
git push -u origin master
```

Replace YOUR_USERNAME with the actual account. Review the staged diff before
committing. `git check-ignore .env.local` should report that path as ignored.
Use GitHub's normal browser/credential-manager sign-in if Git asks; do not paste
a GitHub password or token into this chat. If `origin` already exists by the
time you follow this guide, inspect `git remote -v` first instead of adding it
again. There is no need to rename or reset the current branch.

## 7. Files changed and why

| File | Purpose |
| --- | --- |
| App.tsx | Replaces the local room demonstration with the private-room panel; retains the compatibility lab. |
| src/components/PrivateRoomPanel.tsx | Email OTP sign-in, create/join/leave, member roster, Realtime subscription, foreground refresh and error states. |
| src/backend.ts | Validates public backend configuration and creates the in-memory Supabase auth client. |
| src/room.ts | Adds separate 12-character remote invitation validation; retains original demo helpers. |
| src/security.ts | Updates displayed privacy rules for the new room model. |
| supabase/migrations/202610190001_private_rooms.sql | Access list, RLS, hashed invitations, locked room mutations, expiry and request limits. |
| .env.example / .gitignore | Public configuration template and protection against committing local secrets. |
| package.json / package-lock.json / eslint.config.js | SDK-compatible client dependencies, local PostgreSQL test tool and lint/test commands. |
| tests/rooms.test.mjs | Executes the migration against embedded PostgreSQL and checks authorization/room boundaries. |
| tests/room-validation.test.mjs | Checks remote-code validation and preserves local-code behavior. |
| PHASE_2_SETUP.md | Setup, validation, GitHub connection and remaining work. |

No route/navigation system was introduced. Existing provider links still open the
official services; selecting a service does not add playback integration.

## 8. Verification and remaining work

Completed locally:
- TypeScript check: passed.
- Expo lint: passed.
- Expo dependency compatibility check: passed.
- Expo Doctor: 20/20 checks passed.
- Invitation validation and PostgreSQL security tests: passed.
- Android JavaScript/Hermes export: passed.
- Android emulator smoke test: updated app loaded successfully; missing-backend setup message and retained compatibility lab were verified. Email/room flows remain untested on a live backend.

Re-run checks from this folder:

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npx.cmd expo install --check
npx.cmd expo export --platform android --output-dir .expo/phase2-export
```

Security tests cover the ten-account limit, authenticated/approved access,
nonmember read denial, forged direct writes, private-helper permissions, hashed
codes, real membership creation, duplicate joins, persistent failed-attempt
counters, room capacity, revocation, leave/close behavior and expiry.

The October 19 dependency audit reports **22 findings: 15 high and 7 moderate**.
Auditing the original committed lockfile reports the same totals. A compatible
audit-fix dry run did not remove them; the tool suggested incompatible framework
downgrades for several paths. No forced downgrade was applied. Review the
specific dependency advisories and supported upstream fixes before release.

Still required: actual Supabase project/schema deployment, confirmed users and
access list, working SMTP, public app settings, real cloud authorization and
Realtime tests, two-device testing, independent-connection concurrency tests,
private GitHub setup/push, secure persistent Orbit sessions if desired, and
LiveKit voice integration with server-checked short-lived tokens. No streaming
service credentials are requested, captured or stored by this increment.
