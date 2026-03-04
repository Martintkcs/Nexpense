import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useImpulseItems } from '@/hooks/useImpulse';
import { useCategories } from '@/hooks/useCategories';
import { useSettingsStore } from '@/stores/settingsStore';
import type { ImpulseItem } from '@/types/database';
import { useColors } from '@/lib/useColors';

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Visszaszámláló szöveg a notify_at alapján */
function getTimeLeft(notifyAt: string): { text: string; expired: boolean } {
  const diff = new Date(notifyAt).getTime() - Date.now();
  if (diff <= 0) return { text: '24 óra letelt – döntés szükséges!', expired: true };

  const totalMinutes = Math.floor(diff / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return { text: `Még ${hours} óra ${minutes} perc a gondolkodási idő`, expired: false };
  }
  return { text: `Még ${minutes} perc a gondolkodási idő`, expired: false };
}

/** Munkaóra szöveg a hours_to_earn alapján */
function workHoursLabel(hours: number | null): string {
  if (!hours || hours <= 0) return '—';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h > 0) return `${h} óra ${m} perc`;
  return `${m} perc`;
}

// ─── Ticker hook ───────────────────────────────────────────────────────────────

/** Percenként frissülő tick, hogy a timer újrarenderelődjön */
function useMinuteTicker() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);
}

// ─── Screen ────────────────────────────────────────────────────────────────────

export default function ImpulseScreen() {
  const colors = useColors();
  useMinuteTicker();
  const { hourlyWage } = useSettingsStore();
  const {
    pending, history, savedAmount,
    isLoading, isRefetching, refetch,
    makeDecision, isDeciding,
  } = useImpulseItems();
  const { categories } = useCategories();

  // Build category lookup map
  const catMap = Object.fromEntries(categories.map(c => [c.id, c]));

  function confirmDecision(item: ImpulseItem, decision: 'purchased' | 'skipped') {
    const isPurchase = decision === 'purchased';
    Alert.alert(
      isPurchase ? '💳 Megvetted?' : '🎉 Megspórolod?',
      isPurchase
        ? `Biztosan megvetted a(z) "${item.name}" terméket?`
        : `Biztosan lemondasz a(z) "${item.name}" termékről? Ez ${item.price.toLocaleString('hu-HU')} Ft megtakarítás!`,
      [
        { text: 'Mégsem', style: 'cancel' },
        {
          text: isPurchase ? 'Igen, megvettem' : 'Igen, megspórolom',
          style: isPurchase ? 'destructive' : 'default',
          onPress: () => makeDecision({ id: item.id, decision }),
        },
      ],
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.header, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Impulzus Check ⚡</Text>
        <Text style={[styles.subtitle, { color: colors.textSub }]}>Gondold meg kétszer mielőtt vásárolsz</Text>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
          }
        >
          {/* ── Megtakarítás kártya ── */}
          <View style={[styles.savedCard, { backgroundColor: colors.card }]}>
            <Text style={styles.savedEmoji}>🎉</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.savedLabel, { color: colors.textSub }]}>EDDIG MEGSPÓROLTAD</Text>
              <Text style={styles.savedAmt}>
                {savedAmount > 0
                  ? `+ ${savedAmount.toLocaleString('hu-HU')} Ft`
                  : 'Még nincs megtakarítás'}
              </Text>
            </View>
            {history.filter(i => i.decision === 'skipped').length > 0 && (
              <Text style={[styles.savedCount, { color: colors.textSub }]}>
                {history.filter(i => i.decision === 'skipped').length} visszautasított{'\n'}impulzusvásárlás
              </Text>
            )}
          </View>

          {/* ── Figyelmeztető banner (ha van pending tétel) ── */}
          {pending.length > 0 && (
            <View style={styles.warnBanner}>
              <Text style={styles.warnEmoji}>⏳</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.warnTitle}>
                  {pending.length} tétel vár döntésre
                </Text>
                <Text style={styles.warnSub}>
                  {hourlyWage
                    ? `Az órabéred: ${hourlyWage.toLocaleString('hu-HU')} Ft/h – megéri?`
                    : 'Add meg az órabéredet a Beállításokban!'}
                </Text>
              </View>
            </View>
          )}

          {/* ── Üres állapot ── */}
          {pending.length === 0 && history.length === 0 && (
            <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
              <Text style={styles.emptyEmoji}>⚡</Text>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>Nincs impulzus tétel</Text>
              <Text style={[styles.emptyText, { color: colors.textSub }]}>
                Ha valami megtetszik, add hozzá! 24 óra után eldöntheted, hogy valóban szükséged van-e rá.
              </Text>
            </View>
          )}

          {/* ── Függőben lévő tételek ── */}
          {pending.map(item => (
            <ImpulseCard
              key={item.id}
              item={item}
              cat={item.category_id ? catMap[item.category_id] : undefined}
              onOpen={() => router.push({ pathname: '/(tabs)/impulse/new', params: { impulseId: item.id } } as any)}
              onSkip={() => confirmDecision(item, 'skipped')}
              onBuy={() => confirmDecision(item, 'purchased')}
              isDeciding={isDeciding}
            />
          ))}

          {/* ── Korábbi döntések ── */}
          {history.length > 0 && (
            <>
              <Text style={[styles.histLabel, { color: colors.textMuted }]}>KORÁBBI DÖNTÉSEK</Text>
              <View style={[styles.card, { backgroundColor: colors.card }]}>
                {history.map((item, i) => (
                  <HistItem
                    key={item.id}
                    item={item}
                    cat={item.category_id ? catMap[item.category_id] : undefined}
                    last={i === history.length - 1}
                    onOpen={() => router.push({ pathname: '/(tabs)/impulse/new', params: { impulseId: item.id } } as any)}
                  />
                ))}
              </View>
            </>
          )}
        </ScrollView>
      )}

      <View style={[styles.addBtnWrap, { backgroundColor: colors.bg }]}>
        <Pressable style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={() => router.push('/(tabs)/impulse/new' as any)}>
          <Text style={styles.addBtnText}>+ Új impulzus tétel</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

