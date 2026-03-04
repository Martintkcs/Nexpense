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

const IMPULSE_NOTIFICATION_DELAY_SECONDS = 24 * 60 * 60;

// ─── Foreground notification handler ─────────────────────────────────────────
// Ezt egyszer kell meghívni (root _layout.tsx-ben), hogy foreground-ban
// is megjelenjenek az értesítések.

export function setupNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
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
  delaySeconds = IMPULSE_NOTIFICATION_DELAY_SECONDS,
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
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: delaySeconds,
      repeats: false,
    },
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
    // SDK 54: projectId olvasása app.config.ts extra.eas.projectId-ből
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId as string | undefined;

    if (!projectId) {
      console.warn('[PushToken] projectId hiányzik a Constants.expoConfig.extra.eas-ból');
      return null;
    }

    console.log('[PushToken] projectId:', projectId);
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    console.log('[PushToken] token:', tokenData.data);
    return tokenData.data;
  } catch (err) {
    // Tipikus okok: szimulátor, nincs hálózat, Expo Go + nincs bejelentkezve
    console.warn('[PushToken] getExpoPushTokenAsync hiba:', err);
    return null;
  }
}
