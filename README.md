# Orbit — private watch party

Android app built with React Native, Expo SDK 58 and Supabase. Development happens in the existing local checkout used by VS Code and is pushed to this repository at verified milestones.

The intended product plays video inside Orbit alongside text and voice. Version 1.3.0 adds an isolated in-app Netflix website experiment; actual movie playback and synchronization through that surface are not verified. The older external adapter remains a separate diagnostic. See [IN_APP_NETFLIX_TEST.md](IN_APP_NETFLIX_TEST.md). See [NETFLIX_EMBEDDED_FEASIBILITY.md](NETFLIX_EMBEDDED_FEASIBILITY.md).

## Current capabilities

- A bounded Netflix website surface inside Orbit, with explicit protected-playback consent, app-local browser cleanup and no notification requirement. Movie playback remains a physical-device test.
- Google OAuth with native S256 PKCE and memory-only Orbit sessions.
- Private, account-approved rooms, hashed invitation codes, protected membership reads and realtime room updates. At most ten approved accounts.
- Netflix Android MediaSession diagnostics for play, pause, seek, position and strictly numeric catalog identifiers.
- An experimental one-minute room sync test: the host publishes its Netflix playback; a follower attempts to reconcile to the shared timeline. The test opens the official Netflix app, waits eight seconds, then runs briefly in native code.

**Automatic Netflix synchronization is not verified or movie-length ready.** The room test requires the playback database migration, an approved account, a compatible Netflix media session, supported controls and matching media identity on both devices. It stops on lost access, mismatched identity, slow/failed requests or unacknowledged adjustments. A one-minute test is not a background movie session. Other platforms and text/voice chat are not implemented yet.

## Privacy

The 1.2.2 APK removes unused overlay/storage/vibration/install-referrer permissions. External Netflix diagnostics still use a separate broad optional notification-access grant; core rooms and Google sign-in do not need it. See [ANDROID_PERMISSIONS.md](ANDROID_PERMISSIONS.md) for the verified binary audit.

## Test on a phone

Orbit uses its own standalone APK; Expo Go and Android Studio QR pairing are not required. See [PHONE_TEST_SETUP.md](PHONE_TEST_SETUP.md) for the current phone build and testing steps.

## Development

Use Windows PowerShell commands from the project root:

```powershell
npm.cmd run start:dev -- --android
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
```

Configure the local public Supabase connection using .env.example. Local environment files, credentials, signing material, APKs and generated build/test output are ignored by Git. Never add service-role keys or streaming credentials to the app.

Native changes require an EAS development build. Its Android build runs the native planner unit tests before assembling the APK:

```powershell
npx.cmd eas-cli@latest build --platform android --profile development
```

The preview build profile packages a standalone app bundle; development builds use the local server. Expo Go cannot run the custom Netflix module.

See [PROJECT_STATUS.md](PROJECT_STATUS.md), [PLAYBACK_SYNC_SETUP.md](PLAYBACK_SYNC_SETUP.md), and [NETFLIX_ANDROID_TEST.md](NETFLIX_ANDROID_TEST.md) for verified status, database setup and testing instructions.

## Delivery order

1. Verify and complete Netflix synchronization, including safe movie identity, playback control and movie-length background operation.
2. Add YouTube, Prime Video and Disney+ adapters. Reuse shared room/timing code while verifying each provider separately.
3. Add room text chat and realtime voice.

Never collect streaming passwords, cookies or provider tokens; bypass DRM; extract protected streams; or use accessibility automation to control Netflix.

## Workflow research

[WATCH_PARTY_RESEARCH.md](WATCH_PARTY_RESEARCH.md) compares Rave, Hearo, Teleparty and Watchly using official workflows and public screenshots. It separates documented facts from proposed architecture and records the next in-app playback experiment.
