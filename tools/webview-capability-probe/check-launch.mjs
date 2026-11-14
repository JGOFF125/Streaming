import {spawnSync} from 'node:child_process';
import {writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve,join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const sdk=process.env.ANDROID_HOME||process.env.ANDROID_SDK_ROOT||join(process.env.LOCALAPPDATA||'','Android','Sdk');
const adb=join(sdk,'platform-tools',process.platform==='win32'?'adb.exe':'adb');
if(!existsSync(adb))throw Error('Android SDK platform-tools required.');
function query(args){const r=spawnSync(adb,['-d',...args],{encoding:'utf8',timeout:15000,maxBuffer:524288,windowsHide:true});return !r.error&&r.status===0?r.stdout:null;}
const pkg='com.jgoff125.orbit.demoprobe';
if(query(['get-state'])?.trim()!=='device')throw Error('One authorized USB phone required.');
const policy=query(['shell','dumpsys','window','policy'])||'';
if(/(?:^|\n)\s*showing=true(?:\s|$)|\bmShowingLockscreen=true/.test(policy)){
 const output=join(root,'.expo/webview-demo-probe');mkdirSync(output,{recursive:true});
 const result={diagnostic:'Orbit public-demo launch check',status:'unlock_phone',sampleRequestedByCheck:false,rawLogsSaved:false,netflixPlaybackVerified:false};
 writeFileSync(join(output,'launch-check.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));process.exit(2);
}
// Restart only this account-free diagnostic. Do not touch Orbit or provider processes.
if(query(['shell','am','force-stop',pkg])===null)throw Error('Could not restart the diagnostic.');
const started=query(['shell','am','start','-W','-n',pkg+'/.DemoActivity','--ez','verify_profile_only','true'])!==null;
await new Promise(resolve=>setTimeout(resolve,2000));
const pid=query(['shell','pidof',pkg])?.trim();
let screenReady=false,profileReady=false,desktopApplied=false,systemRestored=false;
if(pid&&/^[1-9][0-9]{0,7}$/.test(pid)){
 const raw=query(['logcat','-b','main','-d','-t','150','-v','brief','--pid='+pid,'OrbitDemoProbe:I','*:S'])||'';
 for(const line of raw.split(/\r?\n/)){
  const event=/^I\/OrbitDemoProbe\s*\(\s*([1-9][0-9]{0,7})\): ([a-z_]+)$/.exec(line);
  if(!event||event[1]!==pid)continue;
  screenReady ||= event[2]==='screen_ready';profileReady ||= event[2]==='profile_support_ready';
  desktopApplied ||= event[2]==='desktop_profile_applied';systemRestored ||= event[2]==='system_profile_applied';
 }
}
await new Promise(resolve=>setTimeout(resolve,2000));
const processStayedAlive=Boolean(pid&&query(['shell','pidof',pkg])?.trim()===pid);
const result={diagnostic:'Orbit public-demo launch check',status:started&&screenReady&&profileReady&&desktopApplied&&systemRestored&&processStayedAlive?'ready':'not_ready',screenReady,profileReady,desktopApplied,systemRestored,processStayedAlive,sampleRequestedByCheck:false,rawLogsSaved:false,netflixPlaybackVerified:false};
const output=join(root,'.expo/webview-demo-probe');mkdirSync(output,{recursive:true});writeFileSync(join(output,'launch-check.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));if(result.status!=='ready')process.exitCode=2;
