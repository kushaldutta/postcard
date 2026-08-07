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

import { BucketListCategoryPicker } from '@/components/ui/BucketListCategoryPicker';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { theme } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import {
  createTripFromBucketListItem,
  deleteBucketListItem,
  fetchBucketListItem,
  updateBucketListItem,
} from '@/lib/bucket-list';
import { BucketListCategory } from '@/lib/database.types';

export default function EditBucketListItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();

  const [loadingItem, setLoadingItem] = useState(true);
  const [destination, setDestination] = useState('');
  const [country, setCountry] = useState('');
  const [category, setCategory] = useState<BucketListCategory>('getaway');
  const [whyWeWantToGo, setWhyWeWantToGo] = useState('');
  const [notes, setNotes] = useState('');
  const [newCoverPhotoUri, setNewCoverPhotoUri] = useState<string | null>(null);
  const [existingCoverUrl, setExistingCoverUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [planning, setPlanning] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetchBucketListItem(id)
      .then((item) => {
        if (!item) return;
        setDestination(item.destination);
        setCountry(item.country ?? '');
        setCategory(item.category ?? 'getaway');
        setWhyWeWantToGo(item.why_we_want_to_go ?? '');
        setNotes(item.notes ?? '');
        setExistingCoverUrl(item.cover_photo_url);
      })
      .finally(() => setLoadingItem(false));
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
      await updateBucketListItem(id, user.id, {
        destination,
        country,
        category,
        whyWeWantToGo,
        notes,
        coverPhotoUri: newCoverPhotoUri ?? undefined,
      });
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleStartPlanning = async () => {
    if (!user || !id) return;

    setPlanning(true);
    setError(null);

    try {
      const item = await fetchBucketListItem(id);
      if (!item) {
        throw new Error('Destination not found');
      }

      const trip = await createTripFromBucketListItem(item, user.id);
      router.replace(`/trip/${trip.id}`);
    } catch (err) {
      Alert.alert(
        'Could not start trip',
        err instanceof Error ? err.message : 'Something went wrong'
      );
    } finally {
      setPlanning(false);
    }
  };

  const handleDelete = () => {
    if (!id) return;

    Alert.alert(
      'Remove destination',
      'Take this off your bucket list?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteBucketListItem(id);
              router.back();
            } catch (err) {
              Alert.alert('Error', err instanceof Error ? err.message : 'Could not remove');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  if (loadingItem) {
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
            placeholder="Japan"
          />
          <Input
            label="Country"
            value={country}
            onChangeText={setCountry}
            placeholder="Japan"
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

        <Button
          title="Start Planning"
          onPress={handleStartPlanning}
          loading={planning}
          fullWidth
        />
        <Button title="Save Changes" onPress={handleSave} loading={saving} fullWidth />
        <Button
          title="Remove from Bucket List"
          variant="danger"
          onPress={handleDelete}
          loading={deleting}
          fullWidth
        />
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
