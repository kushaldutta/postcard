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

export type BucketListItem = {
  id: string;
  user_id: string;
  destination: string;
  country: string | null;
  notes: string | null;
  why_we_want_to_go: string | null;
  cover_photo_url: string | null;
  created_at: string;
};

export type TripWithStats = Trip & {
  member_count: number;
  journal_count: number;
  members: TripMember[];
};

export type TimelineItem = {
  id: string;
  type: 'trip' | 'journal';
  date: string;
  trip: Trip;
  journal?: JournalEntry;
};
