import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { PlaybackSynchronizer } from '../src/playbackSync.ts';

test('playback timeline enforces the room host and current membership in PostgreSQL',async t=>{
 const db=new PGlite();
 const ids=Array.from({length:4},(_,i)=>'00000000-0000-4000-8000-'+String(i+1).padStart(12,'0'));
 const [host,guest,outsider,unapproved]=ids;
 async function asUser(id,sql,params=[],role='authenticated'){
  await db.exec('set role '+role);
  try{await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id??'']);return await db.query(sql,params);}
  finally{await db.exec('reset role');}
 }
 const rpc=async(id,name,args=[],role='authenticated')=>(await asUser(id,'select public.'+name+'('+args.map((_,i)=>'$'+(i+1)).join(',')+') as result',args,role)).rows[0].result;
 try{
  await db.exec(`create role anon nologin;create role authenticated nologin;create schema auth;
   create table auth.users(id uuid primary key);
   create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid;$$;
   grant usage on schema auth to authenticated,anon;grant execute on function auth.uid() to authenticated,anon;`);
  for(const path of ['202610190001_private_rooms.sql','202611020002_playback_timeline.sql'])
   await db.exec(await readFile(new URL('../supabase/migrations/'+path,import.meta.url),'utf8'));
  for(const id of ids)await db.query('insert into auth.users values($1)',[id]);
  for(const id of ids.slice(0,3))await db.query('insert into orbit_private.allowed_users values($1)',[id]);
  const created=await rpc(host,'orbit_create_room',['Host']);const room=created.room_id;
  await rpc(guest,'orbit_join_room',[created.code,'Guest']);
  const get=(id)=>rpc(id,'orbit_get_playback',[room]);
  const set=(id,revision,content='80012345',playing=false,position=12000)=>rpc(id,'orbit_set_playback',[room,content,playing,position,revision]);
  await t.test('anonymous, unapproved and nonmember accounts cannot read or change playback',async()=>{
   await assert.rejects(rpc(null,'orbit_get_playback',[room],'anon'),/permission denied/);
   await assert.rejects(rpc(null,'orbit_set_playback',[room,'80012345',false,0,0],'anon'),/permission denied/);
   await assert.rejects(get(unapproved),/access has not been granted/);
   await assert.rejects(get(outsider),/unavailable/);await assert.rejects(set(outsider,0),/unavailable/);
   assert.equal((await asUser(outsider,'select * from public.orbit_playback')).rows.length,0);
  });
  await t.test('members can read the empty timeline but guests cannot control it',async()=>{
   const before=await get(guest);assert.equal(before.room_id,room);assert.equal(before.timeline,null);
   assert.equal(typeof before.server_time_ms,'number');await assert.rejects(set(guest,0),/unavailable/);
   await assert.rejects(asUser(host,'insert into public.orbit_playback values($1,$2,false,0,now(),1)',[room,'80012345']),/permission denied/);
   await assert.rejects(asUser(host,'update public.orbit_playback set position_ms=999'),/permission denied/);
  });
  await t.test('the host publishes server-anchored revisions and signals existing realtime room updates',async()=>{
   const roomBefore=(await db.query('select revision from public.orbit_rooms where id=$1',[room])).rows[0].revision;
   const first=await set(host,0);assert.equal(first.timeline.revision,1);assert.equal(first.timeline.position_ms,12000);
   assert.ok(first.timeline.anchor_time_ms<=first.server_time_ms);assert.ok(first.server_time_ms-first.timeline.anchor_time_ms<1000);
   const second=await set(host,1,'80012345',true,12000);assert.equal(second.timeline.revision,2);
   assert.equal((await get(guest)).timeline.playing,true);
   assert.equal(Number((await db.query('select revision from public.orbit_rooms where id=$1',[room])).rows[0].revision),Number(roomBefore)+2);
  });
  await t.test('duplicate or stale host writes cannot overwrite a newer command',async()=>{
   const stale=await set(host,1,'80012345',false,999);assert.equal(stale.code,'conflict');
   const state=(await get(host)).timeline;assert.equal(state.revision,2);assert.equal(state.position_ms,12000);assert.equal(state.playing,true);
  });
  await t.test('invalid commands and URLs are rejected and do not change the revision',async()=>{
   for(const args of [[null,false,0,2],['https://example.test/?token=secret',false,0,2],['80012345',null,0,2],
    ['80012345',false,-1,2],['80012345',false,86400001,2],['80012345',false,null,2],['80012345',false,0,null],['80012345',false,0,-1]]){
    const result=await rpc(host,'orbit_set_playback',[room,...args]);assert.equal(result.code,'invalid_argument');assert.doesNotMatch(JSON.stringify(result),/secret/);
   }assert.equal((await get(host)).timeline.revision,2);
  });
  await t.test('database timeline reconciles two simulated devices with different clocks',async()=>{
   const reply=await set(host,2,'80012345',false,22000);
   const players=[{contentId:'80012345',state:'playing',positionMs:1000,canPlay:true,canPause:true,canSeek:true},
    {contentId:'80012345',state:'paused',positionMs:50000,canPlay:true,canPause:true,canSeek:true}];
   for(let i=0;i<players.length;i++){
    const start=1000+i*500000;const plan=new PlaybackSynchronizer(room).evaluate(reply,{sentAtMs:start,receivedAtMs:start+100,nowMs:start+100},players[i]);
    assert.equal(plan.status,'apply');for(const action of plan.actions){if(action.type==='seek')players[i].positionMs=action.positionMs;else players[i].state=action.type==='play'?'playing':'paused';}
   }assert.equal(players[0].positionMs,22000);assert.equal(players[1].positionMs,22000);assert.equal(players[0].state,'paused');assert.equal(players[1].state,'paused');
  });
  await t.test('failed command attempts commit bounded rate-limit counters',async()=>{
   await db.query("delete from orbit_private.attempts where user_id=$1 and action='playback'",[host]);
   // A single transaction keeps now() on one minute boundary even on slow CI.
   await db.exec('begin');
   try {
    for(let i=0;i<120;i++)assert.equal((await set(host,-1)).code,'invalid_argument');
    assert.equal((await set(host,3)).code,'rate_limited');
    await db.exec('commit');
   } catch (error) { await db.exec('rollback'); throw error; }
   assert.equal((await db.query("select attempts from orbit_private.attempts where user_id=$1 and action='playback'",[host])).rows[0].attempts,121);
   await db.query("delete from orbit_private.attempts where user_id=$1 and action='playback'",[host]);
  });
  await t.test('revoking or leaving removes read access immediately',async()=>{
   await db.query('delete from orbit_private.allowed_users where user_id=$1',[guest]);await assert.rejects(get(guest),/access has not been granted/);
   assert.equal((await asUser(guest,'select * from public.orbit_playback')).rows.length,0);
   await db.query('insert into orbit_private.allowed_users values($1)',[guest]);
   await rpc(guest,'orbit_leave_room',[room]);await assert.rejects(get(guest),/unavailable/);
  });
  await t.test('expired and closed rooms cannot receive commands or expose playback',async()=>{
   await db.query("update public.orbit_rooms set expires_at=now()-interval '1 second' where id=$1",[room]);
   await assert.rejects(get(host),/unavailable/);await assert.rejects(set(host,3),/unavailable/);
   await db.query("update public.orbit_rooms set expires_at=now()+interval '1 hour' where id=$1",[room]);
   await rpc(host,'orbit_leave_room',[room]);await assert.rejects(get(host),/unavailable/);await assert.rejects(set(host,3),/unavailable/);
   assert.equal((await asUser(host,'select * from public.orbit_playback')).rows.length,0);
  });
  await t.test('room deletion removes its playback row',async()=>{
   await db.query('delete from public.orbit_rooms where id=$1',[room]);assert.equal((await db.query('select * from public.orbit_playback')).rows.length,0);
  });
 }finally{await db.close();}
});
