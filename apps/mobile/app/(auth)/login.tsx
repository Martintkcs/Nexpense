import { View, Text, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    // TODO: Supabase auth.signInWithPassword
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.replace('/(tabs)');
    }, 1000);
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Bejelentkezés</Text>
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email cím"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Jelszó"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <Pressable style={styles.btn} onPress={handleLogin} disabled={loading}>
          <Text style={styles.btnText}>{loading ? 'Betöltés...' : 'Bejelentkezés'}</Text>
        </Pressable>
      </View>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.link}>← Vissza</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 24, justifyContent: 'center', gap: 24 },
  title: { fontSize: 28, fontWeight: '800', color: '#111827', textAlign: 'center' },
  form: { gap: 12 },
  input: { backgroundColor: 'white', borderRadius: 12, padding: 14, fontSize: 15, borderWidth: 1, borderColor: '#E5E7EB' },
  btn: { backgroundColor: '#4F46E5', borderRadius: 14, padding: 15, alignItems: 'center' },
  btnText: { color: 'white', fontSize: 16, fontWeight: '700' },
  link: { color: '#4F46E5', textAlign: 'center', fontSize: 15 },
});
