package expo.modules.orbitmedia

import org.junit.Assert.*
import org.junit.Test

class OrbitProviderPolicyTest {
  @Test fun officialHttpsDestinations() {
    listOf("https://netflix.com", "https://www.netflix.com/login", "https://help.netflix.com/en/node/1",
      "https://WWW.NETFLIX.COM:443/browse", "https://www.netflix.com/watch/80012345?trackId=1#player")
      .forEach { assertTrue(it, OrbitProviderPolicy.allowsNavigation(it)) }
  }

  @Test fun lookalikesAndUserInfoCannotCrossTrustBoundary() {
    listOf("https://netflix.com.evil.test", "https://evilnetflix.com", "https://netflix.com@evil.test",
      "https://evil.test@netflix.com", "https://user:password@netflix.com", "https://netflix.com.",
      "https://netflix.com%2eevil.test", "https://www.netfliх.com", "https://netflix.com:8443")
      .forEach { assertFalse(it, OrbitProviderPolicy.allowsNavigation(it)) }
  }

  @Test fun nonWebAndAppIntentsNeverLaunch() {
    listOf("http://netflix.com", "javascript:alert(1)", "data:text/html,test", "file:///data/data/test",
      "content://netflix.com", "intent://netflix.com/#Intent;scheme=https;end", "nflx://watch/1",
      "market://details?id=com.netflix.mediaclient", "//netflix.com", "about:blank")
      .forEach { assertFalse(it, OrbitProviderPolicy.allowsNavigation(it)) }
  }

  @Test fun malformedAndAmbiguousUrisFailClosed() {
    listOf("", "https://", " https://netflix.com", "https://netflix.com/\nlogin",
      "https://netflix.com\\@evil.test", "https://netflix.com/%zz", "https://netflix.com/" + "a".repeat(16384))
      .forEach { assertFalse(OrbitProviderPolicy.allowsNavigation(it)) }
  }

  @Test fun normalHttpsDependenciesCanLoadButCannotBecomeTopLevelPages() {
    assertTrue(OrbitProviderPolicy.allowsNetworkResource("https://assets.nflxext.com/image.png"))
    assertFalse(OrbitProviderPolicy.allowsNavigation("https://assets.nflxext.com/image.png"))
    assertFalse(OrbitProviderPolicy.allowsNetworkResource("http://assets.nflxext.com/image.png"))
    assertFalse(OrbitProviderPolicy.allowsNetworkResource("file:///sdcard/video"))
  }

  @Test fun onlyProtectedMediaFromNetflixCanReachExplicitConsent() {
    val media = listOf(OrbitProviderPolicy.PROTECTED_MEDIA)
    assertTrue(OrbitProviderPolicy.allowsProtectedMedia("https://www.netflix.com", media))
    assertFalse(OrbitProviderPolicy.allowsProtectedMedia("https://evil.test", media))
    assertFalse(OrbitProviderPolicy.allowsProtectedMedia("http://netflix.com", media))
    assertFalse(OrbitProviderPolicy.allowsProtectedMedia("https://netflix.com", emptyList()))
    assertFalse(OrbitProviderPolicy.allowsProtectedMedia("https://netflix.com", media + "android.webkit.resource.AUDIO_CAPTURE"))
    assertFalse(OrbitProviderPolicy.allowsProtectedMedia("https://netflix.com", listOf("future_permission")))
  }
}
