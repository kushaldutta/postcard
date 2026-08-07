-- Add category to bucket list items
alter table public.bucket_list_items
  add column if not exists category text not null default 'getaway'
  check (category in ('day_activity', 'getaway', 'international'));
