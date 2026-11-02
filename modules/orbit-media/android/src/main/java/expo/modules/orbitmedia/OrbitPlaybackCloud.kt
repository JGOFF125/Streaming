package expo.modules.orbitmedia

import android.os.SystemClock
import java.net.HttpURLConnection
import java.net.URL
import org.json.JSONObject
import kotlin.math.floor

internal class OrbitSyncFailure(val reason: String) : Exception(reason)
internal data class OrbitCloudReply(val timeline: OrbitTimeline?, val serverTimeMs: Long, val sentAtMs: Long, val receivedAtMs: Long)

/** Only calls Orbit's own fixed project/RPCs. Credentials stay in memory and are never logged. */
internal class OrbitPlaybackCloud(private val publicKey: String, private val orbitAccessToken: String, private val roomId: String) {
  fun read(): OrbitCloudReply = request("orbit_get_playback", JSONObject().put("p_room_id", roomId))
  fun publish(player: OrbitPlayer, revision: Long): OrbitCloudReply = request("orbit_set_playback", JSONObject()
    .put("p_room_id", roomId).put("p_content_id", player.contentId)
    .put("p_playing", player.state == "playing").put("p_position_ms", player.positionMs).put("p_expected_revision", revision))

  private fun request(method: String, body: JSONObject): OrbitCloudReply {
    val sent = SystemClock.elapsedRealtime()
    val connection = URL(PROJECT + "/rest/v1/rpc/" + method).openConnection() as HttpURLConnection
    try {
      connection.instanceFollowRedirects = false
      connection.requestMethod = "POST"; connection.connectTimeout = 4000; connection.readTimeout = 4000
      connection.setRequestProperty("apikey", publicKey)
      connection.setRequestProperty("Authorization", "Bearer " + orbitAccessToken)
      connection.setRequestProperty("Content-Type", "application/json")
      connection.doOutput = true
      connection.outputStream.use { it.write(body.toString().toByteArray(Charsets.UTF_8)) }
      val status = connection.responseCode
      if (status in listOf(401, 403)) throw OrbitSyncFailure("unauthorized")
      if (status == 404) throw OrbitSyncFailure("backend_incomplete")
      if (status == 429) throw OrbitSyncFailure("rate_limited")
      if (status != 200) throw OrbitSyncFailure("connection_failed")
      // Bound the response before allocation; never log raw server error payloads.
      val text = connection.inputStream.bufferedReader().use { reader ->
        val result = StringBuilder(); val chunk = CharArray(1024)
        while (true) { val count = reader.read(chunk); if (count < 0) break
          if (result.length + count > 16384) throw OrbitSyncFailure("invalid_snapshot")
          if (SystemClock.elapsedRealtime() - sent > 2000) throw OrbitSyncFailure("slow_connection")
          result.append(chunk, 0, count)
        }; result.toString()
      }
      val received = SystemClock.elapsedRealtime()
      if (received - sent > 2000) throw OrbitSyncFailure("slow_connection")
      val data = JSONObject(text)
      if (data.has("error")) throw OrbitSyncFailure(when (data.optString("code")) {
        "conflict" -> "conflict"; "rate_limited" -> "rate_limited"; else -> "invalid_snapshot"
      })
      if (data.opt("room_id") != roomId) throw OrbitSyncFailure("invalid_snapshot")
      val serverTime = integer(data, "server_time_ms", 0, 9007199254740991L)
      val rawTimeline = data.opt("timeline")
      val timeline = when (rawTimeline) {
        JSONObject.NULL -> null
        is JSONObject -> {
          val content = rawTimeline.opt("content_id") as? String ?: throw OrbitSyncFailure("invalid_snapshot")
          val playing = rawTimeline.opt("playing") as? Boolean ?: throw OrbitSyncFailure("invalid_snapshot")
          if (!content.matches(Regex("[0-9]{1,12}"))) throw OrbitSyncFailure("invalid_snapshot")
          OrbitTimeline(content, playing, integer(rawTimeline, "position_ms", 0, 86400000),
            integer(rawTimeline, "anchor_time_ms", 0, serverTime), integer(rawTimeline, "revision", 1, 9007199254740991L))
        }
        else -> throw OrbitSyncFailure("invalid_snapshot")
      }
      return OrbitCloudReply(timeline, serverTime, sent, received)
    } finally { connection.disconnect() }
  }

  private fun integer(data: JSONObject, key: String, min: Long, max: Long): Long {
    val value = (data.opt(key) as? Number)?.toDouble() ?: throw OrbitSyncFailure("invalid_snapshot")
    if (!value.isFinite() || floor(value) != value || value < min || value > max) throw OrbitSyncFailure("invalid_snapshot")
    return value.toLong()
  }
  companion object { const val PROJECT = "https://syvxuqwlavfufbhsmzcd.supabase.co" }
}
