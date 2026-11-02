import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

// Verify the merged APK, rather than assuming app.json removed library grants.
const apk = process.argv[2];
if (!apk || !existsSync(apk)) {
  console.error('Usage: node scripts/check-apk-permissions.mjs <Orbit.apk> (AAPT_PATH can select aapt)');
  process.exit(2);
}
const sdk = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
const aapt = process.env.AAPT_PATH || (sdk ? join(sdk, 'build-tools', '36.0.0', process.platform === 'win32' ? 'aapt.exe' : 'aapt') : 'aapt');
const result = spawnSync(aapt, ['dump', 'permissions', resolve(apk)], {
  encoding: 'utf8', timeout: 15000, maxBuffer: 2 * 1024 * 1024,
});
if (result.error || result.status !== 0) {
  console.error('Could not inspect the APK. Set AAPT_PATH to the Android SDK aapt executable.');
  process.exit(2);
}
const packageName = result.stdout.match(/^package: (\S+)/m)?.[1];
const permissions = [...result.stdout.matchAll(/^uses-permission(?:-sdk-\d+)?: name='([^']+)'/gm)].map(match => match[1]);
if (packageName !== 'com.jgoff125.orbit' || !permissions.includes('android.permission.INTERNET')) {
  console.error('Unexpected package or missing expected permission records.');
  process.exit(2);
}
const allowed = new Set(['android.permission.INTERNET', packageName + '.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION']);
const unexpected = permissions.filter(permission => !allowed.has(permission));
console.log(JSON.stringify({
  packageName, declaredPermissions: permissions, unexpectedPermissions: unexpected,
  passed: unexpected.length === 0,
  notificationAccess: 'Separate broad optional Android grant; this check does not remove or narrow it.',
}, null, 2));
process.exitCode = unexpected.length ? 1 : 0;
