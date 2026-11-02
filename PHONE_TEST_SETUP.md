# Orbit on a real Android phone

Orbit's Netflix controls require its own Android app. Expo Go does not include the local native module, and neither Expo Go nor Android Studio's QR pairing is needed for a standalone APK.

Version 1.2.1 (Android versionCode 5) is being prepared as an internally distributed standalone test APK. It contains the one-minute room test and bundles the app so no development server or computer connection is required. This is not verified automatic Netflix support or movie-length synchronization.

## Installation and first checks

1. Open the finished build's installation page on the phone and download the APK. Install Orbit using Android's normal confirmation flow. Keep Play Protect enabled; report any blocked-install message rather than bypassing it.
2. Open Orbit directly from its app icon, then use Continue with Google. The previously signed-in owner's account has room access. Enter a nickname and create a private room to check the room UI; share invitation codes only privately.
3. Use Netflix itself to sign in and start a movie. Orbit's Google sign-in and Netflix sign-in are separate. Streaming credentials never enter Orbit.
4. In Orbit, enable the optional Netflix-controls permission after reading its disclosure. Return after Netflix is playing and run local pause, play and seek tests individually. Confirm the visible movie actually changes. The report distinguishes reported capability from observed acknowledgment.
5. Actual Netflix metadata must include the matching numeric catalog ID before the room test can control playback. Missing identity or ignored commands blocks this route. Two independently authorized devices are required for a host/follower sync test.

The existing 1.2.0 development APK declares minimum Android API 24 (Android 7.0) and includes arm64-v8a and armeabi-v7a phone libraries. The finished 1.2.1 artifact will be inspected separately; minimum OS and processor support alone do not prove a particular phone works. Report the phone model and Android version before installation.

The preview profile runs native release planner unit tests before assembling the APK. Device testing still needs to establish real Netflix behavior, and full-movie background operation remains unfinished.
