# Public Netflix episode catalog — candidate matching

The verified 1.3.5 APK now wires candidate matching into the local phone diagnostic panel with two explicit public reference series and separate provider-context evidence. It remains untrusted and cannot enable sync. See [NETFLIX_RECOGNITION_TEST.md](NETFLIX_RECOGNITION_TEST.md); prior tooling-only results below are history.

November 13, 2026. Developer tooling and a pure candidate matcher, not a shipped mobile identity feature.

## Observed result

The real 1.3.4 phone report has no active queue key, no metadata catalog IDs and the same standard/display title. Those specific paths did not provide a canonical ID in this snapshot. The useful episode labels remain separate from the trusted player identity.

A bounded unauthenticated inspection of [Netflix's public catalog 80997085](https://www.netflix.com/mx/title/80997085) now recovers explicit season/episode records. Canonical episode IDs are present in public JavaScript data literals even though the earlier strict-JSON attempt did not decode them. The reader recovered 30 episodes across 3 seasons, including season 1 episode 3 with videoId 80130306 and runtimeSec 4087. [A second public catalog, 80057281](https://www.netflix.com/mx/title/80057281), independently yielded 42 episodes across 5 seasons.

The reference phone observation produced candidate 80130306, and the user confirmed the reference series for this development validation. No raw user labels are committed. This tests one lookup. It does not prove uniqueness across the entire Netflix catalog or supply the series context that the current Android metadata omits. The user still requires automatic identification; their development answer must not become a required manual confirmation step.

## Tool and boundaries

Run from this checkout:

    npm.cmd run catalog:netflix -- https://www.netflix.com/mx/title/80997085

The tool accepts one canonical www.netflix.com title URL, refuses credentials/query/fragment/custom ports/redirects, fetches one public HTML response with an 8 MiB and 20-second bound, and persists only extracted catalog fields under ignored .expo/catalog-evidence. It uses no sign-in, cookie jar, access token, playback endpoint or streaming-license request. Full HTML is not retained. No automatic crawl or cloud deployment is included.

The syntax reader extracts one bounded seasons container, rejects unsupported schemas, duplicate IDs/numbers/keys, conflicting explicit season labels, excessive nesting and incomplete pagination. It uses TypeScript's AST only to read literal fields. It does not evaluate expressions, invoke getters or run site scripts. The compiler remains an existing development dependency; it is not imported into the mobile application.

The pure matcher supports the subtitle syntax actually observed in the phone test. It checks title agreement, season, episode and exact runtime. It returns all distinct catalog candidates, including ambiguity on collisions. Its result always has identityVerified false and commandsAllowed false, even with one candidate. No result can populate snapshot.contentId, write a room timeline, open a provider link or issue a playback command. Raw observation names are absent from candidate output.

## Verification and remaining work

Lint/typecheck and all 91 JavaScript/database tests pass, including non-execution of malicious expressions/getters, JS escaped strings, descriptive season names, pagination failures, contradictory numbering, duplicates, source-URL bounds, malformed observations and cross-series collisions. Two live public catalog reads passed. Native source, signed APK 1.3.4 and the hosted backend are unchanged; no new Kotlin/build tests were needed for this non-native increment.

Independent automatic series binding and adequate catalog coverage remain missing. Language, alternate editions, ads and duration variation also require validation before control integration. A successful match in these two catalogs is not a complete provider index. The official robots file points to /sitemap/index; a separate exploratory index read stopped at its 1 MiB cap, and no child sitemap was fetched. Do not infer index completeness or start a large crawl from that partial check.

Embedded Netflix playback and actual two-phone synchronization remain unverified. The current milestone supplies catalog data and candidate matching, with the actual-ID control gate intact.
