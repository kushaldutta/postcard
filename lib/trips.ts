import {
  JournalEntry,
  Profile,
  Trip,
  TripMember,
  TripWithStats,
  TimelineItem,
} from '@/lib/database.types';
import { fetchTripPhotos, groupPhotosByDay } from '@/lib/photos';
import { supabase } from '@/lib/supabase';
import { uploadImageToBucket } from '@/lib/storage';

export type CreateTripInput = {
  destination: string;
  country?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  coverPhotoUri?: string;
  createdBy: string;
};

export type UpdateTripInput = Partial<
  Omit<CreateTripInput, 'createdBy' | 'coverPhotoUri'>
> & {
  coverPhotoUri?: string;
};

async function uploadCoverPhoto(userId: string, uri: string): Promise<string | null> {
  try {
    const { publicUrl } = await uploadImageToBucket('trip-covers', userId, uri);
    return publicUrl;
  } catch (err) {
    console.warn('Cover photo upload failed, continuing without photo:', err);
    return null;
  }
}

export async function fetchTrips(): Promise<TripWithStats[]> {
  const { data: trips, error } = await supabase
    .from('trips')
    .select('*')
    .order('start_date', { ascending: false, nullsFirst: false });

  if (error) throw new Error(error.message);
  if (!trips?.length) return [];

  const tripIds = trips.map((t) => t.id);

  const [{ data: members }, { data: journals }] = await Promise.all([
    supabase
      .from('trip_members')
      .select('*, profile:profiles(*)')
      .in('trip_id', tripIds),
    supabase.from('journal_entries').select('trip_id').in('trip_id', tripIds),
  ]);

  return (trips as Trip[]).map((trip) => {
    const tripMembers = (members ?? []).filter((m) => m.trip_id === trip.id) as TripMember[];
    const journalCount = (journals ?? []).filter((j) => j.trip_id === trip.id).length;

    return {
      ...trip,
      member_count: tripMembers.length,
      journal_count: journalCount,
      members: tripMembers.map((m) => ({
        ...m,
        profile: m.profile as unknown as Profile,
      })),
    };
  });
}

export async function fetchTrip(tripId: string): Promise<TripWithStats | null> {
  const { data: trip, error } = await supabase
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .single();

  if (error) throw new Error(error.message);
  if (!trip) return null;

  const [{ data: members }, { data: journals }] = await Promise.all([
    supabase
      .from('trip_members')
      .select('*, profile:profiles(*)')
      .eq('trip_id', tripId),
    supabase.from('journal_entries').select('id').eq('trip_id', tripId),
  ]);

  const tripMembers = (members ?? []) as TripMember[];

  return {
    ...(trip as Trip),
    member_count: tripMembers.length,
    journal_count: journals?.length ?? 0,
    members: tripMembers.map((m) => ({
      ...m,
      profile: m.profile as unknown as Profile,
    })),
  };
}

export async function createTrip(input: CreateTripInput): Promise<Trip> {
  let coverPhotoUrl: string | null = null;

  if (input.coverPhotoUri) {
    coverPhotoUrl = await uploadCoverPhoto(input.createdBy, input.coverPhotoUri);
  }

  const { data, error } = await supabase
    .from('trips')
    .insert({
      destination: input.destination.trim(),
      country: input.country?.trim() || null,
      start_date: input.startDate || null,
      end_date: input.endDate || null,
      description: input.description?.trim() || null,
      cover_photo_url: coverPhotoUrl,
      created_by: input.createdBy,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Trip;
}

export async function updateTrip(tripId: string, userId: string, input: UpdateTripInput) {
  let coverPhotoUrl: string | undefined;

  if (input.coverPhotoUri) {
    coverPhotoUrl = (await uploadCoverPhoto(userId, input.coverPhotoUri)) ?? undefined;
  }

  const { data, error } = await supabase
    .from('trips')
    .update({
      ...(input.destination !== undefined && { destination: input.destination.trim() }),
      ...(input.country !== undefined && { country: input.country?.trim() || null }),
      ...(input.startDate !== undefined && { start_date: input.startDate || null }),
      ...(input.endDate !== undefined && { end_date: input.endDate || null }),
      ...(input.description !== undefined && { description: input.description?.trim() || null }),
      ...(coverPhotoUrl && { cover_photo_url: coverPhotoUrl }),
    })
    .eq('id', tripId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Trip;
}

export async function deleteTrip(tripId: string) {
  const { error } = await supabase.from('trips').delete().eq('id', tripId);
  if (error) throw new Error(error.message);
}

export async function inviteCollaborator(tripId: string, email: string) {
  const normalizedEmail = email.trim().toLowerCase();

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', normalizedEmail)
    .maybeSingle();

  if (profileError) throw new Error(profileError.message);
  if (!profile) {
    throw new Error('No account found with that email. They need to sign up first.');
  }

  const { error } = await supabase.from('trip_members').insert({
    trip_id: tripId,
    user_id: profile.id,
    role: 'collaborator',
  });

  if (error) {
    if (error.code === '23505') {
      throw new Error('This person is already on the trip.');
    }
    throw new Error(error.message);
  }

  return profile as Profile;
}

export async function fetchJournalEntries(tripId: string): Promise<JournalEntry[]> {
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*, profile:profiles(*)')
    .eq('trip_id', tripId)
    .order('entry_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((entry) => ({
    ...(entry as JournalEntry),
    profile: entry.profile as unknown as Profile,
  }));
}

export async function createJournalEntry(
  tripId: string,
  userId: string,
  content: string,
  entryDate?: string
) {
  const { data, error } = await supabase
    .from('journal_entries')
    .insert({
      trip_id: tripId,
      user_id: userId,
      content: content.trim(),
      entry_date: entryDate ?? new Date().toISOString().slice(0, 10),
    })
    .select('*, profile:profiles(*)')
    .single();

  if (error) throw new Error(error.message);

  return {
    ...(data as JournalEntry),
    profile: data.profile as unknown as Profile,
  };
}

export async function fetchTimeline(): Promise<TimelineItem[]> {
  const trips = await fetchTrips();
  const items: TimelineItem[] = [];

  for (const trip of trips) {
    if (trip.start_date) {
      items.push({
        id: `trip-${trip.id}`,
        type: 'trip',
        date: trip.start_date,
        trip,
      });
    }

    const [journals, photos] = await Promise.all([
      fetchJournalEntries(trip.id),
      fetchTripPhotos(trip.id),
    ]);

    for (const journal of journals) {
      items.push({
        id: `journal-${journal.id}`,
        type: 'journal',
        date: journal.entry_date,
        trip,
        journal,
      });
    }

    for (const group of groupPhotosByDay(photos)) {
      items.push({
        id: `photos-${trip.id}-${group.date}`,
        type: 'photos',
        date: group.date,
        trip,
        photos: group.photos,
      });
    }
  }

  return items.sort((a, b) => b.date.localeCompare(a.date));
}

export async function fetchMapTrips(): Promise<Trip[]> {
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .not('country', 'is', null)
    .order('start_date', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Trip[];
}
