import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';

// Ez a modal akkor jelenik meg, amikor Apple Pay tranzakciót észlel az app
export default function ApplePayDetectedModal() {
  return (
    <View style={styles.container}>
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.emoji}>💳</Text>
        <Text style={styles.title}>Apple Pay tranzakció észlelve</Text>
        <Text style={styles.amount}>3 500 Ft</Text>
        <Text style={styles.merchant}>Starbucks · Váci utca</Text>
        <Text style={styles.sub}>Rögzíted ezt a kiadást?</Text>
        <View style={styles.actions}>
          <Pressable style={styles.btnPrimary} onPress={() => { router.back(); router.push('/modals/quick-add'); }}>
            <Text style={styles.btnPrimaryText}>✓ Igen, rögzítem</Text>
          </Pressable>
          <Pressable style={styles.btnSecondary} onPress={() => router.back()}>
            <Text style={styles.btnSecondaryText}>Kihagyom</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { backgroundColor: 'white', borderRadius: 24, padding: 20, paddingBottom: 40, alignItems: 'center', gap: 8 },
  handle: { width: 36, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, marginBottom: 8 },
  emoji: { fontSize: 40, marginBottom: 4 },
  title: { fontSize: 16, fontWeight: '700', color: '#111827' },
  amount: { fontSize: 32, fontWeight: '500', color: '#111827', fontVariant: ['tabular-nums'] },
  merchant: { fontSize: 14, color: '#6B7280' },
  sub: { fontSize: 14, color: '#111827', marginTop: 8 },
  actions: { width: '100%', gap: 10, marginTop: 8 },
  btnPrimary: { backgroundColor: '#4F46E5', borderRadius: 14, padding: 15, alignItems: 'center' },
  btnPrimaryText: { color: 'white', fontSize: 16, fontWeight: '700' },
  btnSecondary: { borderRadius: 14, padding: 12, alignItems: 'center' },
  btnSecondaryText: { color: '#6B7280', fontSize: 15 },
});
