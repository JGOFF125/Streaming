package expo.modules.orbitmedia

/** Diagnostic evidence only. A queue key is never a catalog identity or control authorization. */
data class OrbitQueueEvidence(
  val status: String, val candidateContentId: String? = null,
  val mediaIdPresent: Boolean = false, val mediaUriPresent: Boolean = false
)

object OrbitQueueIdentity {
  // Bound work on provider-owned lists. Never read descriptions of non-active items.
  const val MAX_ITEMS = 100

  fun inspect(activeBefore: Long?, activeAfter: Long?, queueKeys: List<Long>?,
    metadataIdentity: OrbitMediaIdentityResult,
    readDescription: (Int) -> Pair<String?, String?>): OrbitQueueEvidence {
    if (activeBefore == null || activeBefore < 0) return OrbitQueueEvidence("no_active_item")
    if (activeBefore != activeAfter) return OrbitQueueEvidence("active_item_changed")
    if (queueKeys == null) return OrbitQueueEvidence("queue_unavailable")
    if (queueKeys.size > MAX_ITEMS) return OrbitQueueEvidence("queue_too_large")
    val matches = queueKeys.indices.filter { queueKeys[it] == activeBefore }
    if (matches.isEmpty()) return OrbitQueueEvidence("active_item_missing")
    if (matches.size != 1) return OrbitQueueEvidence("ambiguous_active_item")
    val (mediaId, mediaUri) = readDescription(matches.single())
    // Numeric description IDs can also be opaque queue keys: accept canonical watch URLs only.
    val fromId = OrbitMediaIdentity.resolve(null, mediaId).contentId
    val fromUri = OrbitMediaIdentity.resolve(null, mediaUri).contentId
    val candidate = fromId ?: fromUri
    val status = when {
      fromId != null && fromUri != null && fromId != fromUri -> "conflicting_fields"
      candidate == null -> "no_canonical_identity"
      metadataIdentity.source == "conflicting_fields" -> "metadata_conflict"
      metadataIdentity.contentId != null && metadataIdentity.contentId != candidate -> "metadata_conflict"
      else -> "candidate"
    }
    return OrbitQueueEvidence(status, candidate.takeIf { status == "candidate" },
      !mediaId.isNullOrEmpty(), !mediaUri.isNullOrEmpty())
  }
}
