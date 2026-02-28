import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    // TODO: Supabase auth.signUp + create profile
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.replace('/(auth)/onboarding/1');
    }, 1000);
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Fiók létrehozása</Text>
      <View style={styles.form}>
        <TextInput style={styles.input} placeholder="Teljes neved" value={name} onChangeText={setName} />
        <TextInput style={styles.input} placeholder="Email cím" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <TextInput style={styles.input} placeholder="Jelszó (min. 8 karakter)" value={password} onChangeText={setPassword} secureTextEntry />
        <Pressable style={styles.btn} onPress={handleRegister} disabled={loading}>
          <Text style={styles.btnText}>{loading ? 'Létrehozás...' : 'Regisztráció'}</Text>
        </Pressable>
      </View>
      <Pressable onPress={() => router.push('/(auth)/login')}>
        <Text style={styles.link}>Már van fiókom → Bejelentkezés</Text>
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
  link: { color: '#4F46E5', textAlign: 'center', fontSize: 14 },
});
