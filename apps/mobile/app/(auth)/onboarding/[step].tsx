import { useRef, useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, TextInput,
  ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAuth } from '@/providers/AuthProvider';
import { updateProfile } from '@/services/supabase/profiles';
import { useOnboardingStore, type Currency } from '@/stores/onboardingStore';
import { createCategory } from '@/services/supabase/categories';

// ─── Lépés konfiguráció ────────────────────────────────────────────────────────

type StepConfig = {
  q: string;
  options: string[];
  multi?: boolean;          // Többes választás (1. kérdés)
  hasCustom?: boolean;      // Egyéni szöveg mező (3. kérdés)
  hasBalanceInput?: boolean; // Kezdő egyenleg (3. lépés)
  hasWageInput?: boolean;   // Órabér + deviza (6. lépés)
};

const STEPS: StepConfig[] = [
  // 1
  {
    q: 'Mi a fő pénzügyi kihívásod?',
    options: ['Impulzusvásárlás megállítása', 'Kiadások nyomon követése', 'Büdzsé betartása', 'Megtakarítás növelése'],
    multi: true,
  },
  // 2
  {
    q: 'Havi nettó jövedelmű sávod?',
    options: ['200–400 ezer Ft', '400–700 ezer Ft', '700 ezer – 1 M Ft', '1 M Ft felett'],
  },
  // 3 (ÚJ) – Kezdő egyenleg
  {
    q: 'Mennyi pénz van most a számládon?',
    options: ['Inkább kihagyom', 'Beírom manuálisan'],
    hasBalanceInput: true,
  },
  // 4
  {
    q: 'Melyik kategóriában költöd a legtöbbet?',
    options: ['Étel & Ital', 'Vásárlás & Ruha', 'Szórakozás', 'Lakás & Rezsi'],
    hasCustom: true,
  },
  // 5
  {
    q: 'Milyen gyakran veszel impulzívan?',
    options: ['Szinte soha', 'Havonta 1-2x', 'Hetente', 'Szinte mindig'],
  },
  // 6
  {
    q: 'Órabéred (impulzus kalkulátorhoz)?',
    options: ['Inkább kihagyom', 'Beírom manuálisan'],
    hasWageInput: true,
  },
  // 7
  {
    q: 'Engedélyezed a helymeghatározást?',
    options: ['Igen, auto kategória javaslathoz', 'Nem kérek'],
  },
  // 8
  {
    q: 'Engedélyezed a push értesítéseket?',
    options: ['Igen, impulzus figyelmeztetőkhöz', 'Nem kérek'],
  },
  // 9
  {
    q: 'Az AI személyre szabáshoz válaszolj:',
    options: ['Takarékos típus vagyok', 'Néha túlköltekezem', 'Sokat impulzívan veszek'],
  },
  // 10
  {
    q: 'Készen állsz?',
    options: ['Kezdjük! 🚀'],
  },
];

const CURRENCIES: Currency[] = ['HUF', 'EUR', 'USD'];

// ─── Komponens ────────────────────────────────────────────────────────────────

