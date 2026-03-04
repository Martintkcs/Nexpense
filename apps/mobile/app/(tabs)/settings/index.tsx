import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, Pressable, Switch,
  StyleSheet, Alert, ActivityIndicator,
  Platform, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import { useProfile } from '@/hooks/useProfile';
import { useSettingsStore } from '@/stores/settingsStore';
import { useColors } from '@/lib/useColors';
import {
  requestNotificationPermission,
  getNotificationPermissionStatus,
  cancelAllScheduledNotifications,
  getExpoPushToken,
} from '@/services/notifications';
import { savePushToken, deactivateAllPushTokens } from '@/services/supabase/pushTokens';

// ─── Screen ────────────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const colors = useColors();
  const { user, signOut } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile();

  const {
    notificationsEnabled, setNotificationsEnabled,
    locationEnabled,      setLocationEnabled,
    applePayDetectionEnabled, setApplePayDetectionEnabled,
    darkMode, setDarkMode,
  } = useSettingsStore();

  // ── OS permission ↔ store szinkronizáció ─────────────────
  useEffect(() => {
    getNotificationPermissionStatus().then(status => {
      if (status === 'granted' && !notificationsEnabled) {
        setNotificationsEnabled(true);
      } else if (status !== 'granted' && notificationsEnabled) {
        setNotificationsEnabled(false);
      }
    });
  }, []);

  // ── Notification toggle ───────────────────────────────────
  const [notifLoading, setNotifLoading] = useState(false);

  async function handleNotificationToggle(enabled: boolean) {
    if (notifLoading) return;
    setNotifLoading(true);
    try {
      if (enabled) {
        const granted = await requestNotificationPermission();
        if (!granted) {
          Alert.alert(
            'Értesítések letiltva',
            'Az értesítések engedélyezéséhez menj a Beállítások → Nexpense menüpontba.',
            [
              { text: 'Mégse', style: 'cancel' },
              { text: 'Beállítások megnyitása', onPress: () => Linking.openSettings() },
            ],
          );
          return;
        }
        setNotificationsEnabled(true);
        const token = await getExpoPushToken();
        if (token && user) {
          await savePushToken(user.id, token, Platform.OS).catch(() => {});
        }
      } else {
        setNotificationsEnabled(false);
        await cancelAllScheduledNotifications();
        if (user) await deactivateAllPushTokens(user.id).catch(() => {});
      }
    } finally {
      setNotifLoading(false);
    }
  }

  // ── Derived values ────────────────────────────────────────
  const displayName =
    (profile?.display_name as string | undefined) ??
    (user?.user_metadata?.display_name as string | undefined) ??
    'Felhasználó';
  const email    = user?.email ?? '';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((w: string) => w[0].toUpperCase())
    .join('')
    .slice(0, 2);

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
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.header, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Beállítások</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* ── Profil kártya ── */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              {profileLoading
                ? <ActivityIndicator color="white" />
                : <Text style={styles.avatarText}>{initials || '?'}</Text>
              }
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.profileName, { color: colors.text }]}>{displayName}</Text>
              <Text style={[styles.profileEmail, { color: colors.textSub }]}>{email}</Text>
            </View>
          </View>
        </View>

        {/* ── Pénzügyek ── */}
        <SettingsSection label="PÉNZÜGYEK">
          <SettingsRow
            emoji="💰"
            name="Pénzügyek"
            onPress={() => router.push('/(tabs)/settings/finance')}
            last
          />
        </SettingsSection>

        {/* ── Kategóriák ── */}
        <SettingsSection label="KATEGÓRIÁK">
          <SettingsRow
            emoji="🏷️"
            name="Kategóriák kezelése"
            onPress={() => router.push('/(tabs)/settings/categories')}
            last
          />
        </SettingsSection>

        {/* ── Címkék ── */}
        <SettingsSection label="CIMKÉK">
          <SettingsRow
            emoji="🔖"
            name="Cimkék kezelése"
            onPress={() => router.push('/(tabs)/settings/labels')}
            last
          />
        </SettingsSection>

        {/* ── Sablonok ── */}
        <SettingsSection label="SABLONOK">
          <SettingsRow
            emoji="📋"
            name="Sablonok kezelése"
            onPress={() => router.push('/(tabs)/settings/templates')}
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

        <Text style={[styles.version, { color: colors.textMuted }]}>Nexpense v0.1.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function SettingsSection({ label, children }: { label: string; children: React.ReactNode }) {
  const colors = useColors();
  return (
    <View style={styles.section}>
      {label ? <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>{label}</Text> : null}
      <View style={[styles.card, { backgroundColor: colors.card }]}>{children}</View>
    </View>
  );
}

