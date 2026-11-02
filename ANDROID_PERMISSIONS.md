# Orbit Android permissions

Verified against the signed standalone Orbit 1.2.2 APK on November 2, 2026 (UTC). [APK](https://expo.dev/artifacts/eas/2L2zW_K9yTM3Z8RepteDbj4XJ6FpAAbiSwSldOTTuz0.apk) · [Successful build](https://expo.dev/accounts/jgoff/projects/orbit/builds/b417efd6-bcca-4cf0-b28c-6311721baa4a). Native compilation/tests, signature and bundled app checks passed.

## Declared permissions

The merged APK declares INTERNET for Supabase/Google and its package-scoped DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION for internal broadcast protection. The following unused grants were present in 1.2.1 and are absent from 1.2.2:

- SYSTEM_ALERT_WINDOW (draw over other apps)
- READ_EXTERNAL_STORAGE and WRITE_EXTERNAL_STORAGE (legacy device storage)
- VIBRATE
- com.google.android.finsky.permission.BIND_GET_INSTALL_REFERRER_SERVICE

No camera, microphone, contacts, location or phone/SMS permission is declared in this build. Future voice access must be requested when joining voice rather than at startup.

## Separate optional notification-access grant

The media listener is a separate Android special-access grant. It remains broad and is not Netflix-only. Removing the unused manifest grants does not remove or narrow that capability. Orbit ignores notification contents and disables all listener notification categories. On Android 17, the native query requests Netflix sessions only; older Android filters its legacy session list before reading metadata. Review / revoke controls access opens the owner's normal Android settings. Core Google sign-in and rooms do not depend on the grant. The rebuilt API path is compiled and needs real-phone runtime validation; the reported observed seek was from 1.2.1.

This external-player diagnostic is not the intended in-app Netflix experience. See [NETFLIX_EMBEDDED_FEASIBILITY.md](NETFLIX_EMBEDDED_FEASIBILITY.md).

## Reproduce the APK check

Set AAPT_PATH to the Android SDK aapt executable, then run:

    npm.cmd run check:apk-permissions -- path/to/Orbit.apk

The check examines the merged binary rather than trusting the config. The 1.2.1 artifact was used as a negative control and correctly failed for the five extra grants. The finished 1.2.2 artifact passed with no unexpected declared permission. The checker explicitly states that the separate notification-access grant remains broad.

Build source: 8f71340. APK SHA-256: a553abdc98ec8a426af30870e5a6999e544f659b09bc253998a10be6696c302b.
