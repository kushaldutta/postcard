import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { theme } from '@/constants/theme';
import { BucketListItem } from '@/lib/database.types';

type BucketListCardProps = {
  item: BucketListItem;
  onPress: () => void;
  onEdit?: () => void;
  onStartPlanning?: () => void;
  planning?: boolean;
};

export function BucketListCard({
  item,
  onPress,
  onEdit,
  onStartPlanning,
  planning = false,
}: BucketListCardProps) {
  const location = item.country ? `${item.destination}, ${item.country}` : item.destination;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.imageContainer}>
        {item.cover_photo_url ? (
          <Image source={{ uri: item.cover_photo_url }} style={styles.image} contentFit="cover" />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderEmoji}>💌</Text>
          </View>
        )}
        <View style={styles.imageOverlay} />

        {onEdit ? (
          <Pressable onPress={onEdit} hitSlop={8} style={styles.editButton}>
            <Ionicons name="pencil" size={14} color={theme.colors.textInverse} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.content}>
        <Text style={styles.destination}>{location}</Text>

        {item.why_we_want_to_go ? (
          <Text style={styles.why} numberOfLines={2}>
            "{item.why_we_want_to_go}"
          </Text>
        ) : null}

        {item.notes ? (
          <Text style={styles.notes} numberOfLines={2}>
            {item.notes}
          </Text>
        ) : null}

        {onStartPlanning ? (
          <Button
            title="Start Planning"
            variant="secondary"
            onPress={onStartPlanning}
            loading={planning}
            style={styles.planButton}
          />
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },
  pressed: {
    opacity: 0.95,
    transform: [{ scale: 0.99 }],
  },
  imageContainer: {
    height: 140,
    backgroundColor: theme.colors.surfaceMuted,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.accentSoft,
  },
  placeholderEmoji: {
    fontSize: 36,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(61, 50, 41, 0.06)',
  },
  editButton: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    backgroundColor: 'rgba(20, 16, 12, 0.55)',
    borderRadius: theme.radius.full,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  destination: {
    fontFamily: theme.fonts.heading,
    fontSize: 20,
    color: theme.colors.text,
  },
  why: {
    fontFamily: theme.fonts.body,
    fontSize: 15,
    color: theme.colors.secondary,
    lineHeight: 22,
    fontStyle: 'italic',
    marginTop: theme.spacing.xs,
  },
  notes: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.textMuted,
    lineHeight: 20,
    marginTop: theme.spacing.xs,
  },
  planButton: {
    marginTop: theme.spacing.sm,
    minHeight: 44,
    paddingVertical: 10,
  },
});
