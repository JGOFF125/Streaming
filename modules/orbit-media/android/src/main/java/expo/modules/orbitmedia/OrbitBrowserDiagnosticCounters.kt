package expo.modules.orbitmedia

/** Bounded fixed labels only. No message, URL, origin, identifier or exception is retained. */
internal class OrbitBrowserDiagnosticCounters {
  companion object {
    val KEYS = listOf("page_started", "page_finished", "protected_media_requested", "protected_media_grant_called",
      "protected_media_denied", "protected_media_cancelled", "permission_request_blocked",
      "page_http_401", "page_http_403", "page_http_4xx", "page_http_5xx",
      "resource_http_401", "resource_http_403", "resource_http_4xx", "resource_http_5xx",
      "network_dns", "network_connect", "network_timeout", "network_tls", "network_other",
      "console_error", "console_eme_not_supported", "console_media_not_allowed", "console_eme_security_error",
      "console_codec_error", "console_eme_network_error")

    fun httpSignal(status: Int, main: Boolean): String? {
      val kind = when (status) { 401 -> "401"; 403 -> "403"; in 400..499 -> "4xx"; in 500..599 -> "5xx"; else -> return null }
      return (if (main) "page_http_" else "resource_http_") + kind
    }

    fun consoleSignals(message: String, isError: Boolean): List<String> {
      if (!isError) return emptyList()
      val found = mutableListOf("console_error")
      if (message.length > 8192) return found
      val text = message.lowercase()
      val eme = listOf("widevine", "drm", "mediakeys", "keysystem", "key system", "encryptedmedia").any { text.contains(it) }
      if (eme && text.contains("notsupportederror")) found.add("console_eme_not_supported")
      if (eme && text.contains("securityerror")) found.add("console_eme_security_error")
      if (text.contains("notallowederror") && listOf("play(", "autoplay", "user gesture", "media").any { text.contains(it) }) found.add("console_media_not_allowed")
      if (listOf("no decoders for requested formats", "pipeline_error_decode", "decoder_error_not_supported").any { text.contains(it) }) found.add("console_codec_error")
      if (eme && listOf("failed to fetch", "networkerror").any { text.contains(it) }) found.add("console_eme_network_error")
      return found
    }
  }
  private val counts = KEYS.associateWith { 0 }.toMutableMap()
  fun reset() { counts.keys.toList().forEach { counts[it] = 0 } }
  fun record(key: String): String? {
    val before = counts[key] ?: return null
    if (before >= 255) return null
    val count = before + 1
    counts[key] = count
    // At most nine small records per category per view attempt, avoiding callback/log floods.
    return if (count == 255 || (count and (count - 1)) == 0) "signal:" + key + ":" + count else null
  }
}
