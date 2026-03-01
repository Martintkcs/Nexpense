/**
 * Nexpense – Push & Local értesítés kezelő
 *
 * Két réteg:
 *  1. Lokális ütemezés  (Expo Notifications, Expo Go-ban is működik)
 *  2. Expo push token   (csak EAS Build esetén – graceful fallback ha nincs projectId)
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// ─── Foreground notification handler ─────────────────────────────────────────
// Ezt egyszer kell meghívni (root _layout.tsx-ben), hogy foreground-ban
// is megjelenjenek az értesítések.

export function setupNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

// ─── Android channel ──────────────────────────────────────────────────────────

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('impulse', {
    name: 'Impulzus emlékeztetők',
    description: '24 óra elteltével emlékeztet az impulzusvásárlásra',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#4F46E5',
  });
}

// ─── Permission request ───────────────────────────────────────────────────────

export async function requestNotificationPermission(): Promise<boolean> {
  await ensureAndroidChannel();

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function getNotificationPermissionStatus(): Promise<'granted' | 'denied' | 'undetermined'> {
  const { status } = await Notifications.getPermissionsAsync();
  return status as 'granted' | 'denied' | 'undetermined';
}

// ─── Lokális értesítés ütemezés ───────────────────────────────────────────────

/**
 * Ütemez egy lokális értesítést az impulzus tétel 24 órás lejártára.
 * @returns Az ütemezett értesítés azonosítója (törlésnél szükséges)
 */
export async function scheduleImpulseNotification(
  itemId: string,
  itemName: string,
  delaySeconds = 24 * 60 * 60,
): Promise<string> {
  await ensureAndroidChannel();

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: '⚡ Impulzus döntés vár!',
      body: `24 óra telt el. Még mindig kell a(z) ${itemName}?`,
      data: { screen: 'impulse', impulseItemId: itemId },
      sound: true,
      ...(Platform.OS === 'android' ? { channelId: 'impulse' } : {}),
    },
    trigger: {
      seconds: delaySeconds,
      repeats: false,
    } as Notifications.TimeIntervalTriggerInput,
  });

  return notificationId;
}

/**
 * Töröl egy korábban ütemezett értesítést (pl. ha a user döntést hozott).
 */
export async function cancelScheduledNotification(notificationId: string) {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

/**
 * Az összes Nexpense lokális értesítést törli (pl. értesítések kikapcsolásakor).
 */
export async function cancelAllScheduledNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// ─── Expo push token (EAS Build esetén) ──────────────────────────────────────

/**
 * Megpróbálja lekérni az Expo push token-t.
 * Ha nincs EAS projectId beállítva (Expo Go fejlesztés), null-t ad vissza.
 */
export async function getExpoPushToken(): Promise<string | null> {
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId || projectId === 'REPLACE_WITH_YOUR_EAS_PROJECT_ID') {
      // Expo Go fejlesztési módban nincs EAS token – nem hiba, csak nem elérhető
      return null;
    }
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    return tokenData.data;
  } catch {
    return null;
  }
}
