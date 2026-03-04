import { useRef, useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, Alert, TextInput,
  ActivityIndicator, ScrollView, Modal, Keyboard,
  KeyboardAvoidingView, Platform, Animated,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useCategories } from '@/hooks/useCategories';
import { ColorPickerPanel } from '@/components/ui/ColorPickerPanel';
import { useColors } from '@/lib/useColors';

// ─── Common emojis for the picker ─────────────────────────────────────────────

const EMOJI_LIST = [
  // Étel & Ital
  '🍕','🍔','🍜','🍣','🥗','🍩','☕','🧃','🍺','🍰','🥐','🛒',
  // Közlekedés
  '🚗','🚌','✈️','⛽','🚲','🛵','🚂','🚕','🛳️','🚙','🏍️','🚁',
  // Vásárlás & Ruha
  '🛍️','👗','👕','👟','💄','💍','🎁','🧴','👜','⌚','🕶️','🧸',
  // Szórakozás
  '🎬','🎵','🎮','⚽','📚','🎤','🎲','🎭','🏋️','🎯','🎾','🏊',
  // Egészség
  '💊','🏥','🧘','🦷','💉','🌿','🧖','💆','🏃','🩺','🌡️','🥦',
  // Otthon
  '🏠','🔑','💡','🔧','🛋️','🪣','🌱','🌻','🧹','🏡','🛁','🍳',
  // Pénzügyek & Munka
  '💰','💵','💳','🏦','📈','💱','💸','🤑','💼','📊','🖥️','📱',
  // Egyéb
  '⭐','❤️','🔥','💎','🌈','🎊','🎉','✨','🏆','🌍','📦','🎓',
];

// ─── Sub-components ────────────────────────────────────────────────────────────

/** Small live preview pill */
function CategoryPreview({ emoji, name, color }: { emoji: string; name: string; color: string }) {
  if (!name.trim()) return null;
  return (
    <View style={styles.preview}>
      <View style={[styles.previewIcon, { backgroundColor: color + '22' }]}>
        <Text style={{ fontSize: 20 }}>{emoji}</Text>
      </View>
      <Text style={[styles.previewName, { color }]}>{name}</Text>
    </View>
  );
}

// ─── Screen ────────────────────────────────────────────────────────────────────