// ─── ImpulseCard komponens ─────────────────────────────────────────────────────

type CatInfo = { icon: string; color: string; name_hu: string | null } | undefined;

function ImpulseCard({
  item, cat, onOpen, onSkip, onBuy, isDeciding,
}: {
  item: ImpulseItem;
  cat: CatInfo;
  onOpen: () => void;
  onSkip: () => void;
  onBuy: () => void;
  isDeciding: boolean;
}) {
  const colors = useColors();
  const { text: timerText, expired } = getTimeLeft(item.notify_at);

  return (
    <Pressable style={[styles.card, { backgroundColor: colors.card }]} onPress={onOpen}>
      <View style={styles.itemTop}>
        <View style={[styles.itemEmoji, { backgroundColor: cat ? (cat.color + '22') : colors.borderLight }]}>
          <Text style={{ fontSize: 22 }}>{cat ? cat.icon : '🛍️'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
          <Text style={[styles.itemCat, { color: colors.textSub }]} numberOfLines={1}>
            {cat ? (cat.name_hu ?? 'Kategória') : 'Vásárlás'}
          </Text>
        </View>
        <Text style={[styles.itemPrice, { color: colors.text }]}>
          {item.price.toLocaleString('hu-HU')} Ft
        </Text>
      </View>

      <View style={styles.itemBody}>
        {item.hours_to_earn != null && item.hours_to_earn > 0 && (
          <View style={[styles.workRow, { backgroundColor: colors.inputBg }]}>
            <Text style={[styles.workLbl, { color: colors.textSub }]}>⏱️ Ezért ennyit dolgozol</Text>
            <Text style={styles.workVal}>{workHoursLabel(item.hours_to_earn)}</Text>
          </View>
        )}

        <View style={[styles.timerRow, expired && styles.timerRowWarn]}>
          <Text>{expired ? '🔔' : '⏰'}</Text>
          <Text style={[styles.timerTxt, expired && styles.timerTxtWarn]}>{timerText}</Text>
        </View>

        {item.store_name ? (
          <View style={[styles.reasonRow, { backgroundColor: colors.pressedBg }]}>
            <Text style={[styles.reasonTxt, { color: colors.textSub }]}>📝 {item.store_name}</Text>
          </View>
        ) : null}

        <View style={styles.actions}>
          <Pressable
            style={[styles.skipBtn, isDeciding && { opacity: 0.5 }]}
            onPress={onSkip}
            disabled={isDeciding}
          >
            <Text style={styles.skipTxt}>✕ Mégse kell</Text>
          </Pressable>
          <Pressable
            style={[styles.buyBtn, isDeciding && { opacity: 0.5 }]}
            onPress={onBuy}
            disabled={isDeciding}
          >
            <Text style={styles.buyBtnTxt}>✓ Megvettem</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

// ─── HistItem komponens ────────────────────────────────────────────────────────

function HistItem({ item, cat, last, onOpen }: { item: ImpulseItem; cat: CatInfo; last: boolean; onOpen: () => void }) {
  const colors = useColors();
  const skipped = item.decision === 'skipped';
  const dateStr = item.decided_at
    ? new Date(item.decided_at).toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' })
    : '';

  return (
    <Pressable style={[styles.histItem, !last && styles.histItemBorder, !last && { borderBottomColor: colors.borderLight }]} onPress={onOpen}>
      <View style={[styles.histIcon, { backgroundColor: cat ? (cat.color + '22') : colors.borderLight }]}>
        <Text style={{ fontSize: 18 }}>{cat ? cat.icon : '🛍️'}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.histName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
        {!!item.store_name && (
          <Text style={[styles.histDesc, { color: colors.textSub }]} numberOfLines={1}>
            {item.store_name}
          </Text>
        )}
        <Text style={[styles.histPrice, { color: colors.textMuted }]}>
          {item.price.toLocaleString('hu-HU')} Ft{dateStr ? ` · ${dateStr}` : ''}
        </Text>
      </View>
      <View style={[styles.badge, skipped ? styles.badgeGreen : styles.badgeRed]}>
        <Text style={[styles.badgeTxt, { color: skipped ? colors.badgeGreenTx : colors.badgeRedTx }]}>
          {skipped ? '✓ Megspóroltam' : '💳 Megvettem'}
        </Text>
      </View>
    </Pressable>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:     { flex: 1, backgroundColor: '#F2F2F7' },
  header:   { backgroundColor: 'white', padding: 16, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  title:    { fontSize: 22, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  center:   { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content:  { padding: 16, gap: 10, paddingBottom: 90 },

  savedCard:  { backgroundColor: 'white', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 2 },
  savedEmoji: { fontSize: 26 },
  savedLabel: { fontSize: 10, fontWeight: '700', color: '#6B7280', letterSpacing: 0.5 },
  savedAmt:   { fontSize: 20, fontWeight: '500', color: '#10B981', marginTop: 2, fontVariant: ['tabular-nums'] },
  savedCount: { fontSize: 11, color: '#6B7280', textAlign: 'right' },

  warnBanner: { backgroundColor: '#F59E0B', borderRadius: 14, padding: 14, flexDirection: 'row', gap: 12, alignItems: 'center' },
  warnEmoji:  { fontSize: 28 },
  warnTitle:  { fontSize: 14, fontWeight: '700', color: 'white' },
  warnSub:    { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2 },

  emptyCard:  { backgroundColor: 'white', borderRadius: 14, padding: 28, alignItems: 'center', gap: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 2 },
  emptyEmoji: { fontSize: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  emptyText:  { fontSize: 13, color: '#6B7280', textAlign: 'center', lineHeight: 19 },

  card:       { backgroundColor: 'white', borderRadius: 14, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 2 },
  itemTop:    { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 14 },
  itemEmoji:  { width: 46, height: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  itemName:   { fontSize: 15, fontWeight: '700', color: '#111827' },
  itemCat:    { fontSize: 12, color: '#6B7280', marginTop: 2 },
  itemPrice:  { fontSize: 16, fontWeight: '500', color: '#111827', fontVariant: ['tabular-nums'] },
  itemBody:   { padding: 14, paddingTop: 0, gap: 8 },

  workRow:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 9, padding: 10 },
  workLbl:     { flex: 1, fontSize: 12, color: '#6B7280' },
  workVal:     { fontSize: 13, fontWeight: '700', color: '#F59E0B' },

  timerRow:    { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FEF3C7', borderRadius: 9, padding: 9 },
  timerRowWarn:{ backgroundColor: '#FEE2E2' },
  timerTxt:    { fontSize: 13, fontWeight: '600', color: '#92400E', flex: 1 },
  timerTxtWarn:{ color: '#991B1B' },

  reasonRow:  { backgroundColor: '#F9FAFB', borderRadius: 9, padding: 9 },
  reasonTxt:  { fontSize: 12, color: '#6B7280', fontStyle: 'italic', lineHeight: 17 },

  actions:    { flexDirection: 'row', gap: 7 },
  skipBtn:    { flex: 1, backgroundColor: '#FEE2E2', borderRadius: 10, padding: 10, alignItems: 'center' },
  skipTxt:    { fontSize: 13, fontWeight: '600', color: '#991B1B' },
  buyBtn:     { flex: 1, backgroundColor: '#D1FAE5', borderRadius: 10, padding: 10, alignItems: 'center' },
  buyBtnTxt:  { fontSize: 13, fontWeight: '600', color: '#065F46' },

  histLabel:      { fontSize: 11, fontWeight: '700', color: '#9CA3AF', letterSpacing: 0.7 },
  histItem:       { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 14 },
  histItemBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  histIcon:       { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  histName:       { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  histDesc:       { fontSize: 12, color: '#6B7280', marginTop: 1 },
  histPrice:      { fontSize: 12, color: '#9CA3AF', marginTop: 1 },
  badge:          { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeGreen:     { backgroundColor: '#D1FAE5' },
  badgeRed:       { backgroundColor: '#FEE2E2' },
  badgeTxt:       { fontSize: 11, fontWeight: '700' },

  addBtnWrap: { padding: 16, paddingBottom: 20, backgroundColor: '#F2F2F7' },
  addBtn:     { backgroundColor: '#4F46E5', borderRadius: 14, padding: 15, alignItems: 'center' },
  addBtnText: { color: 'white', fontSize: 15, fontWeight: '700' },
});
