# Android playback components — installed-app comparison

November 13, 2026. The user authorized inspection of the installed Rave/Hearo packages to identify reusable technology. This report distinguishes component presence, runtime observations and unverified integration details. No competitor code or binary is added to Orbit. Public installation artifacts and sanitized summaries remain ignored under .expo/competitor-package-metadata.

## Sources and scope

The current phone user has Rave com.wemesh.android 9.0.68 and Hearo live.hearo 26.2. Android reports Play Store installation provenance for both. Their immutable base and ARM64 installation splits were inspected using Android SDK APK Analyzer and ZIP metadata. Account/private storage, cookies, provider credentials, DRM certificates/keys and license messages were not accessed. The public Android API calls in three visual lifecycle methods were filtered to WebSettings setter names; no custom method implementation was saved or copied. No Netflix/private-client protocol was inspected.

Official identities: [Rave Play listing](https://play.google.com/store/apps/details?id=com.wemesh.android), [Hearo Play listing](https://play.google.com/store/apps/details?id=live.hearo). Analysis tool: [Android APK Analyzer](https://developer.android.com/tools/apkanalyzer).

## Measured package evidence

| Component | Rave 9.0.68 | Hearo 26.2 | What this establishes |
|---|---|---|---|
| Android WebView / AndroidX WebKit | Referenced/present | Referenced/present | Both include browser-facing components; this does not identify the movie-rendering route. |
| Media3 native player classes | Present | Present, including a large Media3 package set | Native media infrastructure is bundled; an SDK can also serve ads or other providers. |
| Legacy ExoPlayer classes | Present | No matching namespace observed | Limited package evidence, not proof of a Netflix adapter. |
| WebRTC / realtime media | org.webrtc and native media libraries | LiveKit SDK and its native peer-connection library | Useful leads for later voice/data features. |
| Standalone JavaScript runtime | No Javet namespace observed | Javet classes and libjavet-v8-android.v.4.1.5.so | An embedded V8 runtime is present; it is not a browser or Netflix playback SDK. |
| Chromium namespaces | Mostly Cronet networking types | Some Chromium types | A Chromium name does not by itself establish a bundled browser engine. |
| GeckoView / Crosswalk | No matching types or engine libraries observed in inspected splits | No matching types or engine libraries observed in inspected splits | Does not exclude obfuscation, dynamic delivery or future versions; no basis for adding one to Orbit. |
| Custom native components | Includes libmanifesto_client.so and libwemesh-sync.so | Includes additional native application libraries | Filenames establish presence only. Their proprietary behavior/licensing is not inferred or transplanted. |

Rave has Netflix-named application types and Netflix UI signatures referring to WebView. No com.netflix.msl namespace was observed in the DEX package metadata. This does not rule out obfuscated/native/remote code, and the public [Netflix MSL project](https://github.com/Netflix/msl) is a general secure-messaging framework, not evidence of a consumer streaming SDK being available to Orbit.

Selected public lifecycle configuration calls include JavaScript, viewport, zoom, DOM storage, cache and user-agent setters. No useful autoplay/DRM-setting difference was established in these selected methods. No agent/model/identity constant was exported or copied. Do not turn this into another speculative user-agent build.

## Current physical comparison

The user confirms that the same episode currently plays with video and sound inside Rave in a private room on this Pixel. Android confirms Rave is foreground, rather than the official Netflix app. A scoped view-hierarchy inspection of that activity exposes androidx.media3.ui.SubtitleView, native SurfaceView/TextureView nodes and no WebView nodes in the inspected hierarchy. Raw activity/UI data and video frames were not saved.

Inference: this supports investigating a native playback surface separate from the browser used for provider browsing/authentication. It is stronger evidence than package presence alone, but it does not reveal how Rave obtains authorized Netflix playback configuration, which exact library decodes this title, or whether a supported external SDK exists. A Rave-owned media session is listed, with no informative public ExoPlayer/Chromium tag. No media metadata or playback command was requested.

The current official Netflix package on this Pixel is 9.92.0. Its inspected base manifest declares neither cross-app activity-embedding opt-in nor a standard MediaBrowserService/Media3 session-library service. [Android requires the embedded app to opt in](https://developer.android.com/develop/ui/views/layout/activity-embedding). This does not provide an ordinary supported route for putting Netflix’s official activity inside Orbit on this version. No app trust/signature or system restriction was changed.

## What Orbit can build from public components

- [Media3 / ExoPlayer](https://developer.android.com/media/media3/exoplayer/drm): our own native video/subtitle surface and transport controls using authorized media and DRM configuration. This API’s DRM support is not itself Netflix authorization; a public Netflix watch page is not a provider-issued native playback configuration.
- [LiveKit Android](https://github.com/livekit/client-sdk-android): an independently integrated realtime voice/data SDK for later room work. It is published under Apache-2.0. Its presence in Hearo does not authorize copying Hearo’s account/backend implementation.
- [Javet](https://github.com/caoccao/Javet): an Apache-2.0 Java/V8 runtime if a documented adapter actually needs one. Do not add it merely because Hearo includes it; it does not supply Netflix DRM/player access.
- Existing Orbit room authorization, server timeline, revision/conflict handling and independent local display modes remain reusable once a provider player is verified. No candidate-only title match is promoted to actual identity.

The missing piece is a documented, authorized Netflix player/adapter contract that preserves provider authentication and supplies trustworthy content identity and playback control. This investigation has not identified that contract. It does not prove such an integration is impossible or establish that a particular commercial partnership is mandatory. Do not copy private clients, transplant credentials/certificates, weaken DRM or present a generic native sample as Netflix support.

## Orbit 1.3.7 outcome

The verified update is installed. Its opt-in counter channel works: an observed fresh window reported one page start/finish, one protected-media request and two console errors. No grant call was recorded in that particular pre-acceptance snapshot, and no narrower codec/EME/network category matched. The user subsequently reports accepting protected playback and still seeing loading/E100. Later windows closed or had no retained matching records. These facts do not establish a failed grant, license denial or a specific root cause. No raw console text or provider response was retained to invent a cause.

The PC summary now retains at most four prior fixed-counter windows so a later empty check does not erase a useful captured attempt. The extra privacy/bounds test passes. The latest APK remains 1.3.7; no unverified playback fix or new dependency is shipped by this comparison.
