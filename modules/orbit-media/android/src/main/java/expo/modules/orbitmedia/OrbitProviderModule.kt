package expo.modules.orbitmedia

import android.os.Handler
import android.os.Looper
import android.webkit.CookieManager
import android.webkit.WebView
import android.webkit.WebStorage
import expo.modules.kotlin.Promise
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.util.Collections
import java.util.WeakHashMap

/** Browser feasibility only; never exposes provider cookies, DOM or player internals. */
class OrbitProviderModule : Module() {
  private val views = Collections.newSetFromMap(WeakHashMap<OrbitProviderView, Boolean>())

  override fun definition() = ModuleDefinition {
    Name("OrbitProvider")
    Constant("experimentVersion") { 3 }

    View(OrbitProviderView::class) {
      Events("onStatus")
      Prop("active") { view: OrbitProviderView, active: Boolean -> view.setActive(active) }
      Prop("profile") { view: OrbitProviderView, profile: String -> view.setProfile(profile) }
      Prop("command") { view: OrbitProviderView, command: String -> view.command(command) }
      OnViewDidUpdateProps { view: OrbitProviderView -> views.add(view); view.applyProps() }
      OnViewDestroys { view: OrbitProviderView ->
        views.remove(view)
        view.dispose()
      }
    }

    AsyncFunction("clearBrowserData") { promise: Promise ->
      try {
        // No reads: destroy all provider surfaces, clear Chromium's app-local stores.
        views.toList().forEach { it.clearAndClose() }
        val context = appContext.reactContext ?: throw IllegalStateException("APP_UNAVAILABLE")
        val cleanup = WebView(context)
        try { cleanup.clearCache(true) } finally { cleanup.destroy() }
        WebStorage.getInstance().deleteAllData()
        CookieManager.getInstance().removeAllCookies {
          CookieManager.getInstance().flush()
          promise.resolve(null)
        }
      } catch (_: Exception) {
        promise.reject("BROWSER_CLEAR_FAILED", "Browser cleanup could not finish.", null)
      }
    }.runOnQueue(Queues.MAIN)

    // End this bounded experiment instead of silently leaving provider media running.
    // Reopening loads Netflix afresh; cookies survive until the explicit clear action.
    OnActivityEntersBackground {
      Handler(Looper.getMainLooper()).post { views.toList().forEach { it.background() } }
    }
    OnDestroy {
      Handler(Looper.getMainLooper()).post {
        views.toList().forEach { it.dispose() }
        views.clear()
      }
    }
  }
}
