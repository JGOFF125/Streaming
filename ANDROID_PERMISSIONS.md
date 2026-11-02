# Orbit Android permissions

Verified against the signed standalone Orbit 1.3.0 APK on November 2, 2026 (UTC). [Orbit 1.3.0 standalone APK](https://expo.dev/artifacts/eas/o4C3M1fMeDL6vvq1gtyDKqFRuQitqZXy2X1ezJT8_tw.apk) · [Successful build](https://expo.dev/accounts/jgoff/projects/orbit/builds/8419489c-93bc-4cf8-9854-2e05d7c59954). Native compilation/tests, signature, bundled app, disabled-backup and minimal declared-permission checks passed. Source c0527d1. SHA-256: e0c12a46c216ec717a453f05b1192933048ac7659b7ec178ba87ef0b0c490ae7.

## Declared permissions

The merged APK declares INTERNET for Supabase/Google and its package-scoped DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION for internal broadcast protection. The following unused grants were present in 1.2.1 and are absent from both 1.2.2 and 1.3.0:

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

    npm.cmd run check:apk-permissions -- path/to/Orbit.apk --require-no-backup

The check examines the merged binary rather than trusting the config. The 1.2.1 artifact was used as a negative control and correctly failed for the five extra grants. The finished 1.2.2 artifact passed with no unexpected declared permission. The checker explicitly states that the separate notification-access grant remains broad.

Previous 1.2.2 audit: build source 8f71340. APK SHA-256: a553abdc98ec8a426af30870e5a6999e544f659b09bc253998a10be6696c302b.

## Provider browser backup boundary (1.3.0)

The new browser keeps Netflix-managed sign-in state in app-private WebView storage until cleared. Android app backup is explicitly disabled through app.json android.allowBackup=false. The finished 1.3.0 APK passed the binary check with --require-no-backup. The older 1.2.2 APK correctly fails this new backup requirement as a negative control. This setting concerns Android application backup; it is not a claim about Android password-manager records or every OEM device-transfer behavior.

The in-app website needs no notification access. Its only possible website grant is an explicit Netflix protected-media request, which may disclose a device identifier for playback licensing. Camera/microphone and unknown resources are denied; no Android runtime permission was added. Browser authentication is provider-managed app-private state, with a clear-sign-in action. See [IN_APP_NETFLIX_TEST.md](IN_APP_NETFLIX_TEST.md).
