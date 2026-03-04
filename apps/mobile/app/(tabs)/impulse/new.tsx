import { useEffect, useState } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
  Modal, TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAuth } from '@/providers/AuthProvider';
import { useImpulseItems } from '@/hooks/useImpulse';
import { useCategories } from '@/hooks/useCategories';
import { useLabels } from '@/hooks/useLabels';
import { calcWorkHours } from '@/lib/currency';
import { useColors } from '@/lib/useColors';
import {
  requestNotificationPermission,
  scheduleImpulseNotification,
  getExpoPushToken,
} from '@/services/notifications';
import { savePushToken } from '@/services/supabase/pushTokens';

export default function NewImpulseScreen() {
  const colors = useColors();
  const { impulseId } = useLocalSearchParams<{ impulseId?: string }>();
  const isEditMode = !!impulseId;
  const { user } = useAuth();
  const { hourlyWage, notificationsEnabled, setNotificationsEnabled } = useSettingsStore();
  const { items, addItem, editItem, isAdding, isEditing } = useImpulseItems();
  const { categories } = useCategories();
  const { labels } = useLabels();

  const [name, setName]   = useState('');
  const [price, setPrice] = useState('');
  const [url, setUrl]     = useState('');
  const [aiReason, setAiReason] = useState('');

  const [selectedCatId, setSelectedCatId]       = useState<string | null>(null);
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);
  const [catPickerOpen, setCatPickerOpen]       = useState(false);
  const [didHydrate, setDidHydrate] = useState(false);

  const numericPrice = parseFloat(price.replace(/\s/g, '').replace(',', '.')) || 0;
  const wage = hourlyWage ?? 0;

  const selectedCat = categories.find(c => c.id === selectedCatId);

  const workLabel =
    wage === 0
      ? 'Órabéred még nincs megadva (Beállítások)'
      : numericPrice === 0
      ? 'Add meg az árat'
      : `${calcWorkHours(numericPrice, wage).display} munkával keresheted meg`;

  const hoursToEarn = wage > 0 && numericPrice > 0 ? numericPrice / wage : null;
  const canSave = name.trim().length > 0 && numericPrice > 0 && !!selectedCatId;

  useEffect(() => {
    if (!isEditMode || !impulseId || didHydrate) return;
    const existing = items.find((item) => item.id === impulseId);
    if (!existing) return;

    setName(existing.name ?? '');
    setPrice(existing.price ? String(existing.price) : '');
    setUrl(existing.url ?? '');
    setAiReason(existing.reason ?? '');
    setSelectedCatId(existing.category_id ?? null);

    AsyncStorage.getItem(`impulse_labels_${existing.id}`)
      .then((stored) => {
        if (!stored) return;
        try {
          setSelectedLabelIds(JSON.parse(stored));
        } catch {
          setSelectedLabelIds([]);
        }
      })
      .catch(() => {});

    setDidHydrate(true);
  }, [didHydrate, impulseId, isEditMode, items]);

  function toggleLabel(id: string) {
    setSelectedLabelIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id],
    );
  }

  async function handleSave() {
    if (!canSave || !user) return;

    const now = new Date();
    const notifyAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // +24 óra

    try {
      let savedId: string | undefined;
      if (isEditMode && impulseId) {
        const saved = await editItem({
          id: impulseId,
          updates: {
            name: name.trim(),
            price: numericPrice,
            category_id: selectedCatId,
            reason: aiReason.trim() || null,
            url: url.trim() || null,
            hours_to_earn: hoursToEarn,
          },
        });
        savedId = saved?.id;
      } else {
        const saved = await addItem({
          user_id: user.id,
          name: name.trim(),
          price: numericPrice,
          currency: 'HUF',
          category_id: selectedCatId,
          store_name: null,
          url: url.trim() || null,
          reason: aiReason.trim() || null,
          hours_to_earn: hoursToEarn,
          notify_at: notifyAt.toISOString(),
          decision: 'pending',
        });
        savedId = saved?.id;
      }

      // Label ID-k mentése AsyncStorage-ba (metadata nélküli DB séma miatt)
      if (savedId) {
        await AsyncStorage.setItem(
          `impulse_labels_${savedId}`,
          JSON.stringify(selectedLabelIds),
        ).catch(() => {});
      }

      // Lokális értesítés ütemezése 24 órára
      if (!isEditMode) {
        const granted = await requestNotificationPermission();
        if (granted) {
          if (!notificationsEnabled) {
            setNotificationsEnabled(true);
            const token = await getExpoPushToken();
            if (token && user) {
              await savePushToken(user.id, token, Platform.OS).catch(() => {});
            }
          }
          if (savedId) {
            await scheduleImpulseNotification(savedId, name.trim());
          }
        }
      }

      router.back();
    } catch (err: any) {
      Alert.alert('Hiba', err.message ?? 'Nem sikerült menteni.');
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top']}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.header, borderBottomColor: colors.border }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={[styles.backTxt, { color: colors.primary }]}>‹ Vissza</Text>
          </Pressable>
          <Text style={[styles.title, { color: colors.text }]}>{isEditMode ? 'Impulzus szerkesztése' : 'Új impulzus tétel'}</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Work hours preview */}
          <View style={[styles.previewCard, { backgroundColor: colors.aiCardBg }]}>
            <Text style={styles.previewEmoji}>⏱️</Text>
            <Text style={[styles.previewText, { color: colors.aiCardText }]}>{workLabel}</Text>
          </View>

          {/* Termék neve */}
          <View style={styles.section}>
            <Text style={[styles.fieldLabel, { color: colors.textSub }]}>Termék neve *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              placeholder="pl. Nike Air Max 270"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* Ár */}
          <View style={styles.section}>
            <Text style={[styles.fieldLabel, { color: colors.textSub }]}>Ár (Ft) *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              placeholder="42 990"
              placeholderTextColor={colors.textMuted}
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
            />
          </View>

          {/* ── Kategória ── */}
          <View style={styles.section}>
            <Text style={[styles.fieldLabel, { color: colors.textSub }]}>Kategória *</Text>
            <Pressable style={[styles.pickerRow, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => setCatPickerOpen(true)}>
              <View style={[styles.catIconBg, { backgroundColor: selectedCat ? (selectedCat.color + '33') : colors.borderLight }]}>
                <Text style={{ fontSize: 17 }}>{selectedCat ? selectedCat.icon : '📦'}</Text>
              </View>
              <Text style={[selectedCat ? styles.pickerValue : styles.pickerPlaceholder, { color: selectedCat ? colors.text : colors.textMuted }]}>
                {selectedCat ? selectedCat.name_hu : 'Válassz kategóriát…'}
              </Text>
              <Text style={[styles.pickerChevron, { color: colors.textMuted }]}>›</Text>
            </Pressable>
          </View>

          {/* ── Cimkék ── */}
          {labels.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.fieldLabel, { color: colors.textSub }]}>Cimkék</Text>
              <View style={styles.labelsWrap}>
                {labels.map(lb => {
                  const active = selectedLabelIds.includes(lb.id);
                  return (
                    <Pressable
                      key={lb.id}
                      style={[
                        styles.labelChip,
                        active && {
                          backgroundColor: (lb.color ?? '#4F46E5') + '22',
                          borderColor: lb.color ?? '#4F46E5',
                        },
                      ]}
                      onPress={() => toggleLabel(lb.id)}
                    >
                      <View style={[styles.labelDot, { backgroundColor: lb.color ?? '#4F46E5' }]} />
                      <Text
                        style={[
                          styles.labelChipTxt,
                          { color: colors.textSub },
                          active && { color: lb.color ?? '#4F46E5', fontWeight: '700' },
                        ]}
                      >
                        {lb.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {/* Link */}
          <View style={styles.section}>
            <Text style={[styles.fieldLabel, { color: colors.textSub }]}>Link (opcionális)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              placeholder="https://..."
              placeholderTextColor={colors.textMuted}
              value={url}
              onChangeText={setUrl}
              keyboardType="url"
              autoCapitalize="none"
            />
          </View>

          {/* AI indok */}
          <View style={styles.section}>
            <Text style={[styles.fieldLabel, { color: colors.textSub }]}>Miért akarod? (segít az AI-nak)</Text>
            <TextInput
              style={[styles.input, styles.multiline, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              placeholder="pl. régóta szeretném, most akciós, motiválna az edzésre..."
              placeholderTextColor={colors.textMuted}
              value={aiReason}
              onChangeText={setAiReason}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <View style={[styles.infoBox, { backgroundColor: colors.timerBg }]}>
            <Text style={[styles.infoText, { color: colors.timerText }]}>
              ⏳ 24 óra múlva emlékeztetünk. Ha akkor is meg akarod venni – vedd meg. Ha nem – spórolj!
            </Text>
          </View>
        </ScrollView>

        {/* Save button */}
        <View style={[styles.footer, { backgroundColor: colors.bg }]}>
          <Pressable
            style={[styles.saveBtn, { backgroundColor: colors.primary }, (!canSave || isAdding || isEditing) && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={!canSave || isAdding || isEditing}
          >
            {(isAdding || isEditing)
              ? <ActivityIndicator color="white" />
              : <Text style={styles.saveTxt}>
                  {isEditMode ? 'Mentés' : 'Mentés + 24h visszaszámlálás'}
                </Text>
            }
          </Pressable>
        </View>
      </SafeAreaView>

      {/* ════ Kategória picker modal ════ */}
      <Modal visible={catPickerOpen} transparent animationType="slide" statusBarTranslucent>
        <TouchableWithoutFeedback onPress={() => setCatPickerOpen(false)}>
          <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
            <TouchableWithoutFeedback>
              <View style={[styles.sheetCard, { backgroundColor: colors.card }]}>
                <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
                <Text style={[styles.sheetTitle, { color: colors.text }]}>Kategória</Text>
                <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
                  {categories.map(cat => (
                    <Pressable
                      key={cat.id}
                      style={[styles.catRow, selectedCatId === cat.id && styles.catRowActive, selectedCatId === cat.id && { backgroundColor: colors.aiCardBg }]}
                      onPress={() => { setSelectedCatId(cat.id); setCatPickerOpen(false); }}
                    >
                      <View style={[styles.catRowIcon, { backgroundColor: cat.color + '22' }]}>
                        <Text style={{ fontSize: 18 }}>{cat.icon}</Text>
                      </View>
                      <Text style={[styles.catRowName, { color: colors.text }, selectedCatId === cat.id && styles.catRowNameActive, selectedCatId === cat.id && { color: colors.primary }]}>
                        {cat.name_hu}
                      </Text>
                      {selectedCatId === cat.id && (
                        <Text style={[styles.checkmark, { color: colors.primary }]}>✓</Text>
                      )}
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: '#F2F2F7' },
  header:  {
    backgroundColor: 'white',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  backBtn: { width: 60 },
  backTxt: { fontSize: 17, color: '#4F46E5', fontWeight: '500' },
  title:   { fontSize: 17, fontWeight: '700', color: '#111827' },

  content:     { padding: 16, gap: 4, paddingBottom: 24 },
  previewCard: {
    backgroundColor: '#EEF2FF', borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8,
  },
  previewEmoji: { fontSize: 22 },
  previewText:  { flex: 1, fontSize: 13, color: '#4338CA', fontWeight: '600', lineHeight: 18 },

  section:    { marginBottom: 12 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: {
    backgroundColor: 'white', borderRadius: 12,
    borderWidth: 1, borderColor: '#E5E7EB',
    padding: 12, fontSize: 15, color: '#111827',
  },
  multiline: { minHeight: 80 },

  // Category row picker
  pickerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'white', borderRadius: 12,
    borderWidth: 1, borderColor: '#E5E7EB', padding: 10,
  },
  catIconBg:        { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  pickerValue:      { flex: 1, fontSize: 15, fontWeight: '500', color: '#111827' },
  pickerPlaceholder:{ flex: 1, fontSize: 15, color: '#9CA3AF' },
  pickerChevron:    { fontSize: 20, color: '#D1D5DB' },

  // Labels
  labelsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  labelChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 7,
    backgroundColor: '#F3F4F6', borderRadius: 20,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  labelDot:    { width: 8, height: 8, borderRadius: 4 },
  labelChipTxt:{ fontSize: 13, fontWeight: '500', color: '#374151' },

  infoBox: { backgroundColor: '#FEF3C7', borderRadius: 12, padding: 12, marginTop: 4 },
  infoText:{ fontSize: 13, color: '#92400E', lineHeight: 18 },

  footer:          { padding: 16, paddingBottom: 24, backgroundColor: '#F2F2F7' },
  saveBtn:         { backgroundColor: '#4F46E5', borderRadius: 14, padding: 15, alignItems: 'center' },
  saveBtnDisabled: { backgroundColor: '#C4B5FD' },
  saveTxt:         { color: 'white', fontSize: 15, fontWeight: '700' },

  // ── Category modal sheet ──
  modalOverlay: {
    flex: 1, justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheetCard: {
    backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingTop: 12, paddingBottom: 36,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB',
    alignSelf: 'center', marginBottom: 14,
  },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 8 },

  catRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 11, paddingHorizontal: 4,
    borderRadius: 10,
  },
  catRowActive: { backgroundColor: '#EEF2FF' },
  catRowIcon:   { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  catRowName:   { flex: 1, fontSize: 15, fontWeight: '500', color: '#111827' },
  catRowNameActive: { color: '#4F46E5', fontWeight: '700' },
  checkmark:    { fontSize: 16, color: '#4F46E5', fontWeight: '700' },
});
