// Only fixed error categories leave this parser. Raw messages are never returned.
export const mediaLogTags = ['OrbitBrowserDiag', 'chromium', 'cr_MediaDrmBridge', 'MediaDrmBridge', 'MediaDrm', 'MediaDrm-JNI', 'WVCdm', 'DrmHal', 'CdmHal', 'MediaCodec', 'CCodec', 'ACodec'];
const tags = new Set(mediaLogTags);
const nativeSignalKeys = ["page_started","page_finished","protected_media_requested","protected_media_grant_called","protected_media_denied","protected_media_cancelled","permission_request_blocked","page_http_401","page_http_403","page_http_4xx","page_http_5xx","resource_http_401","resource_http_403","resource_http_4xx","resource_http_5xx","network_dns","network_connect","network_timeout","network_tls","network_other","console_error","console_eme_not_supported","console_media_not_allowed","console_eme_security_error","console_codec_error","console_eme_network_error"];
const categories = [
  ['drm_initialization_failure', /UnsupportedSchemeException|Failed to (?:create|instantiate) (?:MediaDrm(?:Bridge)?|CDM)|Unsupported DRM scheme/i],
  ['drm_provisioning_error', /NotProvisionedException|provisioning (?:request )?failed|Device not provisioned|Failed to get provisioning request|Invalid provision response|failed to provide provision response/i],
  ['drm_server_denial', /DeniedByServerException/],
  ['drm_origin_error', /(?:Failed to set security origin|Security origin .* not supported|Failed to initialize storage for origin)/i],
  ['drm_certificate_error', /Failed to set server certificate/i],
  ['drm_session_error', /Cannot (?:create MediaCrypto|open a new session)|media crypto session is not created/i],
  ['drm_key_request_error', /(?:getKeyRequest.*failed|Failed to getKeyRequest)/i],
  ['drm_key_response_error', /failed to provide key response/i],
  ['drm_state_error', /MediaDrmStateException/],
  ['drm_key_error', /ERROR_DRM_(?:NO_LICENSE|LICENSE_EXPIRED)|No usable (?:decryption )?key/i],
  ['eme_configuration_rejected', /(?:requestMediaKeySystemAccess.*NotSupportedError|NotSupportedError.*requestMediaKeySystemAccess)/],
  ['decoder_error', /MediaCodec\$CodecException|PIPELINE_ERROR_DECODE|DECODER_ERROR_NOT_SUPPORTED|No decoders for requested formats/],
  ['network_tls_error', /net::ERR_(?:CERT_[A-Z_]+|SSL_[A-Z_]+)/],
  ['network_connection_error', /net::ERR_(?:NAME_NOT_RESOLVED|CONNECTION_(?:REFUSED|RESET|CLOSED|TIMED_OUT)|TIMED_OUT|INTERNET_DISCONNECTED|NETWORK_CHANGED)\b/],
];

