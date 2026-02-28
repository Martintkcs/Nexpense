import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

export default function ImpulseScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Impulzus Check ⚡</Text>
        <Text style={styles.subtitle}>Gondold meg kétszer mielőtt vásárolsz</Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* Megtakarítás */}
        <View style={styles.savedCard}>
          <Text style={styles.savedEmoji}>🎉</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.savedLabel}>EDDIG MEGSPÓROLTAD</Text>
            <Text style={styles.savedAmt}>+ 42 990 Ft</Text>
          </View>
          <Text style={styles.savedCount}>1 visszautasított{'\n'}impulzusvásárlás</Text>
        </View>

        {/* Warning banner */}
        <View style={styles.warnBanner}>
          <Text style={styles.warnEmoji}>⏳</Text>
          <View>
            <Text style={styles.warnTitle}>2 tétel vár döntésre</Text>
            <Text style={styles.warnSub}>Az órabéred: 13 300 Ft/h – megéri?</Text>
          </View>
        </View>

        {/* Item 1 */}
        <ImpulseCard
          emoji="👟"
          name="Nike Air Max 270"
          store="Nike.com · Sportcipő"
          price="42 990 Ft"
          hours="3 óra 14 perc"
          timer="Még 14 óra 23 perc a gondolkodási idő"
          timerWarning={false}
        />

        {/* Item 2 */}
        <ImpulseCard
          emoji="🎧"
          name="Sony WH-1000XM5"
          store="MediaMarkt · Headset"
          price="129 000 Ft"
          hours="9 óra 42 perc"
          timer="24 óra letelt – döntés szükséges!"
          timerWarning={true}
        />

        {/* History */}
        <Text style={styles.histLabel}>KORÁBBI DÖNTÉSEK</Text>
        <View style={styles.card}>
          <HistItem emoji="📱" name={'iPad Pro 11" M4'} price="739 990 Ft · febr. 10." skipped />
          <HistItem emoji="☕" name="DeLonghi Dedica kávégép" price="89 990 Ft · jan. 28." skipped={false} />
          <HistItem emoji="🧥" name="Tommy Hilfiger kabát" price="62 000 Ft · jan. 14." skipped last />
        </View>
      </ScrollView>

      <View style={styles.addBtnWrap}>
        <Pressable style={styles.addBtn} onPress={() => router.push('/(tabs)/impulse/new' as any)}>
          <Text style={styles.addBtnText}>+ Új impulzus tétel</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function ImpulseCard({ emoji, name, store, price, hours, timer, timerWarning }: any) {
  return (
    <View style={styles.card}>
      <View style={styles.itemTop}>
        <View style={styles.itemEmoji}><Text style={{ fontSize: 22 }}>{emoji}</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.itemName}>{name}</Text>
          <Text style={styles.itemStore}>{store}</Text>
        </View>
        <Text style={styles.itemPrice}>{price}</Text>
      </View>
      <View style={styles.itemBody}>
        <View style={styles.workRow}>
          <Text style={styles.workLbl}>⏱️ Ezért ennyit dolgozol</Text>
          <Text style={styles.workVal}>{hours}</Text>
        </View>
        <View style={[styles.timerRow, timerWarning && styles.timerRowWarn]}>
          <Text>{timerWarning ? '🔔' : '⏰'}</Text>
          <Text style={[styles.timerTxt, timerWarning && styles.timerTxtWarn]}>{timer}</Text>
        </View>
        <View style={styles.actions}>
          <Pressable style={styles.skipBtn}><Text style={styles.skipTxt}>✕ Mégse kell</Text></Pressable>
          <Pressable style={styles.aiBtn}><Text style={styles.aiBtnTxt}>🤖 AI Tanács</Text></Pressable>
        </View>
      </View>
    </View>
  );
}

function HistItem({ emoji, name, price, skipped, last = false }: any) {
  return (
    <View style={[styles.histItem, !last && styles.histItemBorder]}>
      <Text style={{ fontSize: 22 }}>{emoji}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.histName}>{name}</Text>
        <Text style={styles.histPrice}>{price}</Text>
      </View>
      <View style={[styles.badge, skipped ? styles.badgeGreen : styles.badgeRed]}>
        <Text style={[styles.badgeTxt, { color: skipped ? '#065F46' : '#991B1B' }]}>
          {skipped ? '✓ Megspóroltam' : 'Megvettem'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2F2F7' },
  header: { backgroundColor: 'white', padding: 16, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  title: { fontSize: 22, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  content: { padding: 16, gap: 10, paddingBottom: 90 },
  savedCard: { backgroundColor: 'white', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 14 },
  savedEmoji: { fontSize: 26 },
  savedLabel: { fontSize: 10, fontWeight: '700', color: '#6B7280', letterSpacing: 0.5 },
  savedAmt: { fontSize: 20, fontWeight: '500', color: '#10B981', marginTop: 2, fontVariant: ['tabular-nums'] },
  savedCount: { fontSize: 11, color: '#6B7280', textAlign: 'right' },
  warnBanner: { backgroundColor: '#F59E0B', borderRadius: 14, padding: 14, flexDirection: 'row', gap: 12, alignItems: 'center' },
  warnEmoji: { fontSize: 28 },
  warnTitle: { fontSize: 14, fontWeight: '700', color: 'white' },
  warnSub: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  card: { backgroundColor: 'white', borderRadius: 14, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 2 },
  itemTop: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 14 },
  itemEmoji: { width: 46, height: 46, backgroundColor: '#F3F4F6', borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  itemName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  itemStore: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  itemPrice: { fontSize: 16, fontWeight: '500', color: '#111827', fontVariant: ['tabular-nums'] },
  itemBody: { padding: 14, paddingTop: 0, gap: 8 },
  workRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 9, padding: 10 },
  workLbl: { flex: 1, fontSize: 12, color: '#6B7280' },
  workVal: { fontSize: 13, fontWeight: '700', color: '#F59E0B' },
  timerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FEF3C7', borderRadius: 9, padding: 9 },
  timerRowWarn: { backgroundColor: '#FEE2E2' },
  timerTxt: { fontSize: 13, fontWeight: '600', color: '#92400E', flex: 1 },
  timerTxtWarn: { color: '#991B1B' },
  actions: { flexDirection: 'row', gap: 7 },
  skipBtn: { flex: 1, backgroundColor: '#FEE2E2', borderRadius: 10, padding: 10, alignItems: 'center' },
  skipTxt: { fontSize: 13, fontWeight: '600', color: '#991B1B' },
  aiBtn: { flex: 1, backgroundColor: '#4F46E5', borderRadius: 10, padding: 10, alignItems: 'center' },
  aiBtnTxt: { fontSize: 13, fontWeight: '600', color: 'white' },
  histLabel: { fontSize: 11, fontWeight: '700', color: '#9CA3AF', letterSpacing: 0.7 },
  histItem: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 14 },
  histItemBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  histName: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  histPrice: { fontSize: 12, color: '#9CA3AF', marginTop: 1 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeGreen: { backgroundColor: '#D1FAE5' },
  badgeRed: { backgroundColor: '#FEE2E2' },
  badgeTxt: { fontSize: 11, fontWeight: '700' },
  addBtnWrap: { padding: 16, paddingBottom: 20, backgroundColor: '#F2F2F7' },
  addBtn: { backgroundColor: '#4F46E5', borderRadius: 14, padding: 15, alignItems: 'center' },
  addBtnText: { color: 'white', fontSize: 15, fontWeight: '700' },
});
