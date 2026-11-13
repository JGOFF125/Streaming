import { test } from 'node:test';
import assert from 'node:assert/strict';
import { summarizeOrbitMediaLogs, safeRuntimeVersions, selectOrbitProcessIds } from '../scripts/lib/orbit-media-log-summary.mjs';

test('only the selected Orbit process and allowlisted warning/error tags contribute', () => {
  const input = ['E/MediaDrm( 123): NotProvisionedException', 'E/WVCdm(123): DeniedByServerException',
    'E/MediaDrm(999): DeniedByServerException', 'I/MediaDrm(123): NotProvisionedException',
    'E/UnknownTag(123): NotProvisionedException', 'Unprefixed NotProvisionedException',
    'E/chromium(123): net::ERR_CERT_AUTHORITY_INVALID', 'E/MediaCodec(123): PIPELINE_ERROR_DECODE'].join('\n');
  const r = summarizeOrbitMediaLogs(input, 123);
  assert.equal(r.matchingProcessLines, 4);
  assert.equal(r.observedTags.MediaDrm, 1); assert.equal(r.observedTags.WVCdm, 1);
  assert.equal(r.observedTags.chromium, 1); assert.equal(r.observedTags.MediaCodec, 1);
  assert.equal(r.signals.drm_provisioning_error, 1); assert.equal(r.signals.drm_server_denial, 1);
  assert.equal(r.signals.network_tls_error, 1); assert.equal(r.signals.decoder_error, 1);
  assert.equal(r.rootCauseVerified, false); assert.equal(r.netflixAuthorizationVerified, false);
});

test('URLs, messages, account details, identifiers and opaque errors are never exported', () => {
  const secret = 'private_cookie_account_device_value';
  const r = summarizeOrbitMediaLogs('E/chromium(123): net::ERR_NAME_NOT_RESOLVED https://example.invalid/?token=' + secret + '\nE/MediaDrm(123): Unclassified ' + secret, 123);
  assert.equal(r.signals.network_connection_error, 1);
  assert.doesNotMatch(JSON.stringify(r), /private_cookie|example\.invalid|token=|Unclassified|123/);
  assert.equal(r.automaticSyncVerified, false);
});

test('no matching signal is explicitly inconclusive, and counts/input are bounded', () => {
  const none = summarizeOrbitMediaLogs('E/MediaDrm(999): NotProvisionedException', 123);
  assert.equal(none.status, 'no_classified_signal'); assert.equal(none.rendererAndSystemServiceLogsIncluded, false);
  assert.equal(none.rootCauseVerified, false);
  const saturated = summarizeOrbitMediaLogs(Array(300).fill('E/MediaDrm(123): MediaDrmStateException').join('\n'), 123);
  assert.equal(saturated.signals.drm_state_error, 255);
  const oversized = summarizeOrbitMediaLogs('E/MediaDrm(123): ' + 'x'.repeat(8300) + 'NotProvisionedException', 123);
  assert.equal(oversized.inputTruncated, true); assert.equal(oversized.signals.drm_provisioning_error, 0);
  assert.throws(() => summarizeOrbitMediaLogs('x', '123;anything'));
  assert.throws(() => summarizeOrbitMediaLogs('x'.repeat(2 * 1024 * 1024 + 1), 123));
});

test('runtime output retains only bounded app/WebView version fields', () => {
  const r = safeRuntimeVersions('versionCode=13 minSdk=24\nversionName=1.3.6\nprivate_account', 'Current WebView package (name, version): (com.google.android.webview, 157.0.8103.78)\nprivate_device');
  assert.deepEqual(r, { orbitVersion: '1.3.6', orbitVersionCode: '13', webViewProvider: 'com.google.android.webview', webViewVersion: '157.0.8103.78' });
  assert.doesNotMatch(JSON.stringify(r), /private/);
  assert.equal(safeRuntimeVersions(null, 'Current WebView package (name, version): (untrusted.package, private)').webViewProvider, null);
});


