import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsState {
  currency: string;
  hourlyWage: number | null;
  notificationsEnabled: boolean;
  locationEnabled: boolean;
  applePayDetectionEnabled: boolean;
  darkMode: boolean;
  onboardingCompleted: boolean;

  setCurrency: (currency: string) => void;
  setHourlyWage: (wage: number | null) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setLocationEnabled: (enabled: boolean) => void;
  setApplePayDetectionEnabled: (enabled: boolean) => void;
  setDarkMode: (dark: boolean) => void;
  setOnboardingCompleted: (completed: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      currency: 'HUF',
      hourlyWage: null,
      notificationsEnabled: false,
      locationEnabled: false,
      applePayDetectionEnabled: false,
      darkMode: false,
      onboardingCompleted: false,

      setCurrency: (currency) => set({ currency }),
      setHourlyWage: (hourlyWage) => set({ hourlyWage }),
      setNotificationsEnabled: (notificationsEnabled) => set({ notificationsEnabled }),
      setLocationEnabled: (locationEnabled) => set({ locationEnabled }),
      setApplePayDetectionEnabled: (applePayDetectionEnabled) => set({ applePayDetectionEnabled }),
      setDarkMode: (darkMode) => set({ darkMode }),
      setOnboardingCompleted: (onboardingCompleted) => set({ onboardingCompleted }),
    }),
    {
      name: 'nexpense-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
