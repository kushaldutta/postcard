import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
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
import { createTrip } from '@/lib/trips';

export default function NewTripScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [destination, setDestination] = useState('');
  const [country, setCountry] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');
  const [coverPhotoUri, setCoverPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickCoverPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setCoverPhotoUri(result.assets[0].uri);
    }
  };

  const handleCreate = async () => {
    if (!destination.trim()) {
      setError('Destination is required.');
      return;
    }

    if (!user) {
      setError('You must be signed in to create a trip.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const trip = await createTrip({
        destination,
        country,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        description,
        coverPhotoUri: coverPhotoUri ?? undefined,
        createdBy: user.id,
      });

      router.replace(`/trip/${trip.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create trip');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled">
        <Text style={styles.intro}>Start a new chapter of your travel story.</Text>

        <Pressable onPress={pickCoverPhoto} style={styles.coverPicker}>
          {coverPhotoUri ? (
            <Image source={{ uri: coverPhotoUri }} style={styles.coverImage} contentFit="cover" />
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
            placeholder="2026-03-14"
            autoCapitalize="none"
          />
          <Input
            label="End date"
            value={endDate}
            onChangeText={setEndDate}
            placeholder="2026-03-19"
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

        <Button title="Create Trip" onPress={handleCreate} loading={loading} fullWidth />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
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
