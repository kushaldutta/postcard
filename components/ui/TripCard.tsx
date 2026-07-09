import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { theme } from '@/constants/theme';
import { TripWithStats } from '@/lib/database.types';
import { formatTripDates, getInitials } from '@/lib/format';

type TripCardProps = {
  trip: TripWithStats;
  onPress: () => void;
  onEdit?: () => void;
};

export function TripCard({ trip, onPress, onEdit }: TripCardProps) {
  const location = trip.country ? `${trip.destination}, ${trip.country}` : trip.destination;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.imageContainer}>
        {trip.cover_photo_url ? (
          <Image source={{ uri: trip.cover_photo_url }} style={styles.image} contentFit="cover" />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderEmoji}>✈️</Text>
          </View>
        )}
        <View style={styles.imageOverlay} />

        {onEdit ? (
          <Pressable
            onPress={onEdit}
            hitSlop={8}
            style={styles.editButton}>
            <Ionicons name="pencil" size={14} color={theme.colors.textInverse} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.content}>
        <Text style={styles.destination}>{location}</Text>
        <Text style={styles.dates}>{formatTripDates(trip.start_date, trip.end_date)}</Text>

        <View style={styles.metaRow}>
          <Text style={styles.meta}>
            {trip.journal_count} {trip.journal_count === 1 ? 'memory' : 'memories'}
          </Text>
          <View style={styles.avatars}>
            {trip.members.slice(0, 3).map((member) => (
              <View key={member.id} style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {getInitials(member.profile?.display_name, member.profile?.email)}
                </Text>
              </View>
            ))}
          </View>
        </View>
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
    height: 180,
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
    fontSize: 40,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(61, 50, 41, 0.08)',
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
    fontSize: 22,
    color: theme.colors.text,
  },
  dates: {
    fontFamily: theme.fonts.body,
    fontSize: 15,
    color: theme.colors.textMuted,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: theme.spacing.sm,
  },
  meta: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    color: theme.colors.secondary,
  },
  avatars: {
    flexDirection: 'row',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.accentSoft,
    borderWidth: 2,
    borderColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },
  avatarText: {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 10,
    color: theme.colors.accent,
  },
});
