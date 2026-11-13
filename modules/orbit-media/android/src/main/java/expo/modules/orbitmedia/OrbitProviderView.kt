package expo.modules.orbitmedia

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Bitmap
import android.net.Uri
import android.net.http.SslError
import android.os.Build
import android.os.Message
import android.view.View
import android.webkit.*
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView
import java.io.ByteArrayInputStream

/** A fixed official-site surface with no JS/native bridge, injection or stream extraction. */
@SuppressLint("SetJavaScriptEnabled")
class OrbitProviderView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  override val shouldUseAndroidLayout = true
  private val onStatus by EventDispatcher()
  private var browser: WebView? = null
  private var activeRequested = false
  private var profileMode = "system"
  private var profileEvidence = OrbitBrowserProfileEvidence("system")
  private var pendingMedia: PermissionRequest? = null
  private var mediaAllowed = false
  private var lastCommand = ""
  private var pageFailed = false
  private var disposed = false

  fun setActive(active: Boolean) {
    if (disposed) return
    activeRequested=active
    if (!active) close()
  }

  fun setProfile(mode: String) {
    if (disposed || mode !in listOf("system","desktop") || mode == profileMode) return
    profileMode=mode
    close()
    profileEvidence=OrbitBrowserProfileEvidence(mode)
  }

  // Wait for all props so a desktop attempt never first navigates with mobile settings.
  fun applyProps() {
    if (disposed || !activeRequested || browser != null) return
    try {
      val web = WebView(context)
      browser = web
      web.layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
      web.settings.apply {
        javaScriptEnabled = true // Netflix's own scripts only; Orbit never injects a script.
        domStorageEnabled = true
        useWideViewPort = true
        loadWithOverviewMode = true
        setSupportZoom(true)
        builtInZoomControls = true
        displayZoomControls = false
        allowFileAccess = false
        allowContentAccess = false
        @Suppress("DEPRECATION")
        allowFileAccessFromFileURLs = false
        @Suppress("DEPRECATION")
        allowUniversalAccessFromFileURLs = false
        mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
        javaScriptCanOpenWindowsAutomatically = false
        setSupportMultipleWindows(true) // onCreateWindow rejects all popup/new-app paths.
        setGeolocationEnabled(false)
        mediaPlaybackRequiresUserGesture = true
        @Suppress("DEPRECATION")
        saveFormData = false
        if (Build.VERSION.SDK_INT >= 26) safeBrowsingEnabled = true
        // The system profile leaves the default agent untouched; protections stay enabled.
      }
      profileEvidence=OrbitBrowserProfileEvidence(profileMode)
      try { profileEvidence=OrbitBrowserConfigurator.apply(web,profileMode) }
      catch (_: Exception) {
        activeRequested=false
        close()
        emit("browser_profile_unavailable")
        return
      }
      CookieManager.getInstance().setAcceptThirdPartyCookies(web, false)
      web.setDownloadListener { _, _, _, _, _ -> emit("download_blocked") }
      web.webChromeClient = chrome()
      web.webViewClient = client()
      addView(web)
      // A source prop cannot replace this URL. No app tokens/headers enter the browser.
      if (profileMode == "desktop") emit("desktop_profile_applied")
      web.loadUrl(OrbitProviderPolicy.START_URL)
    } catch (_: Exception) {
      activeRequested=false
      close()
      emit("browser_unavailable")
    }
  }

  fun command(command: String) {
    if (disposed || command == lastCommand || !command.matches(Regex("[0-9]{1,10}:(back|reload|allow_media|deny_media|browse|watch_[1-9][0-9]{0,11})"))) return
    lastCommand = command
    val action = command.substringAfter(':')
    val target = OrbitProviderPolicy.commandUrl(action)
    if (target != null) { browser?.loadUrl(target); return }
    when (action) {
      "back" -> browser?.let { if (it.canGoBack()) it.goBack() }
      "reload" -> browser?.reload()
      "allow_media" -> {
        val request = pendingMedia ?: return
        pendingMedia = null
        if (OrbitProviderPolicy.allowsProtectedMedia(request.origin.toString(), request.resources.toList())) {
          mediaAllowed = true
          request.grant(arrayOf(OrbitProviderPolicy.PROTECTED_MEDIA))
          emit("protected_media_allowed")
        } else { request.deny(); emit("permission_blocked") }
      }
      "deny_media" -> {
        pendingMedia?.deny()
        pendingMedia = null
        emit("protected_media_denied")
      }
    }
  }

  private fun emit(code: String) {
    if (!disposed) onStatus(mapOf(
      "code" to code,
      "browserProfile" to profileEvidence.mode,
      "desktopApplied" to profileEvidence.desktopApplied,
      "clientHintsOverridden" to profileEvidence.clientHintsOverridden,
      "formFactorsOverridden" to profileEvidence.formFactorsOverridden,
      "canGoBack" to (browser?.canGoBack() == true),
      "mediaPermissionPending" to (pendingMedia != null)
    ))
  }

  private fun deniedResource() = WebResourceResponse(
    "text/plain", "UTF-8", 403, "Blocked", emptyMap(),
    ByteArrayInputStream(ByteArray(0))
  )

  private fun client() = object : WebViewClient() {
    override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
      val allowed = if (request.isForMainFrame) OrbitProviderPolicy.allowsNavigation(request.url.toString())
        else OrbitProviderPolicy.allowsNetworkResource(request.url.toString())
      if (!allowed && request.isForMainFrame) emit("navigation_blocked")
      return !allowed // Never hand off intent://, market:// or external-app links.
    }

    override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? =
      if (OrbitProviderPolicy.allowsNetworkResource(request.url.toString())) null else deniedResource()

    override fun onPageStarted(view: WebView, url: String?, favicon: Bitmap?) {
      if (browser !== view) return
      pageFailed = false
      if (url == null || !OrbitProviderPolicy.allowsNavigation(url)) {
        pageFailed = true
        activeRequested=false
        close()
        emit("navigation_blocked")
      } else {
        // Consent is specific to the current top-level page; never carry a pending
        // request across redirects or subsequent navigation.
        pendingMedia?.deny()
        pendingMedia = null
        mediaAllowed = false
        emit("loading")
      }
    }

    override fun onPageFinished(view: WebView, url: String?) {
      if (browser === view && !pageFailed) emit("page_loaded")
      // A loaded page is deliberately NOT classified as video playback.
    }

    override fun onReceivedError(view: WebView, request: WebResourceRequest, error: WebResourceError) {
      if (browser === view && request.isForMainFrame) { pageFailed = true; emit("network_error") }
    }

    override fun onReceivedHttpError(view: WebView, request: WebResourceRequest, response: WebResourceResponse) {
      if (browser === view && request.isForMainFrame) { pageFailed = true; emit("http_error") }
    }

    override fun onReceivedSslError(view: WebView, handler: SslErrorHandler, error: SslError) {
      handler.cancel()
      pageFailed = true
      emit("certificate_error")
    }

    override fun onReceivedHttpAuthRequest(view: WebView, handler: HttpAuthHandler, host: String, realm: String) {
      handler.cancel()
      emit("authentication_blocked")
    }

    override fun onReceivedClientCertRequest(view: WebView, request: ClientCertRequest) {
      request.cancel()
      emit("certificate_error")
    }

    override fun onRenderProcessGone(view: WebView, detail: RenderProcessGoneDetail): Boolean {
      if (browser === view) { activeRequested=false; close(); emit("renderer_stopped") }
      return true
    }
  }

  private fun chrome() = object : WebChromeClient() {
    override fun onPermissionRequest(request: PermissionRequest) {
      // Do not grant camera, microphone, geolocation, MIDI, or future unknown resources.
      if (browser == null || !OrbitProviderPolicy.allowsProtectedMedia(request.origin.toString(), request.resources.toList())) {
        request.deny()
        emit("permission_blocked")
      } else if (mediaAllowed) {
        request.grant(arrayOf(OrbitProviderPolicy.PROTECTED_MEDIA))
      } else {
        pendingMedia?.deny()
        pendingMedia = request
        emit("protected_media_required")
      }
    }

    override fun onPermissionRequestCanceled(request: PermissionRequest) {
      if (pendingMedia === request) { pendingMedia = null; emit("protected_media_cancelled") }
    }

    override fun onCreateWindow(view: WebView, isDialog: Boolean, isUserGesture: Boolean, resultMsg: Message): Boolean {
      emit("popup_blocked")
      return false
    }

    override fun onShowFileChooser(view: WebView, callback: ValueCallback<Array<Uri>>, params: FileChooserParams): Boolean {
      callback.onReceiveValue(null)
      emit("file_upload_blocked")
      return true
    }

    override fun onShowCustomView(view: View, callback: CustomViewCallback) {
      callback.onCustomViewHidden()
      emit("fullscreen_unavailable")
    }

    // Provider console output can contain private data; do not forward it to app logs.
    override fun onConsoleMessage(message: ConsoleMessage): Boolean = true
  }

  fun background() {
    activeRequested=false
    if (browser != null) { close(); emit("background_closed") }
  }

  fun clearAndClose() {
    activeRequested=false
    browser?.clearCache(true)
    close()
  }

  private fun close() {
    pendingMedia?.deny()
    pendingMedia = null
    mediaAllowed = false
    val web = browser ?: return
    browser = null // Ignore callbacks from the destroyed page.
    web.stopLoading()
    web.onPause()
    web.clearHistory()
    removeView(web)
    web.destroy()
  }

  fun dispose() {
    activeRequested=false
    close()
    disposed = true
  }
}
