-- Self-contained fix for trips RLS. Safe to run regardless of which prior
-- migrations were applied. Ensures helper functions exist, then resets ALL
-- trips policies. Key change: the trip creator can always SELECT their own
-- trip (created_by = auth.uid()), which avoids a race with the
-- on_trip_created trigger during INSERT ... RETURNING.

-- Helper functions (idempotent)
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

-- Reset ALL trips policies
drop policy if exists "Authenticated users can create trips" on public.trips;
drop policy if exists "Trip members can view trips" on public.trips;
drop policy if exists "Trip owners can update trips" on public.trips;
drop policy if exists "Trip owners can delete trips" on public.trips;

create policy "Authenticated users can create trips"
  on public.trips for insert
  to authenticated
  with check (auth.uid() = created_by);

create policy "Trip members can view trips"
  on public.trips for select
  to authenticated
  using (
    created_by = auth.uid()
    or public.is_trip_member(id)
  );

create policy "Trip owners can update trips"
  on public.trips for update
  to authenticated
  using (
    created_by = auth.uid()
    or public.is_trip_owner(id)
  );

create policy "Trip owners can delete trips"
  on public.trips for delete
  to authenticated
  using (
    created_by = auth.uid()
    or public.is_trip_owner(id)
  );
