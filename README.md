# Postcard

Postcard is a travel memory app built around preserving trips as stories.

## Getting Started

### 1. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **Authentication → Providers → Email** and disable **Confirm email** (easier for testing; re-enable before gifting)
3. Go to **SQL Editor** and run the migration in `supabase/migrations/001_initial_schema.sql`
4. Go to **Project Settings → API** and copy your project URL and anon key
5. Copy `.env.example` to `.env` and fill in your keys:

```bash
cp .env.example .env
```

### 2. Run the app

```bash
npm install
npx expo start
```

Press `i` for iOS simulator, `a` for Android, or scan the QR code with **Expo Go** on your phone (SDK 54 compatible with the App Store version).

### 3. Create accounts

1. Sign up with your email
2. Create a trip
3. Tap **Invite a traveler** and enter their email (they must sign up first)

## What's built (MVP v0.1)

- **Auth** — Sign up, sign in, secure session persistence
- **Trips tab** — Create trips with cover photos, destinations, dates, descriptions
- **Trip detail** — Hero cover, travelers, invite collaborators, journal entries (memory timeline)
- **Timeline tab** — Cross-trip feed of trips and journal entries
- **Map tab** — Destination list (interactive map coming next)
- **Bucket list tab** — Placeholder for future adventures

## Project structure

```
app/
  (auth)/          Login & signup
  (tabs)/          Main navigation (Trips, Map, Timeline, Bucket List)
  trip/            Trip detail & create
lib/
  auth.tsx         Auth context & session
  supabase.ts      Supabase client
  trips.ts         Trip & journal API
components/ui/     Reusable UI components
supabase/          Database migrations
```

## Design

Warm, nostalgic, scrapbook-inspired UI:

- Cream background (`#FAF6F0`)
- Terracotta accent (`#C4705A`)
- Playfair Display headings + Lora body text

## Next up

- Interactive memory map (Mapbox)
- Bucket list CRUD
- Photo galleries per trip
- Shared memory prompts (side-by-side answers)
- Time capsules
