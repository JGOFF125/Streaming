# Netflix native integration investigation

Reviewed November 3, 2026 (UTC). This is an evidence and implementation handoff, not a working player or an APK release.

## New working comparison

The user explicitly reaffirmed Netflix integration as the next priority, then reported that a movie plays inside the official Rave Android app on the same physical Pixel used for Orbit's failed browser tests. The question asked for actual video and sound rather than login alone. This is user-reported one-device playback, not our instrumented inspection or a two-phone synchronization result. Rave's exact version, title, rendering engine and provider integration remain unknown.

This establishes a working comparator on that phone. Do not attribute Orbit's failure to a universal Android/phone inability to play Netflix inside an app. It does not establish that Rave's implementation is publicly available or transferable to Orbit.

The failed Orbit system-WebView, Chrome Desktop site and Firefox results still stand. Google sign-in, the larger Orbit screen and keyboard behavior remain confirmed working. Orbit is still 1.3.1; no movie has played inside Orbit and no two-device sync has been verified.

## Native-player findings

**Documented:** Android Media3 ExoPlayer supports protected video through MediaDrm and Widevine. Its DRM configuration belongs to a media item and may require a custom session manager. **Engineering implication:** a rendering library is a candidate only after obtaining a supported provider playback session; adding ExoPlayer does not supply Netflix authentication, a playable source or service access. [Android DRM documentation](https://developer.android.com/media/media3/exoplayer/drm).

**Documented:** Netflix publishes Message Security Layer (MSL), a general secure-messaging framework. Its repository describes configurable client/server messaging and example servers. Its historical Widevine client configuration (last edited July 2014) discusses native clients, including Android, device identity and key exchange. **Limit:** the reviewed documentation does not provide a current third-party Android Netflix player, subscriber playback API, onboarding process or an approved Orbit session flow. The framework's open-source availability does not establish access to Netflix content. No MSL code was installed or service requests attempted. [Netflix MSL](https://github.com/Netflix/msl), [Widevine configuration](https://github.com/Netflix/msl/wiki/Widevine-Client-Configuration).

Netflix's device-testing article describes SDK distribution for its TV, set-top-box and console partner ecosystem. It is background, not an Android watch-party embedding contract. This review establishes neither that a particular paid partnership is mandatory nor that one is available to Orbit. [Netflix device SDK context](https://netflixtechblog.com/automated-testing-on-devices-fc5a39f47e24).

## SDK leads that do not fill the gap

| Lead | Primary-source scope | Orbit decision |
|---|---|---|
| Rave Social Android SDK | Social login, contacts and game leaderboards; no reviewed Netflix playback contract. Its relationship to rave.io was not established. | Do not install a namesake SDK as the Rave watch-party engine. [Guide](https://dev-docs.ravesocial.co/android/android-sdk-guide.html). |
| Younify Connect | Streaming-account linking and viewing history/watchlists/ratings. | The reviewed product documentation does not offer embedded movie playback. Do not add its account-data collection to solve this player problem. [Developer overview](https://www.younify.tv/product/developer-sdk/). |
| Connect SDK Launcher | Launching/deep-linking Netflix on a target device. | Does not establish video rendering inside Orbit. [Launcher API](https://connectsdk.com/en/latest/apis-and/and-launcher.html). |
| GeckoView | Embeddable browser with media controls, but the Firefox baseline failed on this phone. | Keep as an unproven candidate; no dependency/build without new playback evidence. [Existing assessment](ANDROID_PLAYER_NEXT_STEP.md). |

A historical forum claim about Rave using ExoPlayer was encountered as a search lead. No vendor confirmation or reproducible primary technical evidence was located, so it is not used to assert Rave's current engine, private rights or integration method. Generic player SDKs and similarly named repositories do not resolve this uncertainty.

## Concrete information needed before implementation

An integration candidate must provide a documented, usable path for all of these:

1. **Provider session:** ordinary per-user subscription authentication within a provider-owned flow; no Orbit credential form, cookie export, copied device identity or private-session harvesting.
2. **Protected playback:** an embeddable Android player/session or supported source-and-license handoff that preserves content protection and survives normal token renewal. Generic DRM support is insufficient.
3. **Actual identity:** the player reports the current movie/episode, including transitions. A selected link or matching duration cannot substitute for actual playback identity.
4. **Controls and observations:** acknowledged play/pause/seek, buffering/error state and a fresh position clock. Seeking while paused must preserve the intended state.
5. **Lifecycle and privacy:** supported background/foreground behavior, logout/cleanup, subtitles/audio tracks, minimal permissions and a disclosed data boundary.

Existing Orbit room timing/revisions can be reused after these inputs exist. Reusing synchronization code does not remove each provider's playback/authentication requirements.

## Rave inquiry — sent November 3, 2026

Rave's official company page publishes a business contact. No public embeddable playback SDK was established in the reviewed materials; a vendor answer is a possible next source of evidence, not a promised solution. The user subsequently authorized sending this inquiry and extending outreach to similar apps. The Rave message below was sent through Gmail; see [the outreach record](NETFLIX_INTEGRATION_OUTREACH.md) for confirmed send status and contact provenance. [Rave company/contact page](https://shop.rave.io/pages/about-rave).

**Subject:** Android in-app streaming integration availability for Orbit

Hello Rave team,

We are developing Orbit, a private Android watch-party project. Netflix video and sound play inside your official Android app on our Pixel, while ordinary embedded-browser playback does not.

Do you offer a licensed embeddable player/SDK or an integration program for third-party Android apps, or can you direct us to a provider-supported route? We are asking about available documentation and eligibility, not proprietary code or credentials.

Our intended flow gives each participant their own provider-authorized playback inside the app, with a separate private room timeline. We need actual title/episode identity, playback-position events and supported play/pause/seek, including paused seeking and session renewal. Orbit must not read streaming passwords/cookies, copy device identities, capture protected video or require broad notification access for in-app playback.

If an integration exists, could you share supported services/platforms, onboarding requirements, technical documentation and permission/data requirements? A clear indication that no third-party program is offered would also help scope our work.

Thank you,
Orbit project

## Decision and handoff

Netflix remains first. Keep the current verified 1.3.1 APK and working source checkout. This research changes the evidence and the next integration target; it does not add a renderer, claim Netflix support, modify accounts/backend settings or justify another browser-only APK. The remaining blocker is a usable provider/player integration. The user authorized outreach; inquiries to Rave, Hearo, Teleparty and Watchly were sent. See [NETFLIX_INTEGRATION_OUTREACH.md](NETFLIX_INTEGRATION_OUTREACH.md). No reply or available SDK is established by sending them.
