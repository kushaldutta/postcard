import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BucketListCard } from '@/components/ui/BucketListCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { theme } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { createTripFromBucketListItem, fetchBucketListItems } from '@/lib/bucket-list';
import { groupBucketListByCategory } from '@/lib/bucket-list-categories';
import { BucketListItem } from '@/lib/database.types';

export default function BucketListScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [items, setItems] = useState<BucketListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [planningId, setPlanningId] = useState<string | null>(null);

  const sections = useMemo(() => groupBucketListByCategory(items), [items]);

  const loadItems = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      const data = await fetchBucketListItems();
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bucket list');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadItems();
    }, [loadItems])
  );

  const handleStartPlanning = useCallback(
    async (item: BucketListItem) => {
      if (!user) return;

      setPlanningId(item.id);
      try {
        const trip = await createTripFromBucketListItem(item, user.id);
        router.push(`/trip/${trip.id}`);
      } catch (err) {
        Alert.alert(
          'Could not start trip',
          err instanceof Error ? err.message : 'Something went wrong'
        );
      } finally {
        setPlanningId(null);
      }
    },
    [user, router]
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
        title="Couldn't load bucket list"
        description={error}
        actionLabel="Try again"
        onAction={() => loadItems()}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.list,
          items.length === 0 && styles.listEmpty,
        ]}
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadItems(true)}
            tintColor={theme.colors.accent}
          />
        }
        ListHeaderComponent={
          items.length > 0 ? (
            <View style={styles.listHeader}>
              <Text style={styles.subtitle}>
                Adventures you haven&apos;t taken yet
              </Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <EmptyState
            emoji="💌"
            title="Dream destinations"
            description="Collect day trips, getaways, and international adventures — with notes on why you want to go."
            actionLabel="Add your first destination"
            onAction={() => router.push('/bucket-list/new')}
          />
        }
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionEmoji}>{section.emoji}</Text>
            <Text style={styles.sectionTitle}>{section.title}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <BucketListCard
            item={item}
            onPress={() => router.push(`/bucket-list/edit/${item.id}`)}
            onEdit={() => router.push(`/bucket-list/edit/${item.id}`)}
            onStartPlanning={() => handleStartPlanning(item)}
            planning={planningId === item.id}
          />
        )}
        SectionSeparatorComponent={() => <View style={styles.sectionGap} />}
        ItemSeparatorComponent={() => <View style={styles.itemGap} />}
      />

      {items.length > 0 ? (
        <Pressable
          style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
          onPress={() => router.push('/bucket-list/new')}>
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
    paddingBottom: 100,
  },
  listEmpty: {
    flexGrow: 1,
  },
  listHeader: {
    marginBottom: theme.spacing.md,
  },
  subtitle: {
    fontFamily: theme.fonts.body,
    fontSize: 15,
    color: theme.colors.textMuted,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  sectionEmoji: {
    fontSize: 20,
  },
  sectionTitle: {
    fontFamily: theme.fonts.heading,
    fontSize: 20,
    color: theme.colors.text,
  },
  sectionGap: {
    height: theme.spacing.lg,
  },
  itemGap: {
    height: theme.spacing.md,
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