export function summarizeOrbitMediaLogs(input, pid) {
  if (typeof input !== 'string' || input.length > 2 * 1024 * 1024 || !/^[1-9][0-9]{0,7}$/.test(String(pid))) throw Error('Invalid bounded process-log input.');
  const counts = Object.fromEntries(categories.map(([key]) => [key, 0]));
  const nativeBrowserEvidence = {attemptBoundaryObserved:false,attemptActive:false,signalCounts:Object.fromEntries(nativeSignalKeys.map(key=>[key,0]))};
  const observedTags = Object.fromEntries(mediaLogTags.map(tag => [tag, 0]));
  let nativeAttempt = null;
  let matchingProcessLines = 0, inputTruncated = false, scanned = 0;
  for (const line of input.split(/\r?\n/)) {
    if (++scanned > 4000) { inputTruncated = true; break; }
    if (line.length > 8192) { inputTruncated = true; continue; }
    const match = /^[IWEF]\/([A-Za-z0-9_-]+)\s*\(\s*([1-9][0-9]{0,7})\s*\):\s?(.*)$/.exec(line);
    if (!match || match[2] !== String(pid) || !tags.has(match[1])) continue;
    if (line[0] === 'I' && match[1] !== 'OrbitBrowserDiag') continue;
    matchingProcessLines++;
    if (match[1] === 'OrbitBrowserDiag') {
      const begin = /^begin:([1-9][0-9]{0,5})$/.exec(match[3]);
      const end = /^end:([1-9][0-9]{0,5})$/.exec(match[3]);
      if (begin) {
        nativeAttempt = begin[1]; nativeBrowserEvidence.attemptBoundaryObserved = true; nativeBrowserEvidence.attemptActive = true;
        for (const key of nativeSignalKeys) nativeBrowserEvidence.signalCounts[key] = 0;
      } else if (end && end[1] === nativeAttempt) nativeBrowserEvidence.attemptActive = false;
      else {
        const signal = /^signal:([1-9][0-9]{0,5}):([a-z0-9_]+):([0-9]{1,3})$/.exec(match[3]);
        if (nativeAttempt !== null && signal && signal[1] === nativeAttempt && nativeSignalKeys.includes(signal[2]) && Number(signal[3]) >= 1 && Number(signal[3]) <= 255) nativeBrowserEvidence.signalCounts[signal[2]] = Math.max(nativeBrowserEvidence.signalCounts[signal[2]],Number(signal[3]));
      }
    }
    observedTags[match[1]] = Math.min(255, observedTags[match[1]] + 1);
    for (const [key, pattern] of categories) if (pattern.test(match[3])) counts[key] = Math.min(255, counts[key] + 1);
  }
  return {
    diagnostic: 'Orbit bounded Android media log v1',
    status: Object.values(counts).some(Boolean) || Object.entries(nativeBrowserEvidence.signalCounts).some(([key,count])=>count>0 && /^(?:console_|network_|(?:page|resource)_http_|protected_media_denied|permission_request_blocked)/.test(key)) ? 'signals_observed' : 'no_classified_signal',
    scope: 'recent_orbit_main_process_warnings_and_errors',
    rendererAndSystemServiceLogsIncluded: false,
    matchingProcessLines: Math.min(4000, matchingProcessLines), inputTruncated, observedTags, signals: counts, nativeBrowserEvidence,
    rootCauseVerified: false, netflixAuthorizationVerified: false, automaticSyncVerified: false,
  };
}

export function safeRuntimeVersions(packageDump, webViewDump) {
  const app = typeof packageDump === 'string' ? packageDump : '';
  const web = typeof webViewDump === 'string' ? webViewDump : '';
  const provider = /Current WebView package \(name, version\): \((com\.(?:(?:google\.android\.|android\.)webview|android\.chrome)(?:\.(?:beta|dev|canary))?), ([0-9]{1,4}(?:\.[0-9]{1,6}){1,3})\)/.exec(web);
  return {
    orbitVersion: app.match(/\bversionName=([0-9]{1,4}(?:\.[0-9]{1,6}){2})\b/)?.[1] ?? null,
    orbitVersionCode: app.match(/\bversionCode=([0-9]{1,9})\b/)?.[1] ?? null,
    webViewProvider: provider?.[1] ?? null, webViewVersion: provider?.[2] ?? null,
  };
}


// Process metadata only: require exact package ownership, then the selected WebView provider.
export function selectOrbitProcessIds(dump, mainPid, provider) {
  if (typeof dump !== 'string' || dump.length > 2 * 1024 * 1024 || !/^[1-9][0-9]{0,7}$/.test(String(mainPid))) throw Error('Invalid process ownership input.');
  const found = [];
  for (const record of dump.split(/(?=^\s*\*APP\*)/m)) {
    const header = /^\s*\*APP\* UID [0-9]+ ProcessRecord\{[a-fA-F0-9]+ ([1-9][0-9]{0,7}):([^/\s{}]+)\/[^}]+\}/.exec(record);
    if (!header || !/^\s*packageList=\{com\.jgoff125\.orbit\}\s*$/m.test(record)) continue;
    if (header[1] === String(mainPid) && header[2] === 'com.jgoff125.orbit') found.push({pid:header[1],kind:'main'});
    else {
      const renderer = /^([a-z0-9_.]+):sandboxed_process[0-9]+:org\.chromium\.content\.app\.SandboxedProcessService[0-9]+:[0-9]+$/.exec(header[2]);
      if (renderer && renderer[1] === provider && /^(?:com\.(?:google\.android\.|android\.)webview(?:\.(?:beta|dev|canary))?|com\.android\.chrome(?:\.(?:beta|dev|canary))?)$/.test(provider ?? '')) found.push({pid:header[1],kind:'renderer'});
    }
  }
  if (!found.some(p => p.kind === 'main')) return null;
  const unique = [...new Map(found.map(p => [p.pid,p])).values()];
  return {processes:[...unique.filter(p=>p.kind==='main'),...unique.filter(p=>p.kind==='renderer')].slice(0,4),truncated:unique.length>4};
}
