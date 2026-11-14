package com.jgoff125.orbit.demoprobe;
import android.app.Activity;
import android.app.AlertDialog;
import android.os.Bundle;
import android.webkit.*;
import android.widget.*;
import android.util.Log;
import java.io.ByteArrayInputStream;
public final class DemoActivity extends Activity {
 private String defaultAgent;private androidx.webkit.UserAgentMetadata defaultMetadata;
 private WebView web;private PermissionRequest pending;private AlertDialog dialog;private int consoleErrors=0;
 private static final String ORIGIN="https://shaka-project.github.io";
 private void emit(String key){Log.i("OrbitDemoProbe",key);}
 @Override public void onCreate(Bundle state){super.onCreate(state);
  LinearLayout layout=new LinearLayout(this);layout.setOrientation(LinearLayout.VERTICAL);layout.setPadding(20,48,20,20);setContentView(layout);
  TextView text=new TextView(this);text.setText("Public video control — not Netflix.\nStart with Clear sample, then Widevine sample. This connects to Shaka/Google demo and DRM servers, using mobile data or Wi-Fi. Protected playback may use a device identifier. No account or Netflix sign-in is needed. No page text, cookies or license messages are recorded.");layout.addView(text);
  LinearLayout buttons=new LinearLayout(this);layout.addView(buttons);
  Button clear=new Button(this);clear.setText("Clear sample");buttons.addView(clear);
  Button drm=new Button(this);drm.setText("Widevine sample");buttons.addView(drm);
  Button close=new Button(this);close.setText("Close");buttons.addView(close);close.setOnClickListener(v->finish());
  web=new WebView(this);layout.addView(web,new LinearLayout.LayoutParams(-1,0,1));web.getSettings().setJavaScriptEnabled(true);web.getSettings().setDomStorageEnabled(true);web.getSettings().setGeolocationEnabled(false);web.getSettings().setAllowFileAccess(false);web.getSettings().setAllowContentAccess(false);web.getSettings().setMediaPlaybackRequiresUserGesture(true);web.getSettings().setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);CookieManager.getInstance().setAcceptThirdPartyCookies(web,false);
  web.setWebViewClient(new WebViewClient(){
   @Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest request){return request.isForMainFrame()?!allowedPage(request.getUrl().toString()):!"https".equals(request.getUrl().getScheme());}
   @Override public WebResourceResponse shouldInterceptRequest(WebView view,WebResourceRequest request){if("https".equals(request.getUrl().getScheme()))return null;return new WebResourceResponse("text/plain","UTF-8",403,"Blocked",java.util.Collections.emptyMap(),new ByteArrayInputStream(new byte[0]));}
   @Override public void onPageFinished(WebView view,String url){emit("page_finished");}
   @Override public void onReceivedError(WebView view,WebResourceRequest request,WebResourceError error){emit("network_error");}
   @Override public void onReceivedHttpError(WebView view,WebResourceRequest request,WebResourceResponse response){emit("http_error");}
   @Override public void onReceivedSslError(WebView view,SslErrorHandler handler,android.net.http.SslError error){handler.cancel();emit("tls_error");}
  });
  web.setWebChromeClient(new WebChromeClient(){
   @Override public boolean onConsoleMessage(ConsoleMessage message){if(message.messageLevel()==ConsoleMessage.MessageLevel.ERROR&&consoleErrors<8){consoleErrors++;emit("console_error");}return true;}
   @Override public void onPermissionRequest(PermissionRequest request){
    if(!ORIGIN.equals(request.getOrigin().toString().replaceAll("/$",""))||request.getResources().length!=1||!PermissionRequest.RESOURCE_PROTECTED_MEDIA_ID.equals(request.getResources()[0])){request.deny();emit("permission_blocked");return;}
    clearPending();pending=request;
    dialog=new AlertDialog.Builder(DemoActivity.this).setTitle("Public demo: protected playback").setMessage("Allow Shaka's official demo to use Android protected playback? Android may contact its DRM provisioning service and the public demo license server. No Netflix account is involved.").setPositiveButton("Allow",(d,w)->{if(pending==request){pending=null;request.grant(new String[]{PermissionRequest.RESOURCE_PROTECTED_MEDIA_ID});emit("protected_permission_granted");}}).setNegativeButton("Decline",(d,w)->clearPending()).setOnCancelListener(d->clearPending()).create();dialog.show();
   }
   @Override public void onPermissionRequestCanceled(PermissionRequest request){if(pending==request){pending=null;if(dialog!=null)dialog.dismiss();dialog=null;emit("permission_cancelled");}}
   @Override public boolean onCreateWindow(WebView view,boolean isDialog,boolean gesture,android.os.Message result){emit("popup_blocked");return false;}
  });
  web.getSettings().setSupportMultipleWindows(true);
  defaultAgent=web.getSettings().getUserAgentString();
  try{defaultMetadata=androidx.webkit.WebSettingsCompat.getUserAgentMetadata(web.getSettings());emit("profile_support_ready");}catch(Exception|LinkageError e){emit("profile_unavailable");}
  Button orbitProfile=new Button(this);orbitProfile.setText("Widevine + Orbit desktop settings");orbitProfile.setEnabled(defaultMetadata!=null);layout.addView(orbitProfile,3);orbitProfile.setOnClickListener(v->loadSample(true,true));
  clear.setOnClickListener(v->loadSample(false,false));drm.setOnClickListener(v->loadSample(true,false));
  new android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(()->finish(),600000);
  if(getIntent().getBooleanExtra("verify_profile_only",false)){applyProfile(true);applyProfile(false);}
  emit("screen_ready");
 }
 private boolean allowedPage(String url){try{android.net.Uri uri=android.net.Uri.parse(url);return "https".equals(uri.getScheme())&&"shaka-project.github.io".equals(uri.getHost())&&uri.getPath()!=null&&uri.getPath().startsWith("/shaka-player/demo/");}catch(Exception e){return false;}}
 private void loadSample(boolean protectedSample,boolean desktop){clearPending();if(!applyProfile(desktop))return;consoleErrors=0;emit(protectedSample?"widevine_sample_selected":"clear_sample_selected");String asset="https://storage.googleapis.com/shaka-demo-assets/angel-one"+(protectedSample?"-widevine":"")+"/dash.mpd";String hash="asset="+asset+(protectedSample?";license=https://proxy.uat.widevine.com/proxy":"")+";panel=HOME";web.loadUrl(ORIGIN+"/shaka-player/demo/#"+hash);}
 private boolean applyProfile(boolean desktop){
  try{
   if(!desktop){web.getSettings().setUserAgentString(defaultAgent);if(defaultMetadata!=null)androidx.webkit.WebSettingsCompat.setUserAgentMetadata(web.getSettings(),defaultMetadata);emit("system_profile_applied");return true;}
   if(defaultMetadata==null){emit("profile_unavailable");return false;}
   java.util.regex.Matcher chrome=java.util.regex.Pattern.compile("Chrome/([0-9]+[.][0-9]+[.][0-9]+[.][0-9]+)").matcher(defaultAgent);
   java.util.regex.Matcher kit=java.util.regex.Pattern.compile("AppleWebKit/([0-9]+[.][0-9]+)").matcher(defaultAgent);
   if(!chrome.find()||!kit.find())return false;String version=chrome.group(1);String webkit=kit.group(1);
   androidx.webkit.UserAgentMetadata.BrandVersion brand=new androidx.webkit.UserAgentMetadata.BrandVersion.Builder().setBrand("Chromium").setMajorVersion(version.substring(0,version.indexOf('.'))).setFullVersion(version).build();
   androidx.webkit.UserAgentMetadata.Builder metadata=new androidx.webkit.UserAgentMetadata.Builder().setBrandVersionList(java.util.Collections.singletonList(brand)).setFullVersion(version).setPlatform("Linux").setPlatformVersion("0.0.0").setArchitecture("x86").setModel("").setMobile(false).setBitness(64).setWow64(false);
   if(androidx.webkit.WebViewFeature.isFeatureSupported(androidx.webkit.WebViewFeature.USER_AGENT_METADATA_FORM_FACTORS))metadata.setFormFactors(java.util.Collections.singletonList("Desktop"));
   web.getSettings().setUserAgentString("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/"+webkit+" (KHTML, like Gecko) Chrome/"+version+" Safari/"+webkit);androidx.webkit.WebSettingsCompat.setUserAgentMetadata(web.getSettings(),metadata.build());emit("desktop_profile_applied");return true;
  }catch(Exception|LinkageError e){emit("profile_unavailable");return false;}
 }
 private void clearPending(){if(dialog!=null){dialog.dismiss();dialog=null;}if(pending!=null){PermissionRequest request=pending;pending=null;request.deny();emit("protected_permission_denied");}}
 @Override public void onPause(){super.onPause();clearPending();if(web!=null)web.onPause();}
 @Override public void onResume(){super.onResume();if(web!=null)web.onResume();}
 @Override public void onDestroy(){clearPending();if(web!=null){web.stopLoading();web.destroy();web=null;}super.onDestroy();}
}
