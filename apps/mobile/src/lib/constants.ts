export const COLORS = {
  primary: '#4F46E5',
  primaryLight: '#818CF8',
  primaryBg: '#EEF2FF',
  success: '#10B981',
  successBg: '#D1FAE5',
  warning: '#F59E0B',
  warningBg: '#FEF3C7',
  danger: '#EF4444',
  dangerBg: '#FEE2E2',
  info: '#3B82F6',

  bg: '#F2F2F7',
  surface: '#FFFFFF',
  surface2: '#F3F4F6',
  border: '#E5E7EB',

  text1: '#111827',
  text2: '#6B7280',
  text3: '#9CA3AF',

  // Kategória színek
  catFood: '#F97316',
  catTransport: '#3B82F6',
  catShopping: '#EC4899',
  catEntertainment: '#8B5CF6',
  catHealth: '#10B981',
  catHousing: '#6366F1',
  catUtil: '#64748B',
  catSub: '#EF4444',
} as const;

export const SYSTEM_CATEGORIES = [
  { id: 'food', name: 'Étel & Ital', name_hu: 'Étel & Ital', icon: '🍽️', color: COLORS.catFood },
  { id: 'transport', name: 'Transport', name_hu: 'Közlekedés', icon: '🚌', color: COLORS.catTransport },
  { id: 'shopping', name: 'Vásárlás', name_hu: 'Vásárlás', icon: '🛍️', color: COLORS.catShopping },
  { id: 'entertainment', name: 'Szórakozás', name_hu: 'Szórakozás', icon: '🎬', color: COLORS.catEntertainment },
  { id: 'health', name: 'Egészség', name_hu: 'Egészség', icon: '💊', color: COLORS.catHealth },
  { id: 'housing', name: 'Lakás', name_hu: 'Lakás & Rezsi', icon: '🏠', color: COLORS.catHousing },
  { id: 'utilities', name: 'Rezsi', name_hu: 'Rezsik', icon: '⚡', color: COLORS.catUtil },
  { id: 'subscriptions', name: 'Előfizetések', name_hu: 'Előfizetések', icon: '🎵', color: COLORS.catSub },
  { id: 'education', name: 'Oktatás', name_hu: 'Oktatás', icon: '📚', color: '#0EA5E9' },
  { id: 'travel', name: 'Utazás', name_hu: 'Utazás', icon: '✈️', color: '#06B6D4' },
  { id: 'personal', name: 'Személyes', name_hu: 'Személyes gondoskodás', icon: '💆', color: '#F472B6' },
  { id: 'gifts', name: 'Ajándékok', name_hu: 'Ajándékok', icon: '🎁', color: '#FB7185' },
  { id: 'savings', name: 'Megtakarítás', name_hu: 'Megtakarítás', icon: '🏦', color: '#34D399' },
  { id: 'other', name: 'Egyéb', name_hu: 'Egyéb', icon: '📦', color: COLORS.text3 },
] as const;

export const DEFAULT_CURRENCY = 'HUF';
export const IMPULSE_WAIT_HOURS = 24;
