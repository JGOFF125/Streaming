# Watch-party workflow and architecture research

Research checkpoint: November 2, 2026 (UTC). In progress; public-source research only. No competitor accounts, streaming credentials or private app data accessed. The user's PC may hibernate: work pauses then; resume from this file and the existing chat.

## Question and existing Orbit state

Compare Rave, Hearo, Teleparty and Watchly: provider sign-in, host/join flow, video/chat/voice UI, synchronization model, permissions and what can actually inform Netflix playback inside Orbit. Distinguish product claims, observed public UI, published technical detail and engineering inference.

Orbit 1.2.2 is a signed standalone Android APK with reduced permissions and optional external Netflix controls. The real Pixel's 1.2.1 report showed an observed seek but no accepted numeric content ID. No two-device sync or embedded Netflix playback is verified. Read NETFLIX_EMBEDDED_FEASIBILITY.md and ANDROID_PERMISSIONS.md before making implementation promises.

## Verified starting sources

- Rave FAQ: https://rave.io/faq — provider sign-in inside Rave, subscription access and private invitation workflow. Privacy: https://rave.io/privacy — says provider passwords are not collected and describes viewing/device/network data collection. These are product/privacy statements, not an implementation specification.
- Teleparty support, currently reachable at https://dev.teleparty.com/support — desktop workflow starts from a playing provider page; mobile users sign into the provider through Teleparty before joining. Official Android listing: https://play.google.com/store/apps/details?id=com.teleparty.android (Teleparty / WP INTERACTIVE MEDIA, INC.). Different support-page sections disagree on platform/service availability, so do not assume feature parity.
- Hearo identity cross-check: the App Store app id1385627895 identifies Quarter Timer LLC and links https://hearo.live/eula. Use this app/domain chain; do not assume the similarly named hearo-app.com landing page is the same product. Current availability/status needs verification.
- Candidate Watchly watch-party site: https://watchlyparty.com/ — advertises room links/codes and video with text/voice/reactions. Its App Store, Play Store and Chrome listing links still need cross-checking. Other unrelated products also use Watchly.

## Resume next

1. Follow each first-party store/privacy/support link; verify identities and current listings.
2. Inspect official screenshots/public UI for provider selection, authentication, invitation, player and conversation layout. Do not use signed-in or payment flows.
3. Check public technical/privacy statements for local playback versus screen relay, player control and data scope. Do not invent proprietary sync algorithms or assume generic Android WebView Netflix compatibility.
4. Produce a per-platform comparison, evidence/confidence labels and an Orbit-specific plan with an embedded-player feasibility test as the first gate.
5. Save final findings and push to GitHub. PC hibernation cannot run local research/build orchestration; no offline-work promise or recurring task is configured.
