import { StyleSheet, Text, View } from 'react-native';

import { theme } from '@/constants/theme';
import { getInitials } from '@/lib/format';

type AvatarProps = {
  name?: string | null;
  email?: string;
  size?: number;
};

export function Avatar({ name, email, size = 36 }: AvatarProps) {
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.text, { fontSize: size * 0.35 }]}>
        {getInitials(name, email)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: theme.colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: theme.fonts.bodySemiBold,
    color: theme.colors.accent,
  },
});
