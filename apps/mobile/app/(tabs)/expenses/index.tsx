import { useState, useMemo, useRef, useCallback } from 'react';
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

// ─── Date helpers ──────────────────────────────────────────────────────────────

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

// ─── Main screen ───────────────────────────────────────────────────────────────

export default function ExpensesScreen() {
  const { expenses, isLoading, isRefetching, refetch, deleteExpense } = useExpenses();
  const { categories } = useCategories();

  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  // Close any open swipeable when another one opens
  const openSwipeableRef = useRef<Swipeable | null>(null);

  const catMap = useMemo(() => new Map(categories.map(c => [c.id, c])), [categories]);

  // Category chips — only show categories that appear in actual expenses
  const usedCatIds = useMemo(
    () => new Set(expenses.map(e => e.category_id).filter(Boolean)),
    [expenses],
  );
  const filterCats = useMemo(
    () => categories.filter(c => usedCatIds.has(c.id)),
    [categories, usedCatIds],
  );

  // Filter + search (client-side, instant)
  const filtered = useMemo(() => {
    let list = expenses;
    if (activeFilter) list = list.filter(e => e.category_id === activeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(e => {
        const desc = (e.description ?? '').toLowerCase();
        const cat = catMap.get(e.category_id ?? '');
        const catName = (cat?.name_hu ?? '').toLowerCase();
        return desc.includes(q) || catName.includes(q);
      });
    }
    return list;
  }, [expenses, activeFilter, search, catMap]);

  const groups = useMemo(() => groupByDate(filtered), [filtered]);

  const monthlyTotal = useMemo(
    () => expenses.reduce((sum, e) => sum + e.amount, 0),
    [expenses],
  );

  const handleSwipeOpen = useCallback((ref: Swipeable) => {
    if (openSwipeableRef.current && openSwipeableRef.current !== ref) {
      openSwipeableRef.current.close();
    }
    openSwipeableRef.current = ref;
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* ── Search ── */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Keresés..."
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')} hitSlop={8}>
              <Text style={styles.clearBtn}>✕</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* ── Category filter chips ── */}
      {filterCats.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chips}
          contentContainerStyle={styles.chipsContent}
        >
          <Pressable
            style={[styles.chip, !activeFilter && styles.chipActive]}
            onPress={() => setActiveFilter(null)}
          >
            <Text style={[styles.chipText, !activeFilter && styles.chipTextActive]}>Mind</Text>
          </Pressable>
          {filterCats.map(cat => {
            const active = activeFilter === cat.id;
            return (
              <Pressable
                key={cat.id}
                style={[
                  styles.chip,
                  active && { backgroundColor: cat.color, borderColor: cat.color },
                ]}
                onPress={() => setActiveFilter(active ? null : cat.id)}
              >
                <Text style={{ fontSize: 12, marginRight: 4 }}>{cat.icon}</Text>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {cat.name_hu}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {/* ── Summary strip ── */}
      <View style={styles.summaryStrip}>
        <Text style={styles.summaryLabel}>{expenses.length} tétel ebben a hónapban</Text>
        <Text style={styles.summaryTotal}>
          {isLoading ? '...' : `${monthlyTotal.toLocaleString('hu-HU')} Ft`}
        </Text>
      </View>

      {/* ── List ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#4F46E5" />
        }
      >
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color="#4F46E5" size="large" />
          </View>
        ) : groups.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>💸</Text>
            <Text style={styles.emptyTitle}>
              {search || activeFilter ? 'Nincs találat' : 'Még nincs kiadás'}
            </Text>
            <Text style={styles.emptyHint}>
              {search || activeFilter
                ? 'Próbálj más keresési feltételt'
                : 'Nyomj a + gombra az első rögzítéséhez!'}
            </Text>
          </View>
        ) : (
          groups.map(group => (
            <View key={group.dateKey}>
              <Text style={styles.dayLabel}>{group.label}</Text>
              <View style={styles.card}>
                {group.items.map((expense, idx) => (
                  <ExpenseRow
                    key={expense.id}
                    expense={expense}
                    cat={catMap.get(expense.category_id ?? '')}
                    isLast={idx === group.items.length - 1}
                    onDelete={() => deleteExpense(expense.id)}
                    onSwipeOpen={handleSwipeOpen}
                  />
                ))}
              </View>
            </View>
          ))
        )}
        {/* Bottom padding so last item isn't hidden behind the add button */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Add button ── */}
      <View style={styles.addBtnWrap}>
        <Pressable style={styles.addBtn} onPress={() => router.push('/modals/quick-add')}>
          <Text style={styles.addBtnText}>+ Kiadás hozzáadása</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

// ─── Swipeable row ─────────────────────────────────────────────────────────────

function ExpenseRow({
  expense,
  cat,
  isLast,
  onDelete,
  onSwipeOpen,
}: {
  expense: Expense;
  cat: Category | undefined;
  isLast: boolean;
  onDelete: () => void;
  onSwipeOpen: (ref: Swipeable) => void;
}) {
  const swipeableRef = useRef<Swipeable>(null);
  const iconBg = (cat?.color ?? '#9CA3AF') + '22'; // 13 % opacity tint

  // The red action panel revealed on swipe-left
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
        style={styles.deleteAction}
        onPress={() => {
          swipeableRef.current?.close();
          onDelete();
        }}
      >
        <Animated.View style={{ transform: [{ scale }], alignItems: 'center' }}>
          <Text style={styles.deleteActionIcon}>🗑️</Text>
          <Text style={styles.deleteActionText}>Törlés</Text>
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
      <View style={[styles.item, !isLast && styles.itemBorder]}>
        {/* Category icon */}
        <View style={[styles.itemIco, { backgroundColor: iconBg }]}>
          <Text style={{ fontSize: 18 }}>{cat?.icon ?? '📦'}</Text>
        </View>

        {/* Name + category */}
        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={1}>
            {expense.description ?? cat?.name_hu ?? 'Kiadás'}
          </Text>
          <Text style={styles.itemCat} numberOfLines={1}>
            {cat?.name_hu ?? 'Kategória nélkül'}
            {expense.location_name ? `  ·  📍 ${expense.location_name}` : ''}
          </Text>
        </View>

        {/* Amount */}
        <View style={styles.itemRight}>
          <Text style={styles.itemAmt}>
            -{expense.amount.toLocaleString('hu-HU')} Ft
          </Text>
          {/* Subtle swipe hint arrow */}
          <Text style={styles.swipeHint}>‹</Text>
        </View>
      </View>
    </Swipeable>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2F2F7' },

  // Search
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

  // Chips
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

  // Summary
  summaryStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  summaryLabel: { fontSize: 12, color: '#9CA3AF', fontWeight: '500' },
  summaryTotal: {
    fontSize: 13,
    color: '#4F46E5',
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },

  // List
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

  // Row
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
  itemCat: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  itemRight: { alignItems: 'flex-end' },
  itemAmt: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
    fontVariant: ['tabular-nums'],
  },
  swipeHint: { fontSize: 12, color: '#D1D5DB', marginTop: 2 },

  // Swipe delete action
  deleteAction: {
    backgroundColor: '#EF4444',
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteActionIcon: { fontSize: 20 },
  deleteActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'white',
    marginTop: 2,
  },

  // Add button
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
