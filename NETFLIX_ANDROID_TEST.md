# Orbit Android Netflix control test

This is a compatibility build, not completed automatic synchronization.

## Physical phone and emulator status

A real Google Pixel 10 Pro XL running Android 17 is now available. The user confirmed that Netflix plays normally on that phone. Orbit Google sign-in also works. Use [PHONE_TEST_SETUP.md](PHONE_TEST_SETUP.md) for the standalone APK; Expo Go and Android Studio QR pairing are not required. Actual Netflix media identity and control acknowledgment on the phone remain unverified.

The Pixel emulator still exits Netflix before sign-in or playback. A standard-page emulator comparison also exited with Orbit absent; changing page size and restarting did not resolve startup. See [the startup investigation](NETFLIX_STARTUP_INVESTIGATION.md). No Android 16 comparison was completed. These emulator failures do not establish the cause or predict the physical phone's control behavior.

## Current development build

Orbit 1.2.0 is already installed on the Pixel emulator and connects to the running local source. Its [EAS development build](https://expo.dev/accounts/jgoff/projects/orbit/builds/11042537-beb5-4d00-ae1a-45842b29c7a6) contains the native room test. Development builds require the local server. The standalone 1.1.0 preview below is historical and contains only local controls diagnostics, not the new room test.

## Historical 1.1.0 local diagnostics

1. Open the [Orbit 1.1.0 build page](https://expo.dev/accounts/jgoff/projects/orbit/builds/d32f83e6-60a7-46ed-9fce-2b172f1b34eb) on a physical Android phone. The build is finished. Download/install the APK, or use the [direct APK download](https://expo.dev/artifacts/eas/ntNJHw0R_h0KL8JIBLu-k0zI4yQSdMNxcIN03gyPKi8.apk). It uses the existing Orbit application ID and signing configuration.
2. Open Orbit. This preview APK includes the app bundle and does not need Metro or your computer running.
3. Find **Netflix controls check**. Tap **Enable Netflix controls** and read the permission disclosure. Android's notification-access permission is broad; granting it is optional and must be done by the phone owner. You can revoke it using **Manage controls access**.
4. Tap **Open Netflix and start a movie**. Sign in only inside the official Netflix app. Choose a title you can legitimately watch. Return to Orbit after playback starts.
5. Check whether Orbit can see the player, a playback position, and play/pause/seek support.
6. Run **Test pause**. Orbit opens Netflix and sends one pause command after eight seconds. Watch for the change, then return to Orbit for the Android-reported result.
7. Leave the movie paused and run **Test play**. Repeat for **Test seek +10 seconds**, away from the end of the movie.
8. Tap **Share diagnostic result** after each test if you want to send the result back. Confirm whether the visible movie actually changed. The result contains only the latest test; reports stay local unless you choose to share them.
9. Repeat on the second phone. A pass on one phone does not establish compatibility on the other.

The adapter only selects the official Netflix Android package, com.netflix.mediaclient. It does not target a browser, another media app, or multiple ambiguous Netflix sessions. Unsupported commands fail without falling back to accessibility, screen capture, custom login pages, or protected-stream extraction.

## What the result means

- **Reported controls** are Android capability flags; Netflix might still ignore a command.
- **Observed** means Android reported the requested state/position change. The viewer must also confirm the movie changed.
- **Not observed** means a command was sent but its expected effect was not reported within three seconds.
- **Unavailable** explains missing access, player state, seeking, or another prerequisite.
- A local test is not proof of two-device synchronization. Ads, buffering, title/episode changes, screen lock, and long background sessions still need testing.

The native check runs briefly while Netflix is in front. It is not a background room-sync service. It stores no settings, Netflix credentials, notification contents, titles, or media-session handles. Snapshot positions and test results are held in app memory and disappear after restart.

## Next development gate

Confirm play, pause, position reporting, and seeking on both real phones first. If these work, connect a host-authoritative playback timeline to authenticated private rooms, add a user-started Android background session, and test clock offsets, drift correction, pause/seek feedback loops, buffering, reconnection, room expiry/revocation, and ads. Matching a title/episode across phones must be explicit; elapsed time alone cannot establish that both phones play the same content.

If required Netflix controls are absent or ignored, this MediaSession route cannot provide the requested automatic sync on those phones. Do not label it supported without a different verified integration.

## Reference APIs

- [Android MediaSessionManager](https://developer.android.com/reference/android/media/session/MediaSessionManager)
- [Android MediaController.TransportControls](https://developer.android.com/reference/android/media/session/MediaController.TransportControls)
- [Android NotificationListenerService](https://developer.android.com/reference/android/service/notification/NotificationListenerService)
- [Expo local native modules](https://docs.expo.dev/modules/get-started/)

## Experimental room test in version 1.2.0

The new development build adds a one-minute host/follower test inside a joined room. Supabase playback migration 002 and approved accounts are required first. Enable Netflix controls on each device. The host selects an official Netflix title/watch link or a detected numeric catalog ID and starts the host test. After the host has published playback, the other device starts its follower test. Use normal 1× playback on both devices.

Each device opens Netflix and waits eight seconds before the native test begins. Change play/pause/position in Netflix on the host and observe the follower. The native runner requires Netflix itself to expose a matching numeric media ID and stops if identity, authorization, network timing or control acknowledgments fail. Do not treat a completed timer or simulated-player tests as verified Netflix support. Ads and nonstandard playback rates are not supported by this test contract.

This is a short validation window, not a movie-length background service. The tested window ends automatically and supports cancellation. No streaming credentials enter Orbit. The one-minute runner uses only its own Orbit access token in memory.
