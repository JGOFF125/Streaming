# Orbit on a real Android phone

Orbit's Netflix controls require its own Android app. Expo Go does not include the local native module, and neither Expo Go nor Android Studio's QR pairing is needed for a standalone APK.

Version 1.2.1 (Android versionCode 5) is finished. [Download the standalone APK](https://expo.dev/artifacts/eas/Z6Tod6xtqFvATUCTLZiSsrqPrOENmiVCNWlnrWD4rqY.apk) on the phone, or open the [successful build page](https://expo.dev/accounts/jgoff/projects/orbit/builds/d1f6aad9-83dd-4626-a2a0-5d97ab28b71b). The APK is about 67.5 MB. It contains the one-minute room test and bundles the app so no development server or computer connection is required. This is not verified automatic Netflix support or movie-length synchronization.

## Installation and first checks

1. Open the finished build's installation page on the phone and download the APK. Install Orbit using Android's normal confirmation flow.
2. Open Orbit directly from its app icon, then use Continue with Google. The previously signed-in owner's account has room access. Enter a nickname and create a private room to check the room UI; share invitation codes only privately.
3. Use Netflix itself to sign in and start a movie. Orbit's Google sign-in and Netflix sign-in are separate. Streaming credentials never enter Orbit.
4. In Orbit, enable the optional Netflix-controls permission after reading its disclosure. Return after Netflix is playing and run local pause, play and seek tests individually. Confirm the visible movie actually changes. The report distinguishes reported capability from observed acknowledgment.
5. Actual Netflix metadata must include the matching numeric catalog ID before the room test can control playback. Missing identity or ignored commands blocks this route. Two independently authorized devices are required for a host/follower sync test.

The finished 1.2.1 APK was inspected: minimum Android API 24 (Android 7.0), target API 36, arm64-v8a and armeabi-v7a phone libraries, and the embedded app bundle are present. Its APK signature verified. Minimum OS and processor support alone do not prove a particular phone works. The user's physical test phone is a Google Pixel 10 Pro XL with Android 17, which meets the declared OS requirement; the user confirmed installation and launch. Netflix controls still need verification.

The successful preview build ran the existing native planner unit-test task and then assembled the release APK. The module's existing debug unit-test task tests the same pure Kotlin planner source used in the release app. Device testing still needs to establish real Netflix behavior, and full-movie background operation remains unfinished.

Build source: a6ae01c. The final guide/status changes do not alter the APK. SHA-256: 60876952de60e05715497c443b912956a975309f3e5dbe20649e07dae750c6a9. The user confirmed that the APK installs and opens on the physical Pixel. Actual Netflix controls remain pending user testing.
