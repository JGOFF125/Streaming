# Optional desktop compatibility profile — 1.3.6

November 13, 2026. Signed [Orbit 1.3.6 APK](https://expo.dev/artifacts/eas/a57UvL-jBjoYrtb0GlEvuc5Wa03UDNXSyV2Uj2rVaA0.apk) verified: build 200f743a-78c7-4a81-b7ff-2f2cdf784279, source 2377c3520b2eaf4b9ec37b61afe730d33874771a, Android code 13. Physical playback remains pending. No working Netflix movie or sync is claimed.

## Evidence and reason for the experiment

The 1.3.5 physical result validates automatic local episode candidate matching but supplies no separate series context: all three additional standard-text fields are absent in the report, both catalog-ID fields are absent and no active queue key is reported. Do not ask for another identical metadata snapshot or promote the candidate to trusted identity.

A new anonymous controlled request comparison used the same public episode watch link and representative mobile/desktop browser signals. The mobile path returned an intent-scheme handoff after the public watch/title redirects. The desktop path stayed in HTTPS and reached a public series page. Both login requests showed the ordinary sign-in form. No account was signed in, no cookies were retained and no movie/licensing request was made. These results are representative HTTP navigation observations, not an actual authenticated WebView test. Previous Orbit/Chrome/Firefox phone playback failures remain evidence; their exact user-agent/client-hint values were not captured, so equivalence or difference is not asserted.

Android documents that user-agent metadata controls WebView Client Hints and recommends aligning it with changes to the normal agent. [AndroidX WebKit release/API](https://developer.android.com/jetpack/androidx/releases/webkit), [WebSettingsCompat metadata](https://developer.android.com/reference/androidx/webkit/WebSettingsCompat#setUserAgentMetadata(android.webkit.WebSettings,%20androidx.webkit.UserAgentMetadata)). The new experiment changes both supported signal sets, not only viewport or an agent suffix. This is a consciously bounded compatibility test based on the observed route difference; it does not overturn the prior failed baselines or establish movie playback.

## Implementation boundaries

- Standard mode leaves the real default agent untouched. Desktop mode is fixed, opt-in and selected before navigation; no arbitrary agent/URL prop is exposed.
- A pure helper extracts only the Chromium/WebKit version tokens from an actual Android default WebView agent. It refuses unknown, outdated, duplicated or excessive inputs. It constructs a generic Linux/x86 desktop presentation without copying the model, Android version, extra suffix or account text.
- Stable AndroidX WebKit 1.18.0 is pinned from Google Maven. Its inspected AAR declares minSdk 24 and minCompileSdk 33. The existing project minimum remains 24. All calls require runtime feature support. Form-factor hints are overridden only if their separate feature is supported, and the result is reported explicitly.
- The profile does not turn Android WebView into desktop Chrome or change MediaDrm, hardware, subscriptions, codec capabilities or legacy browser properties. Provider acceptance is unknown.
- No page injection, DOM/player inspection, cookie/header reads, stream extraction, DRM weakening, device cloning, remote-control gate bypass, new service or new permission.
- Existing Netflix-only navigation/origin checks, explicit protected-media consent, certificate failure handling, blocked file/popups/camera/mic/location and background closure remain. Profile switching requires closing the current surface in the UI. App-local browser sign-in may remain until the existing clear action.
- Native view creation waits until all props are set, avoiding an initial mobile navigation on a desktop attempt. Unavailable metadata or unknown engine information fails the optional attempt explicitly; standard mode remains available.
- Native experiment version 3 emits only mode/applied/capability booleans. Orbit in-app Netflix v3 keeps these separate from page events and user-reported playback, strips raw agents/URLs/errors/cookies, and always leaves titleIdentityVerified / automaticSyncVerified false. The unrelated external-controls diagnostic remains v4.

## Verification and one-phone acceptance

Local lint/typecheck, 107 JavaScript/database tests, 46 pure Kotlin tests, the AndroidX configurator compile and Android Metro/Hermes export passed. Full cloud native tests/release assembly and the signed APK audit also passed. The signature matches earlier Orbit updates, no declared permission was added, and actual bundled JavaScript contains the new action and in-app v3 report. These checks do not verify physical playback.

After delivery: install 1.3.6 as an update, open Netflix inside Orbit → Open Netflix test screen → Try desktop compatibility profile. Stay inside Orbit, sign in only on Netflix's official page if needed, and attempt actual episode video and sound. If Netflix requests protected playback, the existing separate consent is required. Movie played means real protected program video/audio inside Orbit, not a trailer, sign-in page, external app or PiP.

If it still requests its app or returns an error, record that outcome and the short provider error code, not passwords/login codes. In Details/Results select the matching outcome and share the Orbit in-app Netflix v3 text, particularly browserProfileEvidence. Do not send another external Netflix-controls snapshot for this experiment. A successful page, hint override or protected-media grant alone is not successful movie playback or sync.
