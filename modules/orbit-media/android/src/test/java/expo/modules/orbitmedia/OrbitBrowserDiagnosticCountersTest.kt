package expo.modules.orbitmedia
import org.junit.Assert.*
import org.junit.Test
class OrbitBrowserDiagnosticCountersTest {
  @Test fun exportsOnlyFixedBoundedRecordsAndResets() {
    val d=OrbitBrowserDiagnosticCounters()
    assertNull(d.record("private_cookie_url"))
    val records=(1..300).mapNotNull{d.record("console_error")}
    assertEquals(9,records.size);assertEquals("signal:console_error:255",records.last())
    assertNull(d.record("console_error"));d.reset();assertEquals("signal:console_error:1",d.record("console_error"))
  }
  @Test fun nonErrorOrUnclassifiedMessagesNeverRevealTheirContents() {
    val secret="https://private.invalid/?cookie=private_account_identifier"
    assertTrue(OrbitBrowserDiagnosticCounters.consoleSignals(secret,false).isEmpty())
    assertEquals(listOf("console_error"),OrbitBrowserDiagnosticCounters.consoleSignals(secret,true))
    val result=OrbitBrowserDiagnosticCounters.consoleSignals("requestMediaKeySystemAccess Widevine NotSupportedError "+secret,true)
    assertEquals(listOf("console_error","console_eme_not_supported"),result)
    assertFalse(result.toString().contains("private"))
  }
  @Test fun classifiesOnlyMediaQualifiedErrorsAndBoundsMessages() {
    assertEquals(listOf("console_error"),OrbitBrowserDiagnosticCounters.consoleSignals("NotSupportedError unrelated",true))
    assertTrue(OrbitBrowserDiagnosticCounters.consoleSignals("MediaKeys SecurityError",true).contains("console_eme_security_error"))
    assertTrue(OrbitBrowserDiagnosticCounters.consoleSignals("NotAllowedError autoplay play()",true).contains("console_media_not_allowed"))
    assertTrue(OrbitBrowserDiagnosticCounters.consoleSignals("DRM NetworkError Failed to fetch",true).contains("console_eme_network_error"))
    assertTrue(OrbitBrowserDiagnosticCounters.consoleSignals("PIPELINE_ERROR_DECODE",true).contains("console_codec_error"))
    assertEquals(listOf("console_error"),OrbitBrowserDiagnosticCounters.consoleSignals("x".repeat(8193)+"DRM NotSupportedError",true))
  }
  @Test fun separatesHttpPageAndResourceErrorsWithoutRetainingUrls() {
    assertNull(OrbitBrowserDiagnosticCounters.httpSignal(200,true))
    assertEquals("page_http_401",OrbitBrowserDiagnosticCounters.httpSignal(401,true))
    assertEquals("resource_http_403",OrbitBrowserDiagnosticCounters.httpSignal(403,false))
    assertEquals("resource_http_4xx",OrbitBrowserDiagnosticCounters.httpSignal(404,false))
    assertEquals("page_http_5xx",OrbitBrowserDiagnosticCounters.httpSignal(503,true))
  }
}
