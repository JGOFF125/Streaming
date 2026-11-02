# Orbit — current status

Verified November 2, 2026 (UTC).

## Local development is running

The verified project folder is C:/Users/jessu/Downloads/Orbit/Orbit phase 1/orbit, matching the VS Code terminal screenshot. The Pixel emulator originally had development app 1.0.0 from October 22. It has now been updated to 1.1.1, Android versionCode 3.

The local server runs on http://127.0.0.1:8081 from this folder and the Pixel connects through an adb port reverse. It was started in the background by the agent, so the user's VS Code terminal remains idle. Server logs are at .expo/dev-server.log and .expo/dev-server-error.log. The server process ID is in .expo/dev-server.pid. Keep this server running for live development.

For future development sessions, run npm.cmd run start:dev -- --android from this folder. If a server is already running on port 8081, use the existing server instead of starting another copy. Native module changes require another EAS development build.

The current development build finished successfully: [Orbit 1.1.1](https://expo.dev/accounts/jgoff/projects/orbit/builds/f5dc2fa9-095c-485b-ab20-66b74886bda1). It is installed on the Pixel and loads the current local app source. Its Netflix controls panel shows the permission-required state, confirming the new native adapter is present. No AndroidRuntime or ReactNativeJS error appeared in the current launch check. Deprecation warnings remain for SafeAreaView and the Supabase lock option.

## Current code and verification

- Package/app versions are aligned at 1.1.1. Dependencies now match the recommended Expo SDK 58 patch versions, including Expo 58.0.22 and React Native 0.88.1.
- Dependency compatibility, lint, TypeScript, and all automated suites passed after the update.
- Google OAuth with native S256 PKCE and protected private rooms are implemented. The user previously completed Google sign-in; live room-account approval and two-device room behavior remain unverified.
- Supabase Auth is currently reachable (HTTP 200), with Google enabled. It has been resumed; the earlier paused state is historical.
- Netflix-only local Android playback diagnostics are implemented. Real Netflix play/pause/seek behavior and automatic cross-device synchronization are unverified. Voice is not connected.
- The host-authorized playback timeline migration and transport-independent planner passed embedded PostgreSQL and simulated-player tests. They are local source only: not deployed to Supabase or connected to a native player. See [PLAYBACK_SYNC_SETUP.md](PLAYBACK_SYNC_SETUP.md).
- The package audit reports 24 moderate and one high finding. The high finding is the transitive zod dependency used by ESLint development tooling. No forced major dependency upgrades were applied. Details are saved at .expo/dependency-audit-current.json.

## Remaining actions

1. Verify Google sign-in and room approval in the current app. The SQL file open in the screenshot, .expo/admin/approve_signed_in_account.sql, belongs in Supabase SQL Editor as the project administrator; opening it in VS Code does not apply it. Its live execution has not been confirmed.
2. The Pixel emulator has no Netflix installed and Google Play requires sign-in. The device owner must complete Google Play sign-in and install Netflix from its official listing before checking playback. Netflix sign-in remains inside Netflix.
3. Deploy only the new playback migration when ready, then implement the room client integration and a user-started Android background session. Actual content identity, ads, buffering, seeking, reconnection and physical-phone compatibility still require verification. Do not treat simulated players as Netflix integration.
4. The working tree includes uncommitted Phase 2 and synchronization work. No Git remote is configured, and this checkout has not been pushed to the user-supplied Streaming repository.

The earlier standalone 1.1.0 preview APK remains a historical test build that runs without a development server. Development app 1.1.1 is for running and changing the current local source.
