package expo.modules.orbitmedia

import org.junit.Assert.*
import org.junit.Test

class OrbitQueueIdentityTest {
  private val absent = OrbitMediaIdentity.resolve(null, null)
  private val url = "https://www.netflix.com/watch/80012345"

  @Test fun readsOnlyTheUniquelyActiveDescription() {
    var calls = 0
    val evidence = OrbitQueueIdentity.inspect(7, 7, listOf(3, 7, 9), absent) { index ->
      assertEquals(1, index); calls++; null to url
    }
    assertEquals(1, calls)
    assertEquals("candidate", evidence.status)
    assertEquals("80012345", evidence.candidateContentId)
    assertTrue(evidence.mediaUriPresent)
    assertFalse(evidence.mediaIdPresent)
  }

  @Test fun ignoresQueueKeysEvenWhenTheyLookLikeCatalogIds() {
    val evidence = OrbitQueueIdentity.inspect(80012345, 80012345, listOf(80012345), absent) { "80012345" to null }
    assertEquals("no_canonical_identity", evidence.status)
    assertNull(evidence.candidateContentId)
    assertTrue(evidence.mediaIdPresent)
  }

  @Test fun doesNotReadUnknownStaleMissingAmbiguousOrUnboundedQueues() {
    fun inspect(before: Long?, after: Long?, keys: List<Long>?): String =
      OrbitQueueIdentity.inspect(before, after, keys, absent) { fail("Description must not be read"); null to null }.status
    assertEquals("no_active_item", inspect(null, null, listOf(7)))
    assertEquals("no_active_item", inspect(-1, -1, listOf(7)))
    assertEquals("active_item_changed", inspect(7, 8, listOf(7)))
    assertEquals("active_item_changed", inspect(7, null, listOf(7)))
    assertEquals("queue_unavailable", inspect(7, 7, null))
    assertEquals("active_item_missing", inspect(7, 7, emptyList()))
    assertEquals("active_item_missing", inspect(7, 7, listOf(3, 9)))
    assertEquals("ambiguous_active_item", inspect(7, 7, listOf(7, 7)))
    assertEquals("queue_too_large", inspect(7, 7, List(101) { it.toLong() }))
  }

  @Test fun supportsZeroQueueKeyWithoutTreatingItAsCatalogIdentity() {
    assertEquals("80012345", OrbitQueueIdentity.inspect(0, 0, listOf(0), absent) { url to null }.candidateContentId)
  }

  @Test fun refusesConflictingCanonicalDescriptionFields() {
    val evidence = OrbitQueueIdentity.inspect(7, 7, listOf(7), absent) { url to "https://netflix.com/watch/80099999" }
    assertEquals("conflicting_fields", evidence.status)
    assertNull(evidence.candidateContentId)
  }

  @Test fun refusesConflictWithCurrentMetadata() {
    val different = OrbitMediaIdentity.resolve("80099999", null)
    val conflict = OrbitMediaIdentity.resolve("80012345", "https://netflix.com/watch/80099999")
    for (metadata in listOf(different, conflict)) {
      val evidence = OrbitQueueIdentity.inspect(7, 7, listOf(7), metadata) { url to null }
      assertEquals("metadata_conflict", evidence.status)
      assertNull(evidence.candidateContentId)
    }
    assertEquals("candidate", OrbitQueueIdentity.inspect(7, 7, listOf(7), OrbitMediaIdentity.resolve("80012345", null)) { url to url }.status)
  }

  @Test fun refusesTitlePagesLookalikesCredentialsAndUnboundedInput() {
    val invalid = listOf("https://netflix.com/title/80012345", "https://netflix.com.evil.test/watch/80012345",
      "https://secret@netflix.com/watch/80012345", "https://netflix.com/watch/%38%30%30%31%32%33%34%35", "x".repeat(4096))
    for (value in invalid) {
      val evidence = OrbitQueueIdentity.inspect(7, 7, listOf(7), absent) { value to value }
      assertEquals("no_canonical_identity", evidence.status)
      assertNull(evidence.candidateContentId)
    }
  }

  @Test fun neverStoresRawUrlsQueriesOrQueueKeysInEvidence() {
    val secret = "private_value_not_for_export"
    val evidence = OrbitQueueIdentity.inspect(76543210, 76543210, listOf(76543210), absent) { null to (url + "?token=" + secret) }
    assertEquals("80012345", evidence.candidateContentId)
    assertFalse(evidence.toString().contains(secret))
    assertFalse(evidence.toString().contains("76543210"))
    assertFalse(evidence.toString().contains("https"))
  }
}
