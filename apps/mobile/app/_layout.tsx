import '../global.css';
import { useEffect, useRef } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { QueryProvider } from '@/providers/QueryProvider';
import { AuthProvider } from '@/providers/AuthProvider';
import { setupNotificationHandler, getExpoPushToken } from '@/services/notifications';
import { savePushToken } from '@/services/supabase/pushTokens';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAuth } from '@/providers/AuthProvider';

/** Bejelentkezés után szinkronizálja a push tokent ha értesítések be vannak kapcsolva */
function NotificationAutoRegister() {
  const { user } = useAuth();
  const { notificationsEnabled } = useSettingsStore();

  useEffect(() => {
    if (!user || !notificationsEnabled) return;
    // Megpróbálja lekérni az Expo push tokent és menteni DB-be
    // Expo Go-ban graceful skip (projectId nincs beállítva)
    getExpoPushToken().then(token => {
      if (token) {
        savePushToken(user.id, token, Platform.OS).catch(() => {});
      }
    });
  }, [user?.id]);

  return null;
}

// Értesítés megjelenítési logika (foreground) – egyszer kell beállítani
setupNotificationHandler();

export default function RootLayout() {
  const notificationListener = useRef<Notifications.EventSubscription>();
  const responseListener = useRef<Notifications.EventSubscription>();

  useEffect(() => {
    // Felhasználó rányomott egy értesítésre → navigáció
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data as Record<string, string>;
      if (data?.screen === 'impulse') {
        router.push('/(tabs)/impulse');
      }
    });

    // Értesítés beérkezett (app előtérben) – opcionálisan kezelhetjük
    notificationListener.current = Notifications.addNotificationReceivedListener(_n => {});

    return () => {
      responseListener.current?.remove();
      notificationListener.current?.remove();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryProvider>
        <AuthProvider>
          <NotificationAutoRegister />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="modals/quick-add" options={{ presentation: 'modal' }} />
            <Stack.Screen name="modals/apple-pay-detected" options={{ presentation: 'modal' }} />
            <Stack.Screen name="modals/ai-chat" options={{ presentation: 'fullScreenModal' }} />
          </Stack>
          <StatusBar style="auto" />
        </AuthProvider>
      </QueryProvider>
    </GestureHandlerRootView>
  );
}
