import {summarizeProbeResult} from './result-summary.mjs';
import {spawnSync} from 'node:child_process';
import {writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve,join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const sdk=process.env.ANDROID_HOME||process.env.ANDROID_SDK_ROOT||join(process.env.LOCALAPPDATA||'','Android','Sdk');
const adb=join(sdk,'platform-tools',process.platform==='win32'?'adb.exe':'adb');
if(!existsSync(adb))throw Error('Android SDK platform-tools required.');
function query(args){const r=spawnSync(adb,['-d',...args],{encoding:'utf8',timeout:15000,maxBuffer:524288,windowsHide:true});if(r.status!==0||r.error)throw Error('One authorized USB phone and running probe required.');return r.stdout;}
const pkg='com.jgoff125.orbit.capabilityprobe';
const pid=query(['shell','pidof',pkg]).trim();if(!/^[1-9][0-9]{0,7}$/.test(pid))throw Error('Probe process unavailable.');
const raw=query(['logcat','-b','main','-d','-t','150','-v','brief','--pid='+pid,'OrbitLocalProbe:I','*:S']);
const results=summarizeProbeResult(raw,pid);
if(query(['shell','pidof',pkg]).trim()!==pid)throw Error('Probe process changed.');
const summary={diagnostic:'Orbit offline WebView capability v1',status:results.complete==='yes'?'completed':'incomplete',scope:'isolated_default_webview_no_network',results,networkPermission:false,accountDataRead:false,licenseRequested:false,netflixPlaybackVerified:false,rawLogsSaved:false};
const output=join(root,'.expo/webview-capability-probe');mkdirSync(output,{recursive:true});writeFileSync(join(output,'physical-summary.json'),JSON.stringify(summary,null,2)+'\n');console.log(JSON.stringify(summary,null,2));if(summary.status==='incomplete')process.exitCode=2;
