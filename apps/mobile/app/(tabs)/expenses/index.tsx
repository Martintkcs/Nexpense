import { useMemo, useRef, useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TextInput, Pressable,
  StyleSheet, RefreshControl, ActivityIndicator, Animated,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useExpenses } from '@/hooks/useExpenses';
import { useCategories } from '@/hooks/useCategories';
import type { Expense, Category } from '@/types/database';
import { useColors } from '@/lib/useColors';

function getDayLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameDay(d, today)) return 'MA';
  if (sameDay(d, yesterday)) return 'TEGNAP';
  return d
    .toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric' })
    .toUpperCase();
}

function groupByDate(expenses: Expense[]) {
  const map = new Map<string, Expense[]>();
  for (const e of expenses) {
    if (!map.has(e.expense_date)) map.set(e.expense_date, []);
    map.get(e.expense_date)!.push(e);
  }

  return Array.from(map.entries()).map(([dateKey, items]) => ({
    label: getDayLabel(dateKey),
    dateKey,
    items,
  }));
}

export default function ExpensesScreen() {
  const colors = useColors();
  const { expenses, isLoading, isRefetching, refetch, deleteExpense } = useExpenses();
  const { categories } = useCategories();

  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const openSwipeableRef = useRef<Swipeable | null>(null);

  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const usedCatIds = useMemo(
    () => new Set(expenses.map((e) => e.category_id).filter(Boolean)),
    [expenses],
  );

  const filterCats = useMemo(
    () => categories.filter((c) => usedCatIds.has(c.id)),
    [categories, usedCatIds],
  );

  const filtered = useMemo(() => {
    let list = expenses;

    if (activeFilter) list = list.filter((e) => e.category_id === activeFilter);

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((e) => {
        const desc = (e.description ?? '').toLowerCase();
        const note = (e.note ?? '').toLowerCase();
        const cat = catMap.get(e.category_id ?? '');
        const catName = (cat?.name_hu ?? '').toLowerCase();
        return desc.includes(q) || note.includes(q) || catName.includes(q);
      });
    }

    return list;
  }, [expenses, activeFilter, search, catMap]);

  const groups = useMemo(() => groupByDate(filtered), [filtered]);

  const monthlyExpenseTotal = useMemo(
    () => expenses.filter((e) => e.type !== 'income').reduce((sum, e) => sum + e.amount, 0),
    [expenses],
  );

  const monthlyIncomeTotal = useMemo(
    () => expenses.filter((e) => e.type === 'income').reduce((sum, e) => sum + e.amount, 0),
    [expenses],
  );

  const handleSwipeOpen = useCallback((ref: Swipeable) => {
    if (openSwipeableRef.current && openSwipeableRef.current !== ref) {
      openSwipeableRef.current.close();
    }
    openSwipeableRef.current = ref;
  }, []);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      <View style={[styles.searchWrap, { backgroundColor: colors.header, borderBottomColor: colors.border }]}>
        <View style={[styles.searchBox, { backgroundColor: colors.inputBg }]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Kereses..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')} hitSlop={8}>
              <Text style={[styles.clearBtn, { color: colors.textMuted }]}>✕</Text>
            </Pressable>
          )}
        </View>
      </View>

      {filterCats.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={[styles.chips, { backgroundColor: colors.header, borderBottomColor: colors.border }]}
          contentContainerStyle={styles.chipsContent}
        >
          <Pressable
            style={[
              styles.chip,
              { borderColor: colors.border, backgroundColor: colors.card },
              !activeFilter && [styles.chipActive, { backgroundColor: colors.primary, borderColor: colors.primary }],
            ]}
            onPress={() => setActiveFilter(null)}
          >
            <Text style={[styles.chipText, { color: colors.textSub }, !activeFilter && styles.chipTextActive]}>Mind</Text>
          </Pressable>
          {filterCats.map((cat) => {
            const active = activeFilter === cat.id;
            return (
              <Pressable
                key={cat.id}
                style={[
                  styles.chip,
                  { borderColor: colors.border, backgroundColor: colors.card },
                  active && { backgroundColor: cat.color, borderColor: cat.color },
                ]}
                onPress={() => setActiveFilter(active ? null : cat.id)}
              >
                <Text style={{ fontSize: 12, marginRight: 4 }}>{cat.icon}</Text>
                <Text style={[styles.chipText, { color: colors.textSub }, active && styles.chipTextActive]}>
                  {cat.name_hu}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      <View style={styles.summaryStrip}>
        <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>{expenses.length} tetel</Text>
        <View style={styles.summaryTotals}>
          {monthlyIncomeTotal > 0 && (
            <Text style={[styles.summaryTotal, styles.summaryIncome]}>
              +{monthlyIncomeTotal.toLocaleString('hu-HU')} Ft
            </Text>
          )}
          <Text style={[styles.summaryTotal, styles.summaryExpense]}>
            -{monthlyExpenseTotal.toLocaleString('hu-HU')} Ft
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
        }
      >
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        ) : groups.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>💸</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {search || activeFilter ? 'Nincs talalat' : 'Meg nincs tranzakcio'}
            </Text>
            <Text style={[styles.emptyHint, { color: colors.textMuted }]}>
              {search || activeFilter
                ? 'Probald mas keresesi feltetellel'
                : 'Nyomj a + gombra az elso rogziteshez!'}
            </Text>
          </View>
        ) : (
          groups.map((group) => (
            <View key={group.dateKey}>
              <Text style={[styles.dayLabel, { color: colors.textMuted }]}>{group.label}</Text>
              <View style={[styles.card, { backgroundColor: colors.card }]}>
                {group.items.map((expense, idx) => (
                  <ExpenseRow
                    key={expense.id}
                    expense={expense}
                    cat={catMap.get(expense.category_id ?? '')}
                    isLast={idx === group.items.length - 1}
                    onDelete={() => deleteExpense(expense.id)}
                    onEdit={() => router.push({
                      pathname: '/modals/quick-add',
                      params: {
                        expenseId: expense.id,
                        expenseAmount: String(expense.amount),
                        expenseCategoryId: expense.category_id ?? '',
                        expenseType: expense.type ?? 'expense',
                        expenseDescription: expense.description ?? '',
                        expenseNote: expense.note ?? '',
                        expenseLabelIds: JSON.stringify(
                          (expense.metadata as Record<string, unknown> | null)?.label_ids ?? [],
                        ),
                      },
                    })}
                    onSwipeOpen={handleSwipeOpen}
                  />
                ))}
              </View>
            </View>
          ))
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={[styles.addBtnWrap, { backgroundColor: `${colors.bg}F2`, borderTopColor: colors.border }]}>
        <Pressable style={[styles.addBtn, { backgroundColor: colors.primary, shadowColor: colors.primary }]} onPress={() => router.push('/modals/quick-add')}>
          <Text style={styles.addBtnText}>+ Tranzakcio hozzaadasa</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function ExpenseRow({
  expense,
  cat,
  isLast,
  onDelete,
  onEdit,
  onSwipeOpen,
}: {
  expense: Expense;
  cat: Category | undefined;
  isLast: boolean;
  onDelete: () => void;
  onEdit: () => void;
  onSwipeOpen: (ref: Swipeable) => void;
}) {
  const colors = useColors();
  const swipeableRef = useRef<Swipeable>(null);
  const isIncome = expense.type === 'income';
  const iconBg = isIncome && !cat ? '#10B98122' : (cat?.color ?? colors.textMuted) + '22';

  function renderRightActions(
    _progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>,
  ) {
    const scale = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [1, 0.7],
      extrapolate: 'clamp',
    });

    return (
      <Pressable
        style={[styles.deleteAction, { backgroundColor: colors.deleteBg }]}
        onPress={() => {
          swipeableRef.current?.close();
          onDelete();
        }}
      >
        <Animated.View style={{ transform: [{ scale }] }}>
          <Text style={styles.deleteActionText}>Torles</Text>
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <Swipeable
      ref={swipeableRef}
      friction={2}
      overshootRight={false}
      rightThreshold={40}
      renderRightActions={renderRightActions}
      onSwipeableOpen={() => onSwipeOpen(swipeableRef.current!)}
    >
      <Pressable
        style={[
          styles.item,
          { backgroundColor: colors.card },
          !isLast && styles.itemBorder,
          !isLast && { borderBottomColor: colors.borderLight },
        ]}
        onPress={onEdit}
      >
        <View style={[styles.itemIco, { backgroundColor: iconBg }]}>
          <Text style={{ fontSize: 18 }}>{cat?.icon ?? (isIncome ? '💰' : '📦')}</Text>
        </View>

        <View style={styles.itemInfo}>
          <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={1}>
            {cat?.name_hu ?? (isIncome ? 'Bevetel' : 'Kategoria nelkul')}
          </Text>
          {!!expense.note && (
            <Text style={[styles.itemNote, { color: colors.textSub }]} numberOfLines={1}>
              {expense.note}
            </Text>
          )}
          <Text style={[styles.itemMeta, { color: colors.textMuted }]} numberOfLines={1}>
            {new Date(expense.expense_date).toLocaleDateString('hu-HU', {
              month: 'short',
              day: 'numeric',
            })}
            {expense.location_name ? ` · 📍 ${expense.location_name}` : ''}
          </Text>
        </View>

        <View style={styles.itemRight}>
          <Text style={[styles.itemAmt, isIncome && styles.itemAmtIncome]}>
            {isIncome ? '+' : '-'}{expense.amount.toLocaleString('hu-HU')} Ft
          </Text>
          <Text style={[styles.swipeHint, { color: colors.textMuted }]}>‹</Text>
        </View>
      </Pressable>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2F2F7' },

  searchWrap: {
    backgroundColor: 'white',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchBox: {
    backgroundColor: '#F3F4F6',
    borderRadius: 11,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
  },
  searchIcon: { fontSize: 14 },
  searchInput: { flex: 1, paddingVertical: 9, fontSize: 14, color: '#111827' },
  clearBtn: { fontSize: 14, color: '#9CA3AF', paddingHorizontal: 2 },

  chips: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    maxHeight: 54,
  },
  chipsContent: {
    padding: 10,
    gap: 7,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: 'white',
  },
  chipActive: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
  chipText: { fontSize: 12, fontWeight: '500', color: '#6B7280' },
  chipTextActive: { color: 'white' },

  summaryStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  summaryLabel: { fontSize: 12, color: '#9CA3AF', fontWeight: '500' },
  summaryTotals: { flexDirection: 'row', gap: 10 },
  summaryTotal: { fontSize: 13, fontWeight: '700', fontVariant: ['tabular-nums'] },
  summaryIncome: { color: '#10B981' },
  summaryExpense: { color: '#EF4444' },

  list: { paddingHorizontal: 16, paddingTop: 4, gap: 4 },
  center: { paddingTop: 60, alignItems: 'center' },
  emptyBox: { marginTop: 60, alignItems: 'center', gap: 8 },
  emptyEmoji: { fontSize: 44 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#374151' },
  emptyHint: { fontSize: 13, color: '#9CA3AF' },

  dayLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.7,
    paddingVertical: 8,
    paddingHorizontal: 2,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 4,
  },

  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 11,
    backgroundColor: 'white',
  },
  itemBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  itemIco: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  itemNote: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  itemMeta: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  itemRight: { alignItems: 'flex-end' },
  itemAmt: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
    fontVariant: ['tabular-nums'],
  },
  itemAmtIncome: { color: '#10B981' },
  swipeHint: { fontSize: 12, color: '#D1D5DB', marginTop: 2 },

  deleteAction: {
    backgroundColor: '#EF4444',
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: 'white',
  },

  addBtnWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 20,
    backgroundColor: 'rgba(242,242,247,0.95)',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  addBtn: {
    backgroundColor: '#4F46E5',
    borderRadius: 14,
    padding: 15,
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  addBtnText: { color: 'white', fontSize: 15, fontWeight: '700' },
});
