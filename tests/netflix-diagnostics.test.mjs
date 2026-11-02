import { test } from 'node:test';
import assert from 'node:assert/strict';
import { netflixStatus, netflixTestMessage, netflixReport, formatPosition } from '../src/netflixDiagnostics.ts';

const ready = {access:'ready', session:'active', state:'playing', positionMs:12000, durationMs:90000,
  canPlay:true, canPause:true, canSeek:true};

test('reported controls do not claim actual Netflix synchronization works', () => {
  assert.match(netflixStatus(ready), /Run the tests/);
  for (const key of ['canPlay','canPause','canSeek']) {
    assert.match(netflixStatus({...ready,[key]:false}), /requirements are missing/);
  }
  assert.match(netflixStatus({...ready,positionMs:null}), /position/);
  assert.match(netflixStatus({...ready,access:'permission_required'}), /controls are off/);
  assert.match(netflixStatus({...ready,session:'ambiguous'}), /More than one/);
  assert.match(netflixStatus({...ready,session:'none'}), /No Netflix player/);
  assert.match(netflixStatus({...ready,access:'connecting'}), /Waiting for Android/);
});

test('state observations, lack of acknowledgment, and command rejection remain distinct', () => {
  assert.match(netflixTestMessage({command:'seek',status:'observed',reason:'state_changed'}), /not two-phone sync/);
  assert.match(netflixTestMessage({command:'pause',status:'not_observed',reason:'no_change'}), /not confirmed/);
  assert.match(netflixTestMessage({command:'play',status:'unavailable',reason:'wrong_state'}), /Pause the movie/);
  assert.match(netflixTestMessage({command:'pause',status:'unavailable',reason:'wrong_state'}), /Start playing/);
  assert.match(netflixTestMessage({command:'seek',status:'cancelled',reason:'cancelled'}), /already sent cannot be undone/);
});

test('diagnostic export strips extra native fields and arbitrary errors', () => {
  const secret = 'private_account_cookie_and_title';
  const extra = {...ready, email:secret, provider_token:secret, title:secret, notification:secret, sessionToken:secret};
  const report = netflixReport(extra, {command:'pause',status:'unavailable',reason:secret,before:extra,after:extra,rawError:secret});
  assert.doesNotMatch(report, /private_account_cookie_and_title|provider_token|sessionToken|rawError|notification/);
  const parsed=JSON.parse(report);
  assert.equal(parsed.automaticSyncVerified, false);
  assert.equal(parsed.snapshot.positionMs, 12000);
  assert.equal(parsed.lastTest.before.canSeek, true);
  assert.match(parsed.lastTest.message, /could not run/);
});

test('position display handles missing and invalid native values', () => {
  for (const value of [null,undefined,NaN,Infinity,-1]) assert.equal(formatPosition(value),'Unavailable');
  assert.equal(formatPosition(0),'0:00');
  assert.equal(formatPosition(73499),'1:13');
});
