import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PlaybackSynchronizer, parsePlaybackEnvelope, MAX_POSITION_MS } from '../src/playbackSync.ts';
const room='room-a';
const time={sentAtMs:1000, receivedAtMs:1200, nowMs:1200};
const snapshot=(patch={})=>({room_id:room,server_time_ms:1700000000000,timeline:{
 content_id:'80012345',playing:false,position_ms:20000,anchor_time_ms:1700000000000,revision:1,...patch}});
const player=(patch={})=>({contentId:'80012345',state:'playing',positionMs:0,canPlay:true,canPause:true,canSeek:true,...patch});

test('paused host timeline pauses, seeks and restores pause on a simulated follower',()=>{
 const plan=new PlaybackSynchronizer(room).evaluate(snapshot(),time,player());
 assert.equal(plan.status,'apply');assert.deepEqual(plan.actions,[{type:'pause'},{type:'seek',positionMs:20000},{type:'pause'}]);
});
test('play seeks before resuming and compensates for network transit using a monotonic clock',()=>{
 const plan=new PlaybackSynchronizer(room).evaluate(snapshot({playing:true}),time,player({state:'paused'}));
 assert.deepEqual(plan.actions,[{type:'seek',positionMs:20100},{type:'play'}]);
 // The second device has an entirely different uptime but receives the same server time.
 const other=new PlaybackSynchronizer(room).evaluate(snapshot({playing:true}),
  {sentAtMs:80001000,receivedAtMs:80001200,nowMs:80001200},player({state:'paused'}));
 assert.deepEqual(other.actions,plan.actions);
});
test('small drift does not generate repeated seeks',()=>{
 const sync=new PlaybackSynchronizer(room);
 assert.equal(sync.evaluate(snapshot({playing:true}),time,player({positionMs:21000})).status,'aligned');
 assert.equal(sync.evaluate(snapshot({playing:true}),time,player({positionMs:21600})).status,'aligned');
});
test('wrong or unidentified content, buffering and unsupported controls generate no commands',()=>{
 for(const [p,reason] of [
  [player({contentId:null}),'content_mismatch'],[player({contentId:'90011111'}),'content_mismatch'],
  [player({state:'buffering'}),'buffering'],[player({state:'unknown'}),'player_state_unknown'],
  [player({positionMs:null}),'position_unavailable'],[player({positionMs:NaN}),'position_unavailable'],
  [player({canSeek:false}),'control_unsupported'],[player({canPause:false}),'control_unsupported'],
 ]){const plan=new PlaybackSynchronizer(room).evaluate(snapshot(),time,p);assert.equal(plan.reason,reason);assert.deepEqual(plan.actions,[]);}
});
test('stale, inverted, nonfinite and suspended clock samples are refused',()=>{
 for(const timing of [
  {sentAtMs:0,receivedAtMs:3000,nowMs:3000}, {sentAtMs:2000,receivedAtMs:1000,nowMs:2000},
  {...time,nowMs:11201}, {...time,nowMs:1199}, {...time,sentAtMs:NaN}, {...time,receivedAtMs:Infinity},
 ]) assert.equal(new PlaybackSynchronizer(room).evaluate(snapshot(),timing,player()).reason,'clock_sample_unusable');
});
test('reordered responses and conflicting payloads cannot undo newer host commands',()=>{
 const sync=new PlaybackSynchronizer(room);sync.evaluate(snapshot({revision:2}),time,player());
 assert.equal(sync.evaluate(snapshot({revision:1}),time,player()).reason,'stale_revision');
 assert.equal(sync.evaluate(snapshot({revision:2,position_ms:90000}),time,player()).reason,'revision_conflict');
});
test('the cooldown avoids feedback loops but a new host revision can interrupt it',()=>{
 const sync=new PlaybackSynchronizer(room);
 assert.equal(sync.evaluate(snapshot(),time,player()).status,'apply');
 assert.equal(sync.evaluate(snapshot(),{...time,nowMs:1500},player()).status,'cooldown');
 assert.equal(sync.evaluate(snapshot(),{...time,nowMs:4300},player()).status,'apply');
 assert.equal(sync.evaluate(snapshot({playing:true,revision:2}),{...time,nowMs:4400},player()).status,'apply');
});
test('a current null timeline and responses for another room never issue commands',()=>{
 const sync=new PlaybackSynchronizer(room);
 assert.equal(sync.evaluate({...snapshot(),timeline:null},time,player()).reason,'no_timeline');
 assert.equal(sync.evaluate({...snapshot(),room_id:'room-b'},time,player()).reason,'invalid_snapshot');
});
test('malformed or credential-bearing payloads are rejected without echoing values',()=>{
 const secret='https://example.test/?token=private';
 const bad=[null,[],{}, {...snapshot(),server_time_ms:'1700000000000'},
  snapshot({content_id:secret}),snapshot({playing:'false'}),snapshot({position_ms:-1}),
  snapshot({position_ms:Infinity}),snapshot({position_ms:MAX_POSITION_MS+1}),
  snapshot({anchor_time_ms:1700000000001}),snapshot({revision:0}),snapshot({revision:Number.MAX_SAFE_INTEGER+1})];
 for(const value of bad)assert.throws(()=>parsePlaybackEnvelope(value,room),{message:'Invalid playback response.'});
 assert.doesNotMatch(new PlaybackSynchronizer(room).evaluate(snapshot({content_id:secret}),time,player()).reason,/private|token/);
});
test('projected positions are bounded by the timeline position limit',()=>{
 const plan=new PlaybackSynchronizer(room).evaluate(snapshot({playing:true,position_ms:MAX_POSITION_MS-10}),time,player());
 assert.deepEqual(plan.actions,[{type:'seek',positionMs:MAX_POSITION_MS}]);
});

test('a seek that resumes a paused follower is followed by a restoring pause',()=>{
 const plan=new PlaybackSynchronizer(room).evaluate(snapshot(),time,player({state:'paused'}));
 const fake={state:'paused',positionMs:0};
 for(const action of plan.actions){
  if(action.type==='seek'){fake.positionMs=action.positionMs;fake.state='playing';}
  if(action.type==='pause')fake.state='paused';
 }
 assert.equal(fake.positionMs,20000);
 assert.equal(fake.state,'paused');
});

test('a paused seek is refused when pause cannot be restored',()=>{
 const plan=new PlaybackSynchronizer(room).evaluate(snapshot(),time,player({state:'paused',canPause:false}));
 assert.equal(plan.reason,'control_unsupported');
 assert.deepEqual(plan.actions,[]);
});
