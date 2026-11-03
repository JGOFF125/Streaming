package expo.modules.orbitmedia

import android.app.NotificationManager
import android.content.ActivityNotFoundException
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.media.MediaMetadata
import android.media.session.MediaController
import android.media.session.MediaSessionManager
import android.media.session.PlaybackState
import android.os.Build
import android.os.SystemClock
import android.provider.Settings
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.delay
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.coroutines.CancellationException
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicLong
import kotlin.math.abs

/** Netflix controls and a bounded room-sync test. No notification text or streaming credentials. */
class OrbitMediaModule : Module() {
  private val running = AtomicBoolean(false)
  private val generation = AtomicLong(0)

  override fun definition() = ModuleDefinition {
    Name("OrbitMedia")

    AsyncFunction("getSnapshot") { snapshot() }

    AsyncFunction("openAccessSettings") {
      val context = context()
      val intent = if (Build.VERSION.SDK_INT >= 30) {
        Intent(Settings.ACTION_NOTIFICATION_LISTENER_DETAIL_SETTINGS)
          .putExtra(Settings.EXTRA_NOTIFICATION_LISTENER_COMPONENT_NAME, component().flattenToString())
      } else Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)
      try {
        context.startActivity(intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
      } catch (_: ActivityNotFoundException) {
        context.startActivity(Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)
          .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
      }
    }.runOnQueue(Queues.MAIN)

    AsyncFunction("openNetflix") {
      val context = context()
      val launch = context.packageManager.getLaunchIntentForPackage(NETFLIX)
        ?: throw IllegalStateException("NETFLIX_NOT_INSTALLED")
      context.startActivity(launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    }.runOnQueue(Queues.MAIN)

    AsyncFunction("openNetflixTitle") { contentId: String ->
      require(contentId.matches(Regex("[1-9][0-9]{0,11}"))) { "INVALID_TITLE" }
      val intent = Intent(Intent.ACTION_VIEW, android.net.Uri.parse("https://www.netflix.com/watch/" + contentId))
        .setPackage(NETFLIX).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      try { context().startActivity(intent) }
      catch (_: ActivityNotFoundException) {
        val launch = context().packageManager.getLaunchIntentForPackage(NETFLIX) ?: throw IllegalStateException("NETFLIX_NOT_INSTALLED")
        context().startActivity(launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
      }
    }.runOnQueue(Queues.MAIN)

    AsyncFunction("runSyncWindow").SuspendBody { projectUrl: String, publicKey: String, orbitAccessToken: String, roomId: String, mode: String, contentId: String ->
      require(projectUrl.trimEnd('/') == OrbitPlaybackCloud.PROJECT && publicKey.matches(Regex("sb_publishable_[A-Za-z0-9_-]+")) &&
        orbitAccessToken.length in 32..8192 && roomId.matches(Regex("[a-fA-F0-9]{8}(-[a-fA-F0-9]{4}){3}-[a-fA-F0-9]{12}")) &&
        mode in listOf("host", "follow") && contentId.matches(Regex("[1-9][0-9]{0,11}"))) { "INVALID_SYNC_REQUEST" }
      if (!running.compareAndSet(false, true)) return@SuspendBody syncResult("busy", 0, 0, 0, 0)
      val ticket = generation.incrementAndGet()
      try {
        delay(8000)
        if (ticket != generation.get()) return@SuspendBody syncResult("cancelled", 0, 0, 0, 0)
        withContext(Dispatchers.IO) { syncWindow(OrbitPlaybackCloud(publicKey, orbitAccessToken, roomId), mode, contentId, ticket) }
      } finally { running.set(false) }
    }

    AsyncFunction("cancelTest") { generation.incrementAndGet(); Unit }

    // Native coroutine keeps the short test running while Netflix is in front.
    // It is cancelled with the module; it is not a long-running sync service.
    AsyncFunction("runTest").SuspendBody { command: String ->
      require(command in listOf("play", "pause", "seek")) { "INVALID_COMMAND" }
      if (!running.compareAndSet(false, true)) return@SuspendBody result(command, "unavailable", "busy")
      val ticket = generation.incrementAndGet()
      try {
        delay(8000)
        if (ticket != generation.get()) return@SuspendBody result(command, "cancelled", "cancelled")
        runTest(command, ticket)
      } finally { running.set(false) }
    }
    OnDestroy { generation.incrementAndGet() }
  }

  private fun context(): Context = appContext.reactContext ?: throw IllegalStateException("APP_UNAVAILABLE")
  private fun component() = ComponentName(context(), OrbitMediaListener::class.java)
  private fun hasAccess(): Boolean {
    val context = context()
    val listener = component()
    if (Build.VERSION.SDK_INT >= 27) {
      return context.getSystemService(NotificationManager::class.java).isNotificationListenerAccessGranted(listener)
    }
    // Android 7/8.0 lack the framework permission-query API. Read only our
    // component membership; never change the setting or retain the list.
    return Settings.Secure.getString(context.contentResolver, "enabled_notification_listeners")
      ?.split(':')?.any { ComponentName.unflattenFromString(it) == listener } == true
  }

  private fun controllers(): List<MediaController> {
    if (!hasAccess() || !OrbitMediaListener.connected) return emptyList()
    val context = context()
    val manager = context.getSystemService(MediaSessionManager::class.java)
    // Android 17 can query Netflix alone. This narrows the read, not the broad
    // notification-access grant. Older Android exposes only the all-session API.
    val sessions = if (Build.VERSION.SDK_INT >= 37) {
      manager.getActiveSessionsForPackage(NETFLIX, component()).map { MediaController(context, it) }
    } else manager.getActiveSessions(component())
    // Never read metadata or control another app, including on the legacy path.
    return sessions.filter { it.packageName == NETFLIX }
  }

  private fun snapshot(): Map<String, Any?> {
    val access = hasAccess()
    if (!access) return mapOf("access" to "permission_required", "session" to "none")
    if (!OrbitMediaListener.connected) return mapOf("access" to "connecting", "session" to "none")
    return try {
      val sessions = controllers()
      val controller = sessions.singleOrNull()
      if (controller == null) mapOf("access" to "ready", "session" to if (sessions.isEmpty()) "none" else "ambiguous")
      else describe(controller)
    } catch (_: SecurityException) {
      mapOf("access" to "permission_required", "session" to "none")
    }
  }

  private fun describe(controller: MediaController): Map<String, Any?> {
    val state = controller.playbackState
    val actions = state?.actions ?: 0L
    val metadata = controller.metadata
    val duration = metadata?.getLong(MediaMetadata.METADATA_KEY_DURATION)?.takeIf { it > 0 }
    val identity = OrbitMediaIdentity.resolve(
      metadata?.getString(MediaMetadata.METADATA_KEY_MEDIA_ID),
      metadata?.getString(MediaMetadata.METADATA_KEY_MEDIA_URI))
    return mapOf(
      "access" to "ready", "session" to "active",
      "state" to when (state?.state) {
        PlaybackState.STATE_PLAYING -> "playing"
        PlaybackState.STATE_PAUSED -> "paused"
        PlaybackState.STATE_BUFFERING, PlaybackState.STATE_CONNECTING -> "buffering"
        PlaybackState.STATE_STOPPED -> "stopped"
        PlaybackState.STATE_ERROR -> "error"
        else -> "unknown"
      },
      "positionMs" to position(state, duration), "durationMs" to duration, "contentId" to identity.contentId,
      "identitySource" to identity.source, "mediaIdPresent" to identity.mediaIdPresent,
      "mediaUriPresent" to identity.mediaUriPresent,
      "canPlay" to (supports(actions, PlaybackState.ACTION_PLAY) || supports(actions, PlaybackState.ACTION_PLAY_PAUSE)),
      "canPause" to (supports(actions, PlaybackState.ACTION_PAUSE) || supports(actions, PlaybackState.ACTION_PLAY_PAUSE)),
      "canSeek" to supports(actions, PlaybackState.ACTION_SEEK_TO)
    )
  }

  private fun player(controller: MediaController): OrbitPlayer {
    val snapshot = describe(controller)
    return OrbitPlayer(snapshot["contentId"] as? String, snapshot["state"] as String,
      snapshot["positionMs"] as? Long, snapshot["durationMs"] as? Long,
      snapshot["canPlay"] == true, snapshot["canPause"] == true, snapshot["canSeek"] == true)
  }

  private suspend fun syncWindow(cloud: OrbitPlaybackCloud, mode: String, expectedContentId: String, ticket: Long): Map<String, Any?> {
    val started = SystemClock.elapsedRealtime()
    var reads = 0; var published = 0; var commands = 0
    fun finish(reason: String) = syncResult(reason, reads, published, commands, SystemClock.elapsedRealtime() - started)
    try {
      if (!hasAccess()) return finish("permission_required")
      if (!OrbitMediaListener.connected) return finish("connecting")
      val initial = controllers().singleOrNull() ?: return finish("no_session")
      val sessionToken = initial.sessionToken
      val planner = OrbitPlaybackPlanner()
      // This minute-long test is intentionally not a movie-length background service.
      while (SystemClock.elapsedRealtime() - started < 60000) {
        if (ticket != generation.get()) return finish("cancelled")
        val reply = cloud.read(); reads++
        if (SystemClock.elapsedRealtime() - started >= 60000) return finish("completed")
        if (ticket != generation.get()) return finish("cancelled")
        val controller = controllers().singleOrNull() ?: return finish("no_session")
        if (controller.sessionToken != sessionToken) return finish("session_changed")
        val local = player(controller)
        if (local.contentId == null) return finish("identity_unavailable")
        if (local.contentId != expectedContentId) return finish("content_mismatch")
        if (local.positionMs == null || local.positionMs !in 0..86400000L) return finish("no_position")
        val timeline = reply.timeline
        if (mode == "host") {
          if (local.state !in listOf("playing", "paused", "buffering")) return finish("no_state")
          val serverNow = reply.serverTimeMs.toDouble() + SystemClock.elapsedRealtime() -
            (reply.sentAtMs.toDouble() + reply.receivedAtMs) / 2
          val desired = timeline?.let { it.positionMs + if (it.playing) maxOf(0.0, serverNow - it.anchorTimeMs) else 0.0 }
          if (timeline == null || timeline.contentId != expectedContentId || timeline.playing != (local.state == "playing") ||
            desired == null || abs(desired - local.positionMs) > 1500) {
            if (ticket != generation.get()) return finish("cancelled")
            try { cloud.publish(local, timeline?.revision ?: 0); published++ }
            catch (failure: OrbitSyncFailure) { if (failure.reason != "conflict") throw failure }
          }
        } else {
          if (timeline == null) return finish("no_timeline")
          if (timeline.contentId != expectedContentId) return finish("content_mismatch")
          val plan = planner.plan(timeline, reply.serverTimeMs, reply.sentAtMs, reply.receivedAtMs, SystemClock.elapsedRealtime(), local)
          if (plan.reason !in listOf("apply", "aligned", "cooldown", "buffering", "stale_revision")) return finish(plan.reason)
          for (action in plan.actions) {
            if (SystemClock.elapsedRealtime() - started >= 60000) return finish("completed")
            if (ticket != generation.get()) return finish("cancelled")
            // Recheck identity immediately before every command, including a seek/play pair.
            val active = controllers().singleOrNull() ?: return finish("no_session")
            if (active.sessionToken != sessionToken) return finish("session_changed")
            if (player(active).contentId != expectedContentId) return finish("content_mismatch")
            when (action.type) {
              "pause" -> active.transportControls.pause()
              "seek" -> active.transportControls.seekTo(action.positionMs!!)
              "play" -> active.transportControls.play()
            }; commands++
          }
          if (plan.actions.isNotEmpty()) {
            var acknowledged = false
            for (attempt in 0 until 12) {
              delay(250)
              if (ticket != generation.get()) return finish("cancelled")
              if (SystemClock.elapsedRealtime() - started >= 60000) return finish("completed")
              val active = controllers().singleOrNull() ?: return finish("no_session")
              if (active.sessionToken != sessionToken) return finish("session_changed")
              val current = player(active)
              if (current.contentId != expectedContentId) return finish("content_mismatch")
              val serverNow = reply.serverTimeMs.toDouble() + SystemClock.elapsedRealtime() -
                (reply.sentAtMs.toDouble() + reply.receivedAtMs) / 2
              val target = timeline.positionMs + if (timeline.playing) maxOf(0.0, serverNow - timeline.anchorTimeMs) else 0.0
              if (current.positionMs != null && abs(current.positionMs - target) <= 2500 &&
                current.state == if (timeline.playing) "playing" else "paused") { acknowledged = true; break }
            }
            if (!acknowledged) return finish("no_ack")
          }
        }
        delay(1000)
      }
      return finish("completed")
    } catch (cancelled: CancellationException) { throw cancelled }
    catch (failure: OrbitSyncFailure) { return finish(failure.reason) }
    catch (_: SecurityException) { return finish("permission_required") }
    catch (_: Exception) { return finish("connection_failed") }
  }

  private fun syncResult(reason: String, reads: Int, published: Int, commands: Int, duration: Long): Map<String, Any?> =
    mapOf("reason" to reason, "reads" to reads, "published" to published, "commands" to commands, "durationMs" to duration)

  private fun position(state: PlaybackState?, duration: Long?): Long? {
    if (state == null || state.position < 0 || state.lastPositionUpdateTime <= 0) return null
    val elapsed = SystemClock.elapsedRealtime() - state.lastPositionUpdateTime
    if (elapsed < 0 || elapsed > 86_400_000 || !state.playbackSpeed.isFinite()) return null
    val advancement = if (state.state == PlaybackState.STATE_PLAYING) elapsed * state.playbackSpeed.toDouble() else 0.0
    val current = (state.position + advancement).toLong().coerceAtLeast(0)
    return duration?.let { current.coerceAtMost(it) } ?: current
  }

  private suspend fun runTest(command: String, ticket: Long): Map<String, Any?> {
    try {
      if (!hasAccess()) return result(command, "unavailable", "permission_required")
      if (!OrbitMediaListener.connected) return result(command, "unavailable", "connecting")
      val sessions = controllers()
      val controller = sessions.singleOrNull()
        ?: return result(command, "unavailable", if (sessions.isEmpty()) "no_session" else "ambiguous")
      val before = describe(controller)
      val state = controller.playbackState ?: return result(command, "unavailable", "no_state", before)
      val supported = when (command) {
        "play" -> before["canPlay"] == true
        "pause" -> before["canPause"] == true
        else -> before["canSeek"] == true
      }
      if (!supported) return result(command, "unavailable", "unsupported", before)
      if (command == "play" && state.state != PlaybackState.STATE_PAUSED ||
          command == "pause" && state.state != PlaybackState.STATE_PLAYING ||
          command == "seek" && state.state !in listOf(PlaybackState.STATE_PAUSED, PlaybackState.STATE_PLAYING)) {
        return result(command, "unavailable", "wrong_state", before)
      }
      val duration = controller.metadata?.getLong(MediaMetadata.METADATA_KEY_DURATION)?.takeIf { it > 0 }
      val current = position(state, duration)
      if (command == "seek" && current == null) return result(command, "unavailable", "no_position", before)
      val target = if (command == "seek") current!! + 10_000 else null
      if (target != null && duration != null && target >= duration - 2000) {
        return result(command, "unavailable", "near_end", before)
      }
      if (ticket != generation.get()) return result(command, "cancelled", "cancelled")
      val sentAt = SystemClock.elapsedRealtime()
      when (command) {
        "play" -> controller.transportControls.play()
        "pause" -> controller.transportControls.pause()
        "seek" -> controller.transportControls.seekTo(target!!)
      }
      var after = before
      repeat(12) {
        delay(250)
        if (ticket != generation.get()) return result(command, "cancelled", "cancelled")
        val latest = controllers().singleOrNull()
        if (latest == null || latest.sessionToken != controller.sessionToken) {
          return result(command, "unavailable", "session_changed", before)
        }
        after = describe(latest)
        val updated = latest.playbackState
        val observed = when (command) {
          "play" -> updated?.state == PlaybackState.STATE_PLAYING
          "pause" -> updated?.state == PlaybackState.STATE_PAUSED
          else -> {
            val now = position(updated, duration)
            val expected = target!! + if (updated?.state == PlaybackState.STATE_PLAYING)
              ((SystemClock.elapsedRealtime() - sentAt) * updated.playbackSpeed.toDouble()).toLong() else 0L
            now != null && updated != null && updated.lastPositionUpdateTime >= sentAt && abs(now - expected) < 2500
          }
        }
        if (observed) return result(command, "observed", "state_changed", before, after)
      }
      return result(command, "not_observed", "no_change", before, after)
    } catch (_: SecurityException) {
      return result(command, "unavailable", "permission_required")
    } catch (_: IllegalStateException) {
      return result(command, "unavailable", "session_changed")
    }
  }

  private fun result(command: String, status: String, reason: String,
    before: Map<String, Any?>? = null, after: Map<String, Any?>? = null): Map<String, Any?> =
    mapOf("command" to command, "status" to status, "reason" to reason, "before" to before, "after" to after)

  private fun supports(actions: Long, action: Long) = (actions and action) != 0L
  companion object { private const val NETFLIX = "com.netflix.mediaclient" }
}
