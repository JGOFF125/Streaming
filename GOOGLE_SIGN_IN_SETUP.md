# Orbit Google sign-in — Android setup
Updated November 2, 2026.

The Android Google button and secure browser callback flow are implemented.
You confirmed successful Google sign-in on October 22. The Android development
build used for that test was finished and Expo is signed in. Supabase has since
been resumed; the latest public Auth settings check returns HTTP 200 with Google
enabled. See PROJECT_STATUS.md for the current app build and local server.
Room approval and two-device room behavior still need live confirmation.
See [PROJECT_STATUS.md](PROJECT_STATUS.md) for the current recovery steps.

## 1. Add Orbit's return URL in Supabase

Open Authentication → URL Configuration → Redirect URLs → Add URL and save:

```text
com.jgoff125.orbit://auth/callback?orbit_state=*
```

Copy the entire pattern, including `?orbit_state=*`. The app includes a fresh
random state for each sign-in and checks it when the browser returns.
Keep the app scheme/host/path fixed; do not replace this with a broad `**` entry.

This setting is separate from the Google Cloud authorized redirect URI, which
remains:

```text
https://syvxuqwlavfufbhsmzcd.supabase.co/auth/v1/callback
```

The first address returns from Supabase to the installed Android app. The second
returns from Google to Supabase. Keep the Google client secret only in Supabase.

