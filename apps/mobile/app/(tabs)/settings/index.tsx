import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, Pressable, Switch,
  StyleSheet, Alert, TextInput, Modal, ActivityIndicator,
  KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/providers/AuthProvider';
import { useProfile } from '@/hooks/useProfile';
import { useSettingsStore } from '@/stores/settingsStore';
import {
  requestNotificationPermission,
  getNotificationPermissionStatus,
  cancelAllScheduledNotifications,
  getExpoPushToken,
} from '@/services/notifications';
import { savePushToken, deactivateAllPushTokens } from '@/services/supabase/pushTokens';

// ─── Currency options ──────────────────────────────────────────────────────────

const CURRENCIES = [
  { code: 'HUF', label: 'Magyar forint (HUF)', symbol: 'Ft' },
  { code: 'EUR', label: 'Euró (EUR)',           symbol: '€' },
  { code: 'USD', label: 'Dollár (USD)',          symbol: '$' },
];

// ─── Screen ────────────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const { profile, isLoading: profileLoading, updateProfile, isUpdating } = useProfile();

  const {
    currency, setCurrency,
    hourlyWage, setHourlyWage,
    notificationsEnabled, setNotificationsEnabled,
    locationEnabled,      setLocationEnabled,
    applePayDetectionEnabled, setApplePayDetectionEnabled,
    darkMode, setDarkMode,
  } = useSettingsStore();

  // ── OS permission ↔ store szinkronizáció ─────────────────
  // Ha az OS visszavonta az engedélyt (pl. rendszerbeállításokban), a toggle is frissül.
  useEffect(() => {
    getNotificationPermissionStatus().then(status => {
      if (status !== 'granted' && notificationsEnabled) {
        setNotificationsEnabled(false);
      }
    });
  }, []);

  // ── Notification toggle handler ───────────────────────────
  const [notifLoading, setNotifLoading] = useState(false);

  async function handleNotificationToggle(enabled: boolean) {
    if (notifLoading) return;
    setNotifLoading(true);
    try {
      if (enabled) {
        // Engedélyt kérünk
        const granted = await requestNotificationPermission();
        if (!granted) {
          // Korábban megtagadták → rendszerbeállításokba irányítjuk
          Alert.alert(
            'Értesítések letiltva',
            'Az értesítések engedélyezéséhez menj a Beállítások → Nexpense menüpontba.',
            [
              { text: 'Mégse', style: 'cancel' },
              { text: 'Beállítások megnyitása', onPress: () => Linking.openSettings() },
            ],
          );
          return; // store-t nem frissítjük
        }
        setNotificationsEnabled(true);
        // Expo push token mentése DB-be (EAS Build esetén működik, Expo Go-ban graceful skip)
        const token = await getExpoPushToken();
        if (token && user) {
          await savePushToken(user.id, token, Platform.OS).catch(() => {});
        }
      } else {
        // Kikapcsolás: lokális értesítések törlése + DB token deaktiválás
        setNotificationsEnabled(false);
        await cancelAllScheduledNotifications();
        if (user) {
          await deactivateAllPushTokens(user.id).catch(() => {});
        }
      }
    } finally {
      setNotifLoading(false);
    }
  }

  // ── Wage modal state ──────────────────────────────────────
  const [wageModal, setWageModal]   = useState(false);
  const [wageInput, setWageInput]   = useState('');

  // ── Currency modal state ──────────────────────────────────
  const [currencyModal, setCurrencyModal] = useState(false);

  // ── Derived display values ────────────────────────────────
  const displayName =
    (profile?.display_name as string | undefined) ??
    (user?.user_metadata?.display_name as string | undefined) ??
    'Felhasználó';
  const email   = user?.email ?? '';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((w: string) => w[0].toUpperCase())
    .join('')
    .slice(0, 2);

  const wageLabel    = hourlyWage
    ? `${hourlyWage.toLocaleString('hu-HU')} Ft / óra`
    : 'Nincs beállítva';
  const currencyLabel = CURRENCIES.find(c => c.code === currency)?.label ?? currency;

  // ── Handlers ──────────────────────────────────────────────

  function openWageModal() {
    setWageInput(hourlyWage?.toString() ?? '');
    setWageModal(true);
  }

  async function handleSaveWage() {
    const parsed = parseFloat(wageInput.replace(',', '.'));
    if (isNaN(parsed) || parsed <= 0) {
      Alert.alert('Hibás érték', 'Adj meg érvényes órabért (pl. 2500)!');
      return;
    }
    try {
      await updateProfile({ hourly_wage: parsed });
      setHourlyWage(parsed);
      setWageModal(false);
    } catch {
      Alert.alert('Hiba', 'Nem sikerült menteni. Próbáld újra!');
    }
  }

  async function handleSelectCurrency(code: string) {
    setCurrency(code);
    setCurrencyModal(false);
    try {
      await updateProfile({ currency: code });
    } catch {
      // silent – local store already updated, next profile fetch will reconcile
    }
  }

  function handleSignOut() {
    Alert.alert(
      'Kijelentkezés',
      'Biztosan ki szeretnél jelentkezni?',
      [
        { text: 'Mégse', style: 'cancel' },
        { text: 'Kijelentkezés', style: 'destructive', onPress: signOut },
      ],
    );
  }

  // ── Render ────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Beállítások</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* ── Profil kártya ── */}
        <View style={styles.card}>
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              {profileLoading
                ? <ActivityIndicator color="white" />
                : <Text style={styles.avatarText}>{initials || '?'}</Text>
              }
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.profileName}>{displayName}</Text>
              <Text style={styles.profileEmail}>{email}</Text>
            </View>
          </View>
        </View>

        {/* ── Pénzügyek ── */}
        <SettingsSection label="PÉNZÜGYEK">
          <SettingsRow
            emoji="💰"
            name="Órabér"
            value={wageLabel}
            onPress={openWageModal}
          />
          <SettingsRow
            emoji="💱"
            name="Deviza"
            value={currencyLabel}
            onPress={() => setCurrencyModal(true)}
            last
          />
        </SettingsSection>

        {/* ── Értesítések ── */}
        <SettingsSection label="ÉRTESÍTÉSEK & INTEGRÁCIÓ">
          <SettingsToggle
            emoji="🔔"
            name="Push értesítések"
            value={notificationsEnabled}
            onToggle={handleNotificationToggle}
            loading={notifLoading}
          />
          <SettingsToggle
            emoji="📍"
            name="Helymeghatározás"
            value={locationEnabled}
            onToggle={setLocationEnabled}
          />
          <SettingsToggle
            emoji="💳"
            name="Apple Pay észlelés"
            value={applePayDetectionEnabled}
            onToggle={setApplePayDetectionEnabled}
            last
          />
        </SettingsSection>

        {/* ── Megjelenés ── */}
        <SettingsSection label="MEGJELENÉS">
          <SettingsToggle
            emoji="🌙"
            name="Sötét mód"
            value={darkMode}
            onToggle={setDarkMode}
            last
          />
        </SettingsSection>

        {/* ── Fiók ── */}
        <SettingsSection label="FIÓK">
          <SettingsRow
            emoji="🚪"
            name="Kijelentkezés"
            danger
            onPress={handleSignOut}
            last
          />
        </SettingsSection>

        <Text style={styles.version}>Nexpense v0.1.0</Text>
      </ScrollView>

      {/* ════ Órabér modal (centered, keyboard-aware) ════ */}
      <Modal visible={wageModal} transparent animationType="fade" statusBarTranslucent>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableWithoutFeedback onPress={() => { Keyboard.dismiss(); setWageModal(false); }}>
            <View style={styles.overlayCenter}>
              <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
                <View style={styles.wageCard}>
                  <Text style={styles.sheetTitle}>Órabér beállítása</Text>
                  <Text style={styles.sheetHint}>
                    Az impulzus kalkulátor ezzel számolja meg, hány munkaórát ér egy vásárlás.
                  </Text>

                  <View style={styles.wageRow}>
                    <TextInput
                      style={styles.wageInput}
                      value={wageInput}
                      onChangeText={setWageInput}
                      keyboardType="numeric"
                      placeholder="pl. 2500"
                      placeholderTextColor="#9CA3AF"
                      autoFocus
                      selectTextOnFocus
                    />
                    <Text style={styles.wageUnit}>Ft / óra</Text>
                  </View>

                  <View style={styles.sheetActions}>
                    <Pressable style={styles.cancelBtn} onPress={() => setWageModal(false)}>
                      <Text style={styles.cancelTxt}>Mégse</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.saveBtn, isUpdating && { opacity: 0.65 }]}
                      onPress={handleSaveWage}
                      disabled={isUpdating}
                    >
                      {isUpdating
                        ? <ActivityIndicator color="white" size="small" />
                        : <Text style={styles.saveTxt}>Mentés</Text>
                      }
                    </Pressable>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      {/* ════ Deviza modal ════ */}
      <Modal visible={currencyModal} transparent animationType="slide" statusBarTranslucent>
        <Pressable style={styles.overlay} onPress={() => setCurrencyModal(false)}>
          <Pressable style={styles.sheet} onPress={e => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Deviza választás</Text>
            {CURRENCIES.map((c, i) => {
              const active = c.code === currency;
              return (
                <Pressable
                  key={c.code}
                  style={[
                    styles.currencyRow,
                    i < CURRENCIES.length - 1 && styles.currencyRowBorder,
                    active && styles.currencyRowActive,
                  ]}
                  onPress={() => handleSelectCurrency(c.code)}
                >
                  <Text style={styles.currencySymbol}>{c.symbol}</Text>
                  <Text style={[styles.currencyLabel, active && styles.currencyLabelActive]}>
                    {c.label}
                  </Text>
                  {active && <Text style={styles.currencyCheck}>✓</Text>}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function SettingsSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      {label ? <Text style={styles.sectionLabel}>{label}</Text> : null}
      <View style={styles.card}>{children}</View>
    </View>
  );
}

function SettingsRow({
  emoji, name, value, last = false, danger = false, onPress,
}: {
  emoji: string;
  name: string;
  value?: string;
  last?: boolean;
  danger?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        !last && styles.rowBorder,
        pressed && { backgroundColor: '#F9FAFB' },
      ]}
      onPress={onPress}
    >
      <View style={[styles.rowIcon, danger && { backgroundColor: '#FEE2E2' }]}>
        <Text>{emoji}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowName, danger && { color: '#EF4444' }]}>{name}</Text>
        {value ? <Text style={styles.rowValue}>{value}</Text> : null}
      </View>
      {onPress && <Text style={styles.chevron}>›</Text>}
    </Pressable>
  );
}

