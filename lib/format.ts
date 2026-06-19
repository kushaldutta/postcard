import { format, parseISO } from 'date-fns';

export function formatTripDates(startDate?: string | null, endDate?: string | null): string {
  if (!startDate && !endDate) return 'Dates TBD';

  try {
    if (startDate && endDate) {
      const start = parseISO(startDate);
      const end = parseISO(endDate);
      if (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) {
        return `${format(start, 'MMMM yyyy')}`;
      }
      if (start.getFullYear() === end.getFullYear()) {
        return `${format(start, 'MMM')} – ${format(end, 'MMM yyyy')}`;
      }
      return `${format(start, 'MMM yyyy')} – ${format(end, 'MMM yyyy')}`;
    }

    const date = parseISO(startDate ?? endDate!);
    return format(date, 'MMMM yyyy');
  } catch {
    return 'Dates TBD';
  }
}

export function formatDisplayDate(dateString: string): string {
  try {
    return format(parseISO(dateString), 'MMMM d, yyyy');
  } catch {
    return dateString;
  }
}

export function formatTimelineDate(dateString: string): string {
  try {
    return format(parseISO(dateString), 'MMMM yyyy');
  } catch {
    return dateString;
  }
}

export function formatDayHeading(dateString: string): string {
  try {
    return format(parseISO(dateString), 'MMMM d');
  } catch {
    return dateString;
  }
}

export function getInitials(name?: string | null, email?: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  return (email?.slice(0, 2) ?? '??').toUpperCase();
}
