import { Stack, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button, Screen } from '@/components/ui';
import { useAuth } from '@/lib/auth-context';
import { Colors, Radius, Spacing } from '@/constants/theme';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!identifier.trim() || !password) return;
    setBusy(true);
    setError(null);
    const result = await signIn(identifier.trim(), password);
    setBusy(false);
    if (result.ok) {
      router.replace('/my-list');
    } else {
      setError(result.error);
    }
  }

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: true, title: 'Log in', headerBackTitle: 'Back' }} />
      <View style={styles.container}>
        <Text style={styles.heading}>Welcome back</Text>
        <Text style={styles.subheading}>Log in to manage your list.</Text>

        <TextInput
          value={identifier}
          onChangeText={setIdentifier}
          placeholder="Username or email"
          placeholderTextColor={Colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
          editable={!busy}
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor={Colors.textMuted}
          secureTextEntry
          style={styles.input}
          editable={!busy}
          onSubmitEditing={submit}
        />

        {error ? (
          <Text style={styles.error}>{error}</Text>
        ) : null}

        <Button label="Log in" onPress={submit} busy={busy} />

        <Pressable onPress={() => router.push('/register')} disabled={busy} style={{ alignSelf: 'center' }}>
          <Text style={styles.link}>Create an account</Text>
        </Pressable>
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
  link: {
    color: Colors.accentText,
    fontSize: 14,
    fontWeight: '600',
    padding: Spacing.two,
  },
});