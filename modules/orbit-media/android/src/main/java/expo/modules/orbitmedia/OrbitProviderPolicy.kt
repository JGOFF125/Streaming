package expo.modules.orbitmedia

import java.net.URI
import java.util.Locale

/** Only navigation/origin decisions. No credentials, page content or URLs are retained. */
object OrbitProviderPolicy {
  const val START_URL = "https://www.netflix.com/login"
  const val PROTECTED_MEDIA = "android.webkit.resource.PROTECTED_MEDIA_ID"

  private fun httpsUri(value: String): URI? = try {
    if (value.length > 16384 || value.any { it.isWhitespace() || it == '\\' || it.code < 32 }) null
    else URI(value).takeIf {
      !it.isOpaque && it.scheme.equals("https", true) && it.rawUserInfo == null &&
        it.host != null && (it.port == -1 || it.port == 443)
    }
  } catch (_: Exception) { null }

  fun allowsNavigation(value: String): Boolean {
    val host = httpsUri(value)?.host?.lowercase(Locale.ROOT) ?: return false
    return host == "netflix.com" || host.endsWith(".netflix.com")
  }

  // HTTPS CDN/subframe resources may belong to the provider's normal dependencies.
  // This is not a subresource host allowlist or an interception of stream data.
  fun allowsNetworkResource(value: String): Boolean = httpsUri(value) != null

  fun allowsProtectedMedia(origin: String, resources: List<String>): Boolean =
    allowsNavigation(origin) && resources.isNotEmpty() && resources.all { it == PROTECTED_MEDIA }
}