test('Chromium 156 bridge messages map to fixed stages without exporting origins or sessions', () => {
  const input = [
    'E/cr_MediaDrmBridge(123): Failed to set security origin https://private.invalid',
    'E/cr_MediaDrmBridge(123): Failed to set server certificate private_certificate',
    'E/cr_MediaDrmBridge(123): Cannot create MediaCrypto Session.',
    'E/cr_MediaDrmBridge(123): getKeyRequest(private_session) failed',
    'E/MediaDrmBridge(123): failed to provide key response private_response',
    'E/cr_MediaDrmBridge(123): Invalid provision response.',
  ].join('\n');
  const r = summarizeOrbitMediaLogs(input, 123);
  for (const key of ['drm_origin_error', 'drm_certificate_error', 'drm_session_error', 'drm_key_request_error', 'drm_key_response_error', 'drm_provisioning_error']) assert.equal(r.signals[key], 1);
  assert.doesNotMatch(JSON.stringify(r), /private|https/); assert.equal(r.rootCauseVerified, false);
});


test('renderer selection requires exact Orbit package ownership and selected provider', () => {
  const record=(pid,name,packages)=>'*APP* UID 10462 ProcessRecord{ab1234 '+pid+':'+name+'/u0a462}\n  packageList={'+packages+'}\n  connection=com.jgoff125.orbit\n';
  const main=record(123,'com.jgoff125.orbit','com.jgoff125.orbit');
  const name='com.google.android.webview:sandboxed_process0:org.chromium.content.app.SandboxedProcessService0:0';
  const dump=main+record(456,name,'com.jgoff125.orbit')+record(789,name,'other.app')+record(222,name.replace('com.google.android.webview','com.android.chrome'),'com.jgoff125.orbit');
  assert.deepEqual(selectOrbitProcessIds(dump,123,'com.google.android.webview'),{processes:[{pid:'123',kind:'main'},{pid:'456',kind:'renderer'}],truncated:false});
  assert.equal(selectOrbitProcessIds(dump,999,'com.google.android.webview'),null);
  assert.deepEqual(selectOrbitProcessIds(dump,123,'unknown.provider').processes,[{pid:'123',kind:'main'}]);
});

test('process selection is bounded, deduplicated and rejects invalid input', () => {
  const main='*APP* UID 10462 ProcessRecord{ab1234 123:com.jgoff125.orbit/u0a462}\n packageList={com.jgoff125.orbit}\n';
  const children=Array.from({length:6},(_,i)=>'*APP* UID 99180 ProcessRecord{ab1234 '+(456+i)+':com.google.android.webview:sandboxed_process'+i+':org.chromium.content.app.SandboxedProcessService'+i+':0/u0a462i180}\n packageList={com.jgoff125.orbit}\n').join('');
  const result=selectOrbitProcessIds(main+main+children,123,'com.google.android.webview');
  assert.equal(result.processes.length,4);assert.equal(result.truncated,true);
  assert.throws(()=>selectOrbitProcessIds('x'.repeat(2*1024*1024+1),123,'com.google.android.webview'));
});


test('native evidence starts at a fixed begin boundary, resets and never accepts raw fields', () => {
  const lines=['I/OrbitBrowserDiag(123): signal:1:console_error:128',
    'I/OrbitBrowserDiag(123): begin:1','I/OrbitBrowserDiag(123): signal:1:protected_media_grant_called:1',
    'I/OrbitBrowserDiag(123): signal:1:console_error:8','I/OrbitBrowserDiag(123): signal:1:private_cookie:1',
    'I/OrbitBrowserDiag(123): signal:1:network_other:999','I/OrbitBrowserDiag(123): private_url_cookie',
    'I/OrbitBrowserDiag(999): signal:1:console_error:128','I/OrbitBrowserDiag(123): signal:2:console_error:128','I/OrbitBrowserDiag(123): end:2'];
  const r=summarizeOrbitMediaLogs(lines.join('\n'),123);
  assert.equal(r.nativeBrowserEvidence.attemptBoundaryObserved,true);assert.equal(r.nativeBrowserEvidence.attemptActive,true);
  assert.equal(r.status,'signals_observed');
  assert.equal(r.nativeBrowserEvidence.signalCounts.console_error,8);assert.equal(r.nativeBrowserEvidence.signalCounts.protected_media_grant_called,1);
  assert.equal(r.nativeBrowserEvidence.signalCounts.network_other,0);
  assert.doesNotMatch(JSON.stringify(r),/private_cookie|private_url|999/);
  const reset=summarizeOrbitMediaLogs([...lines,'I/OrbitBrowserDiag(123): begin:1','I/OrbitBrowserDiag(123): end:1'].join('\n'),123);
  assert.equal(reset.nativeBrowserEvidence.signalCounts.console_error,0);assert.equal(reset.nativeBrowserEvidence.attemptActive,false);
});
