// Strictly fixed results from the isolated probe; never return raw log text or IDs.
export function summarizeProbeResult(raw,pid){
 if(typeof raw!=='string'||raw.length>524288||!/^[1-9][0-9]{0,7}$/.test(String(pid)))throw Error('Invalid bounded probe input.');
const allowed=new Set(['native_drm_session','native_widevine_mp4','native_widevine_hw','native_h264_decoder','native_h264_secure_decoder','secure_context','eme_api','mse_api','h264_mse','aac_mse','restricted_eme','default_eme','software_crypto_eme','software_decode_eme','hardware_eme','default_media_keys','complete','protected_permission','probe_load','hardware_accelerated','probe_timeout','local_page_loaded','local_page_error','local_asset_served','local_script_error']);
const values=new Set(['yes','no','supported','not_supported','not_allowed','security_error','timeout','other_error','unavailable','created','granted','denied','opened','needs_provisioning','resource_busy']);let results={};let boundary=false;
for(const line of raw.split(/\r?\n/)){
 const event=/^I\/OrbitLocalProbe\s*\(\s*([1-9][0-9]{0,7})\): (.*)$/.exec(line);
 if(!event||event[1]!==String(pid))continue;
 if(event[2]==='begin'){results={};boundary=true;continue;}
 if(!boundary)continue;
 const result=/^result:([a-z_0-9]+):([a-z_]+)$/.exec(event[2]);
 if(result&&allowed.has(result[1])&&values.has(result[2]))results[result[1]]=result[2];
}

 return results;
}