[Supabase redirect configuration](https://supabase.com/docs/guides/auth/redirect-urls).

## 2. Authorize your permanent Google account

Use the exact permanent Google email that you will select in the browser.
A temporary test-email account is a separate identity unless it uses that exact
same email.

1. In Google Auth Platform → Audience, keep the app in Testing and add your
   account and each tester as test users.
2. In Supabase Authentication → Users, create a confirmed user for each intended
   Google email if it is not already present. Use the dashboard's Create user
   option and Auto Confirm User where available. If a password is required,
   generate a unique random Orbit-only password; Google sign-in does not ask
   for that password.
3. In Supabase Sign In / Providers, disable public new-user signups after the
   intended accounts exist. The last public settings check still showed signups
   enabled. Existing confirmed accounts can then use Google, with matching email
   identities linked by Supabase.
4. In the SQL Editor, authorize the users for rooms. Replace the example emails:

```sql
insert into orbit_private.allowed_users (user_id)
select id from auth.users
where lower(email) in (
  lower('YOUR_GOOGLE_EMAIL@example.com'),
  lower('SECOND_GOOGLE_EMAIL@example.com')
)
on conflict do nothing;

select count(*) as authorized_accounts from orbit_private.allowed_users;
```

Confirm that the count matches the intended users. The database caps this list
at ten accounts. Google authentication by itself grants no room access.

Google sign-in does not use Orbit's email-code delivery. If you also want email
OTP login, complete the SMTP/template setup in PHASE_2_SETUP.md separately.

[Supabase Google setup](https://supabase.com/docs/guides/auth/social-login/auth-google).
[Matching-email identity linking](https://supabase.com/docs/guides/auth/auth-identity-linking).

## 3. Sign in to Expo and create the Android development build

In a VS Code terminal opened in:

`C:\Users\jessu\Downloads\Orbit\Orbit phase 1\orbit`

run:

```powershell
npx.cmd eas-cli@latest login
```

Use your own Expo account. If needed, create it at https://expo.dev/signup.
Keep passwords and any account verification codes in the official login flow.

After signing in, create the development build:

```powershell
npx.cmd eas-cli@latest build --platform android --profile development
```

The first build may ask to create/link the Expo project and set up an Android
keystore. The prepared app package is `com.jgoff125.orbit`. Use your own account
for project ownership. Keep any signing credentials in Expo's signing setup.

The development profile in eas.json produces an installable Android APK with the
required browser/crypto modules and the registered custom URL scheme. It includes
only the public Supabase URL and publishable key. Those values are already public
app configuration; do not put Google secrets or Supabase service-role keys there.

This setup does not submit Orbit to Google Play or start a paid Google Cloud trial.
Review the build service's displayed plan/quota if it prompts you.

When the build finishes, use its install link on your Android phone. For the
emulator, you can select the build through:

```powershell
npx.cmd eas-cli@latest build:run --platform android
```

Then start the development server:

```powershell
npm.cmd run start:dev
```

Open the installed **Orbit** development app. Expo Go can still run the existing
email-code/compatibility prototype using `npm.cmd run start:go`, but its Google
button is disabled because Expo Go cannot register Orbit's custom return scheme.

[Expo development builds](https://docs.expo.dev/develop/development-builds/introduction/).
[Build configuration](https://docs.expo.dev/build/eas-json/).

## 4. Verify the actual login

1. In the installed Orbit development app, tap Continue with Google.
2. Choose the approved Google test account and finish consent in the browser.
3. Verify that the browser returns to Orbit and the correct account email appears.
4. Confirm that the authorized account can create a room. Test the second account
   and verify that an account absent from the Orbit access list cannot use rooms.
5. Sign out and repeat. Cancel a login midway and confirm the app remains signed out.
6. If the Android app restarts while the browser is open, start login again. The
   pending verifier/state and Orbit sessions are kept in memory only.

If the browser returns to localhost or a website instead of Orbit, check the
Supabase Redirect URLs entry. If Google reports redirect_uri_mismatch, check
Google Cloud's HTTPS callback. If it reports access_denied, check Google test users
and the existing Supabase account. If room access is denied after sign-in, check
orbit_private.allowed_users.

## 5. Implementation and checks

- src/googleAuthFlow.ts: per-attempt state, S256 PKCE, callback validation, code
  exchange and selective retention of Orbit session tokens.
- src/googleSignIn.ts: native async Expo crypto, Android browser login, runtime
  availability check and verified Supabase session creation.
- src/components/PrivateRoomPanel.tsx: Continue with Google button and cancellation
  handling, with the existing email-code flow retained.
- src/backend.ts: keeps sessions in memory and makes explicit that the native
  Google wrapper owns S256 PKCE. SDK automatic PKCE is off so it does not add a
  second challenge.
- app.json: custom callback scheme and Android package.
- eas.json: Android development APK profile with public backend configuration.
- package.json / package-lock.json: SDK-compatible auth/dev-client packages and
  test/start commands. Expo received its recommended SDK 58 patch update.
- tests/google-auth.test.mjs: wrong callback/state, duplicate parameters,
  cancellation, missing crypto, SDK URL compatibility, token response validation,
  and Google provider-token exclusion.

The native wrapper uses the documented Supabase Auth PKCE token endpoint with
Expo crypto because the installed SDK can fall back to Math.random and plain PKCE
where full WebCrypto is absent. No private SDK storage keys are used. Only basic
Google identity scopes are requested; no streaming-service access scopes are added.
Google provider access/refresh tokens are not copied into the Orbit SDK session.
The code does not log OAuth URLs, codes, verifiers or tokens.

[Supabase Auth REST API](https://github.com/supabase/auth/blob/master/openapi.yaml).
[Expo native crypto](https://docs.expo.dev/versions/v58.0.0/sdk/crypto/).

Run local checks with:

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npx.cmd expo install --check
npx.cmd expo-doctor
npx.cmd expo export --platform android --output-dir .expo/google-auth-export
```

These checks validate code, callback boundaries and packaging. They do not prove
that the Google client secret, Google test-user list, live redirect allowlist,
signed APK or two-device room behavior is correct. Verify those after the
development build is installed. The previously recorded dependency audit findings
also remain unresolved.

Verification on October 21: lint, type checking, all local tests, Expo dependency
compatibility, Expo Doctor (20/20), and Android/Hermes export passed. The APK
and real Google login still require the Expo account/build and dashboard steps.

Expo Go smoke test also passed after restarting the preview with the updated SDK.
The Google button correctly shows the development-build requirement, while the
email-code panel and streaming compatibility lab still render. This does not
verify a live Google login.
