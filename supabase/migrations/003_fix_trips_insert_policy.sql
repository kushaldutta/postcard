-- Ensure trips INSERT policy is clean and present.
-- Also recreates all trips SELECT/UPDATE/DELETE policies via security definer
-- functions (avoiding any recursion through trip_members).

-- Drop all trips policies to start fresh
drop policy if exists "Authenticated users can create trips" on public.trips;
drop policy if exists "Trip members can view trips" on public.trips;
drop policy if exists "Trip owners can update trips" on public.trips;
drop policy if exists "Trip owners can delete trips" on public.trips;

-- Recreate all four
create policy "Authenticated users can create trips"
  on public.trips for insert
  to authenticated
  with check (auth.uid() = created_by);

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
