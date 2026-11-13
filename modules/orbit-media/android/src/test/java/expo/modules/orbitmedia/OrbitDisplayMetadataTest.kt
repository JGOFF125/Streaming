package expo.modules.orbitmedia

import org.junit.Assert.*
import org.junit.Test

class OrbitDisplayMetadataTest {
  @Test fun prefersProviderDisplayTitleAndKeepsEpisodeDetailsSeparate() {
    val labels=OrbitDisplayMetadata.read("Series", "Other formatting", "S1 E2", "Episode title")
    assertEquals("Series", labels.titleLabel)
    assertEquals("Other formatting", labels.standardTitleLabel)
    assertEquals("display_title", labels.titleSource)
    assertEquals("S1 E2", labels.subtitleLabel)
    assertEquals("Episode title", labels.descriptionLabel)
    assertTrue(labels.titlePresent); assertTrue(labels.displayTitlePresent)
  }
  @Test fun fallsBackToStandardTitleWithoutPromotingGenericServiceNames() {
    val labels=OrbitDisplayMetadata.read("Netflix", "Actual movie", "Netflix", null)
    assertEquals("Actual movie", labels.titleLabel); assertEquals("title", labels.titleSource)
    assertNull(labels.subtitleLabel)
    val generic=OrbitDisplayMetadata.read("NETFLIX", null, null, null)
    assertNull(generic.titleLabel); assertTrue(generic.displayTitlePresent)
    assertEquals("unavailable", generic.titleSource)
  }
  @Test fun handlesAbsentBlankAndOversizedMetadataConservatively() {
    val none=OrbitDisplayMetadata.read(null, "  ", null, null)
    assertNull(none.titleLabel); assertFalse(none.titlePresent)
    assertNull(OrbitDisplayMetadata.read("x".repeat(4097),null,null,null).titleLabel)
    assertEquals(512,OrbitDisplayMetadata.read("x".repeat(1000),null,null,null).titleLabel!!.length)
  }
  @Test fun removesControlsNormalizesUnicodeAndPreservesWholeCodePoints() {
    assertEquals("Café",OrbitDisplayMetadata.read("Café",null,null,null).titleLabel)
    assertEquals("A B",OrbitDisplayMetadata.read("A‮B",null,null,null).titleLabel)
    assertEquals("x".repeat(511)+"🌙",OrbitDisplayMetadata.read("x".repeat(511)+"🌙Z",null,null,null).titleLabel)
  }
  @Test fun objectDiagnosticsDoNotIncludeRawProviderLabels() {
    val labels=OrbitDisplayMetadata.read("Private title","Private alternate title","Private episode","Private description")
    assertFalse(labels.toString().contains("Private"))
  }
  @Test fun keepsAlternateTitleBoundedAndRejectsGenericValues() {
    assertNull(OrbitDisplayMetadata.read("Episode", "Netflix", null, null).standardTitleLabel)
    assertNull(OrbitDisplayMetadata.read("Episode", "x".repeat(4097), null, null).standardTitleLabel)
    assertEquals(512, OrbitDisplayMetadata.read("Episode", "x".repeat(1000), null, null).standardTitleLabel!!.length)
    assertEquals("Café", OrbitDisplayMetadata.read("Episode", "Café", null, null).standardTitleLabel)
  }
}
