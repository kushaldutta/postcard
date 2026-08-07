import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { BucketListCategoryPicker } from '@/components/ui/BucketListCategoryPicker';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { theme } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { createBucketListItem } from '@/lib/bucket-list';
import { BucketListCategory } from '@/lib/database.types';

export default function NewBucketListItemScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [destination, setDestination] = useState('');
  const [country, setCountry] = useState('');
  const [category, setCategory] = useState<BucketListCategory>('day_activity');
  const [whyWeWantToGo, setWhyWeWantToGo] = useState('');
  const [notes, setNotes] = useState('');
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
      setError('You must be signed in.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createBucketListItem({
        destination,
        country,
        category,
        whyWeWantToGo,
        notes,
        coverPhotoUri: coverPhotoUri ?? undefined,
        userId: user.id,
      });
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add destination');
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
        <Text style={styles.intro}>
          Dream it up. Where do you want to go together?
        </Text>

        <Pressable onPress={pickCoverPhoto} style={styles.coverPicker}>
          {coverPhotoUri ? (
            <Image source={{ uri: coverPhotoUri }} style={styles.coverImage} contentFit="cover" />
          ) : (
            <View style={styles.coverPlaceholder}>
              <Text style={styles.coverEmoji}>📷</Text>
              <Text style={styles.coverLabel}>Add an inspiration photo</Text>
            </View>
          )}
        </Pressable>

        <View style={styles.form}>
          <BucketListCategoryPicker value={category} onChange={setCategory} />
          <Input
            label="Destination *"
            value={destination}
            onChangeText={setDestination}
            placeholder={
              category === 'day_activity'
                ? 'Half Moon Bay'
                : category === 'international'
                  ? 'Tokyo'
                  : 'Yosemite'
            }
          />
          <Input
            label="Country"
            value={country}
            onChangeText={setCountry}
            placeholder={category === 'international' ? 'Japan' : 'USA'}
          />
          <Input
            label="Why we want to go"
            value={whyWeWantToGo}
            onChangeText={setWhyWeWantToGo}
            placeholder="Cherry blossoms, Kyoto temples, authentic ramen..."
            multiline
            numberOfLines={3}
            style={styles.textArea}
          />
          <Input
            label="Notes"
            value={notes}
            onChangeText={setNotes}
            placeholder="Best time to visit, things to do, travel tips..."
            multiline
            numberOfLines={3}
            style={styles.textArea}
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button title="Add to Bucket List" onPress={handleCreate} loading={loading} fullWidth />
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
    height: 160,
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
