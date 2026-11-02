# Orbit on a real Android phone

## Current in-app player candidate: 1.3.0

The [Orbit 1.3.0 standalone APK](https://expo.dev/artifacts/eas/o4C3M1fMeDL6vvq1gtyDKqFRuQitqZXy2X1ezJT8_tw.apk) ([successful build](https://expo.dev/accounts/jgoff/projects/orbit/builds/8419489c-93bc-4cf8-9854-2e05d7c59954)) is finished. Native compilation, the cloud unit-test task and release assembly passed. Binary inspection verified the existing signing certificate, embedded app bundle, ARM64 phone libraries, minimal permissions and disabled application backup. No computer server or Expo Go is required.

Open Netflix inside Orbit → Test Netflix inside Orbit. Stay in the app, use Netflix’s own page and try a full movie/episode. Select the matching observation in the panel. No notification access is needed. Movie playback, actual player identity and two-device automatic sync remain unverified. See [IN_APP_NETFLIX_TEST.md](IN_APP_NETFLIX_TEST.md) for the complete test and cleanup steps.

All 62 JavaScript/database checks and 14 pure Kotlin tests passed locally, plus lint/typecheck. Build source: c0527d1. APK SHA-256: e0c12a46c216ec717a453f05b1192933048ac7659b7ec178ba87ef0b0c490ae7.

The prior preliminary build was cancelled before delivery so the final artifact could disable Android app backup. Do not use its build ID as a download.

## Previous verified APKs

Previous verified privacy build: [Orbit 1.2.2 privacy-cleanup APK](https://expo.dev/artifacts/eas/2L2zW_K9yTM3Z8RepteDbj4XJ6FpAAbiSwSldOTTuz0.apk) ([build](https://expo.dev/accounts/jgoff/projects/orbit/builds/b417efd6-bcca-4cf0-b28c-6311721baa4a)). It removes unused permissions and clarifies optional external controls. See [ANDROID_PERMISSIONS.md](ANDROID_PERMISSIONS.md). The installed/tested 1.2.1 artifact and its provenance remain below as history. Neither version embeds Netflix video.

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

Build source: a6ae01c. The final guide/status changes do not alter the APK. SHA-256: 60876952de60e05715497c443b912956a975309f3e5dbe20649e07dae750c6a9. The user confirmed that 1.2.1 installs and opens on the physical Pixel and shared an observed-seek report. Its accepted catalog ID was null, so two-device synchronization remains blocked by identity checks.
