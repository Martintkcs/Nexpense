import { View, Text, ScrollView, Pressable, Switch, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';

export default function SettingsScreen() {
  const [notifications, setNotifications] = useState(true);
  const [location, setLocation] = useState(true);
  const [applePay, setApplePay] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Beállítások</Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* Profile */}
        <View style={styles.card}>
          <View style={styles.profileRow}>
            <View style={styles.avatar}><Text style={styles.avatarText}>KM</Text></View>
            <View>
              <Text style={styles.profileName}>Kis Martin</Text>
              <Text style={styles.profileEmail}>kis.martin@email.com</Text>
            </View>
          </View>
        </View>

        <SettingsSection label="PÉNZÜGYEK">
          <SettingsRow emoji="💰" name="Órabér" value="13 300 Ft / óra" />
          <SettingsRow emoji="💱" name="Deviza" value="Magyar forint (HUF)" />
          <SettingsRow emoji="🎯" name="Havi büdzsé keret" value="150 000 Ft" last />
        </SettingsSection>

        <SettingsSection label="KATEGÓRIÁK & CIMKÉK">
          <SettingsRow emoji="🏷️" name="Kategóriák kezelése" value="14 rendszer + 2 egyedi" />
          <SettingsRow emoji="🔖" name="Cimkék" value="8 aktív cimke" last />
        </SettingsSection>

        <SettingsSection label="ÉRTESÍTÉSEK & INTEGRÁCIÓ">
          <SettingsToggle emoji="🔔" name="Push értesítések" value={notifications} onToggle={setNotifications} />
          <SettingsToggle emoji="📍" name="Helymeghatározás" value={location} onToggle={setLocation} />
          <SettingsToggle emoji="💳" name="Apple Pay észlelés" value={applePay} onToggle={setApplePay} last />
        </SettingsSection>

        <SettingsSection label="MEGJELENÉS">
          <SettingsToggle emoji="🌙" name="Sötét mód" value={darkMode} onToggle={setDarkMode} last />
        </SettingsSection>

        <SettingsSection label="">
          <SettingsRow emoji="🚪" name="Kijelentkezés" danger last />
        </SettingsSection>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingsSection({ label, children }: any) {
  return (
    <View style={styles.section}>
      {label ? <Text style={styles.sectionLabel}>{label}</Text> : null}
      <View style={styles.card}>{children}</View>
    </View>
  );
}

function SettingsRow({ emoji, name, value, last = false, danger = false }: any) {
  return (
    <Pressable style={[styles.row, !last && styles.rowBorder]}>
      <View style={styles.rowIco}><Text>{emoji}</Text></View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowName, danger && { color: '#EF4444' }]}>{name}</Text>
        {value && <Text style={styles.rowValue}>{value}</Text>}
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

function SettingsToggle({ emoji, name, value, onToggle, last = false }: any) {
  return (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <View style={styles.rowIco}><Text>{emoji}</Text></View>
      <Text style={[styles.rowName, { flex: 1 }]}>{name}</Text>
      <Switch value={value} onValueChange={onToggle} trackColor={{ true: '#4F46E5' }} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2F2F7' },
  header: { backgroundColor: 'white', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  title: { fontSize: 22, fontWeight: '700', color: '#111827' },
  content: { padding: 16, gap: 4, paddingBottom: 20 },
  card: { backgroundColor: 'white', borderRadius: 14, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 2 },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#4F46E5', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 20, fontWeight: '700', color: 'white' },
  profileName: { fontSize: 17, fontWeight: '700', color: '#111827' },
  profileEmail: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  section: { gap: 6 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#9CA3AF', letterSpacing: 0.7, paddingHorizontal: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 13, padding: 13 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  rowIco: { width: 32, height: 32, backgroundColor: '#F3F4F6', borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  rowName: { fontSize: 14, fontWeight: '500', color: '#111827' },
  rowValue: { fontSize: 12, color: '#6B7280', marginTop: 1 },
  chevron: { fontSize: 18, color: '#D1D5DB' },
});
