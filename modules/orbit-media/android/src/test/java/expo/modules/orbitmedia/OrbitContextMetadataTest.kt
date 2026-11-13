package expo.modules.orbitmedia
import org.junit.Assert.*
import org.junit.Test
class OrbitContextMetadataTest {
  @Test fun keepsStandardContextFieldsSeparateWithoutDeclaringSeriesIdentity() {
    val value=OrbitContextMetadata.read("Album label","Artist label","Album artist label")
    assertEquals("Album label",value.albumLabel);assertEquals("Artist label",value.artistLabel);assertEquals("Album artist label",value.albumArtistLabel)
    assertTrue(value.albumPresent);assertTrue(value.artistPresent);assertTrue(value.albumArtistPresent)
  }
  @Test fun distinguishesMissingAndGenericContext() {
    val empty=OrbitContextMetadata.read(null," ",null);assertNull(empty.albumLabel);assertFalse(empty.albumPresent);assertFalse(empty.artistPresent)
    val generic=OrbitContextMetadata.read("Netflix","com.netflix.mediaclient",null);assertNull(generic.albumLabel);assertNull(generic.artistLabel);assertTrue(generic.albumPresent)
  }
  @Test fun boundsAndNormalizesProviderLabels() {
    assertEquals("Café",OrbitContextMetadata.read("Café",null,null).albumLabel)
    assertEquals(512,OrbitContextMetadata.read("x".repeat(600),null,null).albumLabel!!.length)
    assertNull(OrbitContextMetadata.read("x".repeat(4097),null,null).albumLabel)
  }
  @Test fun contextObjectLogsCannotRevealProviderText() {
    val value=OrbitContextMetadata.read("private_context","private_artist","private_album_artist")
    assertFalse(value.toString().contains("private"));assertFalse(value.toString().contains("context="))
  }
  @Test fun contextFieldsDoNotInventUnavailableValues() {
    val value=OrbitContextMetadata.read(null,null,"Only reported field")
    assertNull(value.albumLabel);assertNull(value.artistLabel);assertEquals("Only reported field",value.albumArtistLabel)
    assertFalse(value.albumPresent);assertFalse(value.artistPresent);assertTrue(value.albumArtistPresent)
  }
}
