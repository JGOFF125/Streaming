# Netflix startup investigation

Verified November 2, 2026 (UTC). Automatic Netflix synchronization is not verified.

## Observed failure

The user reports that Netflix resets to Get started after about ten seconds during sign-in, including when Orbit is not open. No credentials were entered by the agent. Only Android system process/package metadata was collected; Netflix sign-in screens, application data, cookies and account tokens were not read.

The Pixel 10 Pro XL has the official Play Store installation of Netflix 9.89.0 build 14 (versionCode 74684, x86_64). Its API 37.2 Play Store image uses 16 KB memory pages. Repeated foreground exits show Android reason SIGNALED with status 9. System Process-tag entries show the same Netflix process sending SIGKILL to itself. This identifies the immediate termination mechanism, not its underlying cause.

After a full emulator restart, Netflix again disappeared about six seconds after an explicit launch, before credentials or playback. One separate startup process was also recorded as LOW_MEMORY during boot. Memory pressure therefore cannot be ruled out, but it does not explain away the repeated self-signal evidence. No Netflix media session was available for Orbit to control.

## Standard-image comparison

The original Pixel was shut down without wiping data. The existing Medium Phone API 37.0 Play Store emulator was started using standard 4 KB pages. The unchanged, officially signed Netflix APK split set was copied from the Pixel's installed program files. No Netflix account data was copied. This test installation used ADB rather than Play Store, so installer provenance and other device differences limit the comparison.

Netflix restarted once and then exited on that emulator too. Both main-process exits were SIGNALED/status 9, and the system Process tag again recorded self-directed SIGKILL. Orbit's process was absent throughout the 30-second sampling window. The evidence reproduces startup failure without Orbit running and shows that changing page size alone did not resolve it. It does not establish an emulator-wide incompatibility, a DRM failure, an integrity verdict, or a specific bug in Netflix.

The standard test emulator was stopped and the original Pixel was reopened. Saved data and Orbit's owner-granted controls permission were preserved. Orbit 1.2.0 (versionCode 4) was reopened against the existing development server.

## Next validation gate

1. Netflix must remain open, complete sign-in and play a movie independently, using its official app. The restart has already been tried without success. Use a supported physical Android device when available, or continue with official Netflix support for the startup problem. No real phone is currently available to this project.
2. Once playback works, verify the actual catalog ID and acknowledged play/pause/seek controls through Orbit's local check. Missing metadata or controls still blocks this MediaSession route.
3. Then run the one-minute host/follower test on two approved room members. The playback backend is now deployed and the owner's previously signed-in Google account has room access.
4. Only after real behavior is established, implement and validate full-movie background operation and token lifecycle handling.

No Netflix data was cleared, no APK was modified, and no certification, device identity or protected-playback checks were changed. Private test APKs and raw local diagnostic output remain ignored under .expo and are not published to GitHub.

## References

- [Netflix: crashes or closes](https://help.netflix.com/en/node/25892)
- [Android ApplicationExitInfo](https://developer.android.com/reference/android/app/ApplicationExitInfo)
- [Android emulator troubleshooting](https://developer.android.com/studio/run/emulator-troubleshooting): the documented API 37 Google-services issue applies to images before revision 5; the installed images are revision 6, so it is not an established explanation here.
