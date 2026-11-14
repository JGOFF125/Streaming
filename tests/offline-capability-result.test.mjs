import test from 'node:test';
import assert from 'node:assert/strict';
import {summarizeProbeResult} from '../tools/webview-capability-probe/result-summary.mjs';

test('probe summary excludes other processes, unknown fields, values and raw diagnostics',()=>{
 const r=summarizeProbeResult(['I/OrbitLocalProbe(123): begin','I/OrbitLocalProbe(123): result:default_eme:supported','I/OrbitLocalProbe(124): result:hardware_eme:supported','I/OtherTag(123): result:complete:yes','I/OrbitLocalProbe(123): result:cookie:private_secret','I/OrbitLocalProbe(123): result:default_media_keys:private_secret','I/OrbitLocalProbe(123): account private_secret'].join('\n'),123);
 assert.deepEqual(r,{default_eme:'supported'});assert.doesNotMatch(JSON.stringify(r),/private|cookie|123|124/);
});
test('probe support and session preparation remain separate, fixed outcomes',()=>{
 const r=summarizeProbeResult(['I/OrbitLocalProbe(123): begin','I/OrbitLocalProbe(123): result:default_eme:supported','I/OrbitLocalProbe(123): result:default_media_keys:not_supported','I/OrbitLocalProbe(123): result:native_drm_session:needs_provisioning','I/OrbitLocalProbe(123): result:complete:yes'].join('\n'),123);
 assert.equal(r.default_eme,'supported');assert.equal(r.default_media_keys,'not_supported');assert.equal(r.native_drm_session,'needs_provisioning');assert.equal(r.complete,'yes');
});
test('probe parser rejects oversized inputs and invalid process selectors',()=>{
 assert.throws(()=>summarizeProbeResult('x'.repeat(524289),123));assert.throws(()=>summarizeProbeResult('',0));assert.throws(()=>summarizeProbeResult('','123 --other'));
});

test('a new probe attempt cannot inherit a prior complete marker or hardware results',()=>{
 const r=summarizeProbeResult(['I/OrbitLocalProbe(123): begin','I/OrbitLocalProbe(123): result:complete:yes','I/OrbitLocalProbe(123): result:hardware_eme:supported','I/OrbitLocalProbe(123): begin','I/OrbitLocalProbe(123): result:local_page_loaded:yes'].join('\n'),123);
 assert.deepEqual(r,{local_page_loaded:'yes'});assert.deepEqual(summarizeProbeResult('I/OrbitLocalProbe(123): result:complete:yes',123),{});
});
