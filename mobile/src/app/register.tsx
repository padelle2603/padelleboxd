import { Stack, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button, Screen } from '@/components/ui';
import { apiFetch, ApiError } from '@/lib/api';
import { Colors, Radius, Spacing } from '@/constants/theme';

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }
    if (!/^[\w-]+$/.test(username.trim())) {
      setError('Username can only contain letters, numbers, _ and -');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter a valid email address');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username: username.trim(), email: email.trim(), password }),
      });
      setSuccess('Account created. Waiting for an administrator to approve it.');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: true, title: 'Create account', headerBackTitle: 'Back' }} />
      <View style={styles.container}>
        <Text style={styles.heading}>Join PadelleBoxd</Text>
        <Text style={styles.subheading}>
          Accounts need to be approved by an administrator before you can log in.
        </Text>

        {success ? (
          <View style={styles.successPanel}>
            <Text style={styles.successText}>{success}</Text>
            <Button label="Go to login" onPress={() => router.replace('/login')} />
          </View>
        ) : (
          <>
            <TextInput
              value={username}
              onChangeText={setUsername}
              placeholder="Username"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
              editable={!busy}
            />
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              style={styles.input}
              editable={!busy}
            />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password (min 8 characters)"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry
              style={styles.input}
              editable={!busy}
              onSubmitEditing={submit}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button label="Create account" onPress={submit} busy={busy} />
          </>
        )}

        {!success && (
          <Pressable onPress={() => router.replace('/login')} disabled={busy} style={{ alignSelf: 'center' }}>
            <Text style={styles.link}>Already have an account? Log in</Text>
          </Pressable>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  heading: {
    color: Colors.text,
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: Spacing.four,
  },
  subheading: {
    color: Colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: Spacing.three,
  },
  input: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.text,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three + 2,
    fontSize: 15,
  },
  error: {
    color: Colors.danger,
    fontSize: 13,
    textAlign: 'center',
  },
  successPanel: {
    gap: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.4)',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderRadius: Radius.lg,
    padding: Spacing.four,
  },
  successText: {
    color: Colors.emerald,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  link: {
    color: Colors.accentText,
    fontSize: 14,
    fontWeight: '600',
    padding: Spacing.two,
  },
});