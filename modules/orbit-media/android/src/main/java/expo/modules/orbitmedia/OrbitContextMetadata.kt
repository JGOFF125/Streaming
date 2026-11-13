package expo.modules.orbitmedia

/** Standard provider-published text only. Music field names do not imply a verified TV series. */
internal class OrbitContextLabels(
  val albumLabel: String?, val artistLabel: String?, val albumArtistLabel: String?,
  val albumPresent: Boolean, val artistPresent: Boolean, val albumArtistPresent: Boolean
) {
  override fun toString() = "OrbitContextLabels(albumPresent=$albumPresent, artistPresent=$artistPresent, albumArtistPresent=$albumArtistPresent)"
}
internal object OrbitContextMetadata {
  fun read(album: CharSequence?, artist: CharSequence?, albumArtist: CharSequence?): OrbitContextLabels {
    val a=OrbitDisplayMetadata.read(null,album,null,null)
    val b=OrbitDisplayMetadata.read(null,artist,null,null)
    val c=OrbitDisplayMetadata.read(null,albumArtist,null,null)
    return OrbitContextLabels(a.titleLabel,b.titleLabel,c.titleLabel,a.titlePresent,b.titlePresent,c.titlePresent)
  }
}
