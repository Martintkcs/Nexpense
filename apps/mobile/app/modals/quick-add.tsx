import { View, Text, Pressable, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useExpenses } from '@/hooks/useExpenses';
import { useCategories } from '@/hooks/useCategories';

export default function QuickAddModal() {
  const { user } = useAuth();
  const { addExpense, isAdding } = useExpenses();
  const { categories } = useCategories();

  const [amount, setAmount] = useState('0');
  const [selectedCatIdx, setSelectedCatIdx] = useState(0);

  // Az első 8 kategóriát mutatjuk a gyors hozzáadásban
  const visibleCats = categories.slice(0, 8);

  function pressDigit(d: string) {
    if (d === '000') {
      if (amount === '0') return;
      setAmount(prev => prev + '000');
    } else {
      if (amount === '0') setAmount(d);
      else setAmount(prev => prev + d);
    }
  }

  function pressDelete() {
    if (amount.length > 1) setAmount(prev => prev.slice(0, -1));
    else setAmount('0');
  }

  async function handleSave() {
    const numAmount = parseInt(amount, 10);
    if (!numAmount || numAmount <= 0) {
      Alert.alert('Hibás összeg', 'Adj meg egy érvényes összeget!');
      return;
    }
    if (!user) return;

    const selectedCategory = visibleCats[selectedCatIdx];
    const today = new Date().toISOString().split('T')[0];

    try {
      await addExpense({
        user_id: user.id,
        amount: numAmount,
        currency: 'HUF',
        category_id: selectedCategory?.id ?? null,
        description: selectedCategory?.name_hu ?? selectedCategory?.name ?? null,
        note: null,
        expense_date: today,
        expense_time: null,
        location_name: null,
        location_lat: null,
        location_lng: null,
        source: 'manual',
        apple_pay_transaction_id: null,
        is_deleted: false,
        metadata: null,
      });
      router.back();
    } catch (err: any) {
      Alert.alert('Hiba', err.message ?? 'Nem sikerült menteni a kiadást.');
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.cancel}>Mégsem</Text>
        </Pressable>
        <Text style={styles.title}>Kiadás hozzáadása</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Amount */}
      <View style={styles.amountSection}>
        <Text style={styles.amountDisplay}>
          {parseInt(amount, 10).toLocaleString('hu-HU')} Ft
        </Text>
        <Text style={styles.amountSub}>Magyar forint</Text>
      </View>

      {/* Category grid */}
      <View style={styles.catGrid}>
        {visibleCats.map((cat, i) => (
          <Pressable
            key={cat.id}
            style={[styles.catCell, selectedCatIdx === i && styles.catCellActive]}
            onPress={() => setSelectedCatIdx(i)}
          >
            <View style={[styles.catIco, { backgroundColor: cat.color + '22' }]}>
              <Text style={{ fontSize: 20 }}>{cat.icon}</Text>
            </View>
            <Text style={styles.catName} numberOfLines={1}>
              {cat.name_hu ?? cat.name}
            </Text>
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

      <Pressable
        style={[styles.saveBtn, isAdding && styles.saveBtnDisabled]}
        onPress={handleSave}
        disabled={isAdding}
      >
        {isAdding
          ? <ActivityIndicator color="white" />
          : <Text style={styles.saveBtnText}>💾 Mentés</Text>
        }
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'white' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  cancel: { fontSize: 16, color: '#6B7280', width: 60 },
  title: { fontSize: 16, fontWeight: '700', color: '#111827' },
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
  saveBtnDisabled: { backgroundColor: '#A5B4FC' },
  saveBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },
});
