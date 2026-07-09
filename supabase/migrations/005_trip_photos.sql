-- Photos: travel-specific gallery attached to trips.
-- Photos are grouped by day (taken_on) in the UI.

create table public.trip_photos (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  storage_path text not null,
  public_url text not null,
  caption text,
  taken_on date not null default current_date,
  is_favorite boolean not null default false,
  created_at timestamptz not null default now()
);

create index trip_photos_trip_id_idx on public.trip_photos (trip_id);
create index trip_photos_taken_on_idx on public.trip_photos (trip_id, taken_on);

alter table public.trip_photos enable row level security;

-- Trip members can view all photos on the trip
create policy "Trip members can view photos"
  on public.trip_photos for select
  to authenticated
  using (public.is_trip_member(trip_id));

-- Trip members can add photos (as themselves)
create policy "Trip members can add photos"
  on public.trip_photos for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and public.is_trip_member(trip_id)
  );

-- Users can update their own photos (caption, favorite); owners can update any
create policy "Users can update own photos"
  on public.trip_photos for update
  to authenticated
  using (auth.uid() = user_id or public.is_trip_owner(trip_id));

-- Users can delete their own photos; owners can delete any
create policy "Users can delete own photos"
  on public.trip_photos for delete
  to authenticated
  using (auth.uid() = user_id or public.is_trip_owner(trip_id));

-- Storage bucket for trip photos
insert into storage.buckets (id, name, public)
values ('trip-photos', 'trip-photos', true)
on conflict (id) do nothing;

create policy "Authenticated users can upload trip photos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'trip-photos');

create policy "Anyone can view trip photos"
  on storage.objects for select
  to public
  using (bucket_id = 'trip-photos');

create policy "Users can update own trip photos"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'trip-photos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete own trip photos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'trip-photos' and auth.uid()::text = (storage.foldername(name))[1]);
