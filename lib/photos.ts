import { PhotoDayGroup, Profile, TripPhoto } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';
import { uploadImageToBucket } from '@/lib/storage';

export async function fetchTripPhotos(tripId: string): Promise<TripPhoto[]> {
  const { data, error } = await supabase
    .from('trip_photos')
    .select('*, profile:profiles(*)')
    .eq('trip_id', tripId)
    .order('taken_on', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((photo) => ({
    ...(photo as TripPhoto),
    profile: photo.profile as unknown as Profile,
  }));
}

export function groupPhotosByDay(photos: TripPhoto[]): PhotoDayGroup[] {
  const groups = new Map<string, TripPhoto[]>();

  for (const photo of photos) {
    const existing = groups.get(photo.taken_on) ?? [];
    existing.push(photo);
    groups.set(photo.taken_on, existing);
  }

  return Array.from(groups.entries())
    .map(([date, dayPhotos]) => ({ date, photos: dayPhotos }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

export type AddPhotoInput = {
  tripId: string;
  userId: string;
  uri: string;
  takenOn?: string;
  caption?: string;
};

export async function addTripPhoto(input: AddPhotoInput): Promise<TripPhoto> {
  const { path, publicUrl } = await uploadImageToBucket('trip-photos', input.userId, input.uri);

  const { data, error } = await supabase
    .from('trip_photos')
    .insert({
      trip_id: input.tripId,
      user_id: input.userId,
      storage_path: path,
      public_url: publicUrl,
      caption: input.caption?.trim() || null,
      taken_on: input.takenOn ?? new Date().toISOString().slice(0, 10),
    })
    .select('*, profile:profiles(*)')
    .single();

  if (error) throw new Error(error.message);

  return {
    ...(data as TripPhoto),
    profile: data.profile as unknown as Profile,
  };
}

export async function addTripPhotos(inputs: AddPhotoInput[]): Promise<TripPhoto[]> {
  const results: TripPhoto[] = [];
  for (const input of inputs) {
    results.push(await addTripPhoto(input));
  }
  return results;
}

export async function updatePhotoCaption(
  photoId: string,
  caption: string | null
): Promise<void> {
  const { error } = await supabase
    .from('trip_photos')
    .update({ caption })
    .eq('id', photoId);
  if (error) throw new Error(error.message);
}

export async function togglePhotoFavorite(
  photoId: string,
  isFavorite: boolean
): Promise<void> {
  const { error } = await supabase
    .from('trip_photos')
    .update({ is_favorite: isFavorite })
    .eq('id', photoId);

  if (error) throw new Error(error.message);
}

export async function deleteTripPhoto(photo: TripPhoto): Promise<void> {
  const { error } = await supabase.from('trip_photos').delete().eq('id', photo.id);
  if (error) throw new Error(error.message);

  // Best-effort storage cleanup (RLS restricts to own folder).
  await supabase.storage.from('trip-photos').remove([photo.storage_path]).catch(() => {});
}
