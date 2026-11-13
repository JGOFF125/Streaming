package expo.modules.orbitmedia

import java.text.Normalizer

/** Display evidence only. Never creates a catalog identity or enters the shared timeline. */
internal class OrbitDisplayLabels(
  val titleLabel: String?, val standardTitleLabel: String?, val subtitleLabel: String?, val descriptionLabel: String?,
  val titleSource: String, val titlePresent: Boolean, val displayTitlePresent: Boolean,
  val subtitlePresent: Boolean, val descriptionPresent: Boolean
) {
  // Avoid accidental title disclosure through a debug log of this object.
  override fun toString() = "OrbitDisplayLabels(source=$titleSource, titlePresent=$titlePresent, displayTitlePresent=$displayTitlePresent)"
}

internal object OrbitDisplayMetadata {
  fun read(displayTitle: CharSequence?, title: CharSequence?, subtitle: CharSequence?, description: CharSequence?): OrbitDisplayLabels {
    val display = clean(displayTitle); val standard = clean(title)
    val primary = useful(display) ?: useful(standard)
    return OrbitDisplayLabels(primary, useful(standard), useful(clean(subtitle)), useful(clean(description)),
      when { useful(display) != null -> "display_title"; useful(standard) != null -> "title"; else -> "unavailable" },
      standard != null, display != null, clean(subtitle) != null, clean(description) != null)
  }

  private fun useful(value: String?): String? = value?.takeUnless {
    it.equals("Netflix", ignoreCase = true) || it.equals("com.netflix.mediaclient", ignoreCase = true)
  }

  private fun clean(value: CharSequence?): String? {
    if (value == null || value.length > 4096) return null
    val text = Normalizer.normalize(value.toString(), Normalizer.Form.NFC)
      .replace(Regex("[\\p{Cc}\\p{Cf}]"), " ").trim()
    if (text.isEmpty()) return null
    val count = text.codePointCount(0, text.length)
    return if (count > 512) text.substring(0, text.offsetByCodePoints(0, 512)) else text
  }
}