function SettingsRow({
  emoji, name, value, last = false, danger = false, onPress,
}: {
  emoji: string; name: string; value?: string;
  last?: boolean; danger?: boolean; onPress?: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        !last && [styles.rowBorder, { borderBottomColor: colors.borderLight }],
        { backgroundColor: pressed ? colors.pressedBg : colors.card },
      ]}
    >
      {/* inner View carries flexDirection: 'row' — more reliable than Pressable style */}
      <View style={styles.row}>
        <View style={[styles.rowIcon, { backgroundColor: colors.inputBg }, danger && { backgroundColor: '#FEE2E2' }]}>
          <Text>{emoji}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.rowName, { color: colors.text }, danger && { color: colors.danger }]}>{name}</Text>
          {value ? <Text style={[styles.rowValue, { color: colors.textSub }]}>{value}</Text> : null}
        </View>
        {onPress && <Text style={[styles.chevron, { color: colors.textMuted }]}>›</Text>}
      </View>
    </Pressable>
  );
}

function SettingsToggle({
  emoji, name, value, onToggle, last = false, loading = false,
}: {
  emoji: string; name: string; value: boolean;
  onToggle: (v: boolean) => void; last?: boolean; loading?: boolean;
}) {
  const colors = useColors();
  return (
    <View style={!last && [styles.rowBorder, { borderBottomColor: colors.borderLight }]}>
      <View style={styles.row}>
        <View style={[styles.rowIcon, { backgroundColor: colors.inputBg }]}><Text>{emoji}</Text></View>
        <Text style={[styles.rowName, { flex: 1, color: colors.text }]}>{name}</Text>
        {loading
          ? <ActivityIndicator size="small" color={colors.primary} />
          : (
            <Switch
              value={value}
              onValueChange={onToggle}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="white"
              ios_backgroundColor={colors.border}
            />
          )
        }
      </View>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: '#F2F2F7' },
  header:  { backgroundColor: 'white', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  title:   { fontSize: 22, fontWeight: '700', color: '#111827' },
  content: { padding: 16, paddingBottom: 40 },

  card: {
    backgroundColor: 'white', borderRadius: 14, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 2,
  },

  profileRow:   { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  avatar:       { width: 52, height: 52, borderRadius: 26, backgroundColor: '#4F46E5', alignItems: 'center', justifyContent: 'center' },
  avatarText:   { fontSize: 20, fontWeight: '700', color: 'white' },
  profileName:  { fontSize: 16, fontWeight: '700', color: '#111827' },
  profileEmail: { fontSize: 13, color: '#6B7280', marginTop: 2 },

  section:      { marginTop: 20 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#9CA3AF', letterSpacing: 0.8, paddingHorizontal: 4, marginBottom: 6 },

  row:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingHorizontal: 14 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  rowIcon:   { width: 32, height: 32, backgroundColor: '#F3F4F6', borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  rowName:   { fontSize: 14, fontWeight: '500', color: '#111827' },
  rowValue:  { fontSize: 12, color: '#6B7280', marginTop: 1 },
  chevron:   { fontSize: 20, color: '#D1D5DB' },

  version: { fontSize: 11, color: '#D1D5DB', textAlign: 'center', marginTop: 28 },
});
