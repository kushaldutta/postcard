import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '@/components/ui/EmptyState';
import { theme } from '@/constants/theme';
import { Trip } from '@/lib/database.types';
import { formatTripDates } from '@/lib/format';
import { fetchMapTrips } from '@/lib/trips';

export default function MapScreen() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchMapTrips()
        .then(setTrips)
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

  if (trips.length === 0) {
    return (
      <EmptyState
        emoji="🗺️"
        title="Your map is waiting"
        description="As you add trips with destinations, they'll appear here — a visual story of everywhere you've been."
      />
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.intro}>
        A living map of your travels. Full interactive map coming soon — for now, your
        destinations:
      </Text>

      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapEmoji}>🌍</Text>
        <Text style={styles.mapLabel}>{trips.length} destinations explored</Text>
      </View>

      <View style={styles.destinations}>
        {trips.map((trip) => (
          <View key={trip.id} style={styles.pin}>
            <View style={styles.pinDot} />
            <View style={styles.pinContent}>
              <Text style={styles.pinDestination}>
                {trip.destination}
                {trip.country ? `, ${trip.country}` : ''}
              </Text>
              <Text style={styles.pinDates}>
                {formatTripDates(trip.start_date, trip.end_date)}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
  container: {
    padding: theme.spacing.md,
    gap: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  intro: {
    fontFamily: theme.fonts.body,
    fontSize: 15,
    color: theme.colors.textMuted,
    lineHeight: 22,
  },
  mapPlaceholder: {
    height: 200,
    backgroundColor: theme.colors.accentSoft,
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  mapEmoji: {
    fontSize: 48,
  },
  mapLabel: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 16,
    color: theme.colors.secondary,
  },
  destinations: {
    gap: theme.spacing.sm,
  },
  pin: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.md,
  },
  pinDot: {
    width: 12,
    height: 12,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.accent,
  },
  pinContent: {
    flex: 1,
    gap: 2,
  },
  pinDestination: {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 16,
    color: theme.colors.text,
  },
  pinDates: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    color: theme.colors.textMuted,
  },
});
