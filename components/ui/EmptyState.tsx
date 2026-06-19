import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { theme } from '@/constants/theme';

type EmptyStateProps = {
  emoji: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ emoji, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {actionLabel && onAction ? (
        <Button title={actionLabel} onPress={onAction} style={styles.button} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xxl,
  },
  emoji: {
    fontSize: 48,
    marginBottom: theme.spacing.md,
  },
  title: {
    fontFamily: theme.fonts.heading,
    fontSize: 24,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  description: {
    fontFamily: theme.fonts.body,
    fontSize: 16,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 24,
  },
  button: {
    marginTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
  },
});
