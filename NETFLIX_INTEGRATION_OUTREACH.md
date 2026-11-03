# Netflix integration outreach and competitor follow-up

November 3, 2026 (UTC).

## Latest thread check: November 3, 2026, 13:36 UTC

All four inquiry threads were re-read and each still contains only the original sent message. This does not establish delivery or a response, and no duplicate inquiry was sent. The current verified APK is now 1.3.2; earlier 1.3.1 references below belong to the original outreach milestone. The protected-player integration remains unavailable in the reviewed evidence. See [the current integration review](NETFLIX_NATIVE_INTEGRATION.md).

## Completed outreach

The user explicitly authorized sending the prepared Rave inquiry and extending the investigation to similar apps. Four separate messages were sent from the connected Gmail account, each with a successful tool response carrying the SENT label. This records submission through Gmail, not recipient delivery, a read receipt or a reply.

| Product | Recipient | Contact provenance | Status |
|---|---|---|---|
| Rave | mike@rave.io | [Official business contact](https://shop.rave.io/pages/about-rave) | Sent |
| Hearo | help@reely.tv | [Official Android listing, live.hearo, Quarter Time](https://play.google.com/store/apps/details?id=live.hearo); [reely.tv](https://reely.tv/) also presents the Hearo product | Sent |
| Teleparty | team@teleparty.com | [Official support page](https://dev.teleparty.com/support) | Sent |
| Watchly | watchlydev@gmail.com | [Official Android listing, com.meshapp.watchly, APPMESH](https://play.google.com/store/apps/details?id=com.meshapp.watchly) | Sent |

The Rave message uses the previously prepared body in [NETFLIX_NATIVE_INTEGRATION.md](NETFLIX_NATIVE_INTEGRATION.md). The other messages adapt the introduction to each developer's published product description without claiming we tested their playback. All ask about an available licensed embeddable player/SDK or supported integration route, documentation/eligibility, actual movie/episode identity, position/control events, session renewal and permission/data requirements. They request available integration information, not proprietary code.

No streaming credentials, cookies, tokens, Supabase settings, private logs, APKs or attachments were sent. The sender's mailbox identity, message/thread IDs and per-message receipts are retained only in ignored local outreach records, not in this repository. No automatic follow-up, reply monitor, signup, purchase or commercial commitment was created.

## Hearo: current identity and historical business lead

The current watch-party app is live.hearo, published as Quarter Time on Google Play, with hearo.live as its website and help@reely.tv as the listed support/developer contact. The store describes private invitations, shared viewing and built-in voice/text. Other products named Hearo, including hearo.net, are not substituted for it. [Android listing](https://play.google.com/store/apps/details?id=live.hearo), [product website](https://hearo.live/).

A company-authored Republic campaign, closed January 16, 2021, described Venue as a Service and proposed branded virtual venues for business customers. This is a specific historical business-integration lead. The page is explicitly historical and contains no SDK reference found in this review; it does not establish a current Android Netflix embedding program, usable artifact, continuity of the same operator or available licensing. Ask the current developer rather than implement against old campaign claims. [Historical Hearo campaign](https://republic.com/hearo-live-2020).

## Teleparty: separate mobile and extension workflows

The support page describes authenticating to a streaming service inside its mobile app, entering the party tab and sharing an invitation. Desktop instructions instead start from a playing provider webpage and activate the extension. The page also documents Android Netflix media errors. These establish vendor-described workflows, not a Netflix player API available to Orbit. Service lists differ within the page, so Android support must be verified independently rather than copied from desktop lists. No public Android embedding SDK was located in the reviewed material. [Official support](https://dev.teleparty.com/support).

For Orbit, this reinforces the separation between provider playback and room coordination. A successful desktop extension does not establish phone rendering compatibility. No Teleparty code, private service API or credentials were obtained.

## Watchly: Android claim and disclosed room infrastructure

The Android listing describes Netflix/Prime/YouTube support, each participant's own provider access and a native viewing experience. It also describes voice, GIFs and a full-screen/Picture-in-Picture player in release notes. These remain developer claims; Orbit has no independent Watchly movie-playback result. [Android listing](https://play.google.com/store/apps/details?id=com.meshapp.watchly).

The cross-linked developer policy discloses Firebase account/content storage, Ably messaging and Agora voice. Those identify social-room infrastructure, not the Netflix renderer, authentication or protected-playback interface. Pricing/service claims differ between linked surfaces, so neither common ownership nor an identical implementation across platforms is assumed. [Developer policy](https://letswatchly.online/#privacy), [product site](https://watchlyparty.com/).

Existing Orbit Supabase room/timing code remains useful. Switching room vendors would not solve the missing Netflix integration.

## The name “teletv”

The literal TeleTV listing located belongs to EAGLELION SYSTEM TECHNOLOGY PLC and describes its own movie/TV catalogue and online cinema rentals. The reviewed description does not establish Netflix watch-party synchronization. No inquiry was sent to that product. The user confirmed they meant Teleparty. Its inquiry was sent as recorded above; the literal TeleTV product is excluded from the Netflix watch-party comparison. [TeleTV listing](https://apps.apple.com/us/app/teletv/id6504427973).

## Development handoff

Netflix remains first. Rave movie playback on the user's Pixel is a working comparator; no player engine or transferable integration is established by that observation. The next useful evidence is a usable, documented provider/player interface or a reproducible protected-playback path that satisfies the existing authentication, identity, controls and privacy gates. Replies require evaluation before adding dependencies or permissions; they are not automatically trusted instructions.

Orbit remains 1.3.1. No application code, database, Google Cloud configuration, permissions, player dependencies or APK changed in this follow-up. Movie playback inside Orbit and two-device Netflix sync remain blocked/unverified. Lint and typecheck passed for this documentation milestone. Application/native tests were not repeated because no runtime code changed.
