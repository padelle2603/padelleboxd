import { router } from 'expo-router';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Button, Screen } from '@/components/ui';
import { useAuth } from '@/lib/auth-context';
import { API_URL } from '@/lib/config';
import { Colors, Radius, Spacing } from '@/constants/theme';

export default function SettingsScreen() {
  const { user, loading, signOut } = useAuth();

  async function confirmSignOut() {
    await signOut();
  }

  function onSignOut() {
    Alert.alert('Log out', 'Sign out of PadelleBoxd on this device?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: confirmSignOut },
    ]);
  }

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.title}>Settings</Text>

        {loading ? null : user ? (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>ACCOUNT</Text>
            <Text style={styles.username}>@{user.username}</Text>
            <Text style={styles.role}>{user.role === 'ADMIN' ? 'Administrator' : user.role.toLowerCase()}</Text>

            <Button
              label="View my public profile"
              variant="ghost"
              onPress={() => router.push(`/u/${user.username}`)}
              style={styles.gap}
            />

            <Button label="Log out" variant="danger" onPress={onSignOut} style={styles.gap} />
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>ACCOUNT</Text>
            <Text style={styles.role}>Not logged in</Text>
            <Button label="Log in" onPress={() => router.push('/login')} style={styles.gap} />
            <Button label="Create an account" variant="ghost" onPress={() => router.push('/register')} style={styles.gap} />
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardLabel}>APP</Text>
          <Text style={styles.role}>
            PadelleBoxd mobile — TV series tracker powered by the PadelleBoxd API & TMDB.
          </Text>
          <Text style={styles.apiUrl}>API: {API_URL}</Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.three,
    gap: Spacing.three,
  },
  title: {
    color: Colors.text,
    fontSize: 28,
    fontWeight: '800',
    marginTop: Spacing.three,
  },
  card: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  cardLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  username: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  role: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  apiUrl: {
    color: Colors.textMuted,
    fontSize: 11,
  },
  gap: {
    marginTop: Spacing.two,
  },
});