package expo.modules.orbitmedia

import android.webkit.WebView
import androidx.webkit.UserAgentMetadata
import androidx.webkit.WebSettingsCompat
import androidx.webkit.WebViewFeature

internal data class OrbitBrowserProfileEvidence(val mode: String, val desktopApplied: Boolean = false,
  val clientHintsOverridden: Boolean = false, val formFactorsOverridden: Boolean = false)

/** Browser settings only: no JS injection, cookie/header reads, DRM alteration or device cloning. */
internal object OrbitBrowserConfigurator {
  fun apply(web: WebView, mode: String): OrbitBrowserProfileEvidence {
    require(mode in listOf("system","desktop"))
    if (mode == "system") return OrbitBrowserProfileEvidence(mode)
    if (!WebViewFeature.isFeatureSupported(WebViewFeature.USER_AGENT_METADATA)) throw UnsupportedOperationException("PROFILE_UNAVAILABLE")
    val profile=OrbitDesktopProfile.fromDefaultAgent(web.settings.userAgentString)
      ?: throw UnsupportedOperationException("ENGINE_VERSION_UNAVAILABLE")
    val brand=UserAgentMetadata.BrandVersion.Builder().setBrand("Chromium")
      .setMajorVersion(profile.majorVersion).setFullVersion(profile.chromiumVersion).build()
    val builder=UserAgentMetadata.Builder().setBrandVersionList(listOf(brand))
      .setFullVersion(profile.chromiumVersion).setPlatform("Linux").setPlatformVersion("0.0.0")
      .setArchitecture("x86").setModel("").setMobile(false).setBitness(64).setWow64(false)
    val forms=WebViewFeature.isFeatureSupported(WebViewFeature.USER_AGENT_METADATA_FORM_FACTORS)
    if (forms) builder.setFormFactors(listOf("Desktop"))
    val metadata=builder.build()
    web.settings.userAgentString=profile.userAgent
    WebSettingsCompat.setUserAgentMetadata(web.settings,metadata)
    return OrbitBrowserProfileEvidence(mode,true,true,forms)
  }
}
