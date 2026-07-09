import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { theme } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { fetchTrip, updateTrip } from '@/lib/trips';

// Parse common date formats into YYYY-MM-DD for Postgres.
function parseToISODate(input: string): string | undefined {
  const s = input.trim();
  if (!s) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  const parts = s.split(/[-\/]/);
  if (parts.length === 3) {
    const [a, b, c] = parts.map(Number);
    if (c > 1000) {
      const d2 = new Date(c, a - 1, b);
      if (!isNaN(d2.getTime())) {
        return `${c}-${String(a).padStart(2, '0')}-${String(b).padStart(2, '0')}`;
      }
    }
  }
  return undefined;
}

export default function EditTripScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();

  const [loadingTrip, setLoadingTrip] = useState(true);

  const [destination, setDestination] = useState('');
  const [country, setCountry] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');
  // URI of a newly picked local photo (null = keep existing)
  const [newCoverPhotoUri, setNewCoverPhotoUri] = useState<string | null>(null);
  // The current remote cover photo URL from the DB
  const [existingCoverUrl, setExistingCoverUrl] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetchTrip(id)
      .then((trip) => {
        if (!trip) return;
        setDestination(trip.destination);
        setCountry(trip.country ?? '');
        setStartDate(trip.start_date ?? '');
        setEndDate(trip.end_date ?? '');
        setDescription(trip.description ?? '');
        setExistingCoverUrl(trip.cover_photo_url);
      })
      .finally(() => setLoadingTrip(false));
  }, [id]);

  const pickCoverPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setNewCoverPhotoUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!destination.trim()) {
      setError('Destination is required.');
      return;
    }
    if (!user || !id) {
      setError('Something went wrong. Please try again.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await updateTrip(id, user.id, {
        destination,
        country,
        startDate: parseToISODate(startDate),
        endDate: parseToISODate(endDate),
        description,
        coverPhotoUri: newCoverPhotoUri ?? undefined,
      });
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
      Alert.alert('Save failed', err instanceof Error ? err.message : 'Could not save changes');
    } finally {
      setSaving(false);
    }
  };

  if (loadingTrip) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  const coverPreviewUri = newCoverPhotoUri ?? existingCoverUrl;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled">
        <Text style={styles.intro}>Update the details for this trip.</Text>

        <Pressable onPress={pickCoverPhoto} style={styles.coverPicker}>
          {coverPreviewUri ? (
            <>
              <Image
                source={{ uri: coverPreviewUri }}
                style={styles.coverImage}
                contentFit="cover"
              />
              <View style={styles.coverEditBadge}>
                <Text style={styles.coverEditLabel}>Change photo</Text>
              </View>
            </>
          ) : (
            <View style={styles.coverPlaceholder}>
              <Text style={styles.coverEmoji}>📷</Text>
              <Text style={styles.coverLabel}>Add a cover photo</Text>
            </View>
          )}
        </Pressable>

        <View style={styles.form}>
          <Input
            label="Destination *"
            value={destination}
            onChangeText={setDestination}
            placeholder="Madrid"
          />
          <Input
            label="Country"
            value={country}
            onChangeText={setCountry}
            placeholder="Spain"
          />
          <Input
            label="Start date"
            value={startDate}
            onChangeText={setStartDate}
            placeholder="3/22/2026 or 2026-03-22"
            autoCapitalize="none"
          />
          <Input
            label="End date"
            value={endDate}
            onChangeText={setEndDate}
            placeholder="3/29/2026 or 2026-03-29"
            autoCapitalize="none"
          />
          <Input
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="A few words about this trip..."
            multiline
            numberOfLines={3}
            style={styles.textArea}
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button title="Save Changes" onPress={handleSave} loading={saving} fullWidth />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
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
  coverPicker: {
    height: 180,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverEditBadge: {
    position: 'absolute',
    bottom: theme.spacing.sm,
    right: theme.spacing.sm,
    backgroundColor: 'rgba(20, 16, 12, 0.65)',
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
  },
  coverEditLabel: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 13,
    color: theme.colors.textInverse,
  },
  coverPlaceholder: {
    flex: 1,
    backgroundColor: theme.colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  coverEmoji: {
    fontSize: 32,
  },
  coverLabel: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 15,
    color: theme.colors.secondary,
  },
  form: {
    gap: theme.spacing.md,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  error: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.error,
    textAlign: 'center',
  },
});
