import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import { EmptyState } from '@/components/ui/EmptyState';
import { theme } from '@/constants/theme';
import { getRegionForPins } from '@/lib/geo';
import { MapPin } from '@/lib/database.types';
import { formatTripDates } from '@/lib/format';
import { fetchMapPins } from '@/lib/trips';

const MAP_HEIGHT = Dimensions.get('window').height * 0.42;

export default function MapScreen() {
  const router = useRouter();
  const [pins, setPins] = useState<MapPin[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchMapPins()
        .then(setPins)
        .finally(() => setLoading(false));
    }, [])
  );

  const initialRegion = useMemo(
    () => getRegionForPins(pins.map((pin) => ({ latitude: pin.latitude, longitude: pin.longitude }))),
    [pins]
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  if (pins.length === 0) {
    return (
      <EmptyState
        emoji="🗺️"
        title="Your map is waiting"
        description="Create a trip with a destination and country — your adventures will appear here as pins on the map."
      />
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.intro}>
        Every pin is a chapter of your story. Tap a destination to open the trip.
      </Text>

      <View style={styles.mapWrapper}>
        <MapView style={styles.map} initialRegion={initialRegion}>
          {pins.map((pin) => (
            <Marker
              key={pin.trip.id}
              coordinate={{ latitude: pin.latitude, longitude: pin.longitude }}
              title={pin.trip.destination}
              description={pin.trip.country ?? undefined}
              pinColor={theme.colors.accent}
              onPress={() => router.push(`/trip/${pin.trip.id}`)}
            />
          ))}
        </MapView>
      </View>

      <Text style={styles.listHeading}>{pins.length} destinations on your map</Text>

      <View style={styles.destinations}>
        {pins.map((pin) => (
          <Pressable
            key={pin.trip.id}
            style={({ pressed }) => [styles.pin, pressed && styles.pinPressed]}
            onPress={() => router.push(`/trip/${pin.trip.id}`)}>
            <View style={styles.pinDot} />
            <View style={styles.pinContent}>
              <Text style={styles.pinDestination}>
                {pin.trip.destination}
                {pin.trip.country ? `, ${pin.trip.country}` : ''}
              </Text>
              <Text style={styles.pinDates}>
                {formatTripDates(pin.trip.start_date, pin.trip.end_date)}
              </Text>
            </View>
            <Text style={styles.pinChevron}>→</Text>
          </Pressable>
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
    gap: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
  },
  intro: {
    fontFamily: theme.fonts.body,
    fontSize: 15,
    color: theme.colors.textMuted,
    lineHeight: 22,
  },
  mapWrapper: {
    height: MAP_HEIGHT,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  map: {
    flex: 1,
  },
  listHeading: {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 14,
    color: theme.colors.secondary,
    marginTop: theme.spacing.xs,
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
  pinPressed: {
    opacity: 0.92,
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
  pinChevron: {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 18,
    color: theme.colors.accent,
  },
});
