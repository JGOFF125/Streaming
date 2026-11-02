package expo.modules.orbitmedia

import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification

/** Only grants access to Android's MediaSession API. Never inspect notifications. */
class OrbitMediaListener : NotificationListenerService() {
  override fun onListenerConnected() { connected = true }
  override fun onListenerDisconnected() { connected = false }
  override fun onDestroy() { connected = false; super.onDestroy() }
  override fun onNotificationPosted(sbn: StatusBarNotification?) = Unit
  override fun onNotificationRemoved(sbn: StatusBarNotification?) = Unit

  companion object {
    @Volatile var connected: Boolean = false
      private set
  }
}
