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

## Local compatibility controls after the installed-app comparison

The user requested independent local work rather than relying on vendor replies. Two separate SDK-only developer helpers were built and signature/permission checked on the connected phone; neither updates Orbit/Netflix or reads their private storage. Their source is in tools/webview-capability-probe. The offline helper declares no permissions. The optional public-demo helper is a different package with INTERNET only, an explanation and explicit sample/DRM-consent actions, strict TLS and no provider account fields, JS injection, cookie/page/license read or bridge. APKs, signing keys and device output stay ignored. These are diagnostic tools, not product players.

The offline default-profile probe confirms native Widevine MP4/hardware capability, secure AVC decoding via ALL_CODECS, accelerated drawing, a secure app-local context and MSE AVC/AAC support. With ordinary optional identifier/persistence configuration, default and SW_SECURE_CRYPTO EME access succeed; the restrictive no-identifier configuration and stronger tested robustness levels are rejected. Creating MediaKeys fails, and an unkeyed native session reports needs_provisioning. This fresh offline package cannot provision over the network, so those failures do not diagnose Orbit's E100 or a broken device. No provisioning/license request or response is read by our code.

**Public online control: the user confirms both the unencrypted and Widevine-protected Angel One samples play video and sound in the separate default-profile WebView helper on this phone.** This is physical user-observed playback, not a tool-observed decoder result. It demonstrates a working ordinary WebView protected-playback route for that authorized sample; it does not verify Netflix, every robustness/profile, Orbit's wrapper or two-device sync. Do not continue treating a general lack of Android/WebView DRM support as established. A further control with Orbit's exact desktop UA/Client Hints settings is prepared and its outcome is pending. It reuses public AndroidX WebKit 1.18.0 from the existing local SDK cache, not a competitor binary.

The official [Shaka demo](https://shaka-project.github.io/shaka-player/demo/) and [published test asset definitions](https://github.com/shaka-project/shaka-player/blob/main/demo/common/assets.js) supply the two sample manifests and current public Widevine test endpoint. The old App Engine demo has moved. Provider authentication/authorization remains a separate issue from successful sample DRM.

A read-only ELF linker-metadata pass over the installed ARM64 splits found public ANativeWindow imports in Rave's image/surface utility libraries, without a directly reusable DRM adapter in the inspected imported symbols. This does not rule out JNI, dynamic lookup or obfuscation. No application implementation, arbitrary string table, certificate, credential or protocol was exported or transplanted.

Additional public leads were inspected as source rather than installed: [zacalex/webviewtest](https://github.com/zacalex/webviewtest/blob/master/mobile/src/main/java/com/andorid/compatyoutube/WebViewBrowserActivity.java) is a browser-test fork with an old hardcoded desktop agent and generic permission handling; its description does not establish current Netflix movie playback. [Ultralight-WebBrowser](https://github.com/ovsky/Ultralight-WebBrowser#drm-content-support-experimental) describes desktop WebView2/WKWebView/WebKit2GTK routes, not an Android Netflix adapter. Neither supplies a verified new Android route or justifies copying a stale identity or widening permissions.

## Completed desktop-profile control and next boundary

The first helper desktop-profile update closed because our manual diagnostic packaging omitted AndroidX Core's PackageInfoCompat, not because of Netflix. The corrected 1.0.1/code2 helper includes the Google-Maven-declared Core dependency, checks required classes at build time and handles unavailable profile support without losing ordinary samples. A real unlocked-phone launch check confirms the UI stays alive, metadata support is available, and desktop settings apply and restore. **The user confirms the same Widevine sample plays video/audio with Orbit's desktop UA/Client Hints profile too.** Orbit's production 1.3.7 APK was not changed by this helper fix. Its Gradle dependency resolution was not the helper's manual packaging path.

This removes a generic profile-causes-all-DRM-failure theory, but the sample does not reproduce Netflix's authentication, content policy, exact robustness requirements or application trust checks. No Netflix authorization or actual title identity is verified. Do not rerun these successful public controls or keep changing permission/DRM settings without new evidence.

Netflix now has an [official help article for the exact 1044 message](https://help.netflix.com/en/node/126040), describing persistent occurrences as device incompatibility. Its [supported-browser requirements](https://help.netflix.com/en/node/30081) do not establish Android WebView support. Given official-app and Rave playback on the same phone, the working inference is compatibility of the particular embedded-client route rather than a physically incapable phone; the specific rejection condition remains unknown. This is more relevant than the earlier TV-specific E100 article, but still does not establish a particular certificate/codec/DRM failure.

An additional trust lead was checked against primary sources: Android's [WebView Media Integrity API defaults to enabled](https://developer.android.com/reference/androidx/webkit/WebViewMediaIntegrityApiStatusConfig), and its [Android-team explanation](https://android-developers.googleblog.com/2023/11/increasing-trust-for-embedded-media.html) describes store-independent integrity information. Orbit does not disable the API. No evidence here establishes Netflix uses this API, that disabling/enabling it would fix E100, or that publishing Orbit to Play would authorize playback. No token, verdict, app identity or protection setting was changed.
