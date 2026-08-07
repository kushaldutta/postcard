import { Pressable, StyleSheet, Text, View } from 'react-native';

import { theme } from '@/constants/theme';
import { BUCKET_LIST_CATEGORIES } from '@/lib/bucket-list-categories';
import { BucketListCategory } from '@/lib/database.types';

type BucketListCategoryPickerProps = {
  value: BucketListCategory;
  onChange: (category: BucketListCategory) => void;
};

export function BucketListCategoryPicker({ value, onChange }: BucketListCategoryPickerProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>Category</Text>
      <View style={styles.options}>
        {BUCKET_LIST_CATEGORIES.map((cat) => {
          const selected = value === cat.value;
          return (
            <Pressable
              key={cat.value}
              onPress={() => onChange(cat.value)}
              style={[styles.option, selected && styles.optionSelected]}>
              <Text style={styles.emoji}>{cat.emoji}</Text>
              <View style={styles.optionText}>
                <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                  {cat.label}
                </Text>
                <Text style={[styles.optionDescription, selected && styles.optionDescriptionSelected]}>
                  {cat.description}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: theme.spacing.sm,
  },
  label: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 14,
    color: theme.colors.secondary,
  },
  options: {
    gap: theme.spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  optionSelected: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.accentSoft,
  },
  emoji: {
    fontSize: 22,
    lineHeight: 26,
  },
  optionText: {
    flex: 1,
    gap: 2,
  },
  optionLabel: {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 15,
    color: theme.colors.text,
  },
  optionLabelSelected: {
    color: theme.colors.accentDark,
  },
  optionDescription: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    color: theme.colors.textMuted,
    lineHeight: 18,
  },
  optionDescriptionSelected: {
    color: theme.colors.secondary,
  },
});
