import { View, Text, TextInput, Pressable, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { supabase } from '@/services/supabase/client';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert('Hiányzó adatok', 'Töltsd ki az összes mezőt!');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Gyenge jelszó', 'A jelszónak legalább 8 karakternek kell lennie!');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: { display_name: name.trim() },
        },
      });

      if (error) {
        const msg = error.message.toLowerCase();
        let magyarUzenet = error.message;
        if (msg.includes('rate limit') || msg.includes('email rate')) {
          magyarUzenet =
            'Túl sok regisztrációs kísérlet rövid időn belül.\nKérjük várj néhány percet, majd próbáld újra!';
        } else if (msg.includes('already registered') || msg.includes('already been registered')) {
          magyarUzenet = 'Ez az email cím már regisztrálva van!';
        } else if (msg.includes('invalid email')) {
          magyarUzenet = 'Érvénytelen email cím formátum!';
        } else if (msg.includes('weak password') || msg.includes('password')) {
          magyarUzenet = 'A jelszó túl gyenge. Használj legalább 8 karaktert, számot és betűt!';
        }
        Alert.alert('Regisztrációs hiba', magyarUzenet);
        return;
      }

      if (data.user) {
        if (!data.session) {
          // Email-megerősítés be van kapcsolva a Supabase-ben.
          // Nincs azonnal session → a felhasználónak meg kell erősítenie az emailjét.
          Alert.alert(
            'Ellenőrizd az emailedet! 📧',
            `Küldtünk egy megerősítő linket a(z) ${email.trim()} címre.\n\nKattints a linkre, majd lépj be!`,
            [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }],
          );
          return;
        }

        // Session megvan → profil upsert (INSERT policy + trigger fallback)
        await supabase
          .from('profiles')
          .upsert(
            { id: data.user.id, display_name: name.trim() },
            { onConflict: 'id' },
          );

        router.replace('/(auth)/onboarding/1');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Fiók létrehozása</Text>
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Teljes neved"
            placeholderTextColor="#9CA3AF"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
          <TextInput
            style={styles.input}
            placeholder="Email cím"
            placeholderTextColor="#9CA3AF"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TextInput
            style={styles.input}
            placeholder="Jelszó (min. 8 karakter)"
            placeholderTextColor="#9CA3AF"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <Pressable style={[styles.btn, loading && styles.btnDisabled]} onPress={handleRegister} disabled={loading}>
            <Text style={styles.btnText}>{loading ? 'Fiók létrehozása...' : 'Regisztráció'}</Text>
          </Pressable>
        </View>
        <Pressable onPress={() => router.push('/(auth)/login')}>
          <Text style={styles.link}>Már van fiókom → Bejelentkezés</Text>
        </Pressable>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 24, justifyContent: 'center', gap: 24 },
  title: { fontSize: 28, fontWeight: '800', color: '#111827', textAlign: 'center' },
  form: { gap: 12 },
  input: { backgroundColor: 'white', borderRadius: 12, padding: 14, fontSize: 15, borderWidth: 1, borderColor: '#E5E7EB', color: '#111827' },
  btn: { backgroundColor: '#4F46E5', borderRadius: 14, padding: 15, alignItems: 'center' },
  btnDisabled: { backgroundColor: '#A5B4FC' },
  btnText: { color: 'white', fontSize: 16, fontWeight: '700' },
  link: { color: '#4F46E5', textAlign: 'center', fontSize: 14 },
});
