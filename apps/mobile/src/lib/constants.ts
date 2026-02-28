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

/**
 * Rögzített UUID-k a rendszer kategóriákhoz.
 * Ugyanezeket kell használni a DB seed migrációban (0004_seed_categories.sql).
 * Így a fallback és a DB adat mindig ugyanazokat az ID-kat tartalmazza.
 */
export const CAT_IDS = {
  food:          '00000000-0000-0000-0000-000000000001',
  transport:     '00000000-0000-0000-0000-000000000002',
  shopping:      '00000000-0000-0000-0000-000000000003',
  entertainment: '00000000-0000-0000-0000-000000000004',
  health:        '00000000-0000-0000-0000-000000000005',
  housing:       '00000000-0000-0000-0000-000000000006',
  utilities:     '00000000-0000-0000-0000-000000000007',
  subscriptions: '00000000-0000-0000-0000-000000000008',
  education:     '00000000-0000-0000-0000-000000000009',
  travel:        '00000000-0000-0000-0000-000000000010',
  personal:      '00000000-0000-0000-0000-000000000011',
  gifts:         '00000000-0000-0000-0000-000000000012',
  savings:       '00000000-0000-0000-0000-000000000013',
  other:         '00000000-0000-0000-0000-000000000014',
} as const;

export const SYSTEM_CATEGORIES = [
  { id: CAT_IDS.food,          name: 'food',          name_hu: 'Étel & Ital',                 icon: '🍽️',  color: COLORS.catFood },
  { id: CAT_IDS.transport,     name: 'transport',     name_hu: 'Közlekedés',                  icon: '🚌',  color: COLORS.catTransport },
  { id: CAT_IDS.shopping,      name: 'shopping',      name_hu: 'Vásárlás & Ruha',             icon: '🛍️',  color: COLORS.catShopping },
  { id: CAT_IDS.entertainment, name: 'entertainment', name_hu: 'Szórakozás',                  icon: '🎬',  color: COLORS.catEntertainment },
  { id: CAT_IDS.health,        name: 'health',        name_hu: 'Egészség & Gyógyszer',        icon: '💊',  color: COLORS.catHealth },
  { id: CAT_IDS.housing,       name: 'housing',       name_hu: 'Lakás',                       icon: '🏠',  color: COLORS.catHousing },
  { id: CAT_IDS.utilities,     name: 'utilities',     name_hu: 'Rezsik & Számlák',            icon: '⚡',  color: COLORS.catUtil },
  { id: CAT_IDS.subscriptions, name: 'subscriptions', name_hu: 'Előfizetések',                icon: '🎵',  color: COLORS.catSub },
  { id: CAT_IDS.education,     name: 'education',     name_hu: 'Oktatás & Könyvek',           icon: '📚',  color: '#0EA5E9' },
  { id: CAT_IDS.travel,        name: 'travel',        name_hu: 'Utazás & Nyaralás',           icon: '✈️',  color: '#06B6D4' },
  { id: CAT_IDS.personal,      name: 'personal',      name_hu: 'Személyes gondoskodás',       icon: '💆',  color: '#F472B6' },
  { id: CAT_IDS.gifts,         name: 'gifts',         name_hu: 'Ajándékok',                   icon: '🎁',  color: '#FB7185' },
  { id: CAT_IDS.savings,       name: 'savings',       name_hu: 'Megtakarítás',                icon: '🏦',  color: '#34D399' },
  { id: CAT_IDS.other,         name: 'other',         name_hu: 'Egyéb',                       icon: '📦',  color: COLORS.text3 },
] as const;

export const DEFAULT_CURRENCY = 'HUF';
export const IMPULSE_WAIT_HOURS = 24;
