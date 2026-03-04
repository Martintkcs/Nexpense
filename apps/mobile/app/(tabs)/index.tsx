import { View, Text, ScrollView, Pressable, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import { useMonthlyExpenses, useBalance } from '@/hooks/useExpenses';
import { useCategories } from '@/hooks/useCategories';
import { buildSpendingContext } from '@/services/ai/claude';
import { useColors } from '@/lib/useColors';

const MONTH_NAMES = [
  'Január','Február','Március','Április','Május','Június',
  'Július','Augusztus','Szeptember','Október','November','December',
];

export default function DashboardScreen() {
  const colors = useColors();
  const { user } = useAuth();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const { data: monthlyExpenses = [], isLoading, isRefetching, refetch } = useMonthlyExpenses(year, month);
  const { balance, isLoading: balanceLoading } = useBalance();
  const { categories } = useCategories();

  // Havi bevétel / kiadás szétválasztva
  const monthlyExpenseTotal = monthlyExpenses
    .filter(e => e.type !== 'income')
    .reduce((sum, e) => sum + e.amount, 0);
  const monthlyIncomeTotal = monthlyExpenses
    .filter(e => e.type === 'income')
    .reduce((sum, e) => sum + e.amount, 0);

  const recentItems = monthlyExpenses.slice(0, 5);

  const getCat = (catId: string | null) => categories.find(c => c.id === catId);

  const displayName = (user?.user_metadata?.display_name as string | undefined)?.split(' ')[0] ?? 'Felhasználó';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
        }
      >
        {/* ── Hero ── */}
        <View style={[styles.hero, { backgroundColor: colors.heroBg }]}>
          <Text style={[styles.greeting, { color: colors.heroTextDim }]}>Helló,</Text>
          <Text style={styles.name}>{displayName} 👋</Text>
        </View>

        {/* ── Egyenleg kártya ── */}
        <View style={[styles.balanceCard, { backgroundColor: colors.heroBg }]}>
          <Text style={[styles.balanceLabel, { color: colors.heroText }]}>EGYENLEG</Text>
          <Text style={styles.balanceAmount}>
            {balanceLoading ? '...' : balance.toLocaleString('hu-HU') + ' Ft'}
          </Text>

          {/* Havi bevétel / kiadás sor */}
          <View style={[styles.monthRow, { backgroundColor: colors.heroBgCard }]}>
            <View style={styles.monthItem}>
              <Text style={[styles.monthItemIcon, { color: colors.heroTextDim }]}>↑</Text>
              <View>
                <Text style={[styles.monthItemLabel, { color: colors.heroText }]}>{MONTH_NAMES[month - 1]} bevétel</Text>
                <Text style={[styles.monthItemAmt, { color: colors.incomeHero }]}>
                  {isLoading ? '...' : '+' + monthlyIncomeTotal.toLocaleString('hu-HU') + ' Ft'}
                </Text>
              </View>
            </View>
            <View style={[styles.monthDivider, { backgroundColor: colors.heroText }]} />
            <View style={styles.monthItem}>
              <Text style={[styles.monthItemIcon, { color: colors.heroTextDim }]}>↓</Text>
              <View>
                <Text style={[styles.monthItemLabel, { color: colors.heroText }]}>{MONTH_NAMES[month - 1]} kiadás</Text>
                <Text style={[styles.monthItemAmt, { color: colors.expenseHero }]}>
                  {isLoading ? '...' : '−' + monthlyExpenseTotal.toLocaleString('hu-HU') + ' Ft'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          {/* ── Legutóbbi tranzakciók ── */}
          <View style={styles.section}>
            <View style={styles.row}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Legutóbbi tranzakciók</Text>
              <Pressable onPress={() => router.push('/(tabs)/expenses')}>
                <Text style={[styles.link, { color: colors.primary }]}>Mind →</Text>
              </Pressable>
            </View>

            {isLoading ? (
              <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
                <Text style={[styles.emptyText, { color: colors.textSub }]}>Betöltés...</Text>
              </View>
            ) : recentItems.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
                <Text style={styles.emptyEmoji}>💸</Text>
                <Text style={[styles.emptyText, { color: colors.textSub }]}>Még nincs tranzakció ebben a hónapban.</Text>
                <Text style={[styles.emptyHint, { color: colors.textMuted }]}>Nyomj a + gombra az első rögzítéséhez!</Text>
              </View>
            ) : (
              <View style={[styles.card, { backgroundColor: colors.card }]}>
                {recentItems.map((expense, i) => {
                  const cat = getCat(expense.category_id);
                  const isIncome = expense.type === 'income';
                  const isLast = i === recentItems.length - 1;
                  return (
                    <Pressable
                      key={expense.id}
                      style={[
                        styles.expenseRow,
                        !isLast && styles.expenseRowBorder,
                        !isLast && { borderBottomColor: colors.borderLight },
                      ]}
                      onPress={() => router.push({
                        pathname: '/modals/quick-add',
                        params: {
                          expenseId: expense.id,
                          expenseAmount: String(expense.amount),
                          expenseCategoryId: expense.category_id ?? '',
                          expenseType: expense.type ?? 'expense',
                          expenseDescription: expense.description ?? '',
                          expenseNote: expense.note ?? '',
                          expenseLabelIds: JSON.stringify(
                            (expense.metadata as Record<string, unknown> | null)?.label_ids ?? []
                          ),
                        },
                      })}
                    >
                      <View style={[styles.expenseIcon, { backgroundColor: (isIncome && !cat) ? '#10B98122' : (cat?.color ?? colors.textMuted) + '22' }]}>
                        <Text style={{ fontSize: 18 }}>{cat?.icon ?? (isIncome ? '💰' : '📦')}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.expenseName, { color: colors.text }]} numberOfLines={1}>
                          {isIncome
                            ? (expense.description ?? 'Bevétel')
                            : (cat?.name_hu ?? cat?.name ?? 'Kiadás')}
                        </Text>
                        {!!expense.note && (
                          <Text style={[styles.expenseNote, { color: colors.textSub }]} numberOfLines={1}>
                            {expense.note}
                          </Text>
                        )}
                        <Text style={[styles.expenseDate, { color: colors.textMuted }]}>
                          {new Date(expense.expense_date).toLocaleDateString('hu-HU', {
                            month: 'short', day: 'numeric',
                          })}
                        </Text>
                      </View>
                      <Text style={[styles.expenseAmount, isIncome ? styles.incomeAmount : styles.expenseAmountRed]}>
                        {isIncome ? '+' : '−'}{expense.amount.toLocaleString('hu-HU')} Ft
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>

          {/* AI elemzés kártya */}
          <View style={[styles.aiCard, { backgroundColor: colors.aiCardBg, borderColor: colors.aiCardBorder }]}>
            <Text style={[styles.aiLabel, { color: colors.primary }]}>✨ AI ELEMZÉS</Text>
            {monthlyExpenses.filter(e => e.type !== 'income').length < 3 ? (
              <Text style={[styles.aiText, { color: colors.aiCardText }]}>
                Rögzíts legalább 3 kiadást, és az AI személyre szabott visszajelzést ad a pénzügyi szokásaidról!
              </Text>
            ) : (
              <>
                <Text style={[styles.aiText, { color: colors.aiCardText }]}>
                  Az AI elemzi a havi kiadásaidat és személyes tanácsokat ad.
                </Text>
                <Pressable
                  style={[styles.aiBtn, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    const ctx = buildSpendingContext(monthlyExpenses, categories);
                    router.push({
                      pathname: '/modals/ai-chat',
                      params: { type: 'spending_analysis', contextStr: ctx },
                    });
                  }}
                >
                  <Text style={styles.aiBtnTxt}>Elemzés indítása →</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </ScrollView>

      <Pressable style={[styles.fab, { backgroundColor: colors.primary, shadowColor: colors.primary }]} onPress={() => router.push('/modals/quick-add')}>
        <Text style={styles.fabIcon}>+</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2F2F7' },

  hero:     { backgroundColor: '#4F46E5', padding: 20, paddingBottom: 8 },
  greeting: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  name:     { fontSize: 20, fontWeight: '700', color: 'white' },

  // ── Egyenleg kártya ──
  balanceCard: { backgroundColor: '#4F46E5', paddingHorizontal: 20, paddingBottom: 24 },
  balanceLabel: {
    fontSize: 11, color: 'rgba(255,255,255,0.65)',
    letterSpacing: 0.5, fontWeight: '600', marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 38, fontWeight: '500', color: 'white',
    fontVariant: ['tabular-nums'], marginBottom: 16,
  },
  monthRow:       { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: 12 },
  monthItem:      { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  monthDivider:   { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 8 },
  monthItemIcon:  { fontSize: 18, color: 'rgba(255,255,255,0.7)' },
  monthItemLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: '600', marginBottom: 2 },
  monthItemAmt:   { fontSize: 14, fontWeight: '700', fontVariant: ['tabular-nums'] },
  incomeColor:    { color: '#6EE7B7' },  // light emerald on indigo bg
  expenseColor:   { color: '#FCA5A5' },  // light red on indigo bg

  content:      { padding: 16, gap: 12, marginTop: -12 },
  section:      { gap: 8 },
  row:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  link:         { fontSize: 13, color: '#4F46E5', fontWeight: '500' },

  card:             { backgroundColor: 'white', borderRadius: 14, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 2 },
  expenseRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, paddingHorizontal: 14 },
  expenseRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  expenseIcon:      { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  expenseName:      { fontSize: 14, fontWeight: '600', color: '#111827' },
  expenseNote:      { fontSize: 12, color: '#6B7280', marginTop: 1 },
  expenseDate:      { fontSize: 11, color: '#9CA3AF', marginTop: 1 },
  expenseAmount:    { fontSize: 14, fontWeight: '600', fontVariant: ['tabular-nums'] },
  expenseAmountRed: { color: '#EF4444' },
  incomeAmount:     { color: '#10B981' },

  emptyCard:  { backgroundColor: 'white', borderRadius: 14, padding: 28, alignItems: 'center', gap: 6 },
  emptyEmoji: { fontSize: 32 },
  emptyText:  { fontSize: 14, color: '#6B7280', fontWeight: '500' },
  emptyHint:  { fontSize: 12, color: '#9CA3AF' },

  aiCard:   { backgroundColor: '#EEF2FF', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: 'rgba(99,102,241,0.2)', gap: 6 },
  aiLabel:  { fontSize: 10, fontWeight: '700', color: '#4F46E5', letterSpacing: 0.5 },
  aiText:   { fontSize: 13, color: '#111827', lineHeight: 19 },
  aiBtn:    { backgroundColor: '#4F46E5', borderRadius: 10, paddingVertical: 9, paddingHorizontal: 14, alignSelf: 'flex-start', marginTop: 2 },
  aiBtnTxt: { fontSize: 13, fontWeight: '700', color: 'white' },

  fab:     { position: 'absolute', bottom: 20, right: 20, width: 52, height: 52, backgroundColor: '#4F46E5', borderRadius: 26, alignItems: 'center', justifyContent: 'center', shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  fabIcon: { fontSize: 24, color: 'white', fontWeight: '300', lineHeight: 28 },
});
