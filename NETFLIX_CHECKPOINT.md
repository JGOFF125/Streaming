# Netflix integration checkpoint

Updated November 2, 2026 (UTC).

The requirement is automatic Netflix synchronization between two Android phones inside Orbit. Manual countdown is not an accepted substitute.

Orbit now includes a native Android MediaSession compatibility adapter and a Netflix controls check. It selects only the official Netflix Android package and tests local play, pause, seek, and playback-position reporting. Android notification access is optional, explained before settings open, and granted/revoked by the device owner. The adapter does not process notification text or send diagnostics to a server.

This is still an unverified integration route. API support and successful compilation do not establish Netflix compatibility. No real-phone result has been collected for this adapter. Automatic cross-device synchronization and voice are not implemented.

The next action is to install the new standalone test APK and run all three checks on both physical phones. Follow [NETFLIX_ANDROID_TEST.md](NETFLIX_ANDROID_TEST.md). If Netflix accepts the controls, the next implementation is an authenticated room playback timeline plus Android background execution and drift correction. If not, do not claim automatic Netflix sync works.

Do not use Netflix credentials, cookies, provider tokens, protected-stream capture, DRM bypasses, or accessibility automation as integration shortcuts.
