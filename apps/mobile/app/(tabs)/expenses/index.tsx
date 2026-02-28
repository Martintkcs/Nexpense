import { View, Text, ScrollView, TextInput, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

const FILTERS = ['Mind', 'Étel', 'Transport', 'Vásárlás', 'Szórakozás', 'Egészség'];

export default function ExpensesScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Search */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput style={styles.searchInput} placeholder="Keresés..." placeholderTextColor="#9CA3AF" />
        </View>
      </View>

      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips} contentContainerStyle={styles.chipsContent}>
        {FILTERS.map((f, i) => (
          <Pressable key={f} style={[styles.chip, i === 0 && styles.chipActive]}>
            <Text style={[styles.chipText, i === 0 && styles.chipTextActive]}>{f}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* List */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        <Text style={styles.dayLabel}>MA – FEBR. 28.</Text>
        <View style={styles.card}>
          <ExpItem emoji="🛒" name="Lidl" cat="Étel & Ital · #heti vásárlás" amount="4 320 Ft" time="09:15" />
          <ExpItem emoji="☕" name="Costa Coffee" cat="Étel & Ital · #kávé" amount="1 290 Ft" time="08:02" />
        </View>
        <Text style={styles.dayLabel}>TEGNAP – FEBR. 27.</Text>
        <View style={styles.card}>
          <ExpItem emoji="🚌" name="BKK bérlet" cat="Transport · #havi" amount="9 500 Ft" time="18:30" />
          <ExpItem emoji="👗" name="Zara" cat="Vásárlás · #ruha" amount="18 990 Ft" time="14:10" />
          <ExpItem emoji="🎬" name="Cinema City" cat="Szórakozás" amount="3 800 Ft" time="20:00" last />
        </View>
        <Text style={styles.dayLabel}>FEBR. 26.</Text>
        <View style={styles.card}>
          <ExpItem emoji="🍔" name="McDonald's" cat="Étel & Ital" amount="2 850 Ft" time="13:20" />
          <ExpItem emoji="🥦" name="Bolt Szupermarket" cat="Étel & Ital" amount="6 700 Ft" time="10:45" last />
        </View>
      </ScrollView>

      <View style={styles.addBtnWrap}>
        <Pressable style={styles.addBtn} onPress={() => router.push('/modals/quick-add')}>
          <Text style={styles.addBtnText}>+ Kiadás hozzáadása</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function ExpItem({ emoji, name, cat, amount, time, last = false }: any) {
  return (
    <View style={[styles.item, !last && styles.itemBorder]}>
      <View style={styles.itemIco}><Text>{emoji}</Text></View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{name}</Text>
        <Text style={styles.itemCat}>{cat}</Text>
      </View>
      <View>
        <Text style={styles.itemAmt}>{amount}</Text>
        <Text style={styles.itemTime}>{time}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2F2F7' },
  searchWrap: { backgroundColor: 'white', padding: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  searchBox: { backgroundColor: '#F3F4F6', borderRadius: 11, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 8 },
  searchIcon: { fontSize: 14 },
  searchInput: { flex: 1, paddingVertical: 9, fontSize: 14, color: '#111827' },
  chips: { backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  chipsContent: { padding: 10, gap: 8, flexDirection: 'row' },
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 18, borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: 'white' },
  chipActive: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
  chipText: { fontSize: 13, fontWeight: '500', color: '#6B7280' },
  chipTextActive: { color: 'white' },
  list: { padding: 16, gap: 6, paddingBottom: 90 },
  dayLabel: { fontSize: 11, fontWeight: '700', color: '#9CA3AF', letterSpacing: 0.7, paddingVertical: 8 },
  card: { backgroundColor: 'white', borderRadius: 14, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 2 },
  item: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 11 },
  itemBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  itemIco: { width: 40, height: 40, backgroundColor: '#FFF7ED', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  itemCat: { fontSize: 12, color: '#6B7280', marginTop: 1 },
  itemAmt: { fontSize: 14, fontWeight: '500', color: '#111827', textAlign: 'right', fontVariant: ['tabular-nums'] },
  itemTime: { fontSize: 11, color: '#9CA3AF', textAlign: 'right', marginTop: 1 },
  addBtnWrap: { padding: 16, paddingBottom: 20, backgroundColor: '#F2F2F7' },
  addBtn: { backgroundColor: '#4F46E5', borderRadius: 14, padding: 15, alignItems: 'center', shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6 },
  addBtnText: { color: 'white', fontSize: 15, fontWeight: '700' },
});
