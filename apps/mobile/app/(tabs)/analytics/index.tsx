import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PERIODS = ['Hét', 'Hónap', 'Év'];
const CATEGORIES = [
  { emoji: '🍽️', name: 'Étel & Ital', count: 18, amount: '48 340 Ft', pct: 38, color: '#F97316', barW: '100%' },
  { emoji: '🚌', name: 'Transport', count: 5, amount: '29 800 Ft', pct: 23, color: '#3B82F6', barW: '60%' },
  { emoji: '🛍️', name: 'Vásárlás', count: 7, amount: '22 990 Ft', pct: 18, color: '#EC4899', barW: '47%' },
  { emoji: '🎬', name: 'Szórakozás', count: 4, amount: '14 920 Ft', pct: 12, color: '#8B5CF6', barW: '31%' },
  { emoji: '⚡', name: 'Lakás & Rezsi', count: 2, amount: '11 400 Ft', pct: 9, color: '#6366F1', barW: '23%' },
];

export default function AnalyticsScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Kimutatások</Text>
        <Text style={styles.subtitle}>Február 2026</Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Period selector */}
        <View style={styles.periodSel}>
          {PERIODS.map((p, i) => (
            <Pressable key={p} style={[styles.periodOpt, i === 1 && styles.periodOptActive]}>
              <Text style={[styles.periodText, i === 1 && styles.periodTextActive]}>{p}</Text>
            </Pressable>
          ))}
        </View>

        {/* Summary */}
        <View style={[styles.card, { alignItems: 'center', paddingVertical: 20 }]}>
          <Text style={styles.sumLabel}>ÖSSZES KIADÁS</Text>
          <Text style={styles.sumTotal}>127 450 Ft</Text>
          <View style={styles.changePill}>
            <Text style={styles.changeText}>↓ 12 340 Ft kevesebb mint januárban</Text>
          </View>
        </View>

        {/* Bar chart placeholder */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Napi kiadások (február)</Text>
          <View style={styles.bars}>
            {[35, 55, 20, 80, 65, 45, 30, 50, 40, 70, 25, 60, 90, 15, 42].map((h, i) => (
              <View key={i} style={styles.barCol}>
                <View style={[styles.barFill, { height: `${h}%`, backgroundColor: i === 14 ? '#4F46E5' : '#E5E7EB' }]} />
                {i === 14 && <View style={styles.barToday} />}
              </View>
            ))}
          </View>
          <Text style={styles.barLegend}>Ma ↑</Text>
        </View>

        {/* Category breakdown */}
        <View style={styles.card}>
          <Text style={[styles.cardTitle, { padding: 14, paddingBottom: 8 }]}>Kategória részletezés</Text>
          {CATEGORIES.map((cat, i) => (
            <View key={cat.name} style={[styles.catRow, i < CATEGORIES.length - 1 && styles.catRowBorder]}>
              <View style={styles.catIco}><Text>{cat.emoji}</Text></View>
              <View style={styles.catInfo}>
                <Text style={styles.catName}>{cat.name}</Text>
                <Text style={styles.catCount}>{cat.count} tranzakció</Text>
                <View style={styles.catBarBg}>
                  <View style={[styles.catBarFill, { width: cat.barW as any, backgroundColor: cat.color }]} />
                </View>
              </View>
              <View>
                <Text style={styles.catAmt}>{cat.amount}</Text>
                <Text style={styles.catPct}>{cat.pct}%</Text>
              </View>
            </View>
          ))}
        </View>

        {/* AI insight */}
        <View style={styles.aiCard}>
          <Text style={styles.aiLabel}>📊 HAVI ÖSSZEFOGLALÓ</Text>
          <Text style={styles.aiText}>
            Péntekeken átlagosan <Text style={{ fontWeight: '700' }}>3x annyit</Text> költesz mint hétköznapokon. A legtöbb kiadás 12:00–14:00 között és 18:00–20:00 után jelenik meg.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2F2F7' },
  header: { backgroundColor: 'white', padding: 16, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  title: { fontSize: 22, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  content: { padding: 16, gap: 10, paddingBottom: 20 },
  periodSel: { flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: 11, padding: 3 },
  periodOpt: { flex: 1, alignItems: 'center', paddingVertical: 7, borderRadius: 9 },
  periodOptActive: { backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: 2 },
  periodText: { fontSize: 13, fontWeight: '500', color: '#6B7280' },
  periodTextActive: { fontWeight: '700', color: '#111827' },
  card: { backgroundColor: 'white', borderRadius: 14, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 2 },
  sumLabel: { fontSize: 11, color: '#6B7280', letterSpacing: 0.7, fontWeight: '600' },
  sumTotal: { fontSize: 30, fontWeight: '500', color: '#111827', marginTop: 4, fontVariant: ['tabular-nums'] },
  changePill: { marginTop: 6, backgroundColor: '#D1FAE5', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16 },
  changeText: { fontSize: 12, fontWeight: '600', color: '#065F46' },
  cardTitle: { fontSize: 13, fontWeight: '600', color: '#111827', marginBottom: 12 },
  bars: { flexDirection: 'row', alignItems: 'flex-end', height: 72, gap: 4 },
  barCol: { flex: 1, height: '100%', justifyContent: 'flex-end' },
  barFill: { borderRadius: 3, minHeight: 4 },
  barToday: {},
  barLegend: { fontSize: 10, color: '#4F46E5', fontWeight: '700', textAlign: 'right', marginTop: 4 },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 12 },
  catRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  catIco: { width: 38, height: 38, backgroundColor: '#F9FAFB', borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  catInfo: { flex: 1 },
  catName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  catCount: { fontSize: 11, color: '#6B7280', marginTop: 1 },
  catBarBg: { height: 3, backgroundColor: '#F3F4F6', borderRadius: 2, marginTop: 5, overflow: 'hidden' },
  catBarFill: { height: '100%', borderRadius: 2 },
  catAmt: { fontSize: 14, fontWeight: '500', color: '#111827', textAlign: 'right', fontVariant: ['tabular-nums'] },
  catPct: { fontSize: 11, color: '#6B7280', textAlign: 'right', marginTop: 1 },
  aiCard: { backgroundColor: '#EEF2FF', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: 'rgba(99,102,241,0.2)' },
  aiLabel: { fontSize: 10, fontWeight: '700', color: '#4F46E5', marginBottom: 6 },
  aiText: { fontSize: 13, color: '#111827', lineHeight: 19 },
});
