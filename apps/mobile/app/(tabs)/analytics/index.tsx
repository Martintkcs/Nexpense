import { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, Pressable,
  StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMonthlyExpenses } from '@/hooks/useExpenses';
import { useCategories } from '@/hooks/useCategories';
import type { Expense, Category } from '@/types/database';

// ─── Types ─────────────────────────────────────────────────────────────────────

type Period = 'week' | 'month';

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Lokális időzóna szerinti YYYY-MM-DD kulcs — toISOString() UTC-t adna vissza! */
function toLocalDateKey(d: Date): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

function getMondayOfCurrentWeek(): Date {
  const now = new Date();
  const day = now.getDay(); // 0 = Sun
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

/** Egy nap kiadásait kategória szerint csoportosítja, arányos szegmensekbe. */
function buildSegments(dayExpenses: Expense[], catMap: Map<string, Category>) {
  const totals = new Map<string, { color: string; amount: number }>();
  for (const e of dayExpenses) {
    const cat = catMap.get(e.category_id ?? '');
    const color = cat?.color ?? '#9CA3AF';
    const k = e.category_id ?? '__none__';
    const prev = totals.get(k);
    if (prev) prev.amount += e.amount;
    else totals.set(k, { color, amount: e.amount });
  }
  return Array.from(totals.values()).sort((a, b) => b.amount - a.amount);
}

function buildDailyBars(
  expenses: Expense[],
  catMap: Map<string, Category>,
  period: Period,
) {
  const now = new Date();

  if (period === 'week') {
    const monday = getMondayOfCurrentWeek();
    const labels = ['H', 'K', 'Sze', 'Cs', 'P', 'Szo', 'V'];
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const key = toLocalDateKey(d);
      const dayExpenses = expenses.filter(e => e.expense_date === key);
      const amount = dayExpenses.reduce((s, e) => s + e.amount, 0);
      return {
        label: labels[i],
        amount,
        isToday: d.toDateString() === now.toDateString(),
        segments: buildSegments(dayExpenses, catMap),
      };
    });
  }

  // Month: one column per day
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayExpenses = expenses.filter(e => e.expense_date === key);
    const amount = dayExpenses.reduce((s, e) => s + e.amount, 0);
    return {
      label: day % 7 === 1 ? String(day) : '',
      amount,
      isToday: day === now.getDate(),
      segments: buildSegments(dayExpenses, catMap),
    };
  });
}

function buildCategoryBreakdown(expenses: Expense[], catMap: Map<string, Category>) {
  const totals = new Map<string, number>();
  for (const e of expenses) {
    const k = e.category_id ?? '__none__';
    totals.set(k, (totals.get(k) ?? 0) + e.amount);
  }
  const grand = expenses.reduce((s, e) => s + e.amount, 0);

  return Array.from(totals.entries())
    .map(([id, amount]) => {
      const cat = catMap.get(id);
      return {
        id,
        name:  cat?.name_hu ?? 'Egyéb',
        icon:  cat?.icon    ?? '📦',
        color: cat?.color   ?? '#9CA3AF',
        amount,
        pct:   grand > 0 ? Math.round((amount / grand) * 100) : 0,
        count: expenses.filter(e => (e.category_id ?? '__none__') === id).length,
      };
    })
    .sort((a, b) => b.amount - a.amount);
}

// ─── Screen ────────────────────────────────────────────────────────────────────

