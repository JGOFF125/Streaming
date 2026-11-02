-- Apply once after 202610190001_private_rooms.sql. No streaming credentials or URLs.
begin;
create table public.orbit_playback (
  room_id uuid primary key references public.orbit_rooms(id) on delete cascade,
  content_id text not null check (content_id ~ '^[0-9]{1,12}$'),
  playing boolean not null,
  position_ms integer not null check (position_ms between 0 and 86400000),
  anchored_at timestamptz not null,
  revision bigint not null check (revision > 0)
);
alter table public.orbit_playback enable row level security;
revoke all on public.orbit_playback from public, anon, authenticated;
grant select on public.orbit_playback to authenticated;
create policy orbit_read_playback on public.orbit_playback for select to authenticated
using (orbit_private.is_member(room_id));

create function public.orbit_get_playback(p_room_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare caller uuid := orbit_private.require_user(); timeline jsonb;
begin
  if not orbit_private.is_member(p_room_id) then
    raise exception using errcode = '42501', message = 'This room is unavailable';
  end if;
  select jsonb_build_object(
    'content_id', p.content_id, 'playing', p.playing, 'position_ms', p.position_ms,
    'anchor_time_ms', floor(extract(epoch from p.anchored_at) * 1000)::bigint,
    'revision', p.revision
  ) into timeline from public.orbit_playback p where p.room_id = p_room_id;
  return jsonb_build_object('room_id', p_room_id,
    'server_time_ms', floor(extract(epoch from clock_timestamp()) * 1000)::bigint,
    'timeline', timeline);
end;
$$;

-- Host commands describe the desired timeline. Every player, including the host,
-- will reconcile to it. Never accept a client clock or trust a client host ID.
create function public.orbit_set_playback(
  p_room_id uuid, p_content_id text, p_playing boolean,
  p_position_ms integer, p_expected_revision bigint
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare caller uuid := orbit_private.require_user(); target public.orbit_rooms; previous bigint;
begin
  -- Same room-row lock used by joins/leaves: no command can race host departure.
  select * into target from public.orbit_rooms where id = p_room_id for update;
  if not found or target.host_id <> caller or target.closed or target.expires_at <= now()
    or not orbit_private.is_member(p_room_id) then
    raise exception using errcode = '42501', message = 'This room is unavailable';
  end if;
  if not orbit_private.consume_attempt(caller, 'playback', 120) then
    return jsonb_build_object('error', 'Please wait before sending more playback commands', 'code', 'rate_limited');
  end if;
  if p_content_id is null or p_content_id !~ '^[0-9]{1,12}$' or p_playing is null
    or p_position_ms is null or p_position_ms not between 0 and 86400000
    or p_expected_revision is null or p_expected_revision < 0 then
    return jsonb_build_object('error', 'Invalid playback command', 'code', 'invalid_argument');
  end if;
  select revision into previous from public.orbit_playback where room_id = p_room_id;
  if coalesce(previous, 0) <> p_expected_revision then
    return jsonb_build_object('error', 'Playback changed. Read the current timeline before retrying.', 'code', 'conflict');
  end if;
  insert into public.orbit_playback values (
    p_room_id, p_content_id, p_playing, p_position_ms, clock_timestamp(), coalesce(previous, 0) + 1
  ) on conflict (room_id) do update set
    content_id = excluded.content_id, playing = excluded.playing,
    position_ms = excluded.position_ms, anchored_at = excluded.anchored_at,
    revision = excluded.revision;
  -- Reuse the existing protected realtime room-update signal. No extra publication.
  update public.orbit_rooms set revision = revision + 1 where id = p_room_id;
  return public.orbit_get_playback(p_room_id);
end;
$$;
revoke execute on function public.orbit_get_playback(uuid) from public, anon, authenticated;
revoke execute on function public.orbit_set_playback(uuid, text, boolean, integer, bigint) from public, anon, authenticated;
grant execute on function public.orbit_get_playback(uuid) to authenticated;
grant execute on function public.orbit_set_playback(uuid, text, boolean, integer, bigint) to authenticated;
commit;
