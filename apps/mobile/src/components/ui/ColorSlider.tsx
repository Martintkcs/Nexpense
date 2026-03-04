import { useRef, useState } from 'react';
import {
  View, TextInput, PanResponder, StyleSheet,
  Text, type LayoutChangeEvent,
} from 'react-native';
import { useColors } from '@/lib/useColors';

// ─── Color math ────────────────────────────────────────────────────────────────

function hslToHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return '#' + [f(0), f(8), f(4)]
    .map((x) => Math.round(x * 255).toString(16).padStart(2, '0'))
    .join('');
}

function hexToHue(hex: string): number {
  if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) return 220;
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  if (max === min) return 220;
  const d = max - min;
  let h = 0;
  if (max === r)      h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else                h = (r - g) / d + 4;
  return Math.round(((h * 60) + 360) % 360);
}

// ─── Constants ─────────────────────────────────────────────────────────────────

/** 36 segments covering the full hue wheel */
const GRADIENT = Array.from({ length: 36 }, (_, i) => hslToHex(i * 10, 80, 54));
const THUMB_SIZE = 24;
const TRACK_H    = 36;
const FIXED_S    = 80;
const FIXED_L    = 54;

// ─── Component ─────────────────────────────────────────────────────────────────

interface ColorSliderProps {
  color: string;
  onChange: (hex: string) => void;
}

export function ColorSlider({ color, onChange }: ColorSliderProps) {
  const colors = useColors();
  const [hue, setHue]         = useState(() => hexToHue(color));
  const [hexText, setHexText] = useState(() => color.toUpperCase().replace(/^(?!#)/, '#'));
  const [trackW, setTrackW]   = useState(280);

  const trackRef      = useRef<View>(null);
  const trackWRef     = useRef(280);
  const trackPageXRef = useRef(0);

  function applyRatio(ratio: number) {
    const h   = Math.round(Math.max(0, Math.min(1, ratio)) * 360);
    const hex = hslToHex(h, FIXED_S, FIXED_L);
    setHue(h);
    setHexText(hex.toUpperCase());
    onChange(hex);
  }

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,
      onPanResponderGrant: (e) => {
        applyRatio(e.nativeEvent.locationX / trackWRef.current);
      },
      onPanResponderMove: (_e, gs) => {
        applyRatio((gs.moveX - trackPageXRef.current) / trackWRef.current);
      },
    }),
  ).current;

  function onTrackLayout(e: LayoutChangeEvent) {
    const width = e.nativeEvent.layout.width;
    trackWRef.current = width;
    setTrackW(width);
    // Measure pageX for accurate moveX → ratio conversion
    trackRef.current?.measure((_x, _y, _w, _h, pageX) => {
      trackPageXRef.current = pageX;
    });
  }

  const thumbLeft     = Math.max(0, Math.min((hue / 360) * (trackW - THUMB_SIZE), trackW - THUMB_SIZE));
  const previewColor  = hslToHex(hue, FIXED_S, FIXED_L);

  return (
    <View style={cs.wrapper}>

      {/* ── Rainbow track ── */}
      <View
        ref={trackRef}
        style={cs.track}
        onLayout={onTrackLayout}
        {...pan.panHandlers}
      >
        {/* Gradient segments */}
        <View style={cs.gradient} pointerEvents="none">
          {GRADIENT.map((c, i) => (
            <View key={i} style={{ flex: 1, backgroundColor: c }} />
          ))}
        </View>

        {/* Thumb */}
        <View
          style={[cs.thumb, { left: thumbLeft, backgroundColor: previewColor }]}
          pointerEvents="none"
        />
      </View>

      {/* ── Preview swatch + hex input ── */}
      <View style={cs.hexRow}>
        <View style={[cs.preview, { backgroundColor: previewColor, borderColor: colors.border }]} />
        <Text style={[cs.hash, { color: colors.textSub }]}>#</Text>
        <TextInput
          style={[cs.hexInput, { backgroundColor: colors.card, color: colors.text }]}
          value={hexText.replace('#', '')}
          onChangeText={(t) => {
            const cleaned = t.toUpperCase().replace(/[^0-9A-F]/g, '').slice(0, 6);
            setHexText(cleaned);
            const full = '#' + cleaned;
            if (/^#[0-9A-Fa-f]{6}$/.test(full)) {
              setHue(hexToHue(full));
              onChange(full);
            }
          }}
          maxLength={6}
          autoCapitalize="characters"
          autoCorrect={false}
          returnKeyType="done"
          placeholder="RRGGBB"
          placeholderTextColor={colors.textMuted}
        />
      </View>

    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const cs = StyleSheet.create({
  wrapper: { gap: 10 },

  track: {
    height: TRACK_H,
    borderRadius: TRACK_H / 2,
    position: 'relative',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    borderRadius: TRACK_H / 2,
    overflow: 'hidden',
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    top: (TRACK_H - THUMB_SIZE) / 2,
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 5,
  },

  hexRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  preview:  { width: 32, height: 32, borderRadius: 8, borderWidth: 1 },
  hash:     { fontSize: 15, fontWeight: '700', color: '#374151' },
  hexInput: {
    flex: 1, height: 38,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 10,
    fontSize: 14, fontWeight: '600', color: '#111827',
    letterSpacing: 1.5,
  },
});