export default function CategoriesSettings() {
  const colors = useColors();
  const { categories, addCategory, isAdding, updateCategory, isUpdating, deleteCategory } = useCategories();

  const userCategories   = categories.filter(c => c.user_id !== null);
  const systemCategories = categories.filter(c => c.user_id === null);

  // ── New category form ──────────────────────────────────────
  const [newName, setNewName]   = useState('');
  const [newEmoji, setNewEmoji] = useState('📦');
  const [newColor, setNewColor] = useState('#4F46E5');   // managed by ColorPickerPanel internally

  // ── Edit modal ─────────────────────────────────────────────
  const [editOpen, setEditOpen]     = useState(false);
  const [editId, setEditId]         = useState('');
  const [editName, setEditName]     = useState('');
  const [editEmoji, setEditEmoji]   = useState('📦');
  const [editColor, setEditColor]   = useState('#4F46E5');

  // ── Emoji picker (shared) ──────────────────────────────────
  const [emojiOpen, setEmojiOpen]     = useState(false);
  const [emojiTarget, setEmojiTarget] = useState<'new' | 'edit'>('new');

  // ── Swipeable ref tracking ─────────────────────────────────
  const openSwipeRef = useRef<Swipeable | null>(null);

  function openEmojiFor(target: 'new' | 'edit') {
    setEmojiTarget(target);
    setEmojiOpen(true);
  }

  function onSelectEmoji(emoji: string) {
    if (emojiTarget === 'new') setNewEmoji(emoji);
    else setEditEmoji(emoji);
    setEmojiOpen(false);
  }

  function openEdit(cat: (typeof categories)[0]) {
    setEditId(cat.id);
    setEditName(cat.name_hu ?? cat.name);
    setEditEmoji(cat.icon);
    setEditColor(cat.color);
    setEditOpen(true);
  }

  async function handleCreate() {
    if (!newName.trim()) {
      Alert.alert('Hiányzó név', 'Adj nevet a kategóriának!');
      return;
    }
    try {
      Keyboard.dismiss();
      const slug = newName.trim().toLowerCase().replace(/\s+/g, '_');
      await addCategory({ name: slug, nameHu: newName.trim(), icon: newEmoji, color: newColor });
      // Only reset name and emoji — color intentionally kept (#6)
      setNewName('');
      setNewEmoji('📦');
    } catch {
      Alert.alert('Hiba', 'Nem sikerült létrehozni a kategóriát. Próbáld újra!');
    }
  }

  async function handleUpdate() {
    if (!editName.trim()) {
      Alert.alert('Hiányzó név', 'Adj nevet a kategóriának!');
      return;
    }
    try {
      Keyboard.dismiss();
      const slug = editName.trim().toLowerCase().replace(/\s+/g, '_');
      await updateCategory({ id: editId, name: slug, nameHu: editName.trim(), icon: editEmoji, color: editColor });
      setEditOpen(false);
    } catch {
      Alert.alert('Hiba', 'Nem sikerült menteni a változtatásokat. Próbáld újra!');
    }
  }

  function confirmDelete(id: string, name: string) {
    Alert.alert(
      'Törlés',
      `Biztosan törlöd a(z) "${name}" kategóriát?`,
      [
        { text: 'Mégse', style: 'cancel' },
        {
          text: 'Törlés',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCategory(id);
            } catch {
              Alert.alert('Hiba', 'Nem sikerült törölni. Próbáld újra!');
            }
          },
        },
      ],
    );
  }

  // ── Render ────────────────────────────────────────────────

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top']}>

      {/* ── Header ── */}
      <View style={[styles.header, { backgroundColor: colors.header, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backChevron, { color: colors.primary }]}>‹</Text>
          <Text style={[styles.backTxt, { color: colors.primary }]}>Vissza</Text>
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>Kategóriák</Text>
        <View style={{ width: 80 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ══════ ÚJ KATEGÓRIA ══════ */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>ÚJ KATEGÓRIA</Text>
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.formInner}>

              {/* Emoji badge + Name */}
              <View style={styles.emojiNameRow}>
                <Pressable style={[styles.emojiBadge, { backgroundColor: colors.inputBg, borderColor: colors.border }]} onPress={() => openEmojiFor('new')}>
                  <Text style={styles.emojiBadgeText}>{newEmoji}</Text>
                </Pressable>
                <TextInput
                  style={[styles.nameInput, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
                  placeholder="Kategória neve..."
                  placeholderTextColor={colors.textMuted}
                  value={newName}
                  onChangeText={setNewName}
                  returnKeyType="done"
                  onSubmitEditing={Keyboard.dismiss}
                />
              </View>

              {/* Color picker — compact row + expandable panel */}
              <ColorPickerPanel color={newColor} onChange={setNewColor} />

              <CategoryPreview emoji={newEmoji} name={newName} color={newColor} />

              <Pressable
                style={[styles.createBtn, { backgroundColor: colors.primary }, isAdding && { opacity: 0.65 }]}
                onPress={handleCreate}
                disabled={isAdding}
              >
                {isAdding
                  ? <ActivityIndicator color="white" size="small" />
                  : <Text style={styles.createTxt}>Létrehozás</Text>
                }
              </Pressable>

            </View>
          </View>
        </View>

        {/* ══════ SAJÁT KATEGÓRIÁK ══════ */}
        {userCategories.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>SAJÁT KATEGÓRIÁK</Text>
            <View style={[styles.card, { backgroundColor: colors.card }]}>
              {userCategories.map((cat, i) => (
                <Swipeable
                  key={cat.id}
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
                        style={[styles.catDeleteAction, { backgroundColor: colors.deleteBg }]}
                        onPress={() => confirmDelete(cat.id, cat.name_hu ?? cat.name)}
                      >
                        <Animated.View style={{ transform: [{ scale }] }}>
                          <Text style={styles.catDeleteTxt}>Törlés</Text>
                        </Animated.View>
                      </Pressable>
                    );
                  }}
                >
                  {/* Tap to edit */}
                  <Pressable
                    style={[
                      styles.catRow,
                      { backgroundColor: colors.card },
                      i < userCategories.length - 1 && styles.catRowBorder,
                      i < userCategories.length - 1 && { borderBottomColor: colors.borderLight },
                    ]}
                    onPress={() => openEdit(cat)}
                  >
                    <View style={[styles.catIcon, { backgroundColor: cat.color + '22' }]}>
                      <Text style={{ fontSize: 18 }}>{cat.icon}</Text>
                    </View>
                    <Text style={[styles.catName, { flex: 1, color: colors.text }]}>{cat.name_hu ?? cat.name}</Text>
                    <View style={[styles.colorDot, { backgroundColor: cat.color }]} />
                    <Text style={[styles.chevronHint, { color: colors.textMuted }]}>›</Text>
                  </Pressable>
                </Swipeable>
              ))}
            </View>
          </View>
        )}

        {/* ══════ RENDSZER KATEGÓRIÁK ══════ */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>RENDSZER KATEGÓRIÁK</Text>
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            {systemCategories.map((cat, i) => (
              <View
                key={cat.id}
                style={[
                  styles.catRow,
                  { backgroundColor: colors.card },
                  i < systemCategories.length - 1 && styles.catRowBorder,
                  i < systemCategories.length - 1 && { borderBottomColor: colors.borderLight },
                ]}
              >
                <View style={[styles.catIcon, { backgroundColor: cat.color + '22' }]}>
                  <Text style={{ fontSize: 18 }}>{cat.icon}</Text>
                </View>
                <Text style={[styles.catName, { flex: 1, color: colors.textMuted }]}>
                  {cat.name_hu ?? cat.name}
                </Text>
              </View>
            ))}
          </View>
        </View>

      </ScrollView>

      {/* ════ Emoji picker ════ */}
      <Modal visible={emojiOpen} transparent animationType="slide" statusBarTranslucent>
        <Pressable style={[styles.overlay, { backgroundColor: colors.overlay }]} onPress={() => setEmojiOpen(false)}>
          <Pressable style={[styles.emojiSheet, { backgroundColor: colors.card }]} onPress={e => e.stopPropagation()}>
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
            <Text style={[styles.emojiSheetTitle, { color: colors.text }]}>Emoji kiválasztása</Text>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 320 }}>
              <View style={styles.emojiGrid}>
                {EMOJI_LIST.map((e, idx) => (
                  <Pressable
                    key={idx}
                    style={({ pressed }) => [styles.emojiCell, pressed && { backgroundColor: colors.pressedBg }]}
                    onPress={() => onSelectEmoji(e)}
                  >
                    <Text style={styles.emojiCellText}>{e}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ════ Edit modal ════ */}
      <Modal visible={editOpen} transparent animationType="slide" statusBarTranslucent>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Pressable style={[styles.overlay, { backgroundColor: colors.overlay }]} onPress={() => { Keyboard.dismiss(); setEditOpen(false); }}>
            <Pressable style={[styles.editSheet, { backgroundColor: colors.card }]} onPress={e => e.stopPropagation()}>
              <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
              <Text style={[styles.editSheetTitle, { color: colors.text }]}>Kategória szerkesztése</Text>

              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

                {/* Emoji badge + Name */}
                <View style={[styles.emojiNameRow, { marginBottom: 14 }]}>
                  <Pressable style={[styles.emojiBadge, { backgroundColor: colors.inputBg, borderColor: colors.border }]} onPress={() => openEmojiFor('edit')}>
                    <Text style={styles.emojiBadgeText}>{editEmoji}</Text>
                  </Pressable>
                  <TextInput
                    style={[styles.nameInput, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
                    placeholder="Kategória neve..."
                    placeholderTextColor={colors.textMuted}
                    value={editName}
                    onChangeText={setEditName}
                    returnKeyType="done"
                    onSubmitEditing={Keyboard.dismiss}
                  />
                </View>

                {/* Color picker for edit — key forces remount per category */}
                <ColorPickerPanel
                  key={editId}
                  color={editColor}
                  onChange={setEditColor}
                />

                <View style={{ marginTop: 12 }}>
                  <CategoryPreview emoji={editEmoji} name={editName} color={editColor} />
                </View>

              </ScrollView>

              <View style={styles.editActions}>
                <Pressable style={[styles.cancelBtn, { backgroundColor: colors.inputBg }]} onPress={() => setEditOpen(false)}>
                  <Text style={[styles.cancelTxt, { color: colors.textSub }]}>Mégse</Text>
                </Pressable>
                <Pressable
                  style={[styles.saveBtn, { backgroundColor: colors.primary }, isUpdating && { opacity: 0.65 }]}
                  onPress={handleUpdate}
                  disabled={isUpdating}
                >
                  {isUpdating
                    ? <ActivityIndicator color="white" size="small" />
                    : <Text style={styles.saveTxt}>Mentés</Text>
                  }
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#F2F2F7' },

  // Header
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
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: '#9CA3AF',
    letterSpacing: 0.8, paddingHorizontal: 4, marginBottom: 6,
  },
  card: {
    backgroundColor: 'white', borderRadius: 14, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 2,
  },
  formInner: { padding: 16, gap: 14 },

  // Emoji + Name row
  emojiNameRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },

  emojiBadge: {
    width: 72, height: 72, borderRadius: 18,
    backgroundColor: '#F3F4F6', borderWidth: 2, borderColor: '#E5E7EB',
    alignItems: 'center', justifyContent: 'center',
  },
  emojiBadgeText: { fontSize: 38, lineHeight: 46 },

  nameInput: {
    flex: 1, height: 72, backgroundColor: '#F3F4F6',
    borderRadius: 14, paddingHorizontal: 14,
    fontSize: 15, fontWeight: '500', color: '#111827',
    borderWidth: 1.5, borderColor: '#E5E7EB',
  },

  // Preview pill
  preview:     { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F9FAFB', borderRadius: 12, padding: 12 },
  previewIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  previewName: { fontSize: 15, fontWeight: '700' },

  // Create button
  createBtn: { backgroundColor: '#4F46E5', borderRadius: 12, padding: 14, alignItems: 'center' },
  createTxt: { fontSize: 15, fontWeight: '700', color: 'white' },

  // Category rows
  catRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14, backgroundColor: 'white' },
  catRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  catIcon:      { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  catName:      { fontSize: 14, fontWeight: '500', color: '#111827' },
  colorDot:     { width: 10, height: 10, borderRadius: 5 },
  chevronHint:  { fontSize: 18, color: '#D1D5DB' },

  // Swipe delete action (user categories)
  catDeleteAction: {
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 22,
  },
  catDeleteTxt: { fontSize: 13, fontWeight: '700', color: 'white' },

  // Shared modal overlay
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },

  // Emoji picker sheet
  emojiSheet: {
    backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 40,
  },
  sheetHandle:    { width: 36, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginBottom: 12 },
  emojiSheetTitle:{ fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },
  emojiGrid:      { flexDirection: 'row', flexWrap: 'wrap' },
  emojiCell:      { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  emojiCellText:  { fontSize: 28 },

  // Edit modal sheet
  editSheet: {
    backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40, maxHeight: '90%',
  },
  editSheetTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 16 },
  editActions:    { flexDirection: 'row', gap: 10, marginTop: 16 },
  cancelBtn:      { flex: 1, backgroundColor: '#F3F4F6', borderRadius: 12, padding: 14, alignItems: 'center' },
  cancelTxt:      { fontSize: 15, fontWeight: '600', color: '#374151' },
  saveBtn:        { flex: 2, backgroundColor: '#4F46E5', borderRadius: 12, padding: 14, alignItems: 'center' },
  saveTxt:        { fontSize: 15, fontWeight: '700', color: 'white' },
});
