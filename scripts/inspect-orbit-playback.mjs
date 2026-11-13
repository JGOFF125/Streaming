import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { mediaLogTags, safeRuntimeVersions, summarizeOrbitMediaLogs } from './lib/orbit-media-log-summary.mjs';

// Read-only, one authorized USB phone, one Orbit process, fixed platform tags.
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
  console.log(JSON.stringify({ diagnostic: 'Orbit bounded Android media log v1', status, rootCauseVerified: false, rawLogsExported: false }, null, 2));
  process.exitCode = 2;
}
if (query(['get-state'])?.trim() !== 'device') {
  stop('one_authorized_usb_phone_required');
} else {
  const pid = query(['shell', 'pidof', 'com.jgoff125.orbit'])?.trim();
  if (!pid || !/^[1-9][0-9]{0,7}$/.test(pid)) stop('open_orbit_on_the_phone');
  else {
    const logs = query(['logcat', '-b', 'main', '-d', '-t', '2000', '-v', 'brief', '--pid=' + pid,
      ...mediaLogTags.map(tag => tag + ':W'), '*:S']);
    if (logs === null) stop('bounded_process_log_read_failed');
    else {
      const versions = safeRuntimeVersions(query(['shell', 'dumpsys', 'package', 'com.jgoff125.orbit']), query(['shell', 'dumpsys', 'webviewupdate']));
      console.log(JSON.stringify({ ...summarizeOrbitMediaLogs(logs, pid), runtime: versions, rawLogsExported: false }, null, 2));
    }
  }
}
