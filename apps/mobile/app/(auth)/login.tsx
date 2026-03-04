import { View, Text, TextInput, Pressable, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { supabase } from '@/services/supabase/client';
import { useColors } from '@/lib/useColors';

export default function LoginScreen() {
  const colors = useColors();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) {
      Alert.alert('Hiányzó adatok', 'Add meg az email címet és jelszót!');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    setLoading(false);

    if (error) {
      Alert.alert('Bejelentkezési hiba', 
        error.message === 'Invalid login credentials'
          ? 'Hibás email cím vagy jelszó.'
          : error.message
      );
    }
    // Sikeres login esetén az AuthProvider navigál automatikusan
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
        <Text style={[styles.title, { color: colors.text }]}>Bejelentkezés</Text>
        <View style={styles.form}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
            placeholder="Email cím"
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
            placeholder="Jelszó"
            placeholderTextColor={colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <Pressable style={[styles.btn, loading && styles.btnDisabled]} onPress={handleLogin} disabled={loading}>
            <Text style={styles.btnText}>{loading ? 'Bejelentkezés...' : 'Bejelentkezés'}</Text>
          </Pressable>
        </View>
        <Pressable onPress={() => router.back()}>
          <Text style={[styles.link, { color: colors.primary }]}>← Vissza</Text>
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
  link: { color: '#4F46E5', textAlign: 'center', fontSize: 15 },
});
