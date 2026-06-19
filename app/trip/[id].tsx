import { Image } from 'expo-image';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { theme } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { JournalEntry, TripWithStats } from '@/lib/database.types';
import { formatDayHeading, formatTripDates } from '@/lib/format';
import {
  createJournalEntry,
  fetchJournalEntries,
  fetchTrip,
  inviteCollaborator,
} from '@/lib/trips';

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user, profile } = useAuth();

  const [trip, setTrip] = useState<TripWithStats | null>(null);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showJournalForm, setShowJournalForm] = useState(false);
  const [journalContent, setJournalContent] = useState('');
  const [journalLoading, setJournalLoading] = useState(false);

  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);

  const loadTrip = useCallback(async () => {
    if (!id) return;

    try {
      setError(null);
      const [tripData, journalData] = await Promise.all([
        fetchTrip(id),
        fetchJournalEntries(id),
      ]);

      if (!tripData) {
        setError('Trip not found');
        return;
      }

      setTrip(tripData);
      setJournals(journalData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trip');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadTrip();
    }, [loadTrip])
  );

  const isOwner = trip?.members.some(
    (m) => m.user_id === user?.id && m.role === 'owner'
  );

  const handleAddJournal = async () => {
    if (!journalContent.trim() || !id || !user) return;

    setJournalLoading(true);
    try {
      const entry = await createJournalEntry(id, user.id, journalContent);
      setJournals((prev) => [entry, ...prev]);
      setJournalContent('');
      setShowJournalForm(false);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to add entry');
    } finally {
      setJournalLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !id) return;

    setInviteLoading(true);
    try {
      await inviteCollaborator(id, inviteEmail);
      setInviteEmail('');
      setShowInviteForm(false);
      await loadTrip();
      Alert.alert('Invited!', 'They can now see and contribute to this trip.');
    } catch (err) {
      Alert.alert('Could not invite', err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setInviteLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  if (error || !trip) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorText}>{error ?? 'Trip not found'}</Text>
        <Button title="Go back" onPress={() => router.back()} />
      </SafeAreaView>
    );
  }

  const location = trip.country ? `${trip.destination}, ${trip.country}` : trip.destination;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          {trip.cover_photo_url ? (
            <Image source={{ uri: trip.cover_photo_url }} style={styles.heroImage} contentFit="cover" />
          ) : (
            <View style={styles.heroPlaceholder}>
              <Text style={styles.heroEmoji}>✈️</Text>
            </View>
          )}
          <View style={styles.heroOverlay} />

          <SafeAreaView edges={['top']} style={styles.heroHeader}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <Text style={styles.backText}>← Back</Text>
            </Pressable>
          </SafeAreaView>

          <View style={styles.heroContent}>
            <Text style={styles.destination}>{location}</Text>
            <Text style={styles.dates}>{formatTripDates(trip.start_date, trip.end_date)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          {trip.description ? (
            <Text style={styles.description}>{trip.description}</Text>
          ) : null}

          <View style={styles.participants}>
            <Text style={styles.sectionTitle}>Travelers</Text>
            <View style={styles.participantRow}>
              {trip.members.map((member) => (
                <View key={member.id} style={styles.participant}>
                  <Avatar
                    name={member.profile?.display_name}
                    email={member.profile?.email}
                  />
                  <Text style={styles.participantName}>
                    {member.profile?.display_name ?? member.profile?.email}
                    {member.user_id === user?.id ? ' (you)' : ''}
                  </Text>
                </View>
              ))}
            </View>

            {isOwner ? (
              showInviteForm ? (
                <View style={styles.inviteForm}>
                  <Input
                    label="Invite by email"
                    value={inviteEmail}
                    onChangeText={setInviteEmail}
                    placeholder="partner@example.com"
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                  <View style={styles.inviteActions}>
                    <Button
                      title="Cancel"
                      variant="ghost"
                      onPress={() => setShowInviteForm(false)}
                    />
                    <Button
                      title="Send Invite"
                      onPress={handleInvite}
                      loading={inviteLoading}
                    />
                  </View>
                </View>
              ) : (
                <Button
                  title="Invite a traveler"
                  variant="secondary"
                  onPress={() => setShowInviteForm(true)}
                />
              )
            ) : null}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Memory Timeline</Text>
            <Button
              title="+ Entry"
              variant="ghost"
              onPress={() => setShowJournalForm(true)}
            />
          </View>

          {showJournalForm ? (
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              <View style={styles.journalForm}>
                <TextInput
                  value={journalContent}
                  onChangeText={setJournalContent}
                  placeholder="What happened today?"
                  placeholderTextColor={theme.colors.textMuted}
                  multiline
                  style={styles.journalInput}
                />
                <View style={styles.journalActions}>
                  <Button
                    title="Cancel"
                    variant="ghost"
                    onPress={() => {
                      setShowJournalForm(false);
                      setJournalContent('');
                    }}
                  />
                  <Button
                    title="Save"
                    onPress={handleAddJournal}
                    loading={journalLoading}
                  />
                </View>
              </View>
            </KeyboardAvoidingView>
          ) : null}

          {journals.length === 0 ? (
            <View style={styles.emptyTimeline}>
              <Text style={styles.emptyTimelineText}>
                No memories yet. Add a journal entry to start the story of this trip.
              </Text>
            </View>
          ) : (
            journals.map((entry) => (
              <View key={entry.id} style={styles.timelineItem}>
                <Text style={styles.timelineDate}>{formatDayHeading(entry.entry_date)}</Text>
                <View style={styles.timelineCard}>
                  <Text style={styles.timelineIcon}>✍️ Journal Entry</Text>
                  <Text style={styles.timelineContent}>{entry.content}</Text>
                  <Text style={styles.timelineAuthor}>
                    — {entry.profile?.display_name ?? profile?.display_name ?? 'You'}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    paddingBottom: theme.spacing.xxl,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  errorText: {
    fontFamily: theme.fonts.body,
    fontSize: 16,
    color: theme.colors.error,
    textAlign: 'center',
  },
  hero: {
    height: 320,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroPlaceholder: {
    flex: 1,
    backgroundColor: theme.colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEmoji: {
    fontSize: 64,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.overlay,
  },
  heroHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: theme.spacing.md,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: theme.spacing.sm,
  },
  backText: {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 16,
    color: theme.colors.textInverse,
  },
  heroContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: theme.spacing.lg,
    gap: theme.spacing.xs,
  },
  destination: {
    fontFamily: theme.fonts.heading,
    fontSize: 32,
    color: theme.colors.textInverse,
  },
  dates: {
    fontFamily: theme.fonts.body,
    fontSize: 16,
    color: 'rgba(250, 246, 240, 0.85)',
  },
  section: {
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  description: {
    fontFamily: theme.fonts.body,
    fontSize: 16,
    color: theme.colors.text,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontFamily: theme.fonts.heading,
    fontSize: 22,
    color: theme.colors.text,
  },
  participants: {
    gap: theme.spacing.md,
  },
  participantRow: {
    gap: theme.spacing.sm,
  },
  participant: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  participantName: {
    fontFamily: theme.fonts.body,
    fontSize: 15,
    color: theme.colors.text,
  },
  inviteForm: {
    gap: theme.spacing.sm,
  },
  inviteActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.spacing.sm,
  },
  journalForm: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  journalInput: {
    fontFamily: theme.fonts.body,
    fontSize: 16,
    color: theme.colors.text,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  journalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.spacing.sm,
  },
  emptyTimeline: {
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
  },
  emptyTimelineText: {
    fontFamily: theme.fonts.body,
    fontSize: 15,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  timelineItem: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  timelineDate: {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 14,
    color: theme.colors.secondary,
  },
  timelineCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.xs,
  },
  timelineIcon: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 14,
    color: theme.colors.accent,
  },
  timelineContent: {
    fontFamily: theme.fonts.body,
    fontSize: 16,
    color: theme.colors.text,
    lineHeight: 24,
  },
  timelineAuthor: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xs,
  },
});
