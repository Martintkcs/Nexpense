import { useEffect, useState, useMemo } from 'react';
import {
  View, Text, ScrollView, Pressable,
  StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMonthlyExpenses } from '@/hooks/useExpenses';
import { useCategories } from '@/hooks/useCategories';
import type { Expense, Category } from '@/types/database';
import { useColors } from '@/lib/useColors';

// ─── Types ─────────────────────────────────────────────────────────────────────

type Period    = 'month' | 'week';   // month first = default
type ChartType = 'donut' | 'bar';

// ─── Donut constants ────────────────────────────────────────────────────────────

const DONUT_SIZE   = 180;
const DONUT_R      = 62;
const DONUT_STROKE = 22;
const CIRC         = 2 * Math.PI * DONUT_R;

// ─── Date helpers ───────────────────────────────────────────────────────────────

function toLocalDateKey(d: Date): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

function getMondayOfCurrentWeek(): Date {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

// ─── Chart data builders ────────────────────────────────────────────────────────

/** Category-colored segments for one bar. `expenses` is already expense-only. */
function buildSegments(dayExpenses: Expense[], catMap: Map<string, Category>) {
  const totals = new Map<string, { id: string; color: string; amount: number }>();
  for (const e of dayExpenses) {
    const cat   = catMap.get(e.category_id ?? '');
    const color = cat?.color ?? '#9CA3AF';
    const k     = e.category_id ?? '__none__';
    const prev  = totals.get(k);
    if (prev) prev.amount += e.amount;
    else totals.set(k, { id: k, color, amount: e.amount });
  }
  return Array.from(totals.values()).sort((a, b) => b.amount - a.amount);
}

function buildDailyBars(
  expenses: Expense[],   // already filtered: type !== 'income'
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
      const key    = toLocalDateKey(d);
      const dayExp = expenses.filter(e => e.expense_date === key);
      return {
        label:    labels[i],
        amount:   dayExp.reduce((s, e) => s + e.amount, 0),
        isToday:  d.toDateString() === now.toDateString(),
        segments: buildSegments(dayExp, catMap),
      };
    });
  }

  // Month: one bar per day; label only at 1, 10, 20, 30 to avoid overlap
  const year       = now.getFullYear();
  const month      = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  return Array.from({ length: daysInMonth }, (_, i) => {
    const day    = i + 1;
    const key    = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayExp = expenses.filter(e => e.expense_date === key);
    return {
      label:    (day === 1 || day % 10 === 0) ? String(day) : '',
      amount:   dayExp.reduce((s, e) => s + e.amount, 0),
      isToday:  day === now.getDate(),
      segments: buildSegments(dayExp, catMap),
    };
  });
}

function buildCategoryBreakdown(
  expenses: Expense[],   // already filtered: type !== 'income'
  catMap: Map<string, Category>,
) {
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

// ─── Donut chart component ──────────────────────────────────────────────────────

function DonutChart({
  data,
  total,
  selectedCategoryId,
  onSelectCategory,
}: {
  data: Array<{ id: string; color: string; pct: number }>;
  total: number;
  selectedCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
}) {
  const colors = useColors();
  const cx = DONUT_SIZE / 2;
  const cy = DONUT_SIZE / 2;
  const outerR = DONUT_R + DONUT_STROKE / 2;
  const innerR = DONUT_R - DONUT_STROKE / 2;

  // Filter out zero-pct slices to avoid hairline artifacts
  const slices = data.filter(d => d.pct > 0);
  let cumPct = 0;

  function handleDonutPress(evt: any) {
    const { locationX, locationY } = evt.nativeEvent;
    const dx = locationX - cx;
    const dy = locationY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < innerR || dist > outerR) {
      onSelectCategory(null);
      return;
    }

    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    const normalized = (angle + 450) % 360;
    const touchedPct = (normalized / 360) * 100;

    let running = 0;
    for (const seg of slices) {
      running += seg.pct;
      if (touchedPct <= running) {
        onSelectCategory(selectedCategoryId === seg.id ? null : seg.id);
        return;
      }
    }
    onSelectCategory(null);
  }

  return (
    <Pressable
      style={{ width: DONUT_SIZE, height: DONUT_SIZE, alignSelf: 'center' }}
      onPress={handleDonutPress}
    >
      <Svg
        width={DONUT_SIZE}
        height={DONUT_SIZE}
        style={{ transform: [{ rotate: '-90deg' }] }}
      >
        {slices.length === 0 ? (
          <Circle
            cx={cx} cy={cy} r={DONUT_R}
            fill="none"
            stroke={colors.borderLight}
            strokeWidth={DONUT_STROKE}
          />
        ) : (
          slices.map((seg, i) => {
            const dashLen = (seg.pct / 100) * CIRC - 2;   // 2 px gap between slices
            const offset  = -(cumPct / 100) * CIRC;       // negative = advance along path
            cumPct += seg.pct;
            return (
              <Circle
                key={seg.id}
                cx={cx} cy={cy} r={DONUT_R}
                fill="none"
                stroke={seg.color}
                strokeWidth={DONUT_STROKE}
                strokeDasharray={`${Math.max(dashLen, 0.5)} ${CIRC}`}
                strokeDashoffset={offset}
                opacity={!selectedCategoryId || selectedCategoryId === seg.id ? 1 : 0.22}
              />
            );
          })
        )}
      </Svg>

      {/* Centre label — absolute over the SVG */}
      <View style={styles.donutCenter}>
        <Text style={[styles.donutTotal, { color: colors.text }]}>{total.toLocaleString('hu-HU')}</Text>
        <Text style={[styles.donutSub, { color: colors.textMuted }]}>Ft kiadás</Text>
      </View>
    </Pressable>
  );
}

