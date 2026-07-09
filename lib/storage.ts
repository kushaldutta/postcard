import { File } from 'expo-file-system';

import { supabase } from '@/lib/supabase';

const CONTENT_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  heic: 'image/heic',
  webp: 'image/webp',
  gif: 'image/gif',
};

// Reads a local file (from ImagePicker) as raw bytes and uploads it to a
// Supabase Storage bucket. Uses expo-file-system's byte reading, which works
// reliably in React Native (unlike fetch().blob(), which produces empty files).
export async function uploadImageToBucket(
  bucket: string,
  userId: string,
  uri: string
): Promise<{ path: string; publicUrl: string }> {
  const extension = (uri.split('.').pop()?.split('?')[0] ?? 'jpg').toLowerCase();
  const contentType = CONTENT_TYPES[extension] ?? 'image/jpeg';
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;

  const bytes = await new File(uri).bytes();

  const { error } = await supabase.storage.from(bucket).upload(path, bytes, {
    contentType,
    upsert: false,
  });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}
