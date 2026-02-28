import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';

const CATEGORIES = [
  { emoji: '🍽️', name: 'Étel', bg: '#FFF7ED' },
  { emoji: '🚌', name: 'Transport', bg: '#EFF6FF' },
  { emoji: '🛍️', name: 'Vásárlás', bg: '#FDF2F8' },
  { emoji: '🎬', name: 'Szórakozás', bg: '#F5F3FF' },
  { emoji: '💊', name: 'Egészség', bg: '#F0FDF4' },
  { emoji: '⚡', name: 'Rezsi', bg: '#FEF9C3' },
  { emoji: '🎵', name: 'Előfizetés', bg: '#EFF6FF' },
  { emoji: '📦', name: 'Egyéb', bg: '#F9FAFB' },
];

export default function QuickAddModal() {
  const [amount, setAmount] = useState('0');
  const [selectedCat, setSelectedCat] = useState(0);

  function pressDigit(d: string) {
    if (amount === '0') setAmount(d);
    else setAmount(prev => prev + d);
  }
  function pressDelete() {
    if (amount.length > 1) setAmount(prev => prev.slice(0, -1));
    else setAmount('0');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}><Text style={styles.cancel}>Mégsem</Text></Pressable>
        <Text style={styles.title}>Kiadás hozzáadása</Text>
        <Pressable><Text style={styles.save}>Mentés</Text></Pressable>
      </View>

      {/* Amount */}
      <View style={styles.amountSection}>
        <Text style={styles.amountDisplay}>{parseInt(amount, 10).toLocaleString('hu-HU')} Ft</Text>
        <Text style={styles.amountSub}>Magyar forint</Text>
      </View>

      {/* Category grid */}
      <View style={styles.catGrid}>
        {CATEGORIES.map((cat, i) => (
          <Pressable
            key={cat.name}
            style={[styles.catCell, selectedCat === i && styles.catCellActive]}
            onPress={() => setSelectedCat(i)}
          >
            <View style={[styles.catIco, { backgroundColor: cat.bg }]}>
              <Text style={{ fontSize: 20 }}>{cat.emoji}</Text>
            </View>
            <Text style={styles.catName}>{cat.name}</Text>
          </Pressable>
        ))}
      </View>

      {/* Numpad */}
      <View style={styles.numpad}>
        {['1','2','3','4','5','6','7','8','9','000','0','⌫'].map((key) => (
          <Pressable
            key={key}
            style={styles.numKey}
            onPress={() => key === '⌫' ? pressDelete() : pressDigit(key)}
          >
            <Text style={styles.numKeyText}>{key}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable style={styles.saveBtn} onPress={() => router.back()}>
        <Text style={styles.saveBtnText}>Mentés</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'white' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  cancel: { fontSize: 16, color: '#6B7280' },
  title: { fontSize: 16, fontWeight: '700', color: '#111827' },
  save: { fontSize: 16, color: '#4F46E5', fontWeight: '700' },
  amountSection: { alignItems: 'center', paddingVertical: 24 },
  amountDisplay: { fontSize: 42, fontWeight: '500', color: '#111827', fontVariant: ['tabular-nums'] },
  amountSub: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 8 },
  catCell: { width: '22%', alignItems: 'center', gap: 4, padding: 8, borderRadius: 12, borderWidth: 2, borderColor: 'transparent' },
  catCellActive: { borderColor: '#4F46E5', backgroundColor: '#EEF2FF' },
  catIco: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  catName: { fontSize: 10, fontWeight: '500', color: '#6B7280', textAlign: 'center' },
  numpad: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, marginTop: 12, gap: 8 },
  numKey: { width: '30%', aspectRatio: 2.2, backgroundColor: '#F3F4F6', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  numKeyText: { fontSize: 20, fontWeight: '500', color: '#111827' },
  saveBtn: { margin: 16, backgroundColor: '#4F46E5', borderRadius: 14, padding: 15, alignItems: 'center' },
  saveBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },
});
