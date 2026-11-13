import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compareNetflixLabels, netflixStatus, netflixTestMessage, netflixReport, formatPosition } from '../src/netflixDiagnostics.ts';

const ready = {access:'ready', session:'active', state:'playing', positionMs:12000, durationMs:90000,
  canPlay:true, canPause:true, canSeek:true, contentId:'80012345'};

test('reported controls do not claim actual Netflix synchronization works', () => {
  assert.match(netflixStatus(ready), /Run the tests/);
  for (const key of ['canPlay','canPause','canSeek']) {
    assert.match(netflixStatus({...ready,[key]:false}), /requirements are missing/);
  }
  assert.match(netflixStatus({...ready,positionMs:null}), /position/);
  assert.match(netflixStatus({...ready,contentId:null}), /catalog ID/);
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
  const extra = {...ready, email:secret, provider_token:secret, title:secret, contentId:secret, notification:secret, sessionToken:secret};
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

test('identity diagnostics retain only fixed source labels and presence flags', () => {
  const good = JSON.parse(netflixReport({...ready,identitySource:'media_uri_watch_url',mediaIdPresent:false,mediaUriPresent:true}, null));
  assert.equal(good.snapshot.identitySource,'media_uri_watch_url');
  assert.equal(good.snapshot.mediaUriPresent,true);
  assert.equal(good.snapshot.mediaIdPresent,false);
  const secret='private_metadata_url_or_token';
  const bad=netflixReport({...ready,identitySource:secret,mediaIdPresent:secret,mediaUriPresent:secret,mediaUri:secret},null);
  assert.doesNotMatch(bad,/private_metadata_url_or_token/);
  assert.equal(JSON.parse(bad).snapshot.identitySource,'unavailable');
  assert.equal(JSON.parse(bad).snapshot.mediaIdPresent,false);
});


test('display evidence never exports raw titles, episode details, or arbitrary fields', () => {
  const secret='private_display_label_value';
  const snapshot={...ready,contentId:null,displayMetadata:{titleLabel:secret,subtitleLabel:secret,descriptionLabel:secret,
    titleSource:'display_title',titlePresent:true,displayTitlePresent:true,subtitlePresent:true,descriptionPresent:true,custom:secret}};
  const report=netflixReport(snapshot,{command:'pause',status:'observed',reason:'state_changed',before:snapshot,after:snapshot},
    {available:true,titleChanged:true,subtitleChanged:false,descriptionChanged:true,rawLabel:secret});
  assert.doesNotMatch(report,/private_display_label_value|titleLabel|subtitleLabel|descriptionLabel|rawLabel|custom/);
  const parsed=JSON.parse(report);
  assert.equal(parsed.snapshot.contentId,null);
  assert.equal(parsed.automaticMovieIdentificationVerified,false);
  assert.equal(parsed.snapshot.displayEvidence.titleSource,'display_title');
  assert.equal(parsed.lastTest.before.displayEvidence.subtitlePresent,true);
  assert.deepEqual(parsed.labelComparison,{available:true,titleChanged:true,subtitleChanged:false,descriptionChanged:true,standardTitleChanged:false});
});


test('label comparisons distinguish episodes without inventing catalog identity', () => {
  const first={titleLabel:'Fictional series',subtitleLabel:'Episode one',descriptionLabel:null};
  assert.deepEqual(compareNetflixLabels(first,{...first}),{available:true,standardTitleChanged:false,titleChanged:false,subtitleChanged:false,descriptionChanged:false});
  assert.deepEqual(compareNetflixLabels(first,{...first,subtitleLabel:'Episode two'}),{available:true,standardTitleChanged:false,titleChanged:false,subtitleChanged:true,descriptionChanged:false});
  assert.equal(compareNetflixLabels(first,{...first,titleLabel:'Different movie'}).titleChanged,true);
  assert.deepEqual(compareNetflixLabels(first,null),{available:false,standardTitleChanged:false,titleChanged:false,subtitleChanged:false,descriptionChanged:false});
  assert.equal(compareNetflixLabels(first,{titleLabel:''}).available,false);
});


test('active-queue evidence exports only bounded candidates and fixed flags', () => {
  const secret='private_queue_url_token_and_title';
  const queueEvidence={status:'candidate',candidateContentId:'80012345',mediaIdPresent:false,mediaUriPresent:true,
    mediaUri:secret,title:secret,queueKey:secret};
  const snapshot={...ready,contentId:null,queueEvidence};
  const report=netflixReport(snapshot,{command:'pause',status:'observed',reason:'state_changed',before:snapshot,after:snapshot});
  assert.doesNotMatch(report,/private_queue_url_token_and_title|queueKey|mediaUri"|title"/);
  const parsed=JSON.parse(report);
  assert.deepEqual(parsed.snapshot.queueEvidence,{status:'candidate',candidateContentId:'80012345',mediaIdPresent:false,mediaUriPresent:true});
  assert.equal(parsed.snapshot.contentId,null);
  assert.equal(parsed.lastTest.before.queueEvidence.candidateContentId,'80012345');
  assert.equal(parsed.automaticMovieIdentificationVerified,false);
  assert.equal(parsed.automaticSyncVerified,false);
});

test('queue diagnostics reject opaque candidates and suppress conflicted identities', () => {
  const secret='private_queue_value';
  for (const candidate of [secret,'0','00123','1234567890123',123]) {
    const parsed=JSON.parse(netflixReport({...ready,queueEvidence:{status:'candidate',candidateContentId:candidate,mediaIdPresent:secret}},null));
    assert.equal(parsed.snapshot.queueEvidence.candidateContentId,null);
    assert.equal(parsed.snapshot.queueEvidence.mediaIdPresent,false);
  }
  for (const status of ['conflicting_fields','metadata_conflict','active_item_changed','ambiguous_active_item',secret]) {
    const report=netflixReport({...ready,queueEvidence:{status,candidateContentId:'80012345',mediaUri:secret}},null);
    assert.doesNotMatch(report,/private_queue_value/);
    const parsed=JSON.parse(report);
    assert.equal(parsed.snapshot.queueEvidence.candidateContentId,null);
    assert.equal(parsed.snapshot.queueEvidence.status,status===secret?'unavailable':status);
  }
  assert.equal(JSON.parse(netflixReport(ready,null)).snapshot.queueEvidence,null);
});


test('alternate provider titles remain local while equality and changes are exportable', () => {
  const secret='private_alternate_title';
  const first={titleLabel:'Episode one',standardTitleLabel:secret,subtitleLabel:'S1 E1'};
  const second={titleLabel:'Episode two',standardTitleLabel:secret,subtitleLabel:'S1 E2'};
  const comparison=compareNetflixLabels(first,second);
  assert.equal(comparison.titleChanged,true);
  assert.equal(comparison.standardTitleChanged,false);
  assert.equal(compareNetflixLabels(first,{...second,standardTitleLabel:'Other series'}).standardTitleChanged,true);
  const snapshot={...ready,displayMetadata:first};
  const report=netflixReport(snapshot,{command:'pause',status:'observed',reason:'state_changed',before:snapshot,after:snapshot},comparison);
  assert.doesNotMatch(report,/private_alternate_title|standardTitleLabel/);
  const parsed=JSON.parse(report);
  assert.equal(parsed.snapshot.displayEvidence.usableStandardTitlePresent,true);
  assert.equal(parsed.snapshot.displayEvidence.standardTitleMatchesPrimary,false);
  assert.equal(parsed.lastTest.before.displayEvidence.standardTitleMatchesPrimary,false);
  assert.equal(parsed.labelComparison.standardTitleChanged,false);
  assert.equal(parsed.diagnostic,'Orbit Netflix controls v3');
  assert.equal(JSON.parse(netflixReport({...ready,displayMetadata:{titleLabel:secret,standardTitleLabel:secret}},null)).snapshot.displayEvidence.standardTitleMatchesPrimary,true);
  assert.equal(JSON.parse(netflixReport({...ready,displayMetadata:{titleLabel:'Episode'}},null)).snapshot.displayEvidence.standardTitleMatchesPrimary,null);
});