function SettingsToggle({
  emoji, name, value, onToggle, last = false, loading = false,
}: {
  emoji: string;
  name: string;
  value: boolean;
  onToggle: (v: boolean) => void;
  last?: boolean;
  loading?: boolean;
}) {
  return (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <View style={styles.rowIcon}><Text>{emoji}</Text></View>
      <Text style={[styles.rowName, { flex: 1 }]}>{name}</Text>
      {loading
        ? <ActivityIndicator size="small" color="#4F46E5" />
        : (
          <Switch
            value={value}
            onValueChange={onToggle}
            trackColor={{ false: '#E5E7EB', true: '#4F46E5' }}
            thumbColor="white"
            ios_backgroundColor="#E5E7EB"
          />
        )
      }
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: '#F2F2F7' },
  header:  { backgroundColor: 'white', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  title:   { fontSize: 22, fontWeight: '700', color: '#111827' },
  content: { padding: 16, paddingBottom: 40 },

  // Card wrapper
  card: {
    backgroundColor: 'white',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },

  // Profile
  profileRow:   { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  avatar:       { width: 52, height: 52, borderRadius: 26, backgroundColor: '#4F46E5', alignItems: 'center', justifyContent: 'center' },
  avatarText:   { fontSize: 20, fontWeight: '700', color: 'white' },
  profileName:  { fontSize: 16, fontWeight: '700', color: '#111827' },
  profileEmail: { fontSize: 13, color: '#6B7280', marginTop: 2 },

  // Section
  section:      { marginTop: 20 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#9CA3AF', letterSpacing: 0.8, paddingHorizontal: 4, marginBottom: 6 },

  // Row
  row:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingHorizontal: 14 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  rowIcon:   { width: 32, height: 32, backgroundColor: '#F3F4F6', borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  rowName:   { fontSize: 14, fontWeight: '500', color: '#111827' },
  rowValue:  { fontSize: 12, color: '#6B7280', marginTop: 1 },
  chevron:   { fontSize: 20, color: '#D1D5DB' },

  version: { fontSize: 11, color: '#D1D5DB', textAlign: 'center', marginTop: 28 },

  // Modal shared (bottom-sheet style for currency)
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 48,
    gap: 14,
  },
  sheetHandle: { width: 36, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginBottom: 4 },
  sheetTitle:  { fontSize: 18, fontWeight: '700', color: '#111827' },
  sheetHint:   { fontSize: 13, color: '#6B7280', lineHeight: 20, marginTop: -4 },

  // Wage modal — centered card so keyboard doesn't cover the input
  overlayCenter: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  wageCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },

  wageRow:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 14 },
  wageInput: { flex: 1, fontSize: 22, fontWeight: '600', color: '#111827', paddingVertical: 14 },
  wageUnit:  { fontSize: 14, color: '#6B7280', fontWeight: '500' },

  sheetActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn:    { flex: 1, backgroundColor: '#F3F4F6', borderRadius: 12, padding: 14, alignItems: 'center' },
  cancelTxt:    { fontSize: 15, fontWeight: '600', color: '#374151' },
  saveBtn:      { flex: 2, backgroundColor: '#4F46E5', borderRadius: 12, padding: 14, alignItems: 'center' },
  saveTxt:      { fontSize: 15, fontWeight: '700', color: 'white' },

  // Currency modal
  currencyRow:        { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  currencyRowBorder:  { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  currencyRowActive:  { backgroundColor: '#EEF2FF', marginHorizontal: -8, paddingHorizontal: 8, borderRadius: 10 },
  currencySymbol:     { width: 28, fontSize: 16, fontWeight: '700', color: '#4F46E5', textAlign: 'center' },
  currencyLabel:      { flex: 1, fontSize: 15, fontWeight: '500', color: '#111827' },
  currencyLabelActive:{ color: '#4F46E5' },
  currencyCheck:      { fontSize: 16, color: '#4F46E5', fontWeight: '700' },
});