// ─── Screen ────────────────────────────────────────────────────────────────────

export default function AnalyticsScreen() {
  const colors = useColors();
  const now = new Date();

  // ── State ──────────────────────────────────────────────────
  const [period,    setPeriod]    = useState<Period>('month');      // month is default
  const [chartType, setChartType] = useState<ChartType>('donut');   // donut is default
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // ── Data ───────────────────────────────────────────────────
  const { data: monthlyExpenses = [], isLoading, refetch, isRefetching } =
    useMonthlyExpenses(now.getFullYear(), now.getMonth() + 1);

  const { categories } = useCategories();
  const catMap = useMemo(() => new Map(categories.map(c => [c.id, c])), [categories]);

  /** Expenses only (no income), optionally filtered to this week */
  const expenses = useMemo(() => {
    const expOnly = monthlyExpenses.filter(e => e.type !== 'income');
    if (period === 'month') return expOnly;
    const monday = getMondayOfCurrentWeek();
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const from = toLocalDateKey(monday);
    const to   = toLocalDateKey(sunday);
    return expOnly.filter(e => e.expense_date >= from && e.expense_date <= to);
  }, [monthlyExpenses, period]);

  const total     = useMemo(() => expenses.reduce((s, e) => s + e.amount, 0), [expenses]);
  const bars      = useMemo(() => buildDailyBars(expenses, catMap, period), [expenses, catMap, period]);
  const breakdown = useMemo(() => buildCategoryBreakdown(expenses, catMap), [expenses, catMap]);
  const maxBar    = Math.max(...bars.map(b => b.amount), 1);
  const effectiveChartType: ChartType = period === 'month' ? 'donut' : chartType;

  const selectedCategory = useMemo(
    () => breakdown.find((cat) => cat.id === selectedCategoryId) ?? null,
    [breakdown, selectedCategoryId],
  );
  const insightCategory = selectedCategory ?? breakdown[0] ?? null;
  const displayTotal = selectedCategory?.amount ?? total;
  const displayCount = selectedCategory?.count ?? expenses.length;

  function toggleCategory(id: string) {
    setSelectedCategoryId((prev) => (prev === id ? null : id));
  }

  useEffect(() => {
    if (!selectedCategoryId) return;
    const stillVisible = breakdown.some((cat) => cat.id === selectedCategoryId);
    if (!stillVisible) setSelectedCategoryId(null);
  }, [breakdown, selectedCategoryId]);

  const monthLabel = now.toLocaleDateString('hu-HU', { year: 'numeric', month: 'long' });

  // ── Bar column renderer (shared for week/month) ────────────
  function renderBarCol(
    bar: { label: string; amount: number; isToday: boolean; segments: { id: string; color: string; amount: number }[] },
    i: number,
    colStyle?: object,
  ) {
    const heightPct = bar.amount / maxBar;
    return (
      <View
        key={i}
        style={[
          styles.barCol,
          colStyle,
          selectedCategoryId && !bar.segments.some((s) => s.id === selectedCategoryId) && styles.dimmed,
        ]}
      >
        <View style={styles.barTrack}>
          {bar.amount > 0 && (
            <View
              style={[
                styles.barStack,
                { height: `${Math.max(heightPct * 100, 4)}%`, opacity: !selectedCategoryId && !bar.isToday ? 0.72 : 1 },
              ]}
            >
              {bar.segments.map((seg, si) => (
                <Pressable
                  key={`${seg.id}-${si}`}
                  onPress={() => toggleCategory(seg.id)}
                  style={{
                    flex: seg.amount,
                    backgroundColor: seg.color,
                    opacity: !selectedCategoryId || selectedCategoryId === seg.id ? 1 : 0.22,
                    borderTopLeftRadius:     si === 0 ? 3 : 0,
                    borderTopRightRadius:    si === 0 ? 3 : 0,
                    borderBottomLeftRadius:  si === bar.segments.length - 1 ? 3 : 0,
                    borderBottomRightRadius: si === bar.segments.length - 1 ? 3 : 0,
                  }}
                />
              ))}
            </View>
          )}
        </View>
        <Text style={[styles.barLabel, { color: colors.textMuted }, bar.isToday && styles.barLabelToday, bar.isToday && { color: colors.primary }]}>
          {bar.label}
        </Text>
      </View>
    );
  }

  // ── Render ─────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.header, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Kimutatások</Text>
        <Text style={[styles.subtitle, { color: colors.textSub }]}>{monthLabel}</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
        }
      >
        {/* ── Period selector — "Ebben a hónapban" first ── */}
        <View style={[styles.periodSel, { backgroundColor: colors.toggleBg }]}>
          {(['month', 'week'] as Period[]).map(p => (
            <Pressable
              key={p}
              style={[styles.periodOpt, period === p && styles.periodOptActive, period === p && { backgroundColor: colors.toggleItem }]}
              onPress={() => {
                setPeriod(p);
                setSelectedCategoryId(null);
              }}
            >
              <Text style={[styles.periodTxt, { color: colors.textSub }, period === p && styles.periodTxtActive, period === p && { color: colors.text }]}>
                {p === 'month' ? 'Ebben a hónapban' : 'Ezen a héten'}
              </Text>
            </Pressable>
          ))}
        </View>

        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        ) : (
          <>
            {/* ── Summary card ── */}
            <View style={[styles.card, styles.summaryCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.sumLabel, { color: colors.textMuted }]}>ÖSSZES KIADÁS</Text>
              <Text style={[styles.sumTotal, { color: colors.text }]}>{displayTotal.toLocaleString('hu-HU')} Ft</Text>
              <Text style={[styles.sumCount, { color: colors.textSub }]}>
                {selectedCategory ? selectedCategory.name : `${displayCount} tranzakció`}
              </Text>
            </View>

            {/* ── Chart type toggle ── */}
            <View
              style={[
                styles.chartTypeSel,
                { backgroundColor: colors.toggleBg },
                period === 'month' && { display: 'none' },
              ]}
            >
              <Pressable
                style={[styles.chartTypeBtn, effectiveChartType === 'donut' && styles.chartTypeBtnActive, effectiveChartType === 'donut' && { backgroundColor: colors.toggleItem }]}
                onPress={() => setChartType('donut')}
              >
                <Text style={[styles.chartTypeTxt, { color: colors.textMuted }, effectiveChartType === 'donut' && styles.chartTypeTxtActive, effectiveChartType === 'donut' && { color: colors.text }]}>
                  Kör
                </Text>
              </Pressable>
              <Pressable
                style={[styles.chartTypeBtn, effectiveChartType === 'bar' && styles.chartTypeBtnActive, effectiveChartType === 'bar' && { backgroundColor: colors.toggleItem }]}
                onPress={() => setChartType('bar')}
              >
                <Text style={[styles.chartTypeTxt, { color: colors.textMuted }, effectiveChartType === 'bar' && styles.chartTypeTxtActive, effectiveChartType === 'bar' && { color: colors.text }]}>
                  Oszlop
                </Text>
              </Pressable>
            </View>

            {/* ── Chart area ── */}
            {breakdown.length === 0 ? (
              <View style={[styles.card, styles.emptyCard, { backgroundColor: colors.card }]}>
                <Text style={styles.emptyEmoji}>📊</Text>
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                  {period === 'week'
                    ? 'Ezen a héten még nincs kiadás.'
                    : 'Ebben a hónapban még nincs kiadás.'}
                </Text>
              </View>

            ) : effectiveChartType === 'donut' ? (
              /* ────── Donut view ────── */
              <View style={[styles.card, { backgroundColor: colors.card }]}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Kategória megoszlás</Text>
                <DonutChart
                  data={breakdown}
                  total={displayTotal}
                  selectedCategoryId={selectedCategoryId}
                  onSelectCategory={setSelectedCategoryId}
                />

                {/* Category legend list */}
                <View style={{ marginTop: 14 }}>
                  {breakdown.map((cat, i) => (
                    <Pressable
                      key={cat.id}
                      style={[
                        styles.catRow,
                        i < breakdown.length - 1 && styles.catRowBorder,
                        i < breakdown.length - 1 && { borderBottomColor: colors.borderLight },
                        selectedCategoryId && selectedCategoryId !== cat.id && styles.dimmed,
                        selectedCategoryId === cat.id && styles.catRowActive,
                        selectedCategoryId === cat.id && { backgroundColor: colors.aiCardBg },
                      ]}
                      onPress={() => toggleCategory(cat.id)}
                    >
                      <View style={[styles.catIcon, { backgroundColor: cat.color + '22' }]}>
                        <Text style={{ fontSize: 18 }}>{cat.icon}</Text>
                      </View>
                      <View style={styles.catInfo}>
                        <View style={styles.catTopRow}>
                          <Text style={[styles.catName, { color: colors.text }]}>{cat.name}</Text>
                          <Text style={[styles.catAmt, { color: colors.text }]}>{cat.amount.toLocaleString('hu-HU')} Ft</Text>
                        </View>
                        <View style={styles.catMetaRow}>
                          <Text style={[styles.catCount, { color: colors.textMuted }]}>{cat.count} tétel</Text>
                          <Text style={[styles.catPct, { color: colors.textMuted }]}>{cat.pct}%</Text>
                        </View>
                        <View style={[styles.catBarBg, { backgroundColor: colors.borderLight }]}>
                          <View style={[styles.catBarFill, { width: `${cat.pct}%`, backgroundColor: cat.color }]} />
                        </View>
                      </View>
                    </Pressable>
                  ))}
                </View>
              </View>

            ) : (
              /* ────── Bar view ────── */
              <>
                {/* Bar chart — month is horizontally scrollable, week uses flex */}
                <View style={[styles.barCard, { backgroundColor: colors.card }]}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>
                    {period === 'week' ? 'Napi kiadások – ez a hét' : 'Napi kiadások – ez a hónap'}
                  </Text>

                  {period === 'month' ? (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={[styles.barsWrap, { width: bars.length * 17 }]}
                    >
                      {bars.map((bar, i) => renderBarCol(bar, i, { width: 15, flex: 0 }))}
                    </ScrollView>
                  ) : (
                    <View style={styles.barsWrap}>
                      {bars.map((bar, i) => renderBarCol(bar, i))}
                    </View>
                  )}
                </View>

                {/* Category breakdown list */}
                <View style={[styles.card, { backgroundColor: colors.card }]}>
                  <Text style={[styles.cardTitle, { marginBottom: 0, color: colors.text }]}>Kategória bontás</Text>
                  {breakdown.map((cat, i) => (
                    <Pressable
                      key={cat.id}
                      style={[
                        styles.catRow,
                        i < breakdown.length - 1 && styles.catRowBorder,
                        i < breakdown.length - 1 && { borderBottomColor: colors.borderLight },
                        selectedCategoryId && selectedCategoryId !== cat.id && styles.dimmed,
                        selectedCategoryId === cat.id && styles.catRowActive,
                        selectedCategoryId === cat.id && { backgroundColor: colors.aiCardBg },
                      ]}
                      onPress={() => toggleCategory(cat.id)}
                    >
                      <View style={[styles.catIcon, { backgroundColor: cat.color + '22' }]}>
                        <Text style={{ fontSize: 18 }}>{cat.icon}</Text>
                      </View>
                      <View style={styles.catInfo}>
                        <View style={styles.catTopRow}>
                          <Text style={[styles.catName, { color: colors.text }]}>{cat.name}</Text>
                          <Text style={[styles.catAmt, { color: colors.text }]}>{cat.amount.toLocaleString('hu-HU')} Ft</Text>
                        </View>
                        <View style={styles.catMetaRow}>
                          <Text style={[styles.catCount, { color: colors.textMuted }]}>{cat.count} tétel</Text>
                          <Text style={[styles.catPct, { color: colors.textMuted }]}>{cat.pct}%</Text>
                        </View>
                        <View style={[styles.catBarBg, { backgroundColor: colors.borderLight }]}>
                          <View style={[styles.catBarFill, { width: `${cat.pct}%`, backgroundColor: cat.color }]} />
                        </View>
                      </View>
                    </Pressable>
                  ))}
                </View>
              </>
            )}

            {/* ── Top-category insight (both views) ── */}
            {insightCategory && (
              <View style={[styles.insightCard, { backgroundColor: colors.aiCardBg, borderColor: colors.aiCardBorder }]}>
                <Text style={[styles.insightLabel, { color: colors.primary }]}>💡 LEGTÖBBET KÖLTÖTTÉL</Text>
                <Text style={[styles.insightText, { color: colors.aiCardText }]}>
                  <Text style={{ fontWeight: '800' }}>{insightCategory.name}</Text>
                  {' '}kategóriában:{' '}
                  <Text style={{ fontWeight: '800' }}>
                    {insightCategory.amount.toLocaleString('hu-HU')} Ft
                  </Text>
                  {' '}({total > 0 ? Math.round((insightCategory.amount / total) * 100) : 0}% az összes kiadásodból)
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

  // ── Period selector ──────────────────────────────────────
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

  // ── Chart type toggle ────────────────────────────────────
  chartTypeSel: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: 10,
    padding: 3,
    alignSelf: 'center',
  },
  chartTypeBtn: { paddingVertical: 7, paddingHorizontal: 24, borderRadius: 8 },
  chartTypeBtnActive: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  chartTypeTxt:       { fontSize: 13, fontWeight: '600', color: '#9CA3AF' },
  chartTypeTxtActive: { color: '#111827' },

  // ── Cards ────────────────────────────────────────────────
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
  // Bar chart card: no overflow:hidden so horizontal ScrollView isn't clipped on Android
  barCard: {
    backgroundColor: 'white',
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
    padding: 14,
  },
  cardTitle:   { fontSize: 13, fontWeight: '600', color: '#111827', marginBottom: 12 },
  summaryCard: { alignItems: 'center', gap: 4 },
  sumLabel:    { fontSize: 11, color: '#9CA3AF', letterSpacing: 0.7, fontWeight: '600' },
  sumTotal:    { fontSize: 32, fontWeight: '700', color: '#111827', fontVariant: ['tabular-nums'] },
  sumCount:    { fontSize: 13, color: '#6B7280' },

  // ── Donut ────────────────────────────────────────────────
  donutCenter: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutTotal: { fontSize: 20, fontWeight: '700', color: '#111827', fontVariant: ['tabular-nums'] },
  donutSub:   { fontSize: 11, color: '#9CA3AF', marginTop: 2 },

  // ── Bar chart ────────────────────────────────────────────
  barsWrap:      { flexDirection: 'row', alignItems: 'flex-end', height: 80, gap: 2 },
  barCol:        { flex: 1, alignItems: 'center', height: '100%' },
  barTrack:      { flex: 1, width: '100%', justifyContent: 'flex-end' },
  barStack:      { width: '100%', borderRadius: 3, overflow: 'hidden' },
  barLabel:      { fontSize: 9, color: '#9CA3AF', marginTop: 4, textAlign: 'center' },
  barLabelToday: { color: '#4F46E5', fontWeight: '700' },

  // ── Category breakdown ───────────────────────────────────
  catRow:       { flexDirection: 'row', gap: 12, paddingVertical: 12, alignItems: 'center' },
  catRowActive: { backgroundColor: '#EEF2FF', borderRadius: 10, paddingHorizontal: 8 },
  catRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  dimmed:       { opacity: 0.35 },
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

  // ── Empty state ──────────────────────────────────────────
  emptyCard:  { alignItems: 'center', paddingVertical: 28, gap: 8 },
  emptyEmoji: { fontSize: 36 },
  emptyText:  { fontSize: 14, color: '#9CA3AF', textAlign: 'center' },

  // ── Insight card ─────────────────────────────────────────
  insightCard: {
    backgroundColor: '#EEF2FF', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: 'rgba(99,102,241,0.2)', gap: 4,
  },
  insightLabel: { fontSize: 10, fontWeight: '700', color: '#4F46E5', letterSpacing: 0.5 },
  insightText:  { fontSize: 13, color: '#111827', lineHeight: 20 },
});
