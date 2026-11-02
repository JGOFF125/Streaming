import { test } from 'node:test';
import assert from 'node:assert/strict';
import { netflixContentId, netflixSyncMessage, playbackErrorMessage, readPlayback } from '../src/playbackClient.ts';
const reply={room_id:'room',server_time_ms:1700000000000,timeline:{content_id:'80012345',playing:false,position_ms:10000,anchor_time_ms:1700000000000,revision:1}};

test('catalog parsing accepts only numeric IDs or official Netflix watch/title links',()=>{
 for(const [input,expected] of [['80012345','80012345'],[' 80012345 ','80012345'],
  ['https://www.netflix.com/title/80012345?trkid=123&s=a','80012345'],['https://netflix.com/watch/80012345/','80012345']])assert.equal(netflixContentId(input),expected);
 for(const input of ['0','080012345','8001234567890','not-an-id','https://netflix.com.evil.test/title/80012345',
  'http://netflix.com/title/80012345','https://user:password@netflix.com/title/80012345','https://netflix.com:8443/title/80012345',
  'https://netflix.com/login?next=/watch/80012345','file:///watch/80012345','https://netflix.com/watch/80012345/extra'])assert.equal(netflixContentId(input),null,input);
});
test('room reads bind the server response to the expected room and monotonic request interval',async()=>{
 const calls=[];let clock=1000;const result=await readPlayback(async(name,args)=>{calls.push({name,args});clock=1200;return{data:reply,error:null}},'room',()=>clock);
 assert.deepEqual(calls,[{name:'orbit_get_playback',args:{p_room_id:'room'}}]);
 assert.equal(result.sentAtMs,1000);assert.equal(result.receivedAtMs,1200);assert.equal(result.envelope.timeline.contentId,'80012345');
 await assert.rejects(readPlayback(async()=>({data:reply,error:null}),'different-room'),/could not be verified/);
});
test('backend failures and rejected requests never echo credentials or raw error details',async()=>{
 const secret='sensitive-token-body';
 for(const code of ['PGRST202','42501','PGRST301','unknown']){
  await assert.rejects(readPlayback(async()=>({data:null,error:{code,message:secret}}),'room'),error=>!error.message.includes(secret));
 }
 await assert.rejects(readPlayback(async()=>{throw Error(secret)},'room'),error=>!error.message.includes(secret));
 assert.match(playbackErrorMessage({code:'PGRST202'}),/setup/);assert.match(playbackErrorMessage({code:'42501'}),/access was lost/);
});
test('one-minute test results do not claim successful automatic Netflix support',()=>{
 for(const reason of ['completed','identity_unavailable','no_ack','unauthorized','connection_failed','unknown-secret']){
  const message=netflixSyncMessage({reason,reads:1,published:1,commands:1,durationMs:60000});assert.doesNotMatch(message,/unknown-secret/);
 }
 assert.match(netflixSyncMessage({reason:'completed'}),/adjustments have stopped/);
 assert.match(netflixSyncMessage({reason:'identity_unavailable'}),/blocked/);
 assert.match(netflixSyncMessage({reason:'no_ack'}),/did not acknowledge/);
 assert.match(netflixSyncMessage({reason:'connection_failed'}),/will not replay cached/);
});
