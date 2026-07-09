-- Fix infinite recursion in trip_members RLS policies.
--
-- The original policies used subqueries on trip_members inside trip_members policies,
-- causing Postgres to recurse indefinitely. The fix is to use SECURITY DEFINER
-- functions which run as the function owner and bypass RLS entirely.

-- Drop all policies that reference trip_members (directly or transitively)
drop policy if exists "Trip members can view trips" on public.trips;
drop policy if exists "Trip owners can update trips" on public.trips;
drop policy if exists "Trip owners can delete trips" on public.trips;
drop policy if exists "Trip members can view membership" on public.trip_members;
drop policy if exists "Trip owners can add members" on public.trip_members;
drop policy if exists "Trip owners can remove members" on public.trip_members;
drop policy if exists "Trip members can view journal entries" on public.journal_entries;
drop policy if exists "Trip members can create journal entries" on public.journal_entries;

-- Helper: is the current user a member of this trip?
create or replace function public.is_trip_member(trip_uuid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from trip_members
    where trip_id = trip_uuid
      and user_id = auth.uid()
  );
$$;

-- Helper: is the current user an owner of this trip?
create or replace function public.is_trip_owner(trip_uuid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from trip_members
    where trip_id = trip_uuid
      and user_id = auth.uid()
      and role = 'owner'
  );
$$;

-- Trips policies
create policy "Trip members can view trips"
  on public.trips for select
  to authenticated
  using (public.is_trip_member(id));

create policy "Trip owners can update trips"
  on public.trips for update
  to authenticated
  using (public.is_trip_owner(id));

create policy "Trip owners can delete trips"
  on public.trips for delete
  to authenticated
  using (public.is_trip_owner(id));

-- Trip members policies
create policy "Trip members can view membership"
  on public.trip_members for select
  to authenticated
  using (public.is_trip_member(trip_id));

create policy "Trip owners can add members"
  on public.trip_members for insert
  to authenticated
  with check (
    public.is_trip_owner(trip_id)
    or (
      -- Bootstrap: allow the first row (owner) when no members exist yet
      not exists (
        select 1 from public.trip_members tm where tm.trip_id = trip_members.trip_id
      )
      and trip_members.user_id = auth.uid()
      and trip_members.role = 'owner'
    )
  );

create policy "Trip owners can remove members"
  on public.trip_members for delete
  to authenticated
  using (public.is_trip_owner(trip_id));

-- Journal entries policies
create policy "Trip members can view journal entries"
  on public.journal_entries for select
  to authenticated
  using (public.is_trip_member(trip_id));

create policy "Trip members can create journal entries"
  on public.journal_entries for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and public.is_trip_member(trip_id)
  );
