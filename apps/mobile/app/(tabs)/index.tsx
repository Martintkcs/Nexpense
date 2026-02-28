import { View, Text, ScrollView, Pressable, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import { useMonthlyExpenses } from '@/hooks/useExpenses';
import { useCategories } from '@/hooks/useCategories';

const MONTH_NAMES = [
  'Január','Február','Március','Április','Május','Június',
  'Július','Augusztus','Szeptember','Október','November','December',
];

export default function DashboardScreen() {
  const { user } = useAuth();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const { data: monthlyExpenses = [], isLoading, isRefetching, refetch } = useMonthlyExpenses(year, month);
  const { categories } = useCategories();

  const monthlyTotal = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);
  const recentExpenses = monthlyExpenses.slice(0, 5);

  const getCat = (catId: string | null) => categories.find(c => c.id === catId);

  const displayName = (user?.user_metadata?.display_name as string | undefined)?.split(' ')[0] ?? 'Felhasználó';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#4F46E5" />
        }
      >
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.greeting}>Helló,</Text>
          <Text style={styles.name}>{displayName} 👋</Text>
        </View>

        {/* Total */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>{MONTH_NAMES[month - 1].toUpperCase()} ÖSSZES KIADÁS</Text>
          <Text style={styles.totalAmount}>
            {isLoading ? '...' : monthlyTotal.toLocaleString('hu-HU') + ' Ft'}
          </Text>
          <Text style={styles.totalSub}>{monthlyExpenses.length} tétel</Text>
        </View>

        <View style={styles.content}>
          {/* Recent */}
          <View style={styles.section}>
            <View style={styles.row}>
              <Text style={styles.sectionTitle}>Legutóbbi kiadások</Text>
              <Pressable onPress={() => router.push('/(tabs)/expenses')}>
                <Text style={styles.link}>Mind →</Text>
              </Pressable>
            </View>

            {isLoading ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>Betöltés...</Text>
              </View>
            ) : recentExpenses.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyEmoji}>💸</Text>
                <Text style={styles.emptyText}>Még nincs kiadás ebben a hónapban.</Text>
                <Text style={styles.emptyHint}>Nyomj a + gombra az első rögzítéséhez!</Text>
              </View>
            ) : (
              <View style={styles.card}>
                {recentExpenses.map((expense, i) => {
                  const cat = getCat(expense.category_id);
                  const isLast = i === recentExpenses.length - 1;
                  return (
                    <View
                      key={expense.id}
                      style={[styles.expenseRow, !isLast && styles.expenseRowBorder]}
                    >
                      <View style={[styles.expenseIcon, { backgroundColor: (cat?.color ?? '#6B7280') + '22' }]}>
                        <Text style={{ fontSize: 18 }}>{cat?.icon ?? '📦'}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.expenseName} numberOfLines={1}>
                          {expense.description ?? cat?.name_hu ?? 'Kiadás'}
                        </Text>
                        <Text style={styles.expenseDate}>
                          {new Date(expense.expense_date).toLocaleDateString('hu-HU', {
                            month: 'short', day: 'numeric',
                          })}
                        </Text>
                      </View>
                      <Text style={styles.expenseAmount}>
                        -{expense.amount.toLocaleString('hu-HU')} Ft
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {/* AI placeholder */}
          <View style={styles.aiCard}>
            <Text style={styles.aiLabel}>✨ AI ELEMZÉS</Text>
            <Text style={styles.aiText}>
              Rögzíts néhány kiadást, és az AI személyre szabott visszajelzést ad a költési szokásaidról!
            </Text>
          </View>
        </View>
      </ScrollView>

      <Pressable style={styles.fab} onPress={() => router.push('/modals/quick-add')}>
        <Text style={styles.fabIcon}>+</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2F2F7' },
  hero: { backgroundColor: '#4F46E5', padding: 20, paddingBottom: 8 },
  greeting: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  name: { fontSize: 20, fontWeight: '700', color: 'white' },
  totalCard: { backgroundColor: '#4F46E5', paddingHorizontal: 20, paddingBottom: 28 },
  totalLabel: { fontSize: 11, color: 'rgba(255,255,255,0.65)', letterSpacing: 0.5, fontWeight: '600' },
  totalAmount: { fontSize: 36, fontWeight: '500', color: 'white', fontVariant: ['tabular-nums'] },
  totalSub: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  content: { padding: 16, gap: 12, marginTop: -12 },
  section: { gap: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  link: { fontSize: 13, color: '#4F46E5', fontWeight: '500' },
  card: { backgroundColor: 'white', borderRadius: 14, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 2 },
  expenseRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, paddingHorizontal: 14 },
  expenseRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  expenseIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  expenseName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  expenseDate: { fontSize: 11, color: '#9CA3AF', marginTop: 1 },
  expenseAmount: { fontSize: 14, fontWeight: '600', color: '#EF4444', fontVariant: ['tabular-nums'] },
  emptyCard: { backgroundColor: 'white', borderRadius: 14, padding: 28, alignItems: 'center', gap: 6 },
  emptyEmoji: { fontSize: 32 },
  emptyText: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
  emptyHint: { fontSize: 12, color: '#9CA3AF' },
  aiCard: { backgroundColor: '#EEF2FF', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: 'rgba(99,102,241,0.2)' },
  aiLabel: { fontSize: 10, fontWeight: '700', color: '#4F46E5', letterSpacing: 0.5, marginBottom: 4 },
  aiText: { fontSize: 13, color: '#111827', lineHeight: 19 },
  fab: { position: 'absolute', bottom: 20, right: 20, width: 52, height: 52, backgroundColor: '#4F46E5', borderRadius: 26, alignItems: 'center', justifyContent: 'center', shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  fabIcon: { fontSize: 24, color: 'white', fontWeight: '300', lineHeight: 28 },
});
