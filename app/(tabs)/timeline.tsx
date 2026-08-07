import { Image } from 'expo-image';
import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { EmptyState } from '@/components/ui/EmptyState';
import { theme } from '@/constants/theme';
import { TimelineItem } from '@/lib/database.types';
import { formatTimelineDate } from '@/lib/format';
import { fetchTimeline } from '@/lib/trips';

const SCREEN_WIDTH = Dimensions.get('window').width;
const PHOTO_STRIP_HEIGHT = 80;
const PHOTO_STRIP_WIDTH = 80;

export default function TimelineScreen() {
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
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
        description="Create a trip and add journal entries or photos. Over time, this becomes a scroll through years of memories."
      />
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <Pressable
          style={styles.item}
          onPress={() => router.push(`/trip/${item.trip.id}`)}>
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
            ) : item.type === 'journal' ? (
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
            ) : (
              <>
                <Text style={styles.tripLabel}>{item.trip.destination}</Text>
                <Text style={styles.journalIcon}>
                  📸 {item.photos?.length ?? 0}{' '}
                  {(item.photos?.length ?? 0) === 1 ? 'photo' : 'photos'} added
                </Text>
                <View style={styles.photoStrip}>
                  {(item.photos ?? []).slice(0, 4).map((photo) => (
                    <Image
                      key={photo.id}
                      source={{ uri: photo.public_url }}
                      style={styles.photoThumb}
                      contentFit="cover"
                    />
                  ))}
                  {(item.photos?.length ?? 0) > 4 ? (
                    <View style={[styles.photoThumb, styles.photoMore]}>
                      <Text style={styles.photoMoreText}>+{(item.photos?.length ?? 0) - 4}</Text>
                    </View>
                  ) : null}
                </View>
              </>
            )}
            <Text style={styles.viewTrip}>View trip →</Text>
          </View>
        </Pressable>
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
  photoStrip: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
    flexWrap: 'wrap',
  },
  photoThumb: {
    width: PHOTO_STRIP_WIDTH,
    height: PHOTO_STRIP_HEIGHT,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surfaceMuted,
  },
  photoMore: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.accentSoft,
  },
  photoMoreText: {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 14,
    color: theme.colors.accent,
  },
  viewTrip: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 13,
    color: theme.colors.accent,
    marginTop: theme.spacing.sm,
    alignSelf: 'flex-end',
  },
});
