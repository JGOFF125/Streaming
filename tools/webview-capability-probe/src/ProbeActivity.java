package com.jgoff125.orbit.capabilityprobe;
import android.app.Activity;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.webkit.*;
import android.media.MediaDrm;
import android.media.MediaCodecInfo;
import android.media.MediaCodecList;
import android.util.Log;
import java.io.ByteArrayInputStream;
import java.util.UUID;
import java.util.Set;
import java.util.HashSet;
import java.util.Arrays;
public final class ProbeActivity extends Activity {
 private WebView web;
 private final Set<String> seen=new HashSet<>();
 private static final String TAG="OrbitLocalProbe";
 private static final String ORIGIN="https://appassets.androidplatform.net";
 private static final Set<String> KEYS=new HashSet<>(Arrays.asList("secure_context","eme_api","mse_api","h264_mse","aac_mse","restricted_eme","default_eme","software_crypto_eme","software_decode_eme","hardware_eme","default_media_keys","complete"));
 private static final Set<String> VALUES=new HashSet<>(Arrays.asList("yes","no","supported","not_supported","not_allowed","security_error","timeout","other_error","unavailable","created"));
 private void emit(String key,String value){Log.i(TAG,"result:"+key+":"+value);}
 @Override public void onCreate(Bundle state){super.onCreate(state);Log.i(TAG,"begin");
  UUID widevine=UUID.fromString("edef8ba9-79d6-4ace-a3c8-27dcd51d21ed");
  try{emit("native_widevine_mp4",MediaDrm.isCryptoSchemeSupported(widevine,"video/mp4")?"yes":"no");
   emit("native_widevine_hw",MediaDrm.isCryptoSchemeSupported(widevine,"video/mp4",MediaDrm.SECURITY_LEVEL_HW_SECURE_ALL)?"yes":"no");
  }catch(Exception e){emit("native_widevine_mp4","other_error");}
  try(MediaDrm drm=new MediaDrm(widevine)){byte[] session=drm.openSession();try{emit("native_drm_session","opened");}finally{drm.closeSession(session);}}
  catch(android.media.NotProvisionedException e){emit("native_drm_session","needs_provisioning");}
  catch(android.media.ResourceBusyException e){emit("native_drm_session","resource_busy");}
  catch(Exception e){emit("native_drm_session","other_error");}
  boolean h264=false,secure=false;
  try{for(MediaCodecInfo info:new MediaCodecList(MediaCodecList.ALL_CODECS).getCodecInfos())if(!info.isEncoder())for(String type:info.getSupportedTypes())if(type.equalsIgnoreCase("video/avc")){h264=true;secure|=info.getCapabilitiesForType(type).isFeatureSupported(MediaCodecInfo.CodecCapabilities.FEATURE_SecurePlayback);}
   emit("native_h264_decoder",h264?"yes":"no");emit("native_h264_secure_decoder",secure?"yes":"no");
  }catch(Exception e){emit("native_h264_decoder","other_error");}
  web=new WebView(this);setContentView(web);
  web.getSettings().setJavaScriptEnabled(true);web.getSettings().setDomStorageEnabled(true);web.getSettings().setAllowFileAccess(false);web.getSettings().setAllowContentAccess(false);web.getSettings().setBlockNetworkLoads(true);web.getSettings().setMediaPlaybackRequiresUserGesture(true);web.getSettings().setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
  CookieManager.getInstance().setAcceptCookie(false);
  web.setWebViewClient(new WebViewClient(){
   @Override public void onPageFinished(WebView view,String url){emit("local_page_loaded","yes");}
   @Override public void onReceivedError(WebView view,WebResourceRequest request,WebResourceError error){emit("local_page_error","yes");}
   @Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest request){return true;}
   @Override public WebResourceResponse shouldInterceptRequest(WebView view,WebResourceRequest request){if(request.isForMainFrame() && request.getUrl().toString().equals(ORIGIN+"/probe/")){try{emit("local_asset_served","yes");return new WebResourceResponse("text/html","UTF-8",getAssets().open("probe.html"));}catch(Exception e){emit("probe_load","other_error");}}return new WebResourceResponse("text/plain","UTF-8",403,"Offline",java.util.Collections.emptyMap(),new ByteArrayInputStream(new byte[0]));}
  });
  web.setWebChromeClient(new WebChromeClient(){
   @Override public boolean onConsoleMessage(ConsoleMessage message){String value=message.message();if(message.messageLevel()==ConsoleMessage.MessageLevel.ERROR)emit("local_script_error","yes");if(value==null||value.length()>160)return true;
    String[] parts=value.split(":",-1);if(parts.length==3&&parts[0].equals("ORBIT_PROBE")&&KEYS.contains(parts[1])&&VALUES.contains(parts[2])&&seen.add(parts[1])){emit(parts[1],parts[2]);if(parts[1].equals("complete"))new Handler(Looper.getMainLooper()).postDelayed(()->finish(),3000);}return true;}
   @Override public void onPermissionRequest(PermissionRequest request){String[] resources=request.getResources();if(ORIGIN.equals(request.getOrigin().toString().replaceAll("/$",""))&&resources.length==1&&resources[0].equals(PermissionRequest.RESOURCE_PROTECTED_MEDIA_ID)){request.grant(new String[]{PermissionRequest.RESOURCE_PROTECTED_MEDIA_ID});emit("protected_permission","granted");}else{request.deny();emit("protected_permission","denied");}}
  });
  web.loadUrl(ORIGIN+"/probe/");
  web.post(()->emit("hardware_accelerated",web.isHardwareAccelerated()?"yes":"no"));
  new Handler(Looper.getMainLooper()).postDelayed(()->{if(!isFinishing()){emit("probe_timeout","yes");finish();}},40000);
 }
 @Override public void onDestroy(){if(web!=null){web.stopLoading();web.destroy();web=null;}super.onDestroy();}
}