export default function OnboardingStep() {
  const { step } = useLocalSearchParams<{ step: string }>();
  const stepNum = parseInt(step || '1', 10);
  const stepData = STEPS[stepNum - 1];
  const isLast = stepNum >= STEPS.length;
  const { user } = useAuth();
  const { responses, setResponses, resetResponses } = useOnboardingStore();

  const {
    currency,
    hourlyWage,
    startingBalance,
    setHourlyWage,
    setCurrency,
    setStartingBalance,
    setOnboardingCompleted,
  } = useSettingsStore();
  const [isFinishing, setIsFinishing] = useState(false);
  const scrollRef = useRef<ScrollView | null>(null);

  // Szelekciók
  const [selectedIdx, setSelectedIdx]   = useState<number | null>(() => getInitialSelectedIdx(stepNum, responses));
  const [selectedIdxs, setSelectedIdxs] = useState<Set<number>>(() => getInitialSelectedIdxs(stepNum, responses));

  // 4. kérdés: egyéni kategória szöveg
  const [customText, setCustomText] = useState(() => responses.topCategory ?? '');

  // 3. kérdés: kezdő egyenleg
  const [balanceInput, setBalanceInput] = useState(() => (
    startingBalance > 0 ? String(startingBalance) : ''
  ));
  const [balanceCurrency, setBalanceCurrency] = useState<Currency>(() => (
    isCurrency(currency) ? currency : 'HUF'
  ));

  // 6. kérdés: órabér + deviza
  const [wageInput, setWageInput]       = useState(() => (
    hourlyWage != null ? String(hourlyWage) : ''
  ));
  const [wageCurrency, setWageCurrency] = useState<Currency>(() => (
    isCurrency(currency) ? currency : 'HUF'
  ));

  const isMulti        = stepData?.multi === true;
  const hasCustom      = stepData?.hasCustom === true;
  const hasBalanceInput = stepData?.hasBalanceInput === true;
  const hasWageInput   = stepData?.hasWageInput === true;
  const showBalanceFields = hasBalanceInput && selectedIdx === 1; // "Beírom manuálisan"
  const showWageFields    = hasWageInput    && selectedIdx === 1;
  const hasCustomCategory = hasCustom && customText.trim().length > 0 && selectedIdx === null;

  // ── Tovább feltétel ────────────────────────────────────────────
  let canNext: boolean;
  if (isLast) {
    canNext = true;
  } else if (isMulti) {
    canNext = selectedIdxs.size > 0;
  } else if (hasCustom) {
    canNext = selectedIdx !== null || customText.trim().length > 0;
  } else if (hasBalanceInput) {
    canNext = selectedIdx === 0 || (selectedIdx === 1 && balanceInput.trim().length > 0);
  } else if (hasWageInput) {
    canNext = selectedIdx === 0 || (selectedIdx === 1 && wageInput.trim().length > 0);
  } else {
    canNext = selectedIdx !== null;
  }

  // ── Opció kezelő ──────────────────────────────────────────────
  function handleOption(idx: number) {
    if (isMulti) {
      setSelectedIdxs(prev => {
        const next = new Set(prev);
        next.has(idx) ? next.delete(idx) : next.add(idx);
        return next;
      });
    } else {
      setSelectedIdx(idx);
      if (isLast) {
        finishOnboarding();
      }
    }
  }

  // ── Tovább gomb ───────────────────────────────────────────────
  function handleNext() {
    persistCurrentStep();

    // 3. lépés: kezdő egyenleg mentése
    if (stepNum === 3 && hasBalanceInput) {
      setCurrency(balanceCurrency);
      if (selectedIdx === 1 && balanceInput.trim()) {
        const parsed = parseFloat(balanceInput.replace(/\s/g, '').replace(',', '.'));
        if (!isNaN(parsed) && parsed >= 0) {
          setStartingBalance(parsed);
        }
      }
    }

    // 6. lépés: deviza + órabér mentése
    if (stepNum === 6 && hasWageInput) {
      setCurrency(wageCurrency);
      if (selectedIdx === 1 && wageInput.trim()) {
        const parsed = parseFloat(wageInput.replace(/\s/g, '').replace(',', '.'));
        if (!isNaN(parsed) && parsed > 0) {
          setHourlyWage(parsed);
        }
      }
    }

    router.push(`/(auth)/onboarding/${stepNum + 1}` as any);
  }

  async function finishOnboarding() {
    if (!user || isFinishing) return;

    persistCurrentStep();
    setIsFinishing(true);

    try {
      if (hasCustomCategory) {
        await ensureCustomCategoryExists(user.id, customText);
      }

      const spendingProfile = {
        version: 1,
        completed_at: new Date().toISOString(),
        responses: {
          ...responses,
          topCategory: customText.trim() || responses.topCategory,
        },
      };

      const updates = {
        currency,
        wage_currency: currency,
        starting_balance: startingBalance,
        hourly_wage: hourlyWage,
        spending_profile: spendingProfile,
        onboarding_completed_at: new Date().toISOString(),
      };

      await updateProfile(user.id, updates);
      setOnboardingCompleted(true);
      resetResponses();
      router.replace('/(tabs)');
    } finally {
      setIsFinishing(false);
    }
  }

  function persistCurrentStep() {
    if (stepNum === 1) {
      setResponses({
        mainChallenges: Array.from(selectedIdxs).map((idx) => stepData.options[idx]),
      });
      return;
    }

    if (stepNum === 2) {
      setResponses({
        incomeRange: selectedIdx != null ? stepData.options[selectedIdx] : null,
      });
      return;
    }

    if (stepNum === 4) {
      setResponses({
        topCategory: customText.trim() || (selectedIdx != null ? stepData.options[selectedIdx] : null),
      });
      return;
    }

    if (stepNum === 5) {
      setResponses({
        impulseFrequency: selectedIdx != null ? stepData.options[selectedIdx] : null,
      });
      return;
    }

    if (stepNum === 7) {
      setResponses({
        locationEnabled: selectedIdx === 0 ? true : selectedIdx === 1 ? false : null,
      });
      return;
    }

    if (stepNum === 8) {
      setResponses({
        notificationsEnabled: selectedIdx === 0 ? true : selectedIdx === 1 ? false : null,
      });
      return;
    }

    if (stepNum === 9) {
      setResponses({
        aiProfile: selectedIdx != null ? stepData.options[selectedIdx] : null,
      });
    }
  }

  if (!stepData) return null;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={styles.container}>
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="always"
        >
          {/* Progress dots */}
          <View style={styles.progress}>
            {STEPS.map((_, i) => (
              <View key={i} style={[styles.dot, i < stepNum && styles.dotActive]} />
            ))}
          </View>

          <Text style={styles.stepNum}>{stepNum} / {STEPS.length}</Text>
          <Text style={styles.question}>{stepData.q}</Text>

          {/* Hint for balance step */}
          {hasBalanceInput && (
            <Text style={styles.hint}>
              💡 Ez az alap, amihez az összes kiadásod és bevételed hozzáadódik. Bármikor módosíthatod a Beállításokban.
            </Text>
          )}

          {/* Opciók */}
          <View style={styles.options}>
          {stepData.options.map((opt, i) => {
              const isSelected = isMulti ? selectedIdxs.has(i) : selectedIdx === i;
              return (
                <Pressable
                  key={i}
                  style={[styles.option, isSelected && styles.optionSelected]}
                  onPress={() => handleOption(i)}
                >
                  <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                    {opt}
                  </Text>
                  {isSelected && (
                    <View style={styles.check}>
                      <Text style={styles.checkMark}>✓</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}

            {/* ── 3. lépés: Kezdő egyenleg input ── */}
            {showBalanceFields && (
              <View style={styles.wageBlock}>
                <View style={styles.wageRow}>
                  <TextInput
                    style={styles.wageInput}
                    placeholder="pl. 450.000"
                    placeholderTextColor="#9CA3AF"
                    value={formatGroupedIntegerInput(balanceInput)}
                    onChangeText={(text) => setBalanceInput(sanitizeIntegerInput(text))}
                    keyboardType="numeric"
                    autoFocus
                    returnKeyType="done"
                    onFocus={() => scrollToInput(scrollRef)}
                  />
                  <View style={styles.currencyRow}>
                    {CURRENCIES.map(c => (
                      <Pressable
                        key={c}
                        style={[styles.currencyChip, balanceCurrency === c && styles.currencyChipActive]}
                        onPress={() => setBalanceCurrency(c)}
                      >
                        <Text style={[
                          styles.currencyChipText,
                          balanceCurrency === c && styles.currencyChipTextActive,
                        ]}>
                          {c}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {/* ── 4. kérdés: Egyéni kategória ── */}
            {hasCustom && (
              <View style={[
                styles.customRow,
                customText.trim().length > 0 && selectedIdx === null && styles.customRowActive,
              ]}>
                <TextInput
                  style={styles.customInput}
                  placeholder="Egyéb kategória..."
                  placeholderTextColor="#9CA3AF"
                  value={customText}
                  onChangeText={t => {
                    setCustomText(t);
                    if (t.trim().length > 0) setSelectedIdx(null);
                  }}
                  returnKeyType="done"
                  onFocus={() => scrollToInput(scrollRef)}
                />
              </View>
            )}

            {/* ── 6. kérdés: Órabér + deviza ── */}
            {showWageFields && (
              <View style={styles.wageBlock}>
                <View style={styles.wageRow}>
                  <TextInput
                    style={styles.wageInput}
                    placeholder="pl. 2500"
                    placeholderTextColor="#9CA3AF"
                    value={wageInput}
                    onChangeText={setWageInput}
                    keyboardType="numeric"
                    autoFocus
                    returnKeyType="done"
                    onFocus={() => scrollToInput(scrollRef)}
                  />
                  <Text style={styles.wageUnit}>/ óra</Text>
                  <View style={styles.currencyRow}>
                    {CURRENCIES.map(c => (
                      <Pressable
                        key={c}
                        style={[styles.currencyChip, wageCurrency === c && styles.currencyChipActive]}
                        onPress={() => setWageCurrency(c)}
                      >
                        <Text style={[
                          styles.currencyChipText,
                          wageCurrency === c && styles.currencyChipTextActive,
                        ]}>
                          {c}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Tovább gomb – rögzítve alul, ScrollView-n kívül */}
        {!isLast && (
          <Pressable
            style={[styles.nextBtn, !canNext && styles.nextBtnDisabled]}
            onPress={handleNext}
            disabled={!canNext}
          >
            <Text style={styles.nextBtnText}>Tovább →</Text>
          </Pressable>
        )}
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

function getInitialSelectedIdx(stepNum: number, responses: ReturnType<typeof useOnboardingStore.getState>['responses']) {
  switch (stepNum) {
    case 2:
      return getValidIndex(STEPS[1].options, responses.incomeRange);
    case 4:
      return getValidIndex(STEPS[3].options, responses.topCategory);
    case 5:
      return getValidIndex(STEPS[4].options, responses.impulseFrequency);
    case 7:
      return responses.locationEnabled == null ? null : responses.locationEnabled ? 0 : 1;
    case 8:
      return responses.notificationsEnabled == null ? null : responses.notificationsEnabled ? 0 : 1;
    case 9:
      return getValidIndex(STEPS[8].options, responses.aiProfile);
    default:
      return null;
  }
}

function getInitialSelectedIdxs(stepNum: number, responses: ReturnType<typeof useOnboardingStore.getState>['responses']) {
  if (stepNum !== 1) return new Set<number>();

  return new Set(
    responses.mainChallenges
      .map((challenge) => STEPS[0].options.indexOf(challenge))
      .filter((idx) => idx >= 0),
  );
}

function parseNumericInput(value: string): number | null {
  const normalized = value.replace(/\./g, '').replace(/\s/g, '').replace(',', '.');
  const parsed = parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function getValidIndex(options: string[], value: string | null): number | null {
  if (!value) return null;
  const idx = options.indexOf(value);
  return idx >= 0 ? idx : null;
}

function isCurrency(value: string): value is Currency {
  return CURRENCIES.includes(value as Currency);
}

function sanitizeIntegerInput(value: string): string {
  return value.replace(/\D/g, '');
}

function formatGroupedIntegerInput(value: string): string {
  if (!value) return '';
  return Number(value).toLocaleString('hu-HU');
}

function scrollToInput(scrollRef: React.RefObject<ScrollView | null>) {
  setTimeout(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, 150);
}

async function ensureCustomCategoryExists(userId: string, customText: string) {
  const trimmed = customText.trim();
  if (!trimmed) return;

  const slug = trimmed
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40);

  await createCategory({
    userId,
    name: slug || `custom_${Date.now()}`,
    nameHu: trimmed,
    icon: '📦',
    color: '#4F46E5',
  }).catch(() => {
    // If it already exists or creation fails non-critically, onboarding can still continue.
  });
}

// ─── Stílusok ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  scrollContent: { padding: 24, paddingBottom: 140 },

  // Progress
  progress: { flexDirection: 'row', gap: 6, marginBottom: 32, flexWrap: 'wrap' },
  dot: { flex: 1, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, minWidth: 20 },
  dotActive: { backgroundColor: '#4F46E5' },

  stepNum: { fontSize: 13, color: '#9CA3AF', fontWeight: '600', marginBottom: 12 },
  question: { fontSize: 24, fontWeight: '800', color: '#111827', lineHeight: 32, marginBottom: 12 },
  hint: {
    fontSize: 13, color: '#6B7280', lineHeight: 19,
    marginBottom: 20, backgroundColor: '#EEF2FF',
    borderRadius: 10, padding: 12,
  },

  // Opciók
  options: { gap: 10 },
  option: {
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionSelected: { borderColor: '#4F46E5', backgroundColor: '#EEF2FF' },
  optionText: { fontSize: 15, fontWeight: '600', color: '#111827', flex: 1 },
  optionTextSelected: { color: '#4F46E5' },

  // Check jelölő
  check: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#4F46E5',
    alignItems: 'center', justifyContent: 'center', marginLeft: 8,
  },
  checkMark: { color: 'white', fontSize: 13, fontWeight: '700' },

  // 4. kérdés – egyéni kategória
  customRow: {
    backgroundColor: 'white',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  customRowActive: { borderColor: '#4F46E5', backgroundColor: '#EEF2FF' },
  customInput: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    paddingVertical: 12,
  },

  // 3. + 6. kérdés – szám input blokk (egyenleg / órabér)
  wageBlock: {
    backgroundColor: '#EEF2FF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#4F46E5',
    padding: 14,
    marginTop: 4,
  },
  wageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  wageInput: {
    flex: 1,
    minWidth: 80,
    backgroundColor: 'white',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  wageUnit: { fontSize: 14, fontWeight: '600', color: '#4338CA' },
  currencyRow: { flexDirection: 'row', gap: 6 },
  currencyChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'white',
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
  },
  currencyChipActive: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
  currencyChipText: { fontSize: 12, fontWeight: '700', color: '#4338CA' },
  currencyChipTextActive: { color: 'white' },

  // Tovább gomb (rögzített alul)
  nextBtn: {
    marginHorizontal: 24,
    marginBottom: 16,
    backgroundColor: '#4F46E5',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  nextBtnDisabled: { backgroundColor: '#C7D2FE' },
  nextBtnText: { fontSize: 16, fontWeight: '700', color: 'white' },
});