export default function AnalyticsScreen() {
  const now = new Date();
  const [period, setPeriod] = useState<Period>('month');

  const { data: monthlyExpenses = [], isLoading, refetch, isRefetching } =
    useMonthlyExpenses(now.getFullYear(), now.getMonth() + 1);

  const { categories } = useCategories();
  const catMap = useMemo(() => new Map(categories.map(c => [c.id, c])), [categories]);

  // Filter to current week when 'week' period selected
  const expenses = useMemo(() => {
    if (period === 'month') return monthlyExpenses;
    const monday = getMondayOfCurrentWeek();
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const from = toLocalDateKey(monday);
    const to   = toLocalDateKey(sunday);
    return monthlyExpenses.filter(e => e.expense_date >= from && e.expense_date <= to);
  }, [monthlyExpenses, period]);

  const total     = useMemo(() => expenses.reduce((s, e) => s + e.amount, 0), [expenses]);
  const bars      = useMemo(() => buildDailyBars(expenses, catMap, period), [expenses, catMap, period]);
  const breakdown = useMemo(() => buildCategoryBreakdown(expenses, catMap), [expenses, catMap]);
  const maxBar    = Math.max(...bars.map(b => b.amount), 1);

  const monthLabel = now.toLocaleDateString('hu-HU', { year: 'numeric', month: 'long' });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Kimutatások</Text>
        <Text style={styles.subtitle}>{monthLabel}</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#4F46E5" />
        }
      >
        {/* ── Period selector ── */}
        <View style={styles.periodSel}>
          {(['week', 'month'] as Period[]).map(p => (
            <Pressable
              key={p}
              style={[styles.periodOpt, period === p && styles.periodOptActive]}
              onPress={() => setPeriod(p)}
            >
              <Text style={[styles.periodTxt, period === p && styles.periodTxtActive]}>
                {p === 'week' ? 'Ezen a héten' : 'Ebben a hónapban'}
              </Text>
            </Pressable>
          ))}
        </View>

        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color="#4F46E5" size="large" />
          </View>
        ) : (
          <>
            {/* ── Summary card ── */}
            <View style={[styles.card, styles.summaryCard]}>
              <Text style={styles.sumLabel}>ÖSSZES KIADÁS</Text>
              <Text style={styles.sumTotal}>
                {total.toLocaleString('hu-HU')} Ft
              </Text>
              <Text style={styles.sumCount}>{expenses.length} tranzakció</Text>
            </View>

            {/* ── Bar chart ── */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>
                {period === 'week' ? 'Napi kiadások – ez a hét' : 'Napi kiadások – ez a hónap'}
              </Text>
              <View style={styles.barsWrap}>
                {bars.map((bar, i) => {
                  const heightPct = bar.amount / maxBar;
                  return (
                    <View key={i} style={styles.barCol}>
                      <View style={styles.barTrack}>
                        {bar.amount > 0 && (
                          <View
                            style={[
                              styles.barStack,
                              {
                                height: `${Math.max(heightPct * 100, 4)}%`,
                                opacity: bar.isToday ? 1 : 0.75,
                              },
                            ]}
                          >
                            {bar.segments.map((seg, si) => (
                              <View
                                key={si}
                                style={{
                                  flex: seg.amount,
                                  backgroundColor: seg.color,
                                  borderTopLeftRadius: si === 0 ? 3 : 0,
                                  borderTopRightRadius: si === 0 ? 3 : 0,
                                  borderBottomLeftRadius: si === bar.segments.length - 1 ? 3 : 0,
                                  borderBottomRightRadius: si === bar.segments.length - 1 ? 3 : 0,
                                }}
                              />
                            ))}
                          </View>
                        )}
                      </View>
                      <Text style={[styles.barLabel, bar.isToday && { color: '#4F46E5', fontWeight: '700' }]}>
                        {bar.label}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* ── Category breakdown ── */}
            {breakdown.length === 0 ? (
              <View style={[styles.card, styles.emptyCard]}>
                <Text style={styles.emptyEmoji}>📊</Text>
                <Text style={styles.emptyText}>
                  {period === 'week'
                    ? 'Ezen a héten még nincs kiadás.'
                    : 'Ebben a hónapban még nincs kiadás.'}
                </Text>
              </View>
            ) : (
              <View style={styles.card}>
                <Text style={[styles.cardTitle, { marginBottom: 0 }]}>Kategória bontás</Text>
                {breakdown.map((cat, i) => (
                  <View
                    key={cat.id}
                    style={[styles.catRow, i < breakdown.length - 1 && styles.catRowBorder]}
                  >
                    <View style={[styles.catIcon, { backgroundColor: cat.color + '22' }]}>
                      <Text style={{ fontSize: 18 }}>{cat.icon}</Text>
                    </View>
                    <View style={styles.catInfo}>
                      <View style={styles.catTopRow}>
                        <Text style={styles.catName}>{cat.name}</Text>
                        <Text style={styles.catAmt}>
                          {cat.amount.toLocaleString('hu-HU')} Ft
                        </Text>
                      </View>
                      <View style={styles.catMetaRow}>
                        <Text style={styles.catCount}>{cat.count} tétel</Text>
                        <Text style={styles.catPct}>{cat.pct}%</Text>
                      </View>
                      <View style={styles.catBarBg}>
                        <View
                          style={[
                            styles.catBarFill,
                            { width: `${cat.pct}%`, backgroundColor: cat.color },
                          ]}
                        />
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* ── Top-category insight ── */}
            {breakdown.length > 0 && (
              <View style={styles.insightCard}>
                <Text style={styles.insightLabel}>💡 LEGTÖBBET KÖLTÖTTÉL</Text>
                <Text style={styles.insightText}>
                  <Text style={{ fontWeight: '800' }}>{breakdown[0].name}</Text>
                  {' '}kategóriában:{' '}
                  <Text style={{ fontWeight: '800' }}>
                    {breakdown[0].amount.toLocaleString('hu-HU')} Ft
                  </Text>
                  {' '}({breakdown[0].pct}% az összes kiadásodból)
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:     { flex: 1, backgroundColor: '#F2F2F7' },
  header:   { backgroundColor: 'white', padding: 16, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  title:    { fontSize: 22, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  content:  { padding: 16, gap: 12, paddingBottom: 32 },
  center:   { paddingTop: 60, alignItems: 'center' },

  periodSel: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    padding: 3,
  },
  periodOpt: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 10 },
  periodOptActive: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  periodTxt:       { fontSize: 13, fontWeight: '500', color: '#6B7280' },
  periodTxtActive: { fontWeight: '700', color: '#111827' },

  card: {
    backgroundColor: 'white',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
    padding: 14,
  },
  cardTitle: { fontSize: 13, fontWeight: '600', color: '#111827', marginBottom: 12 },

  summaryCard: { alignItems: 'center', gap: 4 },
  sumLabel:    { fontSize: 11, color: '#9CA3AF', letterSpacing: 0.7, fontWeight: '600' },
  sumTotal:    { fontSize: 32, fontWeight: '700', color: '#111827', fontVariant: ['tabular-nums'] },
  sumCount:    { fontSize: 13, color: '#6B7280' },

  barsWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 80,
    gap: 2,
  },
  barCol:    { flex: 1, alignItems: 'center', height: '100%' },
  barTrack:  { flex: 1, width: '100%', justifyContent: 'flex-end' },
  barStack:  { width: '100%', borderRadius: 3, overflow: 'hidden' },
  barLabel:  { fontSize: 9, color: '#9CA3AF', marginTop: 4 },

  catRow:       { flexDirection: 'row', gap: 12, paddingVertical: 12, alignItems: 'center' },
  catRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  catIcon:      { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  catInfo:      { flex: 1, gap: 3 },
  catTopRow:    { flexDirection: 'row', justifyContent: 'space-between' },
  catName:      { fontSize: 14, fontWeight: '600', color: '#111827' },
  catAmt:       { fontSize: 14, fontWeight: '600', color: '#111827', fontVariant: ['tabular-nums'] },
  catMetaRow:   { flexDirection: 'row', justifyContent: 'space-between' },
  catCount:     { fontSize: 11, color: '#9CA3AF' },
  catPct:       { fontSize: 11, color: '#9CA3AF' },
  catBarBg:     { height: 3, backgroundColor: '#F3F4F6', borderRadius: 2, overflow: 'hidden' },
  catBarFill:   { height: '100%', borderRadius: 2 },

  emptyCard:  { alignItems: 'center', paddingVertical: 28, gap: 8 },
  emptyEmoji: { fontSize: 36 },
  emptyText:  { fontSize: 14, color: '#9CA3AF', textAlign: 'center' },

  insightCard:  { backgroundColor: '#EEF2FF', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: 'rgba(99,102,241,0.2)', gap: 4 },
  insightLabel: { fontSize: 10, fontWeight: '700', color: '#4F46E5', letterSpacing: 0.5 },
  insightText:  { fontSize: 13, color: '#111827', lineHeight: 20 },
});
