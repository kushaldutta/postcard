import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet } from 'react-native';

import { theme } from '@/constants/theme';
import { useAuth } from '@/lib/auth';

export function SignOutButton() {
  const { signOut, profile } = useAuth();
  const [loading, setLoading] = useState(false);

  const confirmSignOut = () => {
    Alert.alert(
      'Sign out',
      profile?.display_name ? `Sign out of ${profile.display_name}'s account?` : 'Sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign out',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            await signOut();
            setLoading(false);
          },
        },
      ]
    );
  };

  return (
    <Pressable
      onPress={confirmSignOut}
      disabled={loading}
      hitSlop={12}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      <Ionicons name="log-out-outline" size={24} color={theme.colors.accent} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    marginRight: theme.spacing.md,
  },
  pressed: {
    opacity: 0.6,
  },
});
