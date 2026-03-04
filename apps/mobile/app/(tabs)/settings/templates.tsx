import { useRef, useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, TextInput, Alert,
  ScrollView, KeyboardAvoidingView, Platform, Keyboard,
  Modal, TouchableWithoutFeedback, Animated,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useCategories } from '@/hooks/useCategories';
import { useLabels } from '@/hooks/useLabels';
import { useTemplates, type Template } from '@/hooks/useTemplates';
import { useColors } from '@/lib/useColors';

// ─── Screen ────────────────────────────────────────────────────────────────────

export default function TemplatesSettings() {
  const colors = useColors();
  const { categories } = useCategories();
  const { labels } = useLabels();
  const {
    templates,
    isLoading,
    addTemplate,
    updateTemplate,
    deleteTemplate,
  } = useTemplates();

  // ── Form modal state ─────────────────────────────────────
  const [formOpen, setFormOpen]       = useState(false);
  const [editingId, setEditingId]     = useState<string | null>(null);
  const [formName, setFormName]       = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCatId, setFormCatId]     = useState<string | null>(null);
  const [formLabelIds, setFormLabelIds] = useState<string[]>([]);

  // ── Category picker sub-sheet ────────────────────────────
  const [catPickerOpen, setCatPickerOpen] = useState(false);

  // ── Swipeable tracking ────────────────────────────────────
  const openSwipeRef = useRef<Swipeable | null>(null);

  function openCreate() {
    setEditingId(null);
    setFormName('');
    setFormDescription('');
    setFormCatId(categories[0]?.id ?? null);
    setFormLabelIds([]);
    setFormOpen(true);
  }

  function openEdit(t: Template) {
    setEditingId(t.id);
    setFormName(t.name);
    setFormDescription(t.description ?? '');
    setFormCatId(t.categoryId);
    setFormLabelIds(t.labelIds);
    setFormOpen(true);
  }

  function toggleLabel(id: string) {
    setFormLabelIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function handleSave() {
    if (!formName.trim()) {
      Alert.alert('Hiányzó név', 'Adj nevet a sablonnak!');
      return;
    }

    try {
      if (editingId) {
        await updateTemplate({
          id: editingId,
          name: formName.trim(),
          description: formDescription.trim() || null,
          categoryId: formCatId,
          labelIds: formLabelIds,
        });
      } else {
        await addTemplate({
          name: formName.trim(),
          description: formDescription.trim() || null,
          categoryId: formCatId,
          labelIds: formLabelIds,
        });
      }
      setFormOpen(false);
    } catch {
      Alert.alert('Hiba', 'Nem sikerült menteni a sablont. Próbáld újra!');
    }
  }

  function confirmDelete(t: Template) {
    Alert.alert(
      'Törlés',
      `Biztosan törlöd a(z) "${t.name}" sablont?`,
      [
        { text: 'Mégse', style: 'cancel' },
        { text: 'Törlés', style: 'destructive', onPress: () => deleteTemplate(t.id) },
      ],
    );
  }

  const selectedCat = categories.find((c) => c.id === formCatId);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      {/* ── Header ── */}
      <View style={[styles.header, { backgroundColor: colors.header, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backChevron, { color: colors.primary }]}>‹</Text>
          <Text style={[styles.backTxt, { color: colors.primary }]}>Vissza</Text>
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>Sablonok</Text>
        <Pressable onPress={openCreate} style={styles.addBtn}>
          <Text style={[styles.addTxt, { color: colors.primary }]}>+ Új</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <Text style={[styles.hint, { color: colors.textSub }]}>
          A sablonok segítségével gyorsan beállíthatod a kategóriát és a cimkéket egy kiadásnál.
        </Text>

        {isLoading ? (
          <View style={styles.emptyBox}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Betöltés...</Text>
          </View>
        ) : templates.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Még nincsenek sablonok</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSub }]}>Hozz létre egyet a jobb felső „+ Új" gombbal!</Text>
            <Pressable style={[styles.emptyBtn, { backgroundColor: colors.primary }]} onPress={openCreate}>
              <Text style={styles.emptyBtnTxt}>+ Első sablon létrehozása</Text>
            </Pressable>
          </View>
        ) : (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            {templates.map((t, i) => {
              const cat    = categories.find((c) => c.id === t.categoryId);
              const tLabels = labels.filter((l) => t.labelIds.includes(l.id));
              return (
                <Swipeable
                  key={t.id}
                  friction={2}
                  overshootRight={false}
                  rightThreshold={40}
                  onSwipeableOpen={(ref) => {
                    if (openSwipeRef.current && openSwipeRef.current !== (ref as unknown as Swipeable)) {
                      openSwipeRef.current.close();
                    }
                    openSwipeRef.current = ref as unknown as Swipeable;
                  }}
                  renderRightActions={(_p, dragX) => {
                    const scale = (dragX as Animated.AnimatedInterpolation<number>).interpolate({
                      inputRange: [-80, 0],
                      outputRange: [1, 0.7],
                      extrapolate: 'clamp',
                    });
                    return (
                      <Pressable
                        style={[styles.deleteAction, { backgroundColor: colors.deleteBg }]}
                        onPress={() => confirmDelete(t)}
                      >
                        <Animated.View style={{ transform: [{ scale }] }}>
                          <Text style={styles.deleteTxt}>Törlés</Text>
                        </Animated.View>
                      </Pressable>
                    );
                  }}
                >
                  {/* Tap row to edit */}
                  <Pressable
                    style={[
                      styles.templateRow,
                      { backgroundColor: colors.card },
                      i < templates.length - 1 && styles.rowBorder,
                      i < templates.length - 1 && { borderBottomColor: colors.borderLight },
                    ]}
                    onPress={() => openEdit(t)}
                  >
                    {cat && (
                      <View style={[styles.catIcon, { backgroundColor: cat.color + '22' }]}>
                        <Text style={{ fontSize: 18 }}>{cat.icon}</Text>
                      </View>
                    )}
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={[styles.templateName, { color: colors.text }]}>{t.name}</Text>
                      {!!t.description && (
                        <Text style={[styles.templateDesc, { color: colors.textSub }]} numberOfLines={2}>
                          {t.description}
                        </Text>
                      )}
                      {tLabels.length > 0 && (
                        <View style={styles.labelChips}>
                          {tLabels.map((l) => (
                            <View
                              key={l.id}
                              style={[styles.chip, { backgroundColor: (l.color ?? '#4F46E5') + '22' }]}
                            >
                              <Text style={[styles.chipTxt, { color: l.color ?? '#4F46E5' }]}>
                                {l.name}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                    <Text style={[styles.chevronHint, { color: colors.textMuted }]}>›</Text>
                  </Pressable>
                </Swipeable>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* ════ Sablon form modal ════ */}
      <Modal visible={formOpen} transparent animationType="slide" statusBarTranslucent>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableWithoutFeedback onPress={() => { Keyboard.dismiss(); setFormOpen(false); }}>
            <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
              <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                <View style={[styles.sheet, { backgroundColor: colors.card }]}>
                  <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
                  <Text style={[styles.sheetTitle, { color: colors.text }]}>
                    {editingId ? 'Sablon szerkesztése' : 'Új sablon'}
                  </Text>

                  <TextInput
                    style={[styles.sheetInput, { backgroundColor: colors.inputBg, color: colors.text }]}
                    placeholder="Sablon neve (pl. Ebéd a munkában)"
                    placeholderTextColor={colors.textMuted}
                    value={formName}
                    onChangeText={setFormName}
                    returnKeyType="done"
                    onSubmitEditing={Keyboard.dismiss}
                    autoFocus={!editingId}
                    selectTextOnFocus
                  />

                  <TextInput
                    style={[styles.sheetInput, styles.sheetInputMultiline, { backgroundColor: colors.inputBg, color: colors.text }]}
                    placeholder="Leírás (opcionális) – ezt tölti ki a kiadás leírás mezőbe"
                    placeholderTextColor={colors.textMuted}
                    value={formDescription}
                    onChangeText={setFormDescription}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />

                  <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>KATEGÓRIA</Text>
                  <Pressable style={[styles.catPickerRow, { backgroundColor: colors.inputBg }]} onPress={() => setCatPickerOpen(true)}>
                    {selectedCat ? (
                      <>
                        <View style={[styles.catPickerIcon, { backgroundColor: selectedCat.color + '22' }]}>
                          <Text style={{ fontSize: 18 }}>{selectedCat.icon}</Text>
                        </View>
                        <Text style={[styles.catPickerName, { color: colors.text }]} numberOfLines={1}>
                          {selectedCat.name_hu ?? selectedCat.name}
                        </Text>
                      </>
                    ) : (
                      <Text style={[styles.catPickerPlaceholder, { color: colors.textMuted }]}>Válassz kategóriát…</Text>
                    )}
                    <Text style={[styles.catPickerChevron, { color: colors.textMuted }]}>›</Text>
                  </Pressable>

                  {labels.length > 0 && (
                    <>
                      <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>CIMKÉK</Text>
                      <View style={styles.labelToggleGrid}>
                        {labels.map((l) => {
                          const active = formLabelIds.includes(l.id);
                          return (
                            <Pressable
                              key={l.id}
                              onPress={() => toggleLabel(l.id)}
                              style={[
                                styles.labelToggle,
                                { borderColor: l.color ?? '#4F46E5' },
                                active && { backgroundColor: (l.color ?? '#4F46E5') + '22' },
                              ]}
                            >
                              <Text style={[styles.labelToggleTxt, { color: l.color ?? '#4F46E5' }]}>
                                {l.name}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </>
                  )}

                  <View style={styles.sheetActions}>
                    <Pressable style={[styles.cancelBtn, { backgroundColor: colors.inputBg }]} onPress={() => setFormOpen(false)}>
                      <Text style={[styles.cancelTxt, { color: colors.textSub }]}>Mégse</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.saveBtn, { backgroundColor: colors.primary }, !formName.trim() && { opacity: 0.5 }]}
                      onPress={handleSave}
                      disabled={!formName.trim()}
                    >
                      <Text style={styles.saveTxt}>
                        {editingId ? 'Mentés' : 'Létrehozás'}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      {/* ════ Category picker sub-sheet ════ */}
      <Modal visible={catPickerOpen} transparent animationType="slide" statusBarTranslucent>
        <Pressable style={[styles.overlay, { backgroundColor: colors.overlay }]} onPress={() => setCatPickerOpen(false)}>
          <Pressable style={[styles.sheet, { maxHeight: '70%', backgroundColor: colors.card }]} onPress={(e) => e.stopPropagation()}>
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
            <Text style={[styles.sheetTitle, { color: colors.text }]}>Kategória választás</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {categories.map((c, i) => (
                <Pressable
                  key={c.id}
                  style={[
                    styles.catListRow,
                    i < categories.length - 1 && styles.rowBorder,
                    i < categories.length - 1 && { borderBottomColor: colors.borderLight },
                    formCatId === c.id && styles.catListRowActive,
                    formCatId === c.id && { backgroundColor: colors.aiCardBg },
                  ]}
                  onPress={() => { setFormCatId(c.id); setCatPickerOpen(false); }}
                >
                  <View style={[styles.catIcon, { backgroundColor: c.color + '22' }]}>
                    <Text style={{ fontSize: 20 }}>{c.icon}</Text>
                  </View>
                  <Text style={[styles.catListName, { color: colors.text }, formCatId === c.id && { color: colors.primary, fontWeight: '600' }]}>
                    {c.name_hu ?? c.name}
                  </Text>
                  {formCatId === c.id && <Text style={[styles.check, { color: colors.primary }]}>✓</Text>}
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
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
  addBtn:      { width: 80, alignItems: 'flex-end' },
  addTxt:      { fontSize: 16, color: '#4F46E5', fontWeight: '600' },

  content: { padding: 16, paddingBottom: 48 },
  hint: {
    fontSize: 13, color: '#6B7280', lineHeight: 20,
    marginBottom: 16, paddingHorizontal: 2,
  },

  card: {
    backgroundColor: 'white', borderRadius: 14, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 2,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },

  templateRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 12, paddingVertical: 13, paddingHorizontal: 14,
    backgroundColor: 'white',
  },
  catIcon:      { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  templateName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  templateDesc: { fontSize: 12, lineHeight: 17 },
  labelChips:   { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  chip:         { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  chipTxt:      { fontSize: 12, fontWeight: '600' },
  chevronHint:  { fontSize: 18, color: '#D1D5DB' },

  // Swipe delete
  deleteAction: { backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 22 },
  deleteTxt:    { fontSize: 13, fontWeight: '700', color: 'white' },

  // Empty state
  emptyBox:      { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyEmoji:    { fontSize: 48 },
  emptyTitle:    { fontSize: 17, fontWeight: '700', color: '#111827', marginTop: 8 },
  emptySubtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20, maxWidth: 240 },
  emptyBtn:      { marginTop: 8, backgroundColor: '#4F46E5', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  emptyBtnTxt:   { color: 'white', fontSize: 15, fontWeight: '700' },

  // Form sheet
  overlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet:       { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 48, gap: 12 },
  sheetHandle: { width: 36, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginBottom: 4 },
  sheetTitle:  { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 4 },

  sheetInput: {
    height: 50, backgroundColor: '#F3F4F6', borderRadius: 12,
    paddingHorizontal: 14, fontSize: 15, fontWeight: '500', color: '#111827',
  },
  sheetInputMultiline: {
    minHeight: 72,
    height: 72,
    paddingTop: 12,
    fontSize: 14,
    fontWeight: '400',
  },

  fieldLabel: {
    fontSize: 11, fontWeight: '700', color: '#9CA3AF',
    letterSpacing: 0.7, marginTop: 4,
  },

  catPickerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#F3F4F6', borderRadius: 12,
    paddingVertical: 10, paddingHorizontal: 12,
  },
  catPickerIcon:        { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  catPickerName:        { flex: 1, fontSize: 15, fontWeight: '500', color: '#111827' },
  catPickerPlaceholder: { flex: 1, fontSize: 15, color: '#9CA3AF' },
  catPickerChevron:     { fontSize: 20, color: '#D1D5DB' },

  labelToggleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  labelToggle:     { borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  labelToggleTxt:  { fontSize: 13, fontWeight: '600' },

  sheetActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelBtn:    { flex: 1, backgroundColor: '#F3F4F6', borderRadius: 12, padding: 14, alignItems: 'center' },
  cancelTxt:    { fontSize: 15, fontWeight: '600', color: '#374151' },
  saveBtn:      { flex: 2, backgroundColor: '#4F46E5', borderRadius: 12, padding: 14, alignItems: 'center' },
  saveTxt:      { fontSize: 15, fontWeight: '700', color: 'white' },

  // Category picker sub-sheet
  catListRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 4 },
  catListRowActive: { backgroundColor: '#EEF2FF' },
  catListName:      { flex: 1, fontSize: 15, fontWeight: '500', color: '#111827' },
  check:            { fontSize: 16, color: '#4F46E5', fontWeight: '700' },
});
