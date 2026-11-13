package expo.modules.orbitmedia

/** Generic compatibility presentation derived only from the installed engine version. */
data class OrbitDesktopProfile(val userAgent: String, val chromiumVersion: String, val majorVersion: String) {
  override fun toString() = "OrbitDesktopProfile(chromiumVersion=$chromiumVersion)"
  companion object {
    fun fromDefaultAgent(value: String?): OrbitDesktopProfile? {
      if (value == null || value.length > 4096 || !value.startsWith("Mozilla/5.0 ") || !value.contains("Android") || !value.contains(" wv)")) return null
      val versions=Regex("Chrome/([1-9][0-9]{1,2}\\.[0-9]{1,6}\\.[0-9]{1,6}\\.[0-9]{1,6})(?= |$)").findAll(value).map { it.groupValues[1] }.toList()
      val webkits=Regex("AppleWebKit/([0-9]{1,4}\\.[0-9]{1,4})(?= |$)").findAll(value).map { it.groupValues[1] }.toList()
      if (versions.size != 1 || webkits.size != 1) return null
      val version=versions.single(); val major=version.substringBefore('.')
      if (major.toInt() < 117) return null
      return OrbitDesktopProfile("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/"+webkits.single()+
        " (KHTML, like Gecko) Chrome/"+version+" Safari/"+webkits.single(),version,major)
    }
  }
}
