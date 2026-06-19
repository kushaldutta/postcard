import { Link, useRouter } from 'expo-router';
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
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { theme } from '@/constants/theme';
import { useAuth } from '@/lib/auth';

export default function SignupScreen() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!displayName.trim() || !email.trim() || !password) {
      setError('Please fill in all fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setError(null);

    const result = await signUp(email.trim(), password, displayName.trim());
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.logo}>Start your story</Text>
            <Text style={styles.tagline}>Create an account to begin collecting memories</Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Your name"
              value={displayName}
              onChangeText={setDisplayName}
              autoComplete="name"
              placeholder="What should we call you?"
            />
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              placeholder="you@example.com"
            />
            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="new-password"
              placeholder="At least 6 characters"
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Button title="Create Account" onPress={handleSignup} loading={loading} fullWidth />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <Link href="/(auth)/login" asChild>
              <Pressable>
                <Text style={styles.link}>Sign in</Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  flex: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    padding: theme.spacing.lg,
    justifyContent: 'center',
    gap: theme.spacing.xl,
  },
  header: {
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  logo: {
    fontFamily: theme.fonts.heading,
    fontSize: 32,
    color: theme.colors.text,
    textAlign: 'center',
  },
  tagline: {
    fontFamily: theme.fonts.body,
    fontSize: 16,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    gap: theme.spacing.md,
  },
  error: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.error,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  footerText: {
    fontFamily: theme.fonts.body,
    fontSize: 15,
    color: theme.colors.textMuted,
  },
  link: {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 15,
    color: theme.colors.accent,
  },
});
