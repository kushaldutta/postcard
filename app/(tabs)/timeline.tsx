import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { EmptyState } from '@/components/ui/EmptyState';
import { theme } from '@/constants/theme';
import { TimelineItem } from '@/lib/database.types';
import { formatTimelineDate } from '@/lib/format';
import { fetchTimeline } from '@/lib/trips';

export default function TimelineScreen() {
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchTimeline()
        .then(setItems)
        .finally(() => setLoading(false));
    }, [])
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        emoji="📖"
        title="Your story starts here"
        description="Create a trip and add journal entries. Over time, this becomes a scroll through years of memories."
      />
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <View style={styles.item}>
          <Text style={styles.date}>{formatTimelineDate(item.date)}</Text>
          <View style={styles.card}>
            {item.type === 'trip' ? (
              <>
                <Text style={styles.tripLabel}>Trip</Text>
                <Text style={styles.title}>{item.trip.destination}</Text>
                {item.trip.country ? (
                  <Text style={styles.subtitle}>{item.trip.country}</Text>
                ) : null}
              </>
            ) : (
              <>
                <Text style={styles.tripLabel}>{item.trip.destination}</Text>
                <Text style={styles.journalIcon}>✍️ Journal Entry</Text>
                <Text style={styles.journalPreview} numberOfLines={3}>
                  {item.journal?.content}
                </Text>
                {item.journal?.profile?.display_name ? (
                  <Text style={styles.author}>— {item.journal.profile.display_name}</Text>
                ) : null}
              </>
            )}
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
  list: {
    padding: theme.spacing.md,
    gap: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  item: {
    gap: theme.spacing.sm,
  },
  date: {
    fontFamily: theme.fonts.heading,
    fontSize: 18,
    color: theme.colors.secondary,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.xs,
  },
  tripLabel: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 12,
    color: theme.colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    fontFamily: theme.fonts.heading,
    fontSize: 22,
    color: theme.colors.text,
  },
  subtitle: {
    fontFamily: theme.fonts.body,
    fontSize: 15,
    color: theme.colors.textMuted,
  },
  journalIcon: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 14,
    color: theme.colors.text,
  },
  journalPreview: {
    fontFamily: theme.fonts.body,
    fontSize: 15,
    color: theme.colors.textMuted,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  author: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    color: theme.colors.secondary,
    marginTop: theme.spacing.xs,
  },
});
