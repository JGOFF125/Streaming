This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md

## Orbit delivery priorities

- Keep this existing checkout current for VS Code; it is the project working copy.
- The user authorized committing and pushing completed changes to https://github.com/JGOFF125/Streaming, including future changes. Push verified milestones, without force-pushing or overwriting unrelated work. Never commit local environment files, credentials, signing material, APKs, or generated test/build output.
- Prioritize actual Netflix synchronization first. Then add YouTube, Prime Video and Disney+ playback adapters, followed by room text chat and real-time voice. Reuse shared room, timing and messaging code while independently verifying each platform adapter.
- Never collect streaming credentials or session cookies, bypass DRM, or use accessibility automation to control Netflix. Distinguish simulated-player results from real Netflix behavior.

- The intended experience is video playing inside Orbit's room alongside text/voice chat. External Netflix launching and MediaSession controls are diagnostics, not fulfillment of that requirement. Embedded Netflix playback needs a verified integration; do not claim a generic WebView or Rave's existence proves compatibility.
- Minimize app permissions. Keep Google sign-in and core rooms usable without notification access. External controls remain optional and must accurately disclose Android's broad grant. Request microphone access only when a future voice feature is actually used.

## Updated room experience requirement

- The user asks for chat visible beneath video in portrait and hidden during full-screen viewing, with automatic synchronization between users in different locations. Their final embedded-versus-overlapping-app choice is not settled.
- Investigate the overlapping-app option, but do not claim it fulfills the final experience without user agreement and real playback/sync verification. Automatic approval review rejected adding SYSTEM_ALERT_WINDOW without explicit approval of that persistent permission. No overlay permission/implementation has been added; obtain explicit approval before retrying that rejected change. The independent provider-metadata identity fix adds no permissions.

- Each participant chooses portrait/chat or full-screen locally. Changing one viewer’s presentation must never change the other viewer’s mode or publish a playback command. Preserve unsent drafts when returning to chat. Only one physical phone is currently available: continue local/backend/virtual-client development without claiming a real two-device synchronization test.
- The user confirms Netflix’s own PiP continues playing above Orbit for 15 seconds on their Pixel. This is a user-reported co-existence result, not embedded Orbit video or verified sync; investigate it without adding Orbit overlay access.

- The 1.3.2 physical Pixel report shows contentId null and both MEDIA_ID / MEDIA_URI absent despite working position/control capability. The user explicitly rejected one-time manual movie confirmation: retain automatic actual movie/episode identification. Do not substitute a selected link, manual acknowledgment, session token or matching duration for actual player identity.

- November 12 phone evidence: 1.3.3 title/subtitle labels stayed unchanged on the same episode and changed across two tested episodes. This is observed label discrimination, not a unique catalog identity. Verified APK 1.3.4 adds diagnostic-only active-item and separate standard-title evidence; keep these candidates out of the control identity gate until actual identity is established. See NETFLIX_ACTIVE_ITEM_TEST.md.

- November 13 evidence: the 1.3.4 v3 phone snapshot reports no_active_item and identical standard/display titles. The new public-catalog syntax reader recovers canonical episode IDs on two official reference pages; its matcher remains candidate-only. The user confirmed the reference series for development validation, not as authorization for a manual product identity fallback. Keep catalog completeness/series binding distinct from a match and retain the actual-ID control gate. See NETFLIX_CATALOG_IDENTITY.md.

- Pending 1.3.5 wires local candidate matching into the diagnostic panel with only two public reference series (72 unique episodes, Spanish/English variants). Treat this as limited development coverage. Standard ALBUM/ARTIST/ALBUM_ARTIST fields may or may not provide distinct series context; their generic Android semantics are not a Netflix identity contract. Every recognition result remains unverified and cannot authorize controls; see NETFLIX_RECOGNITION_TEST.md.
