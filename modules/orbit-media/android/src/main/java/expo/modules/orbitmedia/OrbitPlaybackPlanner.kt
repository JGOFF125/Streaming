package expo.modules.orbitmedia

import kotlin.math.abs
import kotlin.math.roundToLong

internal data class OrbitTimeline(val contentId: String, val playing: Boolean, val positionMs: Long, val anchorTimeMs: Long, val revision: Long)
internal data class OrbitPlayer(val contentId: String?, val state: String, val positionMs: Long?, val durationMs: Long?, val canPlay: Boolean, val canPause: Boolean, val canSeek: Boolean)
internal data class OrbitAction(val type: String, val positionMs: Long? = null)
internal data class OrbitPlan(val reason: String, val actions: List<OrbitAction> = emptyList())

/** Shared by Android player adapters. Never assumes a room selection proves player identity. */
internal class OrbitPlaybackPlanner {
  private var latest: OrbitTimeline? = null
  private var lastCommandAt = Long.MIN_VALUE
  private var lastCommandRevision = 0L

  fun plan(timeline: OrbitTimeline, serverTimeMs: Long, sentAtMs: Long, receivedAtMs: Long, nowMs: Long, player: OrbitPlayer): OrbitPlan {
    if (receivedAtMs < sentAtMs || nowMs < receivedAtMs || receivedAtMs - sentAtMs > 2000 || nowMs - receivedAtMs > 10000) return OrbitPlan("slow_connection")
    if (!timeline.contentId.matches(Regex("[0-9]{1,12}")) || timeline.positionMs !in 0..86400000L || timeline.revision < 1 || timeline.anchorTimeMs !in 0..serverTimeMs) return OrbitPlan("invalid_snapshot")
    val previous = latest
    if (previous != null && timeline.revision < previous.revision) return OrbitPlan("stale_revision")
    if (previous != null && timeline.revision == previous.revision && timeline != previous) return OrbitPlan("revision_conflict")
    latest = timeline
    if (player.contentId == null) return OrbitPlan("identity_unavailable")
    if (player.contentId != timeline.contentId) return OrbitPlan("content_mismatch")
    if (player.state == "buffering") return OrbitPlan("buffering")
    if (player.state !in listOf("playing", "paused")) return OrbitPlan("no_state")
    val position = player.positionMs ?: return OrbitPlan("no_position")
    if (position !in 0..86400000L) return OrbitPlan("no_position")
    val serverNow = serverTimeMs.toDouble() + nowMs - (sentAtMs.toDouble() + receivedAtMs) / 2
    val target = (timeline.positionMs + if (timeline.playing) maxOf(0.0, serverNow - timeline.anchorTimeMs) else 0.0).coerceAtMost(86400000.0).roundToLong()
    if (player.durationMs != null && target > player.durationMs) return OrbitPlan("content_bounds")
    val seek = abs(target - position) > 1500
    val play = timeline.playing && player.state != "playing"
    val pause = !timeline.playing && player.state != "paused"
    // Netflix may resume after a seek even when it started paused.
    val pauseAfterSeek = seek && !timeline.playing
    if (seek && !player.canSeek || play && !player.canPlay || (pause || pauseAfterSeek) && !player.canPause) return OrbitPlan("unsupported")
    val actions = mutableListOf<OrbitAction>()
    if (pause) actions.add(OrbitAction("pause"))
    if (seek) actions.add(OrbitAction("seek", target))
    if (pauseAfterSeek) actions.add(OrbitAction("pause"))
    if (play) actions.add(OrbitAction("play"))
    if (actions.isEmpty()) return OrbitPlan("aligned")
    if (lastCommandRevision == timeline.revision && nowMs - lastCommandAt < 3000) return OrbitPlan("cooldown")
    lastCommandAt = nowMs; lastCommandRevision = timeline.revision
    return OrbitPlan("apply", actions)
  }
}
