import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.logo}>💸</Text>
        <Text style={styles.title}>Nexpense</Text>
        <Text style={styles.subtitle}>Tudatos pénzköltés, AI segítséggel</Text>
      </View>
      <View style={styles.actions}>
        <Pressable style={styles.btnPrimary} onPress={() => router.push('/(auth)/register')}>
          <Text style={styles.btnPrimaryText}>Kezdés</Text>
        </Pressable>
        <Pressable style={styles.btnSecondary} onPress={() => router.push('/(auth)/login')}>
          <Text style={styles.btnSecondaryText}>Már van fiókom</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#4F46E5', justifyContent: 'space-between', padding: 24 },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  logo: { fontSize: 72 },
  title: { fontSize: 40, fontWeight: '800', color: 'white' },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.75)', textAlign: 'center' },
  actions: { gap: 12 },
  btnPrimary: { backgroundColor: 'white', borderRadius: 14, padding: 16, alignItems: 'center' },
  btnPrimaryText: { fontSize: 16, fontWeight: '700', color: '#4F46E5' },
  btnSecondary: { borderRadius: 14, padding: 16, alignItems: 'center' },
  btnSecondaryText: { fontSize: 16, fontWeight: '600', color: 'rgba(255,255,255,0.85)' },
});
