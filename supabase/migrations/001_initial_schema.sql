-- Postcard initial schema
-- Run this in the Supabase SQL Editor for a new project.

-- Profiles (extends auth.users)
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text not null,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Trips
create table public.trips (
  id uuid primary key default gen_random_uuid(),
  destination text not null,
  country text,
  latitude double precision,
  longitude double precision,
  cover_photo_url text,
  start_date date,
  end_date date,
  description text,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Trip members (owner + collaborators)
create table public.trip_members (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'collaborator' check (role in ('owner', 'collaborator')),
  joined_at timestamptz not null default now(),
  unique (trip_id, user_id)
);

-- Journal entries (trip timeline)
create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  entry_date date not null default current_date,
  created_at timestamptz not null default now()
);

-- Bucket list items
create table public.bucket_list_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  destination text not null,
  country text,
  notes text,
  why_we_want_to_go text,
  cover_photo_url text,
  created_at timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Auto-add trip creator as owner
create or replace function public.handle_new_trip()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.trip_members (trip_id, user_id, role)
  values (new.id, new.created_by, 'owner');
  return new;
end;
$$;

create trigger on_trip_created
  after insert on public.trips
  for each row execute procedure public.handle_new_trip();

-- Updated_at helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trips_updated_at
  before update on public.trips
  for each row execute procedure public.set_updated_at();

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.trips enable row level security;
alter table public.trip_members enable row level security;
alter table public.journal_entries enable row level security;
alter table public.bucket_list_items enable row level security;

-- Profiles: read all (for collaborator names), update own
create policy "Profiles are viewable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- Trips: members can read; authenticated can create; owners can update/delete
create policy "Trip members can view trips"
  on public.trips for select
  to authenticated
  using (
    exists (
      select 1 from public.trip_members
      where trip_members.trip_id = trips.id
        and trip_members.user_id = auth.uid()
    )
  );

create policy "Authenticated users can create trips"
  on public.trips for insert
  to authenticated
  with check (auth.uid() = created_by);

create policy "Trip owners can update trips"
  on public.trips for update
  to authenticated
  using (
    exists (
      select 1 from public.trip_members
      where trip_members.trip_id = trips.id
        and trip_members.user_id = auth.uid()
        and trip_members.role = 'owner'
    )
  );

create policy "Trip owners can delete trips"
  on public.trips for delete
  to authenticated
  using (
    exists (
      select 1 from public.trip_members
      where trip_members.trip_id = trips.id
        and trip_members.user_id = auth.uid()
        and trip_members.role = 'owner'
    )
  );

-- Trip members
create policy "Trip members can view membership"
  on public.trip_members for select
  to authenticated
  using (
    exists (
      select 1 from public.trip_members tm
      where tm.trip_id = trip_members.trip_id
        and tm.user_id = auth.uid()
    )
  );

create policy "Trip owners can add members"
  on public.trip_members for insert
  to authenticated
  with check (
    exists (
      select 1 from public.trip_members tm
      where tm.trip_id = trip_members.trip_id
        and tm.user_id = auth.uid()
        and tm.role = 'owner'
    )
    or (
      -- Allow owner bootstrap via trigger (security definer)
      not exists (select 1 from public.trip_members tm where tm.trip_id = trip_members.trip_id)
      and trip_members.user_id = auth.uid()
      and trip_members.role = 'owner'
    )
  );

create policy "Trip owners can remove members"
  on public.trip_members for delete
  to authenticated
  using (
    exists (
      select 1 from public.trip_members tm
      where tm.trip_id = trip_members.trip_id
        and tm.user_id = auth.uid()
        and tm.role = 'owner'
    )
  );

-- Journal entries
create policy "Trip members can view journal entries"
  on public.journal_entries for select
  to authenticated
  using (
    exists (
      select 1 from public.trip_members
      where trip_members.trip_id = journal_entries.trip_id
        and trip_members.user_id = auth.uid()
    )
  );

create policy "Trip members can create journal entries"
  on public.journal_entries for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.trip_members
      where trip_members.trip_id = journal_entries.trip_id
        and trip_members.user_id = auth.uid()
    )
  );

create policy "Users can update own journal entries"
  on public.journal_entries for update
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can delete own journal entries"
  on public.journal_entries for delete
  to authenticated
  using (auth.uid() = user_id);

-- Bucket list (personal for now)
create policy "Users can manage own bucket list"
  on public.bucket_list_items for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Storage bucket for trip cover photos
insert into storage.buckets (id, name, public)
values ('trip-covers', 'trip-covers', true)
on conflict (id) do nothing;

create policy "Authenticated users can upload trip covers"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'trip-covers');

create policy "Anyone can view trip covers"
  on storage.objects for select
  to public
  using (bucket_id = 'trip-covers');

create policy "Users can update own trip covers"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'trip-covers' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete own trip covers"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'trip-covers' and auth.uid()::text = (storage.foldername(name))[1]);
