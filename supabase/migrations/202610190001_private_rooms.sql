-- Orbit Phase 2. Run once in a NEW Supabase development project, as postgres.
begin;
create schema orbit_private;
revoke all on schema orbit_private from public, anon, authenticated;

create table orbit_private.allowed_users (
  user_id uuid primary key references auth.users(id) on delete cascade
);
create function orbit_private.limit_allowed_users() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform pg_catalog.pg_advisory_xact_lock(670214, 1);
  if (select count(*) from orbit_private.allowed_users where user_id <> new.user_id) >= 10 then
    raise exception 'Orbit supports at most 10 authorized users';
  end if;
  return new;
end;
$$;
create trigger orbit_allowed_users_limit before insert or update on orbit_private.allowed_users
for each row execute function orbit_private.limit_allowed_users();

create table public.orbit_rooms (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '24 hours',
  closed boolean not null default false,
  revision bigint not null default 1
);
create table public.orbit_members (
  room_id uuid not null references public.orbit_rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  nickname text not null check (char_length(btrim(nickname)) between 1 and 32),
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id)
);
create index orbit_members_user on public.orbit_members(user_id);
create table orbit_private.invitations (
  room_id uuid primary key references public.orbit_rooms(id) on delete cascade,
  code_hash bytea not null unique
);
create table orbit_private.attempts (
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  window_start timestamptz not null,
  attempts integer not null,
  primary key (user_id, action)
);

create function orbit_private.require_user() returns uuid
language plpgsql security definer set search_path = '' as $$
declare caller uuid := auth.uid();
begin
  if caller is null or not exists (
    select 1 from orbit_private.allowed_users where user_id = caller
  ) then
    raise exception using errcode = '42501', message = 'Orbit access has not been granted to this account';
  end if;
  return caller;
end;
$$;

-- One bounded counter per account/action. Return errors rather than raising after
-- consuming a join attempt: an exception would roll back the rate-limit counter.
create function orbit_private.consume_attempt(caller uuid, kind text, maximum integer) returns boolean
language plpgsql security definer set search_path = '' as $$
declare n integer;
begin
  insert into orbit_private.attempts as a values (caller, kind, date_trunc('minute', now()), 1)
  on conflict (user_id, action) do update set
    window_start = excluded.window_start,
    attempts = case when a.window_start = excluded.window_start
      then least(a.attempts + 1, maximum + 1) else 1 end
  returning attempts into n;
  return n <= maximum;
end;
$$;

-- Security-definer helper prevents recursive RLS checks on the members table.
create function orbit_private.is_member(target uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.orbit_members m
    join public.orbit_rooms r on r.id = m.room_id
    join orbit_private.allowed_users a on a.user_id = m.user_id
    where m.room_id = target and m.user_id = auth.uid()
      and not r.closed and r.expires_at > now()
  );
$$;
grant usage on schema orbit_private to authenticated;
grant execute on function orbit_private.is_member(uuid) to authenticated;

alter table public.orbit_rooms enable row level security;
alter table public.orbit_members enable row level security;
alter table orbit_private.allowed_users enable row level security;
alter table orbit_private.invitations enable row level security;
alter table orbit_private.attempts enable row level security;
revoke all on public.orbit_rooms, public.orbit_members from public, anon, authenticated;
revoke all on all tables in schema orbit_private from public, anon, authenticated;
grant select on public.orbit_rooms, public.orbit_members to authenticated;
create policy orbit_read_rooms on public.orbit_rooms for select to authenticated
using (orbit_private.is_member(id));
create policy orbit_read_members on public.orbit_members for select to authenticated
using (orbit_private.is_member(room_id));

create function public.orbit_restore_room() returns uuid
language plpgsql security definer set search_path = '' as $$
declare caller uuid := orbit_private.require_user(); result uuid;
begin
  select r.id into result from public.orbit_rooms r
  join public.orbit_members m on m.room_id = r.id
  where m.user_id = caller and not r.closed and r.expires_at > now()
  order by r.created_at desc limit 1;
  return result;
end;
$$;

