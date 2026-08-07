import { BucketListCategory, BucketListItem } from '@/lib/database.types';

export const BUCKET_LIST_CATEGORIES: {
  value: BucketListCategory;
  label: string;
  description: string;
  emoji: string;
}[] = [
  {
    value: 'day_activity',
    label: 'Day Activities',
    description: 'Beach days, SF outings, local adventures',
    emoji: '☀️',
  },
  {
    value: 'getaway',
    label: 'Getaways',
    description: 'Weekends away, road trips, multi-day escapes',
    emoji: '🛣️',
  },
  {
    value: 'international',
    label: 'International Trips',
    description: 'Cross-border adventures abroad',
    emoji: '✈️',
  },
];

export function getBucketListCategoryLabel(category: BucketListCategory): string {
  return BUCKET_LIST_CATEGORIES.find((c) => c.value === category)?.label ?? 'Getaways';
}

export function groupBucketListByCategory(
  items: BucketListItem[]
): { title: string; emoji: string; data: BucketListItem[] }[] {
  return BUCKET_LIST_CATEGORIES.map((cat) => ({
    title: cat.label,
    emoji: cat.emoji,
    data: items.filter((item) => item.category === cat.value),
  })).filter((section) => section.data.length > 0);
}
