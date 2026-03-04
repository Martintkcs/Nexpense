import {
  View, Text, Pressable, StyleSheet, Alert, ActivityIndicator,
  Modal, TextInput, KeyboardAvoidingView, Platform, Keyboard,
  TouchableWithoutFeedback, ScrollView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useExpenses } from '@/hooks/useExpenses';
import { useCategories } from '@/hooks/useCategories';
import { useLabels } from '@/hooks/useLabels';
import { useTemplates } from '@/hooks/useTemplates';
import { ColorSlider } from '@/components/ui/ColorSlider';
import { useColors } from '@/lib/useColors';

// ─── Constants ─────────────────────────────────────────────────────────────────

const CAT_COLORS = [
  '#F97316', '#3B82F6', '#EC4899', '#8B5CF6',
  '#10B981', '#6366F1', '#EF4444', '#F59E0B',
  '#06B6D4', '#84CC16', '#64748B', '#FB923C',
];

// ─── Component ─────────────────────────────────────────────────────────────────

export default function QuickAddModal() {
  const colors = useColors();
  const { user }                                = useAuth();
  const { expenses, addExpense, isAdding, updateExpense, isUpdating } = useExpenses();
  const { categories, addCategory, isAdding: isCategoryAdding } = useCategories();
  const { labels, addLabel }                    = useLabels();
  const { templates }                           = useTemplates();

  // ── Edit mode params ──────────────────────────────────────
  const {
    expenseId,
    expenseAmount,
    expenseCategoryId,
    expenseLabelIds,
    expenseType,
    expenseDescription,
    expenseNote,
  } = useLocalSearchParams<{
    expenseId?: string;
    expenseAmount?: string;
    expenseCategoryId?: string;
    expenseLabelIds?: string;
    expenseType?: string;
    expenseDescription?: string;
    expenseNote?: string;
  }>();
  const isEditMode = !!expenseId;

  // ── Entry type (expense / income) ────────────────────────
  const [entryType, setEntryType] = useState<'expense' | 'income'>(
    expenseType === 'income' ? 'income' : 'expense',
  );
  const isIncome = entryType === 'income';

  // ── Amount ───────────────────────────────────────────────
  const [amount, setAmount] = useState(expenseAmount ?? '0');

  // ── Income description (free-text when entryType === 'income') ──
  const [incomeDescription, setIncomeDescription] = useState(
    expenseType === 'income' ? (expenseDescription ?? '') : '',
  );
  const [expenseNoteInput, setExpenseNoteInput] = useState(
    expenseType !== 'income' ? (expenseNote ?? '') : '',
  );

  // ── Category ─────────────────────────────────────────────
  const [selectedCatId, setSelectedCatId] = useState<string | null>(
    expenseCategoryId || null,
  );
  const [catPickerOpen, setCatPickerOpen] = useState(false);

  // Category create (inside category picker sheet)
  const [catCreateOpen, setCatCreateOpen] = useState(false);
  const [catName, setCatName]   = useState('');
  const [catEmoji, setCatEmoji] = useState('📦');
  const [catColor, setCatColor] = useState(CAT_COLORS[0]);

  // ── Labels ───────────────────────────────────────────────
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>(() => {
    if (!expenseLabelIds) return [];
    try { return JSON.parse(expenseLabelIds); } catch { return []; }
  });
  const [labelPickerOpen, setLabelPickerOpen]   = useState(false);

  // New label create (inside label picker sheet)
  const [newLabelName, setNewLabelName]   = useState('');
  const [newLabelColor, setNewLabelColor] = useState('#4F46E5');
  const [labelCreating, setLabelCreating] = useState(false);

  // ── Templates ────────────────────────────────────────────
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);

  // ── Set default category after categories load (create mode) ──
  useEffect(() => {
    if (!isEditMode && !selectedCatId && categories.length > 0) {
      setSelectedCatId(categories[0].id);
    }
  }, [isEditMode, categories, selectedCatId]);

  // ── Derived ──────────────────────────────────────────────
  const selectedCategory = categories.find((c) => c.id === selectedCatId) ?? categories[0];
  const selectedLabels   = labels.filter((l) => selectedLabelIds.includes(l.id));

  // ── Numpad ───────────────────────────────────────────────

  function pressDigit(d: string) {
    if (d === '000') {
      if (amount === '0') return;
      setAmount((prev) => prev + '000');
    } else {
      if (amount === '0') setAmount(d);
      else setAmount((prev) => prev + d);
    }
  }

  function pressDelete() {
    if (amount.length > 1) setAmount((prev) => prev.slice(0, -1));
    else setAmount('0');
  }

  // ── Category create ──────────────────────────────────────

  async function handleAddCategory() {
    if (!catName.trim()) {
      Alert.alert('Hiányzó név', 'Adj nevet a kategóriának!');
      return;
    }
    try {
      const slug = catName.trim().toLowerCase().replace(/\s+/g, '_');
      const newCat = await addCategory({ name: slug, nameHu: catName.trim(), icon: catEmoji, color: catColor });
      setSelectedCatId(newCat.id);
      setCatCreateOpen(false);
      setCatPickerOpen(false);
      setCatName('');
      setCatEmoji('📦');
      setCatColor(CAT_COLORS[0]);
    } catch {
      Alert.alert('Hiba', 'Nem sikerült létrehozni a kategóriát.');
    }
  }

  // ── Label create ─────────────────────────────────────────

  async function handleAddLabel() {
    if (!newLabelName.trim()) return;
    setLabelCreating(true);
    try {
      const newLabel = await addLabel({ name: newLabelName.trim(), color: newLabelColor });
      setSelectedLabelIds((prev) => [...prev, newLabel.id]);
      setNewLabelName('');
      Keyboard.dismiss();
    } catch {
      Alert.alert('Hiba', 'Nem sikerült létrehozni a cimkét.');
    } finally {
      setLabelCreating(false);
    }
  }

  // ── Template apply ───────────────────────────────────────

  function applyTemplate(id: string) {
    const t = templates.find((x) => x.id === id);
    if (!t) return;
    if (t.categoryId) setSelectedCatId(t.categoryId);
    setSelectedLabelIds(t.labelIds);
    if (isIncome) setIncomeDescription(t.description ?? '');
    else setExpenseNoteInput(t.description ?? '');
    setTemplatePickerOpen(false);
  }

  // ── Toggle label selection ───────────────────────────────

  function toggleLabel(id: string) {
    setSelectedLabelIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  // ── Save (create or update) ───────────────────────────────

  async function handleSave() {
    const numAmount = parseInt(amount, 10);
    if (!numAmount || numAmount <= 0) {
      Alert.alert('Hibás összeg', 'Adj meg egy érvényes összeget!');
      return;
    }
    if (!user) return;

    const metaPayload = selectedLabelIds.length ? { label_ids: selectedLabelIds } : null;

    // For income: no category, use typed description; for expense: use selected category
    const saveCategoryId  = isIncome ? null : (selectedCategory?.id ?? null);
    const saveDescription = isIncome
      ? (incomeDescription.trim() || null)
      : (selectedCategory?.name_hu ?? selectedCategory?.name ?? null);
    const saveNote = isIncome ? null : (expenseNoteInput.trim() || null);

    try {
      if (isEditMode && expenseId) {
        // ── Update existing expense ──
        await updateExpense({
          id: expenseId,
          updates: {
            amount:      numAmount,
            type:        entryType,
            category_id: saveCategoryId,
            description: saveDescription,
            note:        saveNote,
            metadata:    metaPayload,
          },
        });
      } else {
        // ── Create new expense ──
        const now   = new Date();
        const today = [
          now.getFullYear(),
          String(now.getMonth() + 1).padStart(2, '0'),
          String(now.getDate()).padStart(2, '0'),
        ].join('-');

        await addExpense({
          user_id:                  user.id,
          amount:                   numAmount,
          currency:                 'HUF',
          type:                     entryType,
          category_id:              saveCategoryId,
          description:              saveDescription,
          note:                     saveNote,
          expense_date:             today,
          expense_time:             null,
          location_name:            null,
          location_lat:             null,
          location_lng:             null,
          source:                   'manual',
          apple_pay_transaction_id: null,
          is_deleted:               false,
          metadata:                 metaPayload,
        });
      }
      router.back();
    } catch (err: any) {
      Alert.alert('Hiba', err.message ?? 'Nem sikerült menteni a kiadást.');
    }
  }

  const isSaving = isAdding || isUpdating;

  // ── Render ───────────────────────────────────────────────

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>

      {/* ── Header ── */}
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.header }]}>
        <Pressable onPress={() => router.back()}>
          <Text style={[styles.cancel, { color: colors.textSub }]}>Mégsem</Text>
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>
          {isEditMode
            ? (isIncome ? 'Bevétel szerkesztése' : 'Kiadás szerkesztése')
            : (isIncome ? 'Bevétel hozzáadása' : 'Kiadás hozzáadása')}
        </Text>
        {!isEditMode ? (
          <Pressable onPress={() => setTemplatePickerOpen(true)} style={[styles.templateBtn, { backgroundColor: colors.aiCardBg }]}>
            <Text style={[styles.templateBtnTxt, { color: colors.primary }]}>📋 Sablon</Text>
          </Pressable>
        ) : (
          <View style={{ width: 72 }} />
        )}
      </View>

      {/* ── Type toggle ── */}
      <View style={[styles.typeToggleWrap, { backgroundColor: colors.toggleBg }]}>
        <Pressable
          style={[styles.typeBtn, !isIncome && styles.typeBtnExpenseActive]}
          onPress={() => setEntryType('expense')}
        >
          <Text style={[styles.typeBtnTxt, !isIncome && styles.typeBtnTxtActive]}>
            − Kiadás
          </Text>
        </Pressable>
        <Pressable
          style={[styles.typeBtn, isIncome && styles.typeBtnIncomeActive]}
          onPress={() => setEntryType('income')}
        >
          <Text style={[styles.typeBtnTxt, isIncome && styles.typeBtnTxtActive]}>
            + Bevétel
          </Text>
        </Pressable>
      </View>

      {/* ── Top section: amount + category + labels ── */}
      <View style={styles.topSection}>
        {/* Amount */}
        <View style={styles.amountSection}>
          <Text style={[styles.amountDisplay, { color: colors.text }, isIncome && styles.amountDisplayIncome]}>
            {parseInt(amount, 10).toLocaleString('hu-HU')} Ft
          </Text>
          <Text style={[styles.amountSub, { color: colors.textSub }]}>Magyar forint</Text>
        </View>

        {/* Category row — fixed for income, selectable for expense */}
        {isIncome ? (
          <>
            <View style={[styles.incomeCatFixed, { backgroundColor: colors.pressedBg, borderColor: colors.success }]}>
              <View style={[styles.pickerIcon, { backgroundColor: '#10B98122' }]}>
                <Text style={{ fontSize: 18 }}>💰</Text>
              </View>
              <Text style={[styles.pickerLabel, { color: colors.success }]}>Bevétel</Text>
              <Text style={styles.incomeCatLock}>🔒</Text>
            </View>
            <TextInput
              style={[styles.incomeDescInput, { backgroundColor: colors.inputBg, color: colors.text }]}
              placeholder="Leírás (pl. Fizetés, Bónusz…)"
              placeholderTextColor={colors.textMuted}
              value={incomeDescription}
              onChangeText={setIncomeDescription}
              returnKeyType="done"
              onSubmitEditing={() => {}}
            />
          </>
        ) : (
          <>
            <Pressable style={[styles.pickerRow, { backgroundColor: colors.inputBg }]} onPress={() => setCatPickerOpen(true)}>
              {selectedCategory ? (
                <View style={[styles.pickerIcon, { backgroundColor: selectedCategory.color + '22' }]}>
                  <Text style={{ fontSize: 18 }}>{selectedCategory.icon}</Text>
                </View>
              ) : (
                <View style={[styles.pickerIcon, { backgroundColor: colors.borderLight }]}>
                  <Text style={{ fontSize: 18 }}>📦</Text>
                </View>
              )}
              <Text style={[styles.pickerLabel, { color: colors.text }]} numberOfLines={1}>
                {selectedCategory?.name_hu ?? selectedCategory?.name ?? 'Válassz kategóriát…'}
              </Text>
              <Text style={[styles.pickerChevron, { color: colors.textMuted }]}>›</Text>
            </Pressable>
            <TextInput
              style={[styles.expenseNoteInput, { backgroundColor: colors.inputBg, color: colors.text }]}
              placeholder="Leírás (pl. heti bevásárlás, ebéd a városban…)"
              placeholderTextColor={colors.textMuted}
              value={expenseNoteInput}
              onChangeText={setExpenseNoteInput}
              returnKeyType="done"
              onSubmitEditing={() => {}}
            />
          </>
        )}

        {/* Labels row */}
        <Pressable style={[styles.labelsRow, { backgroundColor: colors.inputBg }]} onPress={() => setLabelPickerOpen(true)}>
          <Text style={styles.labelsIcon}>🏷️</Text>
          {selectedLabels.length === 0 ? (
            <Text style={[styles.labelsPlaceholder, { color: colors.textMuted }]}>Cimkék hozzáadása…</Text>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsScroll}
            >
              {selectedLabels.map((l) => (
                <View
                  key={l.id}
                  style={[styles.chip, { backgroundColor: (l.color ?? '#4F46E5') + '22' }]}
                >
                  <Text style={[styles.chipTxt, { color: l.color ?? '#4F46E5' }]}>{l.name}</Text>
                </View>
              ))}
            </ScrollView>
          )}
          <Text style={[styles.pickerChevron, { color: colors.textMuted }]}>›</Text>
        </Pressable>
      </View>

      {/* ── Numpad ── */}
      <View style={styles.numpad}>
        {['1','2','3','4','5','6','7','8','9','000','0','⌫'].map((key) => (
          <Pressable
            key={key}
            style={[styles.numKey, { backgroundColor: colors.inputBg }]}
            onPress={() => key === '⌫' ? pressDelete() : pressDigit(key)}
          >
            <Text style={[styles.numKeyText, { color: colors.text }]}>{key}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        style={[
          styles.saveBtn,
          { backgroundColor: isIncome ? colors.success : colors.primary },
          isSaving && styles.saveBtnDisabled,
        ]}
        onPress={handleSave}
        disabled={isSaving}
      >
        {isSaving
          ? <ActivityIndicator color="white" />
          : <Text style={styles.saveBtnText}>
              {isEditMode
                ? '💾 Mentés'
                : isIncome ? '💾 Bevétel rögzítése' : '💾 Kiadás rögzítése'}
            </Text>
        }
      </Pressable>

      {/* ════ Kategória választó sheet ════ */}
      <Modal visible={catPickerOpen} transparent animationType="slide" statusBarTranslucent>
        <Pressable style={[styles.overlay, { backgroundColor: colors.overlay }]} onPress={() => { setCatPickerOpen(false); setCatCreateOpen(false); }}>
          <Pressable style={[styles.sheet, { backgroundColor: colors.card }]} onPress={(e) => e.stopPropagation()}>
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
            <Text style={[styles.sheetTitle, { color: colors.text }]}>Kategória</Text>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 360 }}>
              {categories.map((cat, i) => (
                <Pressable
                  key={cat.id}
                  style={[
                    styles.catListRow,
                    i < categories.length - 1 && styles.rowBorder,
                    i < categories.length - 1 && { borderBottomColor: colors.borderLight },
                    selectedCatId === cat.id && styles.catListRowActive,
                    selectedCatId === cat.id && { backgroundColor: colors.aiCardBg },
                  ]}
                  onPress={() => { setSelectedCatId(cat.id); setCatPickerOpen(false); }}
                >
                  <View style={[styles.catListIcon, { backgroundColor: cat.color + '22' }]}>
                    <Text style={{ fontSize: 20 }}>{cat.icon}</Text>
                  </View>
                  <Text style={[
                    styles.catListName,
                    { color: colors.text },
                    selectedCatId === cat.id && { color: colors.primary, fontWeight: '600' },
                  ]}>
                    {cat.name_hu ?? cat.name}
                  </Text>
                  {selectedCatId === cat.id && <Text style={[styles.check, { color: colors.primary }]}>✓</Text>}
                </Pressable>
              ))}
            </ScrollView>

            {/* Inline new category form */}
            {catCreateOpen ? (
              <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <View style={styles.catCreateForm}>
                  <View style={styles.catFormRow}>
                    <TextInput
                      style={styles.emojiInput}
                      value={catEmoji}
                      onChangeText={(t) => setCatEmoji(t.slice(-2))}
                      maxLength={2}
                    />
                    <TextInput
                      style={[styles.catNameInput, { backgroundColor: colors.inputBg, color: colors.text }]}
                      placeholder="Kategória neve…"
                      placeholderTextColor={colors.textMuted}
                      value={catName}
                      onChangeText={setCatName}
                      autoFocus
                      returnKeyType="done"
                      onSubmitEditing={Keyboard.dismiss}
                    />
                  </View>
                  <View style={styles.colorGrid}>
                    {CAT_COLORS.map((c) => (
                      <Pressable
                        key={c}
                        style={[styles.colorSwatch, { backgroundColor: c }, catColor === c && styles.colorSwatchActive]}
                        onPress={() => setCatColor(c)}
                      />
                    ))}
                  </View>
                  <View style={styles.catCreateActions}>
                    <Pressable style={[styles.sheetCancelBtn, { backgroundColor: colors.inputBg }]} onPress={() => setCatCreateOpen(false)}>
                      <Text style={[styles.cancelTxt, { color: colors.textSub }]}>Mégse</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.sheetCreateBtn, { backgroundColor: colors.primary }, isCategoryAdding && { opacity: 0.65 }]}
                      onPress={handleAddCategory}
                      disabled={isCategoryAdding}
                    >
                      {isCategoryAdding
                        ? <ActivityIndicator color="white" size="small" />
                        : <Text style={styles.createTxt}>Létrehozás</Text>
                      }
                    </Pressable>
                  </View>
                </View>
              </KeyboardAvoidingView>
            ) : (
              <Pressable style={styles.addNewRow} onPress={() => setCatCreateOpen(true)}>
                <Text style={[styles.addNewTxt, { color: colors.primary }]}>＋ Új kategória</Text>
              </Pressable>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* ════ Cimke választó sheet ════ */}
      <Modal visible={labelPickerOpen} transparent animationType="slide" statusBarTranslucent>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableWithoutFeedback
            onPress={() => { Keyboard.dismiss(); setLabelPickerOpen(false); setNewLabelName(''); }}
          >
            <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
              <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                <View style={[styles.sheet, { backgroundColor: colors.card }]}>
                  <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
                  <Text style={[styles.sheetTitle, { color: colors.text }]}>Cimkék</Text>

                  {labels.length === 0 ? (
                    <Text style={[styles.emptyTxt, { color: colors.textMuted }]}>
                      Még nincsenek cimkéid.{'\n'}Hozz létre egyet lent!
                    </Text>
                  ) : (
                    <View style={styles.labelToggleGrid}>
                      {labels.map((l) => {
                        const active = selectedLabelIds.includes(l.id);
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
                              {active ? '✓ ' : ''}{l.name}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  )}

                  {/* New label form */}
                  <View style={styles.newLabelSection}>
                    <Text style={[styles.newLabelHeading, { color: colors.textMuted }]}>ÚJ CIMKE</Text>
                    <View style={styles.newLabelForm}>
                      <View style={[styles.newLabelDot, { backgroundColor: newLabelColor }]} />
                      <TextInput
                        style={[styles.newLabelInput, { backgroundColor: colors.inputBg, color: colors.text }]}
                        placeholder="Új cimke neve…"
                        placeholderTextColor={colors.textMuted}
                        value={newLabelName}
                        onChangeText={setNewLabelName}
                        returnKeyType="done"
                        onSubmitEditing={Keyboard.dismiss}
                      />
                      <Pressable
                        style={[styles.newLabelBtn, { backgroundColor: colors.primary }, (!newLabelName.trim() || labelCreating) && { opacity: 0.45 }]}
                        onPress={handleAddLabel}
                        disabled={!newLabelName.trim() || labelCreating}
                      >
                        {labelCreating
                          ? <ActivityIndicator color="white" size="small" />
                          : <Text style={styles.newLabelBtnTxt}>+</Text>
                        }
                      </Pressable>
                    </View>
                    <ColorSlider color={newLabelColor} onChange={setNewLabelColor} />
                  </View>

                  <Pressable
                    style={[styles.doneBtn, { backgroundColor: colors.primary }]}
                    onPress={() => { setLabelPickerOpen(false); setNewLabelName(''); }}
                  >
                    <Text style={styles.doneBtnTxt}>Kész</Text>
                  </Pressable>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      {/* ════ Sablon választó sheet ════ */}
      <Modal visible={templatePickerOpen} transparent animationType="slide" statusBarTranslucent>
        <Pressable style={[styles.overlay, { backgroundColor: colors.overlay }]} onPress={() => setTemplatePickerOpen(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: colors.card }]} onPress={(e) => e.stopPropagation()}>
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
            <Text style={[styles.sheetTitle, { color: colors.text }]}>Sablon alkalmazása</Text>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 340 }}>
              {templates.length === 0 && (
                <Text style={[styles.emptyTxt, { color: colors.textMuted }]}>
                  Még nincsenek sablonok.{'\n'}Hozz létre egyet lent.
                </Text>
              )}
              {templates.map((t, i) => {
                const cat    = categories.find((c) => c.id === t.categoryId);
                const tLabels = labels.filter((l) => t.labelIds.includes(l.id));
                return (
                  <Pressable
                    key={t.id}
                    style={[
                      styles.templateRow,
                      i < templates.length - 1 && styles.rowBorder,
                      i < templates.length - 1 && { borderBottomColor: colors.borderLight },
                    ]}
                    onPress={() => applyTemplate(t.id)}
                  >
                    {cat && (
                      <View style={[styles.catListIcon, { backgroundColor: cat.color + '22' }]}>
                        <Text style={{ fontSize: 20 }}>{cat.icon}</Text>
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
                        <View style={styles.miniChips}>
                          {tLabels.map((l) => (
                            <View
                              key={l.id}
                              style={[styles.miniChip, { backgroundColor: (l.color ?? '#4F46E5') + '22' }]}
                            >
                              <Text style={[styles.miniChipTxt, { color: l.color ?? '#4F46E5' }]}>
                                {l.name}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                    <Text style={[styles.applyTxt, { color: colors.primary }]}>Alkalmaz ›</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <Pressable
              style={[styles.createTemplateBtn, { backgroundColor: colors.primary }]}
              onPress={() => {
                setTemplatePickerOpen(false);
                router.push('/(tabs)/settings/templates');
              }}
            >
              <Text style={styles.createTemplateBtnTxt}>+ Új sablon létrehozása</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: 'white' },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  cancel:         { fontSize: 16, color: '#6B7280' },
  title:          { fontSize: 16, fontWeight: '700', color: '#111827' },
  templateBtn:    { backgroundColor: '#EEF2FF', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  templateBtnTxt: { fontSize: 13, color: '#4F46E5', fontWeight: '600' },

  // Top section
  topSection: { paddingHorizontal: 16, paddingTop: 12, gap: 8 },

  // Type toggle
  typeToggleWrap: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 3,
    gap: 3,
  },
  typeBtn: {
    flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center',
  },
  typeBtnExpenseActive: { backgroundColor: '#EF4444' },
  typeBtnIncomeActive:  { backgroundColor: '#10B981' },
  typeBtnTxt:           { fontSize: 14, fontWeight: '700', color: '#9CA3AF' },
  typeBtnTxtActive:     { color: 'white' },

  amountSection: { alignItems: 'center', paddingVertical: 12 },
  amountDisplay:       { fontSize: 42, fontWeight: '500', color: '#111827', fontVariant: ['tabular-nums'] },
  amountDisplayIncome: { color: '#10B981' },
  amountSub:           { fontSize: 13, color: '#6B7280', marginTop: 2 },

  // Picker rows
  pickerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#F3F4F6', borderRadius: 12,
    paddingVertical: 10, paddingHorizontal: 12,
  },
  pickerIcon:     { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  pickerLabel:    { flex: 1, fontSize: 15, fontWeight: '500', color: '#111827' },
  pickerChevron:  { fontSize: 20, color: '#D1D5DB' },

  // Income: fixed category display + description input
  incomeCatFixed: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#F0FDF4', borderRadius: 12,
    paddingVertical: 10, paddingHorizontal: 12,
    borderWidth: 1, borderColor: '#6EE7B7',
  },
  incomeCatLock: { fontSize: 13, color: '#10B981' },
  incomeDescInput: {
    backgroundColor: '#F3F4F6', borderRadius: 12,
    paddingVertical: 11, paddingHorizontal: 14,
    fontSize: 15, color: '#111827',
    borderWidth: 1, borderColor: 'transparent',
  },
  expenseNoteInput: {
    backgroundColor: '#F3F4F6', borderRadius: 12,
    paddingVertical: 11, paddingHorizontal: 14,
    fontSize: 15, color: '#111827',
    borderWidth: 1, borderColor: 'transparent',
  },

  labelsRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#F3F4F6', borderRadius: 12,
    paddingVertical: 10, paddingHorizontal: 12, minHeight: 50,
  },
  labelsIcon:        { fontSize: 18 },
  labelsPlaceholder: { flex: 1, fontSize: 14, color: '#9CA3AF' },
  chipsScroll:       { flexDirection: 'row', gap: 6, alignItems: 'center' },
  chip:              { borderRadius: 6, paddingHorizontal: 9, paddingVertical: 4 },
  chipTxt:           { fontSize: 13, fontWeight: '600' },

  // Numpad
  numpad:     { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, marginTop: 10, gap: 8 },
  numKey:     { width: '30%', aspectRatio: 2.2, backgroundColor: '#F3F4F6', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  numKeyText: {
    fontSize: 20,
    lineHeight: 20,
    fontWeight: '500',
    color: '#111827',
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  saveBtn:         { margin: 16, backgroundColor: '#4F46E5', borderRadius: 14, padding: 15, alignItems: 'center' },
  saveBtnIncome:   { backgroundColor: '#10B981' },
  saveBtnDisabled: { backgroundColor: '#A5B4FC' },
  saveBtnText:     { color: 'white', fontSize: 16, fontWeight: '700' },

  // Bottom sheets (shared)
  overlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet:       { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 44, gap: 12 },
  sheetHandle: { width: 36, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginBottom: 4 },
  sheetTitle:  { fontSize: 17, fontWeight: '700', color: '#111827' },
  rowBorder:   { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },

  // Category picker list
  catListRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 11, paddingHorizontal: 4,
  },
  catListRowActive: { backgroundColor: '#EEF2FF', borderRadius: 10, paddingHorizontal: 8 },
  catListIcon:      { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  catListName:      { flex: 1, fontSize: 15, fontWeight: '500', color: '#111827' },
  check:            { fontSize: 16, color: '#4F46E5', fontWeight: '700' },

  addNewRow: { paddingVertical: 12, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  addNewTxt: { fontSize: 15, color: '#4F46E5', fontWeight: '600' },

  // Category create form (inside picker)
  catCreateForm:    { gap: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  catFormRow:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
  emojiInput:       { width: 50, height: 50, borderRadius: 12, backgroundColor: '#F3F4F6', textAlign: 'center', fontSize: 24, borderWidth: 1, borderColor: '#E5E7EB' },
  catNameInput:     { flex: 1, height: 50, backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 12, fontSize: 15, fontWeight: '500', color: '#111827' },
  colorGrid:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  colorSwatch:      { width: 28, height: 28, borderRadius: 7 },
  colorSwatchActive:{ borderWidth: 2.5, borderColor: '#111827', transform: [{ scale: 1.15 }] },
  catCreateActions: { flexDirection: 'row', gap: 8 },
  sheetCancelBtn:   { flex: 1, backgroundColor: '#F3F4F6', borderRadius: 10, padding: 12, alignItems: 'center' },
  cancelTxt:        { fontSize: 14, fontWeight: '600', color: '#374151' },
  sheetCreateBtn:   { flex: 2, backgroundColor: '#4F46E5', borderRadius: 10, padding: 12, alignItems: 'center' },
  createTxt:        { fontSize: 14, fontWeight: '700', color: 'white' },

  // Label picker
  emptyTxt: {
    textAlign: 'center', color: '#9CA3AF', fontSize: 14,
    lineHeight: 22, paddingVertical: 8,
  },
  labelToggleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  labelToggle:     { borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
  labelToggleTxt:  { fontSize: 13, fontWeight: '600' },

  newLabelSection: {
    borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 12, gap: 10,
  },
  newLabelHeading: { fontSize: 11, fontWeight: '700', color: '#9CA3AF', letterSpacing: 0.8 },
  newLabelForm: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  newLabelDot:    { width: 18, height: 18, borderRadius: 9 },
  newLabelInput:  { flex: 1, height: 40, backgroundColor: '#F3F4F6', borderRadius: 10, paddingHorizontal: 12, fontSize: 14, color: '#111827' },
  newLabelBtn:    { width: 40, height: 40, backgroundColor: '#4F46E5', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  newLabelBtnTxt: { color: 'white', fontSize: 22, fontWeight: '700', lineHeight: 26 },

  doneBtn:    { backgroundColor: '#4F46E5', borderRadius: 12, padding: 13, alignItems: 'center', marginTop: 4 },
  doneBtnTxt: { color: 'white', fontSize: 15, fontWeight: '700' },

  // Template picker
  templateRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 4 },
  templateName:  { fontSize: 15, fontWeight: '600', color: '#111827' },
  templateDesc:  { fontSize: 12, lineHeight: 17 },
  miniChips:     { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  miniChip:      { borderRadius: 5, paddingHorizontal: 7, paddingVertical: 2 },
  miniChipTxt:   { fontSize: 11, fontWeight: '600' },
  applyTxt:      { fontSize: 13, color: '#4F46E5', fontWeight: '600' },
  createTemplateBtn: { marginTop: 8, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  createTemplateBtnTxt: { color: 'white', fontSize: 15, fontWeight: '700' },
});
