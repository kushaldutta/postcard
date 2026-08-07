import { BucketListCategory, BucketListItem, Trip } from '@/lib/database.types';
import { resolveCoordinates } from '@/lib/geo';
import { supabase } from '@/lib/supabase';
import { uploadImageToBucket } from '@/lib/storage';
import { createTrip } from '@/lib/trips';

export type CreateBucketListInput = {
  destination: string;
  country?: string;
  category?: BucketListCategory;
  notes?: string;
  whyWeWantToGo?: string;
  coverPhotoUri?: string;
  userId: string;
};

export type UpdateBucketListInput = Partial<
  Omit<CreateBucketListInput, 'userId' | 'coverPhotoUri'>
> & {
  coverPhotoUri?: string;
};

async function uploadCoverPhoto(userId: string, uri: string): Promise<string | null> {
  try {
    const { publicUrl } = await uploadImageToBucket('trip-covers', userId, uri);
    return publicUrl;
  } catch (err) {
    console.warn('Bucket list cover upload failed:', err);
    return null;
  }
}

export async function fetchBucketListItems(): Promise<BucketListItem[]> {
  const { data, error } = await supabase
    .from('bucket_list_items')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as BucketListItem[];
}

export async function fetchBucketListItem(id: string): Promise<BucketListItem | null> {
  const { data, error } = await supabase
    .from('bucket_list_items')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as BucketListItem | null;
}

export async function createBucketListItem(input: CreateBucketListInput): Promise<BucketListItem> {
  let coverPhotoUrl: string | null = null;

  if (input.coverPhotoUri) {
    coverPhotoUrl = await uploadCoverPhoto(input.userId, input.coverPhotoUri);
  }

  const { data, error } = await supabase
    .from('bucket_list_items')
    .insert({
      user_id: input.userId,
      destination: input.destination.trim(),
      country: input.country?.trim() || null,
      category: input.category ?? 'getaway',
      notes: input.notes?.trim() || null,
      why_we_want_to_go: input.whyWeWantToGo?.trim() || null,
      cover_photo_url: coverPhotoUrl,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as BucketListItem;
}

export async function updateBucketListItem(
  id: string,
  userId: string,
  input: UpdateBucketListInput
): Promise<BucketListItem> {
  let coverPhotoUrl: string | undefined;

  if (input.coverPhotoUri) {
    coverPhotoUrl = (await uploadCoverPhoto(userId, input.coverPhotoUri)) ?? undefined;
  }

  const { data, error } = await supabase
    .from('bucket_list_items')
    .update({
      ...(input.destination !== undefined && { destination: input.destination.trim() }),
      ...(input.country !== undefined && { country: input.country?.trim() || null }),
      ...(input.category !== undefined && { category: input.category }),
      ...(input.notes !== undefined && { notes: input.notes?.trim() || null }),
      ...(input.whyWeWantToGo !== undefined && {
        why_we_want_to_go: input.whyWeWantToGo?.trim() || null,
      }),
      ...(coverPhotoUrl && { cover_photo_url: coverPhotoUrl }),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as BucketListItem;
}

export async function deleteBucketListItem(id: string): Promise<void> {
  const { error } = await supabase.from('bucket_list_items').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

function buildTripDescription(item: BucketListItem): string | undefined {
  const parts = [item.why_we_want_to_go, item.notes].filter(Boolean);
  return parts.length ? parts.join('\n\n') : undefined;
}

export async function createTripFromBucketListItem(
  item: BucketListItem,
  userId: string
): Promise<Trip> {
  const coords = resolveCoordinates(item.destination, item.country);

  return createTrip({
    destination: item.destination,
    country: item.country ?? undefined,
    description: buildTripDescription(item),
    coverPhotoUrl: item.cover_photo_url ?? undefined,
    latitude: coords?.latitude,
    longitude: coords?.longitude,
    createdBy: userId,
  });
}
