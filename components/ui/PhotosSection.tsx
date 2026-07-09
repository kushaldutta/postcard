import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Keyboard,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { theme } from '@/constants/theme';
import { PhotoDayGroup, TripPhoto } from '@/lib/database.types';
import { formatDayHeading, getInitials } from '@/lib/format';
import {
  addTripPhotos,
  deleteTripPhoto,
  groupPhotosByDay,
  togglePhotoFavorite,
  updatePhotoCaption,
} from '@/lib/photos';

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_GAP = 4;
const GRID_COLUMNS = 3;
const SECTION_PADDING = theme.spacing.md * 2;
const THUMB_SIZE = (SCREEN_WIDTH - SECTION_PADDING - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS;

type PhotosSectionProps = {
  tripId: string;
  userId: string;
  canContribute: boolean;
  photos: TripPhoto[];
  onPhotosChange: (photos: TripPhoto[]) => void;
  // Optional: set to open the viewer at a specific index from outside the component
  viewerStartIndex?: number | null;
  onViewerDismiss?: () => void;
};

export function PhotosSection({
  tripId,
  userId,
  canContribute,
  photos,
  onPhotosChange,
  viewerStartIndex,
  onViewerDismiss,
}: PhotosSectionProps) {
  const [uploading, setUploading] = useState(false);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [editingCaption, setEditingCaption] = useState(false);
  const [captionDraft, setCaptionDraft] = useState('');
  const [savingCaption, setSavingCaption] = useState(false);
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<TripPhoto>>(null);
  const captionInputRef = useRef<TextInput>(null);

  const groups: PhotoDayGroup[] = groupPhotosByDay(photos);
  const viewer = viewerIndex !== null ? photos[viewerIndex] ?? null : null;

  // Allow parent to open the viewer at a specific index (e.g. from timeline thumbnails)
  useEffect(() => {
    if (viewerStartIndex !== null && viewerStartIndex !== undefined && viewerStartIndex >= 0) {
      setViewerIndex(viewerStartIndex);
    }
  }, [viewerStartIndex]);

  const closeViewer = useCallback(() => {
    setViewerIndex(null);
    setEditingCaption(false);
    setCaptionDraft('');
    onViewerDismiss?.();
  }, [onViewerDismiss]);

  const openViewer = useCallback(
    (photo: TripPhoto) => {
      const index = photos.findIndex((p) => p.id === photo.id);
      if (index >= 0) setViewerIndex(index);
    },
    [photos]
  );

  const onViewerScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
      setViewerIndex(index);
      setEditingCaption(false);
      setCaptionDraft('');
    },
    []
  );

  const startEditCaption = useCallback((photo: TripPhoto) => {
    setCaptionDraft(photo.caption ?? '');
    setEditingCaption(true);
    setTimeout(() => captionInputRef.current?.focus(), 100);
  }, []);

  const saveCaption = useCallback(
    async (photo: TripPhoto) => {
      Keyboard.dismiss();
      setEditingCaption(false);
      const trimmed = captionDraft.trim() || null;
      onPhotosChange(
        photos.map((p) => (p.id === photo.id ? { ...p, caption: trimmed } : p))
      );
      setSavingCaption(true);
      try {
        await updatePhotoCaption(photo.id, trimmed);
      } catch {
        onPhotosChange(
          photos.map((p) => (p.id === photo.id ? { ...p, caption: photo.caption } : p))
        );
      } finally {
        setSavingCaption(false);
      }
    },
    [captionDraft, photos, onPhotosChange]
  );

  // Extract EXIF taken-date from a picked asset; fall back to today.
  const extractTakenOn = (asset: ImagePicker.ImagePickerAsset): string => {
    const exif = asset.exif as Record<string, unknown> | null | undefined;
    const raw = exif?.DateTimeOriginal ?? exif?.DateTime;
    if (typeof raw === 'string') {
      // EXIF format: "2026:03:22 14:35:00" → "2026-03-22"
      const datePart = raw.split(' ')[0].replace(/:/g, '-');
      if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return datePart;
    }
    return new Date().toISOString().slice(0, 10);
  };

  const handleAddPhotos = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow photo access to add photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 30,
      exif: true,
    });

    if (result.canceled || result.assets.length === 0) return;

    setUploading(true);
    try {
      const inputs = result.assets.map((a) => ({
        tripId,
        userId,
        uri: a.uri,
        takenOn: extractTakenOn(a),
      }));
      const added = await addTripPhotos(inputs);
      onPhotosChange([...added, ...photos]);
    } catch (err) {
      Alert.alert('Upload failed', err instanceof Error ? err.message : 'Could not add photos');
    } finally {
      setUploading(false);
    }
  }, [tripId, userId, photos, onPhotosChange]);

  const handleToggleFavorite = useCallback(
    async (photo: TripPhoto) => {
      const next = !photo.is_favorite;
      onPhotosChange(photos.map((p) => (p.id === photo.id ? { ...p, is_favorite: next } : p)));
      try {
        await togglePhotoFavorite(photo.id, next);
      } catch {
        onPhotosChange(
          photos.map((p) => (p.id === photo.id ? { ...p, is_favorite: photo.is_favorite } : p))
        );
      }
    },
    [photos, onPhotosChange]
  );

  const handleDelete = useCallback(
    (photo: TripPhoto) => {
      Alert.alert('Delete photo', 'Remove this photo from the trip?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            closeViewer();
            onPhotosChange(photos.filter((p) => p.id !== photo.id));
            try {
              await deleteTripPhoto(photo);
            } catch (err) {
              Alert.alert('Error', err instanceof Error ? err.message : 'Could not delete');
            }
          },
        },
      ]);
    },
    [photos, onPhotosChange, closeViewer]
  );

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Photos</Text>
        {canContribute ? (
          uploading ? (
            <ActivityIndicator color={theme.colors.accent} />
          ) : (
            <Button title="+ Add" variant="ghost" onPress={handleAddPhotos} />
          )
        ) : null}
      </View>

      {photos.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📷</Text>
          <Text style={styles.emptyText}>
            No photos yet. Add some to build this trip&apos;s album.
          </Text>
        </View>
      ) : (
        groups.map((group) => (
          <View key={group.date} style={styles.dayGroup}>
            <Text style={styles.dayHeading}>{formatDayHeading(group.date)}</Text>
            <View style={styles.grid}>
              {group.photos.map((photo) => (
                <Pressable key={photo.id} onPress={() => openViewer(photo)}>
                  <Image
                    source={{ uri: photo.public_url }}
                    style={styles.thumb}
                    contentFit="cover"
                    transition={150}
                  />
                  {photo.is_favorite ? (
                    <View style={styles.favoriteBadge}>
                      <Ionicons name="heart" size={12} color={theme.colors.textInverse} />
                    </View>
                  ) : null}
                </Pressable>
              ))}
            </View>
          </View>
        ))
      )}

      <Modal
        visible={viewer !== null}
        transparent
        animationType="fade"
        onRequestClose={closeViewer}>
        {viewer ? (
          <View style={styles.viewerBackdrop}>
            <FlatList
              ref={listRef}
              data={photos}
              keyExtractor={(item) => item.id}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              initialScrollIndex={viewerIndex ?? 0}
              getItemLayout={(_, index) => ({
                length: SCREEN_WIDTH,
                offset: SCREEN_WIDTH * index,
                index,
              })}
              onMomentumScrollEnd={onViewerScroll}
              renderItem={({ item }) => (
                <View style={styles.viewerPage}>
                  <Image
                    source={{ uri: item.public_url }}
                    style={styles.viewerImage}
                    contentFit="contain"
                  />
                </View>
              )}
            />

            {/* Header: notch-safe via manual inset padding */}
            <View style={[styles.viewerHeader, { paddingTop: insets.top + theme.spacing.sm }]}>
              <Pressable onPress={closeViewer} hitSlop={16} style={styles.iconButton}>
                <Ionicons name="close" size={28} color={theme.colors.textInverse} />
              </Pressable>
              <View style={styles.viewerActions}>
                <Pressable
                  onPress={() => handleToggleFavorite(viewer)}
                  hitSlop={16}
                  style={styles.iconButton}>
                  <Ionicons
                    name={viewer.is_favorite ? 'heart' : 'heart-outline'}
                    size={26}
                    color={viewer.is_favorite ? theme.colors.accent : theme.colors.textInverse}
                  />
                </Pressable>
                {viewer.user_id === userId ? (
                  <Pressable
                    onPress={() => handleDelete(viewer)}
                    hitSlop={16}
                    style={styles.iconButton}>
                    <Ionicons name="trash-outline" size={24} color={theme.colors.textInverse} />
                  </Pressable>
                ) : null}
              </View>
            </View>

            {/* Footer: author info + caption */}
            <View
              style={[
                styles.viewerFooter,
                { paddingBottom: insets.bottom + theme.spacing.md },
              ]}>
              <View style={styles.viewerMeta}>
                <View style={styles.viewerAvatar}>
                  <Text style={styles.viewerAvatarText}>
                    {getInitials(viewer.profile?.display_name, viewer.profile?.email)}
                  </Text>
                </View>
                <Text style={styles.viewerAuthor}>
                  {viewer.profile?.display_name ?? 'Traveler'}
                  {' · '}
                  {formatDayHeading(viewer.taken_on)}
                  {photos.length > 1 ? `  ·  ${(viewerIndex ?? 0) + 1}/${photos.length}` : ''}
                </Text>
              </View>

              {/* Caption row */}
              {editingCaption ? (
                <View style={styles.captionRow}>
                  <TextInput
                    ref={captionInputRef}
                    value={captionDraft}
                    onChangeText={setCaptionDraft}
                    placeholder="Add a caption…"
                    placeholderTextColor="rgba(250,246,240,0.4)"
                    style={styles.captionInput}
                    maxLength={200}
                    returnKeyType="done"
                    onSubmitEditing={() => saveCaption(viewer)}
                    onBlur={() => saveCaption(viewer)}
                    multiline={false}
                  />
                  {savingCaption ? (
                    <ActivityIndicator size="small" color={theme.colors.textInverse} />
                  ) : null}
                </View>
              ) : (
                <Pressable
                  onPress={() => (canContribute ? startEditCaption(viewer) : undefined)}
                  style={styles.captionRow}>
                  <Text style={[styles.captionText, !viewer.caption && styles.captionPlaceholder]}>
                    {viewer.caption ?? (canContribute ? 'Add a caption…' : '')}
                  </Text>
                  {canContribute ? (
                    <Ionicons
                      name="pencil-outline"
                      size={14}
                      color="rgba(250,246,240,0.5)"
                      style={styles.captionPencil}
                    />
                  ) : null}
                </Pressable>
              )}
            </View>
          </View>
        ) : (
          <View />
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    padding: theme.spacing.md,
    gap: theme.spacing.md,
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
  empty: {
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  emptyEmoji: {
    fontSize: 32,
  },
  emptyText: {
    fontFamily: theme.fonts.body,
    fontSize: 15,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  dayGroup: {
    gap: theme.spacing.sm,
  },
  dayHeading: {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 14,
    color: theme.colors.secondary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surfaceMuted,
  },
  favoriteBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.full,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(20, 16, 12, 0.97)',
  },
  viewerPage: {
    width: SCREEN_WIDTH,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerImage: {
    width: '100%',
    height: '100%',
  },
  viewerHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  iconButton: {
    padding: theme.spacing.xs,
  },
  viewerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.lg,
  },
  viewerFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
  },
  viewerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  viewerAvatar: {
    width: 32,
    height: 32,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerAvatarText: {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 12,
    color: theme.colors.accent,
  },
  viewerAuthor: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.textInverse,
  },
  captionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingVertical: 2,
  },
  captionText: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: 'rgba(250,246,240,0.85)',
    flexShrink: 1,
    fontStyle: 'italic',
  },
  captionPlaceholder: {
    color: 'rgba(250,246,240,0.35)',
    fontStyle: 'normal',
  },
  captionPencil: {
    flexShrink: 0,
  },
  captionInput: {
    flex: 1,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.textInverse,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(250,246,240,0.4)',
    paddingVertical: 2,
    fontStyle: 'italic',
  },
});
