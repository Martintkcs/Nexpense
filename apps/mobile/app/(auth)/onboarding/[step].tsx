import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

const STEPS = [
  { q: 'Mi a fő pénzügyi kihívásod?', options: ['Impulzusvásárlás megállítása', 'Kiadások nyomon követése', 'Büdzsé betartása', 'Megtakarítás növelése'] },
  { q: 'Havi nettó jövedelmű sávod?', options: ['200–400 ezer Ft', '400–700 ezer Ft', '700 ezer – 1 M Ft', '1 M Ft felett'] },
  { q: 'Melyik kategóriában költöd a legtöbbet?', options: ['Étel & Ital', 'Vásárlás & Ruha', 'Szórakozás', 'Lakás & Rezsi'] },
  { q: 'Milyen gyakran veszel impulzívan?', options: ['Szinte soha', 'Havonta 1-2x', 'Hetente', 'Szinte mindig'] },
  { q: 'Órabéred (impulzus kalkulátorhoz)?', options: ['Inkább kihagyom', 'Beírom manuálisan'] },
  { q: 'Melyik devizát használod?', options: ['Magyar forint (HUF)', 'Euró (EUR)', 'Dollár (USD)'] },
  { q: 'Engedélyezed a helymeghatározást?', options: ['Igen, auto kategória javaslathoz', 'Nem kérek'] },
  { q: 'Engedélyezed a push értesítéseket?', options: ['Igen, impulzus figyelmeztetőkhöz', 'Nem kérek'] },
  { q: 'Az AI személyre szabáshoz válaszolj:', options: ['Takarékos típus vagyok', 'Néha túlköltekezek', 'Sokat impulzívan veszek'] },
  { q: 'Készen állsz?', options: ['Kezdjük! 🚀'] },
];

export default function OnboardingStep() {
  const { step } = useLocalSearchParams<{ step: string }>();
  const stepNum = parseInt(step || '1', 10);
  const stepData = STEPS[stepNum - 1];
  const isLast = stepNum >= STEPS.length;

  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  function handleNext() {
    if (isLast) {
      router.replace('/(tabs)');
    } else {
      router.push(`/(auth)/onboarding/${stepNum + 1}` as any);
    }
  }

  function handleOption(idx: number) {
    setSelectedIdx(idx);
    // Last step: navigate immediately on tap (single "Kezdjük" button feel)
    if (isLast) {
      router.replace('/(tabs)');
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress dots */}
      <View style={styles.progress}>
        {STEPS.map((_, i) => (
          <View key={i} style={[styles.dot, i < stepNum && styles.dotActive]} />
        ))}
      </View>

      <Text style={styles.stepNum}>{stepNum} / {STEPS.length}</Text>
      <Text style={styles.question}>{stepData?.q}</Text>

      {/* Options */}
      <View style={styles.options}>
        {stepData?.options.map((opt, i) => {
          const isSelected = selectedIdx === i;
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
      </View>

      {/* Next button — shown for all but last step */}
      {!isLast && (
        <Pressable
          style={[styles.nextBtn, selectedIdx === null && styles.nextBtnDisabled]}
          onPress={handleNext}
          disabled={selectedIdx === null}
        >
          <Text style={styles.nextBtnText}>Tovább →</Text>
        </Pressable>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 24 },
  progress: { flexDirection: 'row', gap: 6, marginBottom: 32, flexWrap: 'wrap' },
  dot: { flex: 1, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, minWidth: 20 },
  dotActive: { backgroundColor: '#4F46E5' },
  stepNum: { fontSize: 13, color: '#9CA3AF', fontWeight: '600', marginBottom: 12 },
  question: { fontSize: 24, fontWeight: '800', color: '#111827', lineHeight: 32, marginBottom: 32 },
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
  optionSelected: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
  },
  optionText: { fontSize: 15, fontWeight: '600', color: '#111827', flex: 1 },
  optionTextSelected: { color: '#4F46E5' },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  checkMark: { color: 'white', fontSize: 13, fontWeight: '700' },
  nextBtn: {
    marginTop: 28,
    backgroundColor: '#4F46E5',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  nextBtnDisabled: {
    backgroundColor: '#C7D2FE',
  },
  nextBtnText: { fontSize: 16, fontWeight: '700', color: 'white' },
});
