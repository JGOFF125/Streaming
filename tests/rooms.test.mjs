import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

test('private rooms enforce authorization in PostgreSQL', async t => {
  const db = new PGlite();
  const ids = Array.from({ length: 12 }, (_, i) => '00000000-0000-4000-8000-' + String(i + 1).padStart(12, '0'));
  async function asUser(id, sql, params = [], role = 'authenticated') {
    await db.exec('set role ' + role);
    try {
      await db.query("select set_config('request.jwt.claim.sub', $1, false)", [id ?? '']);
      return await db.query(sql, params);
    } finally { await db.exec('reset role'); }
  }
  const rpc = async (id, fn, params = []) => {
    const placeholders = params.map((_, i) => '$' + (i + 1)).join(',');
    return (await asUser(id, 'select public.' + fn + '(' + placeholders + ') as result', params)).rows[0].result;
  };
  try {
    await db.exec(`
      create role anon nologin;
      create role authenticated nologin;
      create schema auth;
      create table auth.users (id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$
        select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
      $$;
      grant usage on schema auth to authenticated, anon;
      grant execute on function auth.uid() to authenticated, anon;
    `);
    await db.exec(await readFile(new URL('../supabase/migrations/202610190001_private_rooms.sql', import.meta.url), 'utf8'));
    for (const id of ids) await db.query('insert into auth.users values ($1)', [id]);
    for (const id of ids.slice(0, 10)) await db.query('insert into orbit_private.allowed_users values ($1)', [id]);

    await t.test('the access list cannot exceed ten accounts', async () => {
      await assert.rejects(db.query('insert into orbit_private.allowed_users values ($1)', [ids[10]]), /at most 10/);
    });
    await t.test('unauthenticated and unapproved users cannot create rooms', async () => {
      await assert.rejects(asUser(null, "select public.orbit_create_room('Visitor')", [], 'anon'), /permission denied/);
      await assert.rejects(rpc(ids[10], 'orbit_create_room', ['Visitor']), /access has not been granted/);
    });

    const created = await rpc(ids[0], 'orbit_create_room', ['Host']);
    const room = created.room_id;
    await t.test('invitations are random-looking twelve-character codes and stored only as hashes', async () => {
      assert.match(created.code, /^[A-HJ-NP-Z2-9]{12}$/);
      const invitation = (await db.query('select * from orbit_private.invitations')).rows[0];
      assert.equal(invitation.code_hash.length, 32);
      assert.deepEqual(Object.keys(invitation).sort(), ['code_hash', 'room_id']);
      await assert.rejects(asUser(ids[0], 'select * from orbit_private.invitations'), /permission denied/);
    });
    await t.test('nonmembers see no room data and cannot forge membership', async () => {
      assert.equal((await asUser(ids[1], 'select * from public.orbit_rooms')).rows.length, 0);
      assert.equal((await asUser(ids[1], 'select * from public.orbit_members')).rows.length, 0);
      await assert.rejects(asUser(ids[1], 'insert into public.orbit_members(room_id,user_id,nickname) values ($1,$2,$3)', [room, ids[1], 'Forged']), /permission denied/);
      await assert.rejects(asUser(ids[1], 'update public.orbit_rooms set host_id = $1 where id = $2', [ids[1], room]), /permission denied/);
      await assert.rejects(asUser(ids[1], 'select orbit_private.require_user()'), /permission denied/);
      await assert.rejects(asUser(ids[1], 'select orbit_private.consume_attempt($1,$2,999)', [ids[1], 'join']), /permission denied/);
    });
    await t.test('an authorized second user can join and both users can read the roster', async () => {
      const grouped = created.code.toLowerCase().match(/.{4}/g).join('-');
      assert.equal((await rpc(ids[1], 'orbit_join_room', [grouped, 'Guest'])).room_id, room);
      for (const id of ids.slice(0, 2)) {
        assert.equal((await asUser(id, 'select * from public.orbit_rooms')).rows.length, 1);
        assert.equal((await asUser(id, 'select * from public.orbit_members')).rows.length, 2);
      }
      assert.equal(await rpc(ids[1], 'orbit_restore_room'), room);
    });
    await t.test('duplicate joins are idempotent and a user cannot create a second active room', async () => {
      assert.equal((await rpc(ids[1], 'orbit_join_room', [created.code, 'Guest'])).room_id, room);
      assert.match((await rpc(ids[1], 'orbit_create_room', ['Guest'])).error, /Leave your current room/);
      assert.equal((await db.query('select count(*)::int as n from public.orbit_members')).rows[0].n, 2);
    });
    await t.test('failed join attempts commit their rate-limit counters', async () => {
      for (let i = 0; i < 10; i++) {
        assert.match((await rpc(ids[9], 'orbit_join_room', ['invalid', 'Guess'])).error, /unavailable/);
      }
      assert.match((await rpc(ids[9], 'orbit_join_room', [created.code, 'Guess'])).error, /wait a minute/);
      assert.equal((await db.query("select attempts from orbit_private.attempts where user_id=$1 and action='join'", [ids[9]])).rows[0].attempts, 11);
      await db.query('delete from orbit_private.attempts where user_id=$1', [ids[9]]);
    });
    await t.test('the room cannot exceed ten members, including after account revocation', async () => {
      for (const id of ids.slice(2, 10)) assert.equal((await rpc(id, 'orbit_join_room', [created.code, 'Member'])).room_id, room);
      await db.query('delete from orbit_private.allowed_users where user_id=$1', [ids[9]]);
      await db.query('insert into orbit_private.allowed_users values ($1)', [ids[10]]);
      assert.match((await rpc(ids[10], 'orbit_join_room', [created.code, 'Extra'])).error, /full/);
      assert.equal((await db.query('select count(*)::int as n from public.orbit_members')).rows[0].n, 10);
      assert.equal((await asUser(ids[9], 'select * from public.orbit_rooms')).rows.length, 0);
      await assert.rejects(rpc(ids[9], 'orbit_restore_room'), /access has not been granted/);
    });
    await t.test('an outsider cannot close another user’s room', async () => {
      await rpc(ids[10], 'orbit_leave_room', [room]);
      assert.equal((await db.query('select closed from public.orbit_rooms where id=$1', [room])).rows[0].closed, false);
    });
    await t.test('leaving revokes reads, and the revision changes for remaining members', async () => {
      const before = (await db.query('select revision from public.orbit_rooms where id=$1', [room])).rows[0].revision;
      await rpc(ids[1], 'orbit_leave_room', [room]);
      assert.equal((await asUser(ids[1], 'select * from public.orbit_members')).rows.length, 0);
      const after = (await db.query('select revision from public.orbit_rooms where id=$1', [room])).rows[0].revision;
      assert.equal(Number(after), Number(before) + 1);
      assert.equal((await rpc(ids[10], 'orbit_join_room', [created.code, 'Replacement'])).room_id, room);
    });
    await t.test('host departure closes the room and invalidates its invitation', async () => {
      await rpc(ids[0], 'orbit_leave_room', [room]);
      assert.equal((await asUser(ids[10], 'select * from public.orbit_rooms')).rows.length, 0);
      assert.match((await rpc(ids[1], 'orbit_join_room', [created.code, 'Guest'])).error, /unavailable/);
      assert.equal(await rpc(ids[10], 'orbit_restore_room'), null);
    });
    await t.test('expired rooms cannot be joined or read', async () => {
      const next = await rpc(ids[0], 'orbit_create_room', ['Host']);
      await db.query("update public.orbit_rooms set expires_at = now() - interval '1 second' where id=$1", [next.room_id]);
      assert.equal((await asUser(ids[0], 'select * from public.orbit_rooms')).rows.length, 0);
      assert.match((await rpc(ids[1], 'orbit_join_room', [next.code, 'Guest'])).error, /unavailable/);
    });
    await t.test('blank nicknames are rejected server-side', async () => {
      assert.match((await rpc(ids[1], 'orbit_create_room', ['   '])).error, /nickname/);
    });
    await t.test('room creation is rate limited too', async () => {
      await db.query('delete from orbit_private.attempts where user_id=$1', [ids[1]]);
      for (let i = 0; i < 5; i++) {
        const value = await rpc(ids[1], 'orbit_create_room', ['Guest']);
        await rpc(ids[1], 'orbit_leave_room', [value.room_id]);
      }
      assert.match((await rpc(ids[1], 'orbit_create_room', ['Guest'])).error, /wait a minute/);
    });
  } finally { await db.close(); }
});
