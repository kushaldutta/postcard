import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/ui/EmptyState';
import { TripCard } from '@/components/ui/TripCard';
import { theme } from '@/constants/theme';
import { TripWithStats } from '@/lib/database.types';
import { fetchTrips } from '@/lib/trips';

export default function TripsScreen() {
  const router = useRouter();
  const [trips, setTrips] = useState<TripWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTrips = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      const data = await fetchTrips();
      setTrips(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trips');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTrips();
    }, [loadTrips])
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  if (error) {
    return (
      <EmptyState
        emoji="😔"
        title="Couldn't load trips"
        description={error}
        actionLabel="Try again"
        onAction={() => loadTrips()}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={trips}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.list,
          trips.length === 0 && styles.listEmpty,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadTrips(true)}
            tintColor={theme.colors.accent}
          />
        }
        ListHeaderComponent={
          trips.length > 0 ? (
            <View style={styles.listHeader}>
              <Text style={styles.subtitle}>Your adventures, preserved</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <EmptyState
            emoji="🌍"
            title="No trips yet"
            description="Start your first chapter. Every adventure begins with a single destination."
            actionLabel="Create your first trip"
            onAction={() => router.push('/trip/new')}
          />
        }
        renderItem={({ item }) => (
          <TripCard
            trip={item}
            onPress={() => router.push(`/trip/${item.id}`)}
            onEdit={() => router.push(`/trip/edit/${item.id}`)}
          />
        )}
      />

      {trips.length > 0 ? (
        <Pressable
          style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
          onPress={() => router.push('/trip/new')}>
          <Text style={styles.fabText}>+</Text>
        </Pressable>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
  list: {
    padding: theme.spacing.md,
    gap: theme.spacing.md,
    paddingBottom: 100,
  },
  listEmpty: {
    flexGrow: 1,
  },
  listHeader: {
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontFamily: theme.fonts.body,
    fontSize: 15,
    color: theme.colors.textMuted,
  },
  fab: {
    position: 'absolute',
    right: theme.spacing.lg,
    bottom: theme.spacing.lg,
    width: 56,
    height: 56,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  fabPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.96 }],
  },
  fabText: {
    fontSize: 28,
    color: theme.colors.textInverse,
    lineHeight: 30,
  },
});
