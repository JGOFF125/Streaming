package expo.modules.orbitmedia

import java.net.URI

/** Read only provider-published MediaMetadata fields; never export the original values. */
data class OrbitMediaIdentityResult(
  val contentId: String?, val source: String,
  val mediaIdPresent: Boolean, val mediaUriPresent: Boolean
)

object OrbitMediaIdentity {
  private val numeric = Regex("[1-9][0-9]{0,11}")
  private val watch = Regex("/watch/([1-9][0-9]{0,11})")

  fun resolve(mediaId: String?, mediaUri: String?): OrbitMediaIdentityResult {
    val direct = mediaId?.takeIf { numeric.matches(it) }
    val idFromUrl = watchId(mediaId)
    val id = direct ?: idFromUrl
    val uriId = watchId(mediaUri)
    val result = when {
      id != null && uriId != null && id != uriId -> null to "conflicting_fields"
      id != null && uriId != null -> id to "matching_fields"
      direct != null -> direct to "media_id"
      idFromUrl != null -> idFromUrl to "media_id_watch_url"
      uriId != null -> uriId to "media_uri_watch_url"
      else -> null to "unavailable"
    }
    return OrbitMediaIdentityResult(result.first, result.second,
      !mediaId.isNullOrEmpty(), !mediaUri.isNullOrEmpty())
  }

  private fun watchId(value: String?): String? {
    if (value == null || value.length !in 1..2048 || value.any { it.isWhitespace() || it == '\\' }) return null
    return try {
      val uri = URI(value)
      if (!uri.scheme.equals("https", ignoreCase = true) ||
        uri.host?.lowercase() !in setOf("netflix.com", "www.netflix.com") ||
        uri.rawUserInfo != null || uri.port !in listOf(-1, 443)) return null
      // Only the path is used. Query/fragment data stays local and is never exported.
      watch.matchEntire(uri.rawPath ?: "")?.groupValues?.get(1)
    } catch (_: Exception) { null }
  }
}
