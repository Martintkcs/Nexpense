import { useRef, useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, TextInput, Alert,
  ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, Keyboard,
  Modal, TouchableWithoutFeedback, Animated,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useLabels } from '@/hooks/useLabels';
import { ColorPickerPanel } from '@/components/ui/ColorPickerPanel';
import { useColors } from '@/lib/useColors';

// ─── Screen ────────────────────────────────────────────────────────────────────

export default function LabelsSettings() {
  const colors = useColors();
  const { labels, isLoading, addLabel, isAdding, editLabel, removeLabel } = useLabels();

  // ── Create form ───────────────────────────────────────────
  const [newName, setNewName]   = useState('');
  const [newColor, setNewColor] = useState('#4F46E5');

  // ── Edit modal ────────────────────────────────────────────
  const [editOpen, setEditOpen]   = useState(false);
  const [editId, setEditId]       = useState('');
  const [editName, setEditName]   = useState('');
  const [editColor, setEditColor] = useState('#4F46E5');

  // ── Swipeable tracking ────────────────────────────────────
  const openSwipeRef = useRef<Swipeable | null>(null);

  async function handleCreate() {
    if (!newName.trim()) {
      Alert.alert('Hiányzó név', 'Adj nevet a cimkének!');
      return;
    }
    try {
      await addLabel({ name: newName.trim(), color: newColor });
      setNewName(''); // color kept intentionally (#6)
      Keyboard.dismiss();
    } catch {
      Alert.alert('Hiba', 'Nem sikerült létrehozni a cimkét. Próbáld újra!');
    }
  }

  function openEdit(label: { id: string; name: string; color: string | null }) {
    setEditId(label.id);
    setEditName(label.name);
    setEditColor(label.color ?? '#4F46E5');
    setEditOpen(true);
  }

  async function handleUpdate() {
    if (!editName.trim()) {
      Alert.alert('Hiányzó név', 'Adj nevet a cimkének!');
      return;
    }
    try {
      await editLabel({ id: editId, name: editName.trim(), color: editColor });
      setEditOpen(false);
    } catch {
      Alert.alert('Hiba', 'Nem sikerült menteni. Próbáld újra!');
    }
  }

  function confirmDelete(id: string, name: string) {
    Alert.alert(
      'Törlés',
      `Biztosan törlöd a(z) "${name}" cimkét?`,
      [
        { text: 'Mégse', style: 'cancel' },
        {
          text: 'Törlés',
          style: 'destructive',
          onPress: async () => {
            try { await removeLabel(id); }
            catch { Alert.alert('Hiba', 'Nem sikerült törölni. Próbáld újra!'); }
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      {/* ── Header ── */}
      <View style={[styles.header, { backgroundColor: colors.header, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backChevron, { color: colors.primary }]}>‹</Text>
          <Text style={[styles.backTxt, { color: colors.primary }]}>Vissza</Text>
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>Cimkék</Text>
        <View style={{ width: 80 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Új cimke ── */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>ÚJ CIMKE</Text>
            <View style={[styles.formCard, { backgroundColor: colors.card }]}>
              <View style={styles.createNameRow}>
                <View style={[styles.colorDot, { backgroundColor: newColor }]} />
                <TextInput
                  style={[styles.nameInput, { backgroundColor: colors.inputBg, color: colors.text }]}
                  placeholder="Pl. Munka, Éttermek, Hétvége…"
                  placeholderTextColor={colors.textMuted}
                  value={newName}
                  onChangeText={setNewName}
                  returnKeyType="done"
                  onSubmitEditing={Keyboard.dismiss}
                />
              </View>
              <ColorPickerPanel color={newColor} onChange={setNewColor} />
              <Pressable
                style={[styles.createBtn, { backgroundColor: colors.primary }, (!newName.trim() || isAdding) && { opacity: 0.5 }]}
                onPress={handleCreate}
                disabled={!newName.trim() || isAdding}
              >
                {isAdding
                  ? <ActivityIndicator color="white" size="small" />
                  : <Text style={styles.createTxt}>+ Létrehozás</Text>
                }
              </Pressable>
            </View>
          </View>

          {/* ── Meglévő cimkék ── */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>MEGLÉVŐ CIMKÉK</Text>
            {isLoading ? (
              <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
            ) : labels.length === 0 ? (
              <Text style={[styles.emptyTxt, { color: colors.textMuted }]}>
                Még nincsenek cimkéid.{'\n'}Hozz létre egyet fent!
              </Text>
            ) : (
              <View style={[styles.listCard, { backgroundColor: colors.card }]}>
                {labels.map((label, i) => (
                  <Swipeable
                    key={label.id}
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
                          onPress={() => confirmDelete(label.id, label.name)}
                        >
                          <Animated.View style={{ transform: [{ scale }] }}>
                            <Text style={styles.deleteTxt}>Törlés</Text>
                          </Animated.View>
                        </Pressable>
                      );
                    }}
                  >
                    {/* Tap to edit */}
                    <Pressable
                      style={[
                        styles.labelRow,
                        { backgroundColor: colors.card },
                        i < labels.length - 1 && styles.rowBorder,
                        i < labels.length - 1 && { borderBottomColor: colors.borderLight },
                      ]}
                      onPress={() => openEdit(label)}
                    >
                      <View style={[styles.labelDot, { backgroundColor: label.color ?? '#4F46E5' }]} />
                      <Text style={[styles.labelName, { color: colors.text }]}>{label.name}</Text>
                      <Text style={[styles.chevronHint, { color: colors.textMuted }]}>›</Text>
                    </Pressable>
                  </Swipeable>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ════ Szerkesztés modal ════ */}
      <Modal visible={editOpen} transparent animationType="fade" statusBarTranslucent>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableWithoutFeedback onPress={() => { Keyboard.dismiss(); setEditOpen(false); }}>
            <View style={[styles.overlayCenter, { backgroundColor: colors.overlay }]}>
              <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                <View style={[styles.editCard, { backgroundColor: colors.card }]}>
                  <Text style={[styles.editTitle, { color: colors.text }]}>Cimke szerkesztése</Text>
                  <View style={styles.createNameRow}>
                    <View style={[styles.colorDot, { backgroundColor: editColor }]} />
                    <TextInput
                      style={[styles.nameInput, { backgroundColor: colors.inputBg, color: colors.text }]}
                      value={editName}
                      onChangeText={setEditName}
                      returnKeyType="done"
                      onSubmitEditing={Keyboard.dismiss}
                      selectTextOnFocus
                    />
                  </View>
                  <ColorPickerPanel key={editId} color={editColor} onChange={setEditColor} />
                  <View style={styles.modalActions}>
                    <Pressable style={[styles.cancelBtn, { backgroundColor: colors.inputBg }]} onPress={() => setEditOpen(false)}>
                      <Text style={[styles.cancelTxt, { color: colors.textSub }]}>Mégse</Text>
                    </Pressable>
                    <Pressable style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleUpdate}>
                      <Text style={styles.saveTxt}>Mentés</Text>
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
  safe: { flex: 1, backgroundColor: '#F2F2F7' },

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

  // Card with padding — for create form
  formCard: {
    backgroundColor: 'white', borderRadius: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 2,
    padding: 14, gap: 12,
  },
  // Card without padding — for swipeable list
  listCard: {
    backgroundColor: 'white', borderRadius: 14, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 2,
  },

  createNameRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  colorDot:      { width: 24, height: 24, borderRadius: 12 },
  nameInput: {
    flex: 1, height: 44, backgroundColor: '#F3F4F6', borderRadius: 10,
    paddingHorizontal: 12, fontSize: 15, fontWeight: '500', color: '#111827',
  },

  createBtn: { backgroundColor: '#4F46E5', borderRadius: 10, padding: 12, alignItems: 'center' },
  createTxt: { color: 'white', fontSize: 14, fontWeight: '700' },

  emptyTxt: {
    textAlign: 'center', color: '#9CA3AF', fontSize: 14,
    lineHeight: 22, marginTop: 8, paddingHorizontal: 4,
  },

  rowBorder:   { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  labelRow:    { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingHorizontal: 14, backgroundColor: 'white' },
  labelDot:    { width: 14, height: 14, borderRadius: 7 },
  labelName:   { flex: 1, fontSize: 15, fontWeight: '500', color: '#111827' },
  chevronHint: { fontSize: 18, color: '#D1D5DB' },

  // Swipe delete
  deleteAction: { backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 22 },
  deleteTxt:    { fontSize: 13, fontWeight: '700', color: 'white' },

  // Edit modal
  overlayCenter: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center', paddingHorizontal: 24,
  },
  editCard: {
    backgroundColor: 'white', borderRadius: 20, padding: 24, gap: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15, shadowRadius: 24, elevation: 10,
  },
  editTitle:    { fontSize: 18, fontWeight: '700', color: '#111827' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn:    { flex: 1, backgroundColor: '#F3F4F6', borderRadius: 12, padding: 14, alignItems: 'center' },
  cancelTxt:    { fontSize: 15, fontWeight: '600', color: '#374151' },
  saveBtn:      { flex: 2, backgroundColor: '#4F46E5', borderRadius: 12, padding: 14, alignItems: 'center' },
  saveTxt:      { fontSize: 15, fontWeight: '700', color: 'white' },
});
