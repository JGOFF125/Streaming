package expo.modules.orbitmedia

import org.junit.Assert.*
import org.junit.Test

class OrbitMediaIdentityTest {
  @Test fun keepsNumericProviderIdentityAndRecognizesCanonicalWatchLinks() {
    assertEquals("80012345", OrbitMediaIdentity.resolve("80012345", null).contentId)
    assertEquals("media_id", OrbitMediaIdentity.resolve("80012345", null).source)
    assertEquals("media_id_watch_url", OrbitMediaIdentity.resolve("https://www.netflix.com/watch/80012345", null).source)
    assertEquals("80012345", OrbitMediaIdentity.resolve(null, "https://NETFLIX.COM:443/watch/80012345?trackId=2#player").contentId)
    assertEquals("media_uri_watch_url", OrbitMediaIdentity.resolve(null, "https://netflix.com/watch/80012345").source)
  }

  @Test fun requiresProviderFieldsToAgreeWhenBothHaveRecognizedIds() {
    assertEquals("matching_fields", OrbitMediaIdentity.resolve("123", "https://netflix.com/watch/123").source)
    val conflict = OrbitMediaIdentity.resolve("123", "https://netflix.com/watch/456")
    assertNull(conflict.contentId)
    assertEquals("conflicting_fields", conflict.source)
  }

  @Test fun refusesSeriesPagesQueryOnlyIdsAndUnrelatedMedia() {
    listOf("https://netflix.com/title/123", "https://netflix.com/login?movieid=123",
      "https://netflix.com/watch/123/extra", "https://netflix.com/watch/%31%32%33",
      "https://netflix.com/watch/123/", "netflix://watch/123", "http://netflix.com/watch/123",
      "content://netflix.com/watch/123").forEach { assertNull(it, OrbitMediaIdentity.resolve(null, it).contentId) }
  }

  @Test fun rejectsLookalikesCredentialsPortsAndMalformedUris() {
    listOf("https://netflix.com.evil.test/watch/123", "https://evil.test@netflix.com/watch/123",
      "https://netflix.com@evil.test/watch/123", "https://netflix.com.:443/watch/123",
      "https://netflix.com:8443/watch/123", "https://help.netflix.com/watch/123",
      "https://netfliх.com/watch/123", "https://netflix.com\\@evil.test/watch/123",
      " https://netflix.com/watch/123", "https://netflix.com/watch/123\n",
      "https://netflix.com/watch/123?bad=%zz").forEach { assertNull(it, OrbitMediaIdentity.resolve(it, it).contentId) }
  }

  @Test fun rejectsUnboundedNonPositiveUnicodeAndOpaqueIdentifiers() {
    listOf("", "0", "-1", "00123", "１２３", "1".repeat(13), "opaque-private-value").forEach {
      assertNull(OrbitMediaIdentity.resolve(it, null).contentId)
    }
    assertNull(OrbitMediaIdentity.resolve(null, "https://netflix.com/watch/" + "1".repeat(2048)).contentId)
    assertEquals("123456789012", OrbitMediaIdentity.resolve("123456789012", null).contentId)
  }

  @Test fun exportsOnlyCatalogIdentityAndFixedDiagnosticFlags() {
    val secret = "private_cookie_or_account_value"
    val resolved = OrbitMediaIdentity.resolve("opaque-" + secret, "https://netflix.com/watch/123?token=" + secret)
    assertEquals("123", resolved.contentId)
    assertEquals("media_uri_watch_url", resolved.source)
    assertTrue(resolved.mediaIdPresent)
    assertTrue(resolved.mediaUriPresent)
    assertFalse(resolved.toString().contains(secret))
    assertFalse(resolved.toString().contains("https"))
    assertEquals("unavailable", OrbitMediaIdentity.resolve(null, null).source)
  }
}
