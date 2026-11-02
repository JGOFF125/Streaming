package expo.modules.orbitmedia

import org.junit.Assert.*
import org.junit.Test

class OrbitPlaybackPlannerTest {
  private fun makeTimeline(playing: Boolean = false, revision: Long = 1, position: Long = 20000) = OrbitTimeline("80012345", playing, position, 1700000000000, revision)
  private fun makePlayer(state: String = "playing", position: Long? = 0, id: String? = "80012345", seek: Boolean = true) = OrbitPlayer(id, state, position, 100000, true, true, seek)
  private fun plan(planner: OrbitPlaybackPlanner = OrbitPlaybackPlanner(), timeline: OrbitTimeline = makeTimeline(), player: OrbitPlayer = makePlayer(), now: Long = 1200) =
    planner.plan(timeline, 1700000000000, 1000, 1200, now, player)

  @Test fun pauseAndSeekBeforeReconciliation() {
    assertEquals(listOf(OrbitAction("pause"), OrbitAction("seek", 20000)), plan().actions)
  }
  @Test fun seekBeforePlayWithTransitCompensation() {
    assertEquals(listOf(OrbitAction("seek", 20100), OrbitAction("play")), plan(timeline = makeTimeline(true), player = makePlayer("paused")).actions)
  }
  @Test fun refuseUnidentifiedOrDifferentMovies() {
    assertEquals("identity_unavailable", plan(player = makePlayer(id = null)).reason)
    assertEquals("content_mismatch", plan(player = makePlayer(id = "90012345")).reason)
  }
  @Test fun noCommandsWhileBufferingOrWithoutControls() {
    assertTrue(plan(player = makePlayer("buffering")).actions.isEmpty())
    assertEquals("unsupported", plan(player = makePlayer(seek = false)).reason)
    assertEquals("no_position", plan(player = makePlayer(position = null)).reason)
  }
  @Test fun staleAndConflictingRevisionsCannotUndoNewerCommands() {
    val planner = OrbitPlaybackPlanner(); plan(planner, makeTimeline(revision = 2))
    assertEquals("stale_revision", plan(planner, makeTimeline(revision = 1)).reason)
    assertEquals("revision_conflict", plan(planner, makeTimeline(revision = 2, position = 30000)).reason)
  }
  @Test fun cooldownProtectsAgainstLoopsButNewCommandsCanInterrupt() {
    val planner = OrbitPlaybackPlanner()
    assertEquals("apply", plan(planner).reason)
    assertEquals("cooldown", plan(planner, now = 1500).reason)
    assertEquals("apply", plan(planner, now = 4300).reason)
    assertEquals("apply", plan(planner, makeTimeline(revision = 2), now = 4400).reason)
  }
  @Test fun slowAndStaleClockSamplesDoNotMoveThePlayer() {
    val p = OrbitPlaybackPlanner()
    assertEquals("slow_connection", p.plan(makeTimeline(), 1700000000000, 1000, 4000, 4000, makePlayer()).reason)
    assertEquals("slow_connection", plan(now = 11201).reason)
    assertEquals("aligned", plan(timeline = makeTimeline(true), player = makePlayer(position = 21000)).reason)
  }
  @Test fun neverSeekPastTheKnownMovieDuration() {
    assertEquals("content_bounds", plan(timeline = makeTimeline(position = 100001)).reason)
  }
}