create function public.orbit_create_room(p_nickname text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  caller uuid := orbit_private.require_user();
  room uuid; code text := ''; bytes bytea := uuid_send(gen_random_uuid()); i integer;
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(caller::text, 0));
  if not orbit_private.consume_attempt(caller, 'create', 5) then
    return jsonb_build_object('error', 'Please wait a minute before creating another room');
  end if;
  if p_nickname is null or char_length(btrim(p_nickname)) not between 1 and 32 then
    return jsonb_build_object('error', 'Enter a nickname of 1 to 32 characters');
  end if;
  if public.orbit_restore_room() is not null then
    return jsonb_build_object('error', 'Leave your current room first');
  end if;
  -- Twelve independent random 5-bit values; skip UUID version/variant bytes.
  foreach i in array array[0,1,2,3,4,5,7,9,10,11,12,13] loop
    code := code || substr(alphabet, (get_byte(bytes, i) & 31) + 1, 1);
  end loop;
  insert into public.orbit_rooms(host_id) values (caller) returning id into room;
  insert into orbit_private.invitations values (room, sha256(convert_to(code, 'UTF8')));
  insert into public.orbit_members(room_id, user_id, nickname) values (room, caller, btrim(p_nickname));
  return jsonb_build_object('room_id', room, 'code', code);
end;
$$;

create function public.orbit_join_room(p_code text, p_nickname text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare caller uuid := orbit_private.require_user(); target public.orbit_rooms;
  current_room uuid; code text := upper(regexp_replace(coalesce(p_code, ''), '[\s-]', '', 'g'));
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(caller::text, 0));
  if not orbit_private.consume_attempt(caller, 'join', 10) then
    return jsonb_build_object('error', 'Please wait a minute before trying another invitation');
  end if;
  if code !~ '^[A-HJ-NP-Z2-9]{12}$' then
    return jsonb_build_object('error', 'Invitation unavailable or expired');
  end if;
  if p_nickname is null or char_length(btrim(p_nickname)) not between 1 and 32 then
    return jsonb_build_object('error', 'Enter a nickname of 1 to 32 characters');
  end if;
  select r.* into target from public.orbit_rooms r
  join orbit_private.invitations i on i.room_id = r.id
  where i.code_hash = sha256(convert_to(code, 'UTF8'))
    and not r.closed and r.expires_at > now()
  for update of r;
  if not found then return jsonb_build_object('error', 'Invitation unavailable or expired'); end if;
  current_room := public.orbit_restore_room();
  if current_room is not null and current_room <> target.id then
    return jsonb_build_object('error', 'Leave your current room first');
  end if;
  if exists (select 1 from public.orbit_members where room_id = target.id and user_id = caller) then
    return jsonb_build_object('room_id', target.id);
  end if;
  -- Row lock serializes all joins/leaves for this room.
  if (select count(*) from public.orbit_members where room_id = target.id) >= 10 then
    return jsonb_build_object('error', 'This room is full');
  end if;
  insert into public.orbit_members(room_id, user_id, nickname) values (target.id, caller, btrim(p_nickname));
  update public.orbit_rooms set revision = revision + 1 where id = target.id;
  return jsonb_build_object('room_id', target.id);
end;
$$;

create function public.orbit_leave_room(p_room_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare caller uuid := auth.uid(); host uuid;
begin
  -- Allow a revoked account to clean up its own membership too.
  if caller is null then raise exception using errcode = '42501', message = 'Sign in first'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(caller::text, 0));
  select host_id into host from public.orbit_rooms where id = p_room_id for update;
  if not exists (select 1 from public.orbit_members where room_id = p_room_id and user_id = caller) then return; end if;
  delete from public.orbit_members where room_id = p_room_id and user_id = caller;
  update public.orbit_rooms set revision = revision + 1, closed = closed or host = caller where id = p_room_id;
end;
$$;

-- Revoke Supabase's default grants on every privileged helper and RPC.
revoke execute on all functions in schema orbit_private from public, anon, authenticated;
grant execute on function orbit_private.is_member(uuid) to authenticated;
revoke execute on function public.orbit_restore_room() from public, anon, authenticated;
revoke execute on function public.orbit_create_room(text) from public, anon, authenticated;
revoke execute on function public.orbit_join_room(text, text) from public, anon, authenticated;
revoke execute on function public.orbit_leave_room(uuid) from public, anon, authenticated;
grant execute on function public.orbit_restore_room() to authenticated;
grant execute on function public.orbit_create_room(text) to authenticated;
grant execute on function public.orbit_join_room(text, text) to authenticated;
grant execute on function public.orbit_leave_room(uuid) to authenticated;

-- Publish only room revisions. Member deletes and invitation hashes are never published.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.orbit_rooms;
  end if;
end;
$$;
commit;
