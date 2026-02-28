import { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useSettingsStore } from '@/stores/settingsStore';

export default function NewImpulseScreen() {
  const { hourlyWage } = useSettingsStore();
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [store, setStore] = useState('');
  const [url, setUrl] = useState('');
  const [reason, setReason] = useState('');

  const numericPrice = parseFloat(price.replace(/\s/g, '').replace(',', '.')) || 0;
  const wage = hourlyWage ?? 0;
  const hoursRaw = wage > 0 ? numericPrice / wage : 0;
  const hours = Math.floor(hoursRaw);
  const minutes = Math.round((hoursRaw - hours) * 60);

  const workLabel =
    wage === 0
      ? 'Órabéred még nincs megadva (Beállítások)'
      : hoursRaw === 0
      ? 'Add meg az árat'
      : `${hours > 0 ? `${hours} óra ` : ''}${minutes} perc munkával keresheted meg`;

  const canSave = name.trim().length > 0 && numericPrice > 0;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backTxt}>‹ Vissza</Text>
          </Pressable>
          <Text style={styles.title}>Új impulzus tétel</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Work hours preview */}
          <View style={styles.previewCard}>
            <Text style={styles.previewEmoji}>⏱️</Text>
            <Text style={styles.previewText}>{workLabel}</Text>
          </View>

          {/* Form */}
          <View style={styles.section}>
            <Text style={styles.label}>Termék neve *</Text>
            <TextInput
              style={styles.input}
              placeholder="pl. Nike Air Max 270"
              placeholderTextColor="#9CA3AF"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Ár (Ft) *</Text>
            <TextInput
              style={styles.input}
              placeholder="42 990"
              placeholderTextColor="#9CA3AF"
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Bolt / Webshop</Text>
            <TextInput
              style={styles.input}
              placeholder="pl. Nike.com"
              placeholderTextColor="#9CA3AF"
              value={store}
              onChangeText={setStore}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Link (opcionális)</Text>
            <TextInput
              style={styles.input}
              placeholder="https://..."
              placeholderTextColor="#9CA3AF"
              value={url}
              onChangeText={setUrl}
              keyboardType="url"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Miért akarod? (segít az AI-nak)</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              placeholder="pl. Régóta szeretném, kell a sporthoz..."
              placeholderTextColor="#9CA3AF"
              value={reason}
              onChangeText={setReason}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              ⏳ 24 óra múlva emlékeztetünk. Ha akkor is meg akarod venni – vedd meg. Ha nem – spórolj!
            </Text>
          </View>
        </ScrollView>

        {/* Save button */}
        <View style={styles.footer}>
          <Pressable
            style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
            onPress={() => {
              if (canSave) router.back();
            }}
            disabled={!canSave}
          >
            <Text style={styles.saveTxt}>Mentés + 24h visszaszámlálás</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2F2F7' },
  header: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: { width: 60 },
  backTxt: { fontSize: 17, color: '#4F46E5', fontWeight: '500' },
  title: { fontSize: 17, fontWeight: '700', color: '#111827' },
  content: { padding: 16, gap: 4, paddingBottom: 24 },
  previewCard: {
    backgroundColor: '#EEF2FF',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  previewEmoji: { fontSize: 22 },
  previewText: { flex: 1, fontSize: 13, color: '#4338CA', fontWeight: '600', lineHeight: 18 },
  section: { marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    fontSize: 15,
    color: '#111827',
  },
  multiline: { minHeight: 80 },
  infoBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
  },
  infoText: { fontSize: 13, color: '#92400E', lineHeight: 18 },
  footer: { padding: 16, paddingBottom: 24, backgroundColor: '#F2F2F7' },
  saveBtn: {
    backgroundColor: '#4F46E5',
    borderRadius: 14,
    padding: 15,
    alignItems: 'center',
  },
  saveBtnDisabled: { backgroundColor: '#C4B5FD' },
  saveTxt: { color: 'white', fontSize: 15, fontWeight: '700' },
});
