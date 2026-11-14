import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { mediaLogTags, safeRuntimeVersions, summarizeOrbitMediaLogs, selectOrbitProcessIds } from './lib/orbit-media-log-summary.mjs';

// Read-only, one authorized USB phone, verified Orbit processes, fixed platform tags.
// No root, global log dump, log clearing, app data, network interception or debug setting changes.
const executable = process.platform === 'win32' ? 'adb.exe' : 'adb';
const sdk = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
const candidates = [process.env.ORBIT_ADB_PATH, sdk && join(sdk, 'platform-tools', executable),
  process.platform === 'win32' && process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, 'Android', 'Sdk', 'platform-tools', executable)].filter(Boolean);
const adb = candidates.find(existsSync) || executable;
function query(args) {
  const r = spawnSync(adb, ['-d', ...args], { encoding: 'utf8', timeout: 15000, maxBuffer: 2 * 1024 * 1024, windowsHide: true });
  return !r.error && r.status === 0 ? r.stdout : null;
}
function stop(status) {
  console.log(JSON.stringify({ diagnostic: 'Orbit bounded Android media log v3', status, rootCauseVerified: false, rawLogsExported: false }, null, 2));
  process.exitCode = 2;
}
if (query(['get-state'])?.trim() !== 'device') {
  stop('one_authorized_usb_phone_required');
} else {
  const pid = query(['shell', 'pidof', 'com.jgoff125.orbit'])?.trim();
  if (!pid || !/^[1-9][0-9]{0,7}$/.test(pid)) stop('open_orbit_on_the_phone');
  else {
    const versions = safeRuntimeVersions(query(['shell', 'dumpsys', 'package', 'com.jgoff125.orbit']), query(['shell', 'dumpsys', 'webviewupdate']));
    const dump = query(['shell', 'dumpsys', 'activity', 'processes', 'com.jgoff125.orbit']);
    const owned = dump === null ? null : selectOrbitProcessIds(dump, pid, versions.webViewProvider);
    if (!owned) stop('process_ownership_not_verified');
    else if (query(['shell', 'pidof', 'com.jgoff125.orbit'])?.trim() !== pid) stop('orbit_process_changed_reproduce_again');
    else {
      const report = summarizeOrbitMediaLogs('', pid);
      report.diagnostic = 'Orbit bounded Android media log v3';
      report.scope = 'recent_verified_orbit_and_webview_process_warnings_and_errors';
      delete report.rendererAndSystemServiceLogsIncluded;
      const coverage = {queriedProcessCount:0,includedRendererProcesses:0,failedProcessCount:0,processSelectionTruncated:owned.truncated};
      for (const process of owned.processes) {
        const logs = query(['logcat', '-b', 'main', '-d', '-t', '2000', '-v', 'brief', '--pid=' + process.pid,
          ...mediaLogTags.map(tag => tag + (tag === 'OrbitBrowserDiag' ? ':I' : ':W')), '*:S']);
        coverage.queriedProcessCount++;
        if (logs === null) {coverage.failedProcessCount++;continue;}
        if (process.kind === 'renderer') coverage.includedRendererProcesses++;
        const part = summarizeOrbitMediaLogs(logs, process.pid);
        if (process.kind === 'main') { report.nativeBrowserEvidence = part.nativeBrowserEvidence; report.previousNativeWindows = part.previousNativeWindows; }
        report.matchingProcessLines += part.matchingProcessLines;
        report.inputTruncated ||= part.inputTruncated;
        for (const key of Object.keys(report.signals)) report.signals[key] = Math.min(255, report.signals[key] + part.signals[key]);
        for (const key of Object.keys(report.observedTags)) report.observedTags[key] = Math.min(255, report.observedTags[key] + part.observedTags[key]);
      }
      report.status = Object.values(report.signals).some(Boolean) || Object.entries(report.nativeBrowserEvidence.signalCounts).some(([key,count])=>count>0 && /^(?:console_|network_|(?:page|resource)_http_|protected_media_denied|permission_request_blocked)/.test(key)) ? 'signals_observed' : 'no_classified_signal';
      if (query(['shell', 'pidof', 'com.jgoff125.orbit'])?.trim() !== pid) stop('orbit_process_changed_reproduce_again');
      else console.log(JSON.stringify({...report,coverage,systemServiceLogsIncluded:false,runtime:versions,rawLogsExported:false},null,2));
    }
  }
}
