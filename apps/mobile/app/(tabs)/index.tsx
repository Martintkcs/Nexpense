import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

// TODO: Importálni ezeket a saját komponensekből:
// import { DonutChart } from '@/components/charts/DonutChart';
// import { AIInsightCard } from '@/components/ai/SpendingInsightCard';
// import { ExpenseList } from '@/components/expenses/ExpenseList';
// import { useExpenses } from '@/hooks/useExpenses';

export default function DashboardScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <View>
            <Text style={styles.greeting}>Jó reggelt,</Text>
            <Text style={styles.name}>Kis Martin 👋</Text>
          </View>
        </View>

        {/* Total */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>FEBRUÁR ÖSSZES KIADÁS</Text>
          <Text style={styles.totalAmount}>127 450 Ft</Text>
          <View style={styles.changeBadge}>
            <Text style={styles.changeText}>↓ 12% az előző hónaphoz képest</Text>
          </View>
        </View>

        <View style={styles.content}>
          {/* Progress */}
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.cardTitle}>Havi büdzsé</Text>
              <Text style={styles.cardSub}>150 000 Ft keret</Text>
            </View>
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, { width: '85%' }]} />
            </View>
            <View style={styles.row}>
              <Text style={styles.progressLabel}>127 450 Ft elköltve</Text>
              <Text style={styles.progressLabel}>22 550 Ft maradt</Text>
            </View>
          </View>

          {/* AI Insight */}
          <View style={styles.aiCard}>
            <Text style={styles.aiLabel}>✨ AI ELEMZÉS</Text>
            <Text style={styles.aiText}>
              Étkezésre <Text style={{ fontWeight: '700' }}>23%-kal többet</Text> költöttél januárhoz képest. Főleg hétvégén jelenik meg a különbség.
            </Text>
          </View>

          {/* Recent expenses */}
          <View style={styles.section}>
            <View style={styles.row}>
              <Text style={styles.sectionTitle}>Legutóbbi kiadások</Text>
              <Pressable onPress={() => router.push('/(tabs)/expenses')}>
                <Text style={styles.link}>Mind →</Text>
              </Pressable>
            </View>
            {/* TODO: <ExpenseList limit={5} /> */}
            <Text style={styles.placeholder}>← Kiadások itt fognak megjelenni</Text>
          </View>
        </View>
      </ScrollView>

      {/* FAB */}
      <Pressable style={styles.fab} onPress={() => router.push('/modals/quick-add')}>
        <Text style={styles.fabIcon}>+</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2F2F7' },
  hero: { backgroundColor: '#4F46E5', padding: 20, paddingBottom: 32, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  name: { fontSize: 20, fontWeight: '700', color: 'white' },
  totalCard: { backgroundColor: '#4F46E5', paddingHorizontal: 20, paddingBottom: 24 },
  totalLabel: { fontSize: 11, color: 'rgba(255,255,255,0.65)', letterSpacing: 0.5, fontWeight: '600' },
  totalAmount: { fontSize: 36, fontWeight: '500', color: 'white', fontVariant: ['tabular-nums'] },
  changeBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginTop: 8 },
  changeText: { fontSize: 12, color: 'white', fontWeight: '500' },
  content: { padding: 16, gap: 10, marginTop: -12 },
  card: { backgroundColor: 'white', borderRadius: 14, padding: 14, gap: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 13, fontWeight: '600', color: '#111827' },
  cardSub: { fontSize: 12, color: '#6B7280' },
  progressBg: { height: 7, backgroundColor: '#F3F4F6', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#4F46E5', borderRadius: 4 },
  progressLabel: { fontSize: 11, color: '#9CA3AF' },
  aiCard: { backgroundColor: '#EEF2FF', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: 'rgba(99,102,241,0.2)' },
  aiLabel: { fontSize: 10, fontWeight: '700', color: '#4F46E5', letterSpacing: 0.5, marginBottom: 4 },
  aiText: { fontSize: 13, color: '#111827', lineHeight: 19 },
  section: { gap: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  link: { fontSize: 13, color: '#4F46E5', fontWeight: '500' },
  placeholder: { color: '#9CA3AF', fontSize: 13, textAlign: 'center', paddingVertical: 20, backgroundColor: 'white', borderRadius: 14 },
  fab: { position: 'absolute', bottom: 20, right: 20, width: 52, height: 52, backgroundColor: '#4F46E5', borderRadius: 26, alignItems: 'center', justifyContent: 'center', shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  fabIcon: { fontSize: 24, color: 'white', fontWeight: '300', lineHeight: 28 },
});
