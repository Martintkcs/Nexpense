import { useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, Alert, TextInput, Modal,
  KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard,
  ActivityIndicator, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useSettingsStore } from '@/stores/settingsStore';
import { useProfile } from '@/hooks/useProfile';
import { useColors } from '@/lib/useColors';

const CURRENCIES = [
  { code: 'HUF', label: 'Magyar forint (HUF)', symbol: 'Ft' },
  { code: 'EUR', label: 'Euró (EUR)',           symbol: '€'  },
  { code: 'USD', label: 'Dollár (USD)',          symbol: '$'  },
];

export default function FinanceSettings() {
  const colors = useColors();
  const { currency, setCurrency, hourlyWage, setHourlyWage } = useSettingsStore();
  const { updateProfile, isUpdating } = useProfile();

  // ── Wage modal ────────────────────────────────────────────
  const [wageModal, setWageModal] = useState(false);
  const [wageInput, setWageInput] = useState('');

  function openWageModal() {
    setWageInput(hourlyWage?.toString() ?? '');
    setWageModal(true);
  }

  async function handleSaveWage() {
    const parsed = parseFloat(wageInput.replace(',', '.'));
    if (isNaN(parsed) || parsed <= 0) {
      Alert.alert('Hibás érték', 'Adj meg érvényes órabért (pl. 2500)!');
      return;
    }
    try {
      await updateProfile({ hourly_wage: parsed });
      setHourlyWage(parsed);
      setWageModal(false);
    } catch {
      Alert.alert('Hiba', 'Nem sikerült menteni. Próbáld újra!');
    }
  }

  async function handleSelectCurrency(code: string) {
    setCurrency(code);
    try {
      await updateProfile({ currency: code });
    } catch {
      // silent – store already updated
    }
  }

  const wageLabel = hourlyWage
    ? `${hourlyWage.toLocaleString('hu-HU')} Ft / óra`
    : 'Nincs beállítva';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      {/* ── Header ── */}
      <View style={[styles.header, { backgroundColor: colors.header, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backChevron}>‹</Text>
          <Text style={styles.backTxt}>Vissza</Text>
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>Pénzügyek</Text>
        <View style={{ width: 80 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── ÓRABÉR ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>ÓRABÉR</Text>
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Pressable
              onPress={openWageModal}
              style={({ pressed }) => ({ backgroundColor: pressed ? colors.pressedBg : colors.card })}
            >
              <View style={styles.row}>
                <View style={[styles.rowIcon, { backgroundColor: colors.inputBg }]}>
                  <Text>💰</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowName, { color: colors.text }]}>Órabér beállítása</Text>
                  <Text style={[styles.rowValue, { color: colors.textSub }]}>{wageLabel}</Text>
                </View>
                <Text style={[styles.chevron, { color: colors.textMuted }]}>›</Text>
              </View>
            </Pressable>
          </View>
          <Text style={[styles.hint, { color: colors.textMuted }]}>
            Az impulzus kalkulátor ezzel számolja meg, hány munkaórát ér egy vásárlás.
          </Text>
        </View>

        {/* ── DEVIZA ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>DEVIZA</Text>
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            {CURRENCIES.map((c, i) => {
              const active = c.code === currency;
              return (
                <Pressable
                  key={c.code}
                  onPress={() => handleSelectCurrency(c.code)}
                  style={({ pressed }) => [
                    i < CURRENCIES.length - 1 && styles.rowBorder,
                    { backgroundColor: active ? '#EEF2FF' : pressed ? colors.pressedBg : colors.card },
                  ]}
                >
                  <View style={styles.row}>
                    <View style={[styles.rowIcon, { backgroundColor: colors.inputBg }, active && styles.rowIconActive]}>
                      <Text style={[styles.currencySymbol, active && styles.currencySymbolActive]}>
                        {c.symbol}
                      </Text>
                    </View>
                    <Text style={[styles.rowName, { flex: 1, color: colors.text }, active && styles.rowNameActive]}>
                      {c.label}
                    </Text>
                    {active && <Text style={styles.checkMark}>✓</Text>}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

      </ScrollView>

      {/* ════ Órabér modal ════ */}
      <Modal visible={wageModal} transparent animationType="fade" statusBarTranslucent>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableWithoutFeedback onPress={() => { Keyboard.dismiss(); setWageModal(false); }}>
            <View style={styles.overlayCenter}>
              <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
                <View style={[styles.wageCard, { backgroundColor: colors.card }]}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>Órabér beállítása</Text>
                  <Text style={[styles.modalHint, { color: colors.textSub }]}>
                    Az impulzus kalkulátor ezzel számolja meg, hány munkaórát ér egy vásárlás.
                  </Text>
                  <View style={[styles.wageInputRow, { backgroundColor: colors.inputBg }]}>
                    <TextInput
                      style={[styles.wageInput, { color: colors.text }]}
                      value={wageInput}
                      onChangeText={setWageInput}
                      keyboardType="numeric"
                      placeholder="pl. 2500"
                      placeholderTextColor={colors.textMuted}
                      autoFocus
                      selectTextOnFocus
                    />
                    <Text style={[styles.wageUnit, { color: colors.textSub }]}>Ft / óra</Text>
                  </View>
                  <View style={styles.modalActions}>
                    <Pressable style={[styles.cancelBtn, { backgroundColor: colors.inputBg }]} onPress={() => setWageModal(false)}>
                      <Text style={[styles.cancelTxt, { color: colors.textSub }]}>Mégse</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.saveBtn, isUpdating && { opacity: 0.65 }]}
                      onPress={handleSaveWage}
                      disabled={isUpdating}
                    >
                      {isUpdating
                        ? <ActivityIndicator color="white" size="small" />
                        : <Text style={styles.saveTxt}>Mentés</Text>
                      }
                    </Pressable>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#F2F2F7' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'white', paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  backBtn:     { flexDirection: 'row', alignItems: 'center', gap: 2, width: 80 },
  backChevron: { fontSize: 28, color: '#4F46E5', lineHeight: 32, marginTop: -2 },
  backTxt:     { fontSize: 16, color: '#4F46E5', fontWeight: '500' },
  title:       { fontSize: 17, fontWeight: '700', color: '#111827' },

  content:      { padding: 16, paddingBottom: 48 },
  section:      { marginBottom: 20 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#9CA3AF', letterSpacing: 0.8, paddingHorizontal: 4, marginBottom: 6 },
  hint:         { fontSize: 12, color: '#9CA3AF', paddingHorizontal: 4, marginTop: 6, lineHeight: 18 },

  card: {
    backgroundColor: 'white', borderRadius: 14, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 2,
  },

  row:          { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingHorizontal: 14 },
  rowBorder:    { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  rowPressed:   { backgroundColor: '#F9FAFB' },
  rowActive:    { backgroundColor: '#EEF2FF' },
  rowIcon:      { width: 32, height: 32, backgroundColor: '#F3F4F6', borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  rowIconActive:{ backgroundColor: '#EEF2FF' },
  rowName:      { fontSize: 14, fontWeight: '500', color: '#111827' },
  rowNameActive:{ color: '#4F46E5', fontWeight: '600' },
  rowValue:     { fontSize: 12, color: '#6B7280', marginTop: 1 },
  chevron:      { fontSize: 20, color: '#D1D5DB' },

  currencySymbol:       { fontSize: 15, fontWeight: '700', color: '#6B7280' },
  currencySymbolActive: { color: '#4F46E5' },
  checkMark:            { fontSize: 16, color: '#4F46E5', fontWeight: '700' },

  // Wage modal
  overlayCenter: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', paddingHorizontal: 24 },
  wageCard: {
    backgroundColor: 'white', borderRadius: 20, padding: 24, gap: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15, shadowRadius: 24, elevation: 10,
  },
  modalTitle:    { fontSize: 18, fontWeight: '700', color: '#111827' },
  modalHint:     { fontSize: 13, color: '#6B7280', lineHeight: 20, marginTop: -4 },
  wageInputRow:  { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 14 },
  wageInput:     { flex: 1, fontSize: 22, fontWeight: '600', color: '#111827', paddingVertical: 14 },
  wageUnit:      { fontSize: 14, color: '#6B7280', fontWeight: '500' },
  modalActions:  { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn:     { flex: 1, backgroundColor: '#F3F4F6', borderRadius: 12, padding: 14, alignItems: 'center' },
  cancelTxt:     { fontSize: 15, fontWeight: '600', color: '#374151' },
  saveBtn:       { flex: 2, backgroundColor: '#4F46E5', borderRadius: 12, padding: 14, alignItems: 'center' },
  saveTxt:       { fontSize: 15, fontWeight: '700', color: 'white' },
});
