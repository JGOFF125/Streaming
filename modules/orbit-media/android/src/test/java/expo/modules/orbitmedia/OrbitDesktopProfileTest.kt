package expo.modules.orbitmedia
import org.junit.Assert.*
import org.junit.Test
class OrbitDesktopProfileTest {
  private val agent="Mozilla/5.0 (Linux; Android 17; private-model; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/157.0.8103.78 Mobile Safari/537.36 private-account-value"
  @Test fun derivesActualEngineVersionWithoutCarryingDeviceInformation() {
    val result=OrbitDesktopProfile.fromDefaultAgent(agent)!!
    assertEquals("157.0.8103.78",result.chromiumVersion);assertEquals("157",result.majorVersion)
    assertTrue(result.userAgent.contains("X11; Linux x86_64"));assertTrue(result.userAgent.contains("Chrome/157.0.8103.78"))
    for (token in listOf("Android","Mobile","private","wv)"))assertFalse(result.userAgent.contains(token))
  }
  @Test fun refusesUnknownOutdatedOrUnboundedEngineInformation() {
    assertNull(OrbitDesktopProfile.fromDefaultAgent(null));assertNull(OrbitDesktopProfile.fromDefaultAgent("x".repeat(4097)))
    assertNull(OrbitDesktopProfile.fromDefaultAgent(agent.replace("157.0.8103.78","116.0.0.0")))
    assertNull(OrbitDesktopProfile.fromDefaultAgent(agent.replace("Chrome/157.0.8103.78","Chrome/unknown")))
    assertNull(OrbitDesktopProfile.fromDefaultAgent(agent.replace("AppleWebKit/537.36","NoEngine")))
  }
  @Test fun rejectsConflictingDuplicatedVersionTokens() {
    assertNull(OrbitDesktopProfile.fromDefaultAgent(agent+" Chrome/158.0.0.0"))
    assertNull(OrbitDesktopProfile.fromDefaultAgent(agent+" AppleWebKit/999.1"))
  }
  @Test fun diagnosticObjectContainsNoRawDefaultAgent() {
    assertFalse(OrbitDesktopProfile.fromDefaultAgent(agent)!!.toString().contains("private"))
    assertFalse(OrbitDesktopProfile.fromDefaultAgent(agent)!!.toString().contains("Mozilla"))
  }
}
