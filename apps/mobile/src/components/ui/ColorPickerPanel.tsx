import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { ColorSlider } from './ColorSlider';
import { useColors } from '@/lib/useColors';

// ─── Constants ─────────────────────────────────────────────────────────────────

const PRESET_COLORS = [
  '#F97316', '#3B82F6', '#EC4899', '#8B5CF6',
  '#10B981', '#6366F1', '#EF4444', '#F59E0B',
  '#06B6D4', '#84CC16', '#64748B', '#FB923C',
];

// ─── Component ─────────────────────────────────────────────────────────────────

interface ColorPickerPanelProps {
  /** The currently selected hex color (controlled from outside) */
  color: string;
  /** Called whenever the user picks a different color */
  onChange: (hex: string) => void;
}

/**
 * Compact color picker:
 * - Shows a single row with the selected color square + "▼" toggle
 * - Tapping reveals an inline panel with preset swatches + optional hue slider
 * - "＋" swatch toggles the custom hue slider
 * - Slider color is remembered independently across preset↔custom switches
 */
export function ColorPickerPanel({ color, onChange }: ColorPickerPanelProps) {
  const colors = useColors();
  const [showPanel, setShowPanel] = useState(false);
  const [showSlider, setShowSlider] = useState(!PRESET_COLORS.includes(color));
  // Persist slider position independently so it's remembered when switching modes
  const [sliderColor, setSliderColor] = useState(color);

  function pickPreset(c: string) {
    onChange(c);
    setShowSlider(false);
  }

  function handleSliderChange(hex: string) {
    setSliderColor(hex);
    onChange(hex);
  }

  function toggleCustom() {
    if (showSlider) {
      setShowSlider(false);
      // Don't change color; user can pick a preset next
    } else {
      setShowSlider(true);
      onChange(sliderColor); // Resume from last slider position
    }
  }

  return (
    <View>
      {/* ── Compact trigger row ── */}
      <Pressable style={[cps.row, { backgroundColor: colors.inputBg, borderColor: colors.border }]} onPress={() => setShowPanel(v => !v)}>
        <Text style={[cps.label, { color: colors.textSub }]}>Szín</Text>
        <View style={[cps.swatch, { backgroundColor: color }]} />
        <Text style={[cps.chevron, { color: colors.textMuted }]}>{showPanel ? '▲' : '▼'}</Text>
      </Pressable>

      {/* ── Expandable panel ── */}
      {showPanel && (
        <View style={[cps.panel, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
          <View style={cps.grid}>
            {PRESET_COLORS.map((c) => (
              <Pressable
                key={c}
                style={[
                  cps.colorSwatch,
                  { backgroundColor: c },
                  color === c && !showSlider && [cps.colorSwatchActive, { borderColor: colors.text }],
                ]}
                onPress={() => pickPreset(c)}
              />
            ))}

            {/* Custom hue slider toggle */}
            <Pressable
              style={[
                cps.colorSwatch,
                cps.colorSwatchCustom,
                { borderColor: colors.border, backgroundColor: colors.pressedBg },
                showSlider && { backgroundColor: sliderColor },
                showSlider && [cps.colorSwatchActive, { borderColor: colors.text }],
              ]}
              onPress={toggleCustom}
            >
              {!showSlider && <Text style={[cps.plus, { color: colors.textSub }]}>＋</Text>}
            </Pressable>
          </View>

          {showSlider && (
            <ColorSlider color={sliderColor} onChange={handleSliderChange} />
          )}
        </View>
      )}
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const cps = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  label:   { flex: 1, fontSize: 14, fontWeight: '500', color: '#374151' },
  swatch:  { width: 26, height: 26, borderRadius: 7 },
  chevron: { fontSize: 11, color: '#9CA3AF', marginLeft: 8 },

  panel: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
    marginTop: 4,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  grid:             { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  colorSwatch:      { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  colorSwatchActive:{ borderWidth: 2.5, borderColor: '#111827', transform: [{ scale: 1.15 }] },
  colorSwatchCustom:{ borderWidth: 1.5, borderColor: '#D1D5DB', backgroundColor: '#F3F4F6' },
  plus:             { fontSize: 16, color: '#6B7280' },
});
