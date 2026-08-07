export type Profile = {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
};

export type Trip = {
  id: string;
  destination: string;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  cover_photo_url: string | null;
  start_date: string | null;
  end_date: string | null;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type TripMember = {
  id: string;
  trip_id: string;
  user_id: string;
  role: 'owner' | 'collaborator';
  joined_at: string;
  profile?: Profile;
};

export type JournalEntry = {
  id: string;
  trip_id: string;
  user_id: string;
  content: string;
  entry_date: string;
  created_at: string;
  profile?: Profile;
};

export type BucketListCategory = 'day_activity' | 'getaway' | 'international';

export type BucketListItem = {
  id: string;
  user_id: string;
  destination: string;
  country: string | null;
  category: BucketListCategory;
  notes: string | null;
  why_we_want_to_go: string | null;
  cover_photo_url: string | null;
  created_at: string;
};

export type TripPhoto = {
  id: string;
  trip_id: string;
  user_id: string;
  storage_path: string;
  public_url: string;
  caption: string | null;
  taken_on: string;
  is_favorite: boolean;
  created_at: string;
  profile?: Profile;
};

export type PhotoDayGroup = {
  date: string;
  photos: TripPhoto[];
};

export type TripWithStats = Trip & {
  member_count: number;
  journal_count: number;
  photo_count: number;
  members: TripMember[];
};

export type MapPin = {
  trip: Trip;
  latitude: number;
  longitude: number;
};

export type TimelineItem = {
  id: string;
  type: 'trip' | 'journal' | 'photos';
  date: string;
  trip: Trip;
  journal?: JournalEntry;
  photos?: TripPhoto[];
};
