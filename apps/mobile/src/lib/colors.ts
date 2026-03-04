/**
 * Design-token color system for Nexpense.
 * Light and dark palettes share the same keys so screens can swap them with
 * a single `useColors()` call — no conditional logic inside components.
 */

const shared = {
  // Brand
  primary:  '#4F46E5',   // indigo-600
  success:  '#10B981',   // emerald-500
  danger:   '#EF4444',   // red-500
  warning:  '#F59E0B',   // amber-500

  // Hero section (always stays dark indigo regardless of color scheme)
  heroBg:      '#4F46E5',
  heroBgCard:  'rgba(255,255,255,0.12)',
  heroText:    'rgba(255,255,255,0.65)',
  heroTextDim: 'rgba(255,255,255,0.7)',

  // Income / expense semantic
  incomeText:  '#10B981',
  expenseText: '#EF4444',
  incomeHero:  '#6EE7B7',
  expenseHero: '#FCA5A5',

  // Impulse card accents (readable on both schemes)
  timerBg:     '#FEF3C7',
  timerText:   '#92400E',
  timerWarnBg: '#FEE2E2',
  timerWarnTx: '#991B1B',
  skipBg:      '#FEE2E2',
  skipTxt:     '#991B1B',
  buyBg:       '#D1FAE5',
  buyTxt:      '#065F46',
  badgeGreen:  '#D1FAE5',
  badgeGreenTx:'#065F46',
  badgeRed:    '#FEE2E2',
  badgeRedTx:  '#991B1B',

  // Always white
  white: '#FFFFFF',
} as const;

export const Colors = {
  light: {
    ...shared,

    // Backgrounds
    bg:      '#F2F2F7',
    card:    '#FFFFFF',
    inputBg: '#F3F4F6',
    overlay: 'rgba(0,0,0,0.45)',

    // Text
    text:      '#111827',
    textSub:   '#6B7280',
    textMuted: '#9CA3AF',

    // Borders
    border:      '#E5E7EB',
    borderLight: '#F3F4F6',
    divider:     '#F3F4F6',

    // Interactive
    pressedBg: '#F9FAFB',

    // Header / Tab bar
    header:        '#FFFFFF',
    tabBar:        '#FFFFFF',
    tabBorder:     '#E5E7EB',
    tabActive:     '#4F46E5',
    tabInactive:   '#9CA3AF',

    // Status bar
    statusBar: 'dark' as const,

    // AI card
    aiCardBg:     '#EEF2FF',
    aiCardBorder: 'rgba(99,102,241,0.2)',
    aiCardText:   '#111827',

    // Period/chart toggle pill
    toggleBg:  '#E5E7EB',
    toggleItem: '#FFFFFF',

    // Swipe delete
    deleteBg: '#EF4444',
  },

  dark: {
    ...shared,

    // Hero section overrides for dark mode
    heroBg:      '#312E81',
    heroBgCard:  'rgba(129,140,248,0.20)',
    heroText:    'rgba(224,231,255,0.75)',
    heroTextDim: 'rgba(224,231,255,0.9)',

    // Backgrounds
    bg:      '#0F0F11',
    card:    '#1C1C1E',
    inputBg: '#2D2D30',
    overlay: 'rgba(0,0,0,0.6)',

    // Text
    text:      '#F9FAFB',
    textSub:   '#9CA3AF',
    textMuted: '#6B7280',

    // Borders
    border:      '#3A3A3C',
    borderLight: '#2D2D30',
    divider:     '#2D2D30',

    // Interactive
    pressedBg: '#2D2D30',

    // Header / Tab bar
    header:        '#1C1C1E',
    tabBar:        '#1C1C1E',
    tabBorder:     '#3A3A3C',
    tabActive:     '#818CF8',   // indigo-400 — more legible on dark bg
    tabInactive:   '#6B7280',

    // Status bar
    statusBar: 'light' as const,

    // AI card
    aiCardBg:     '#1E1B4B',
    aiCardBorder: 'rgba(129,140,248,0.25)',
    aiCardText:   '#E0E7FF',

    // Period/chart toggle pill
    toggleBg:  '#2D2D30',
    toggleItem: '#3A3A3C',

    // Swipe delete
    deleteBg: '#EF4444',
  },
} as const;

export type ColorTokens = typeof Colors.light;
