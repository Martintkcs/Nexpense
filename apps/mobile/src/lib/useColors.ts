import { useSettingsStore } from '@/stores/settingsStore';
import { Colors } from '@/lib/colors';

export function useColors() {
  const darkMode = useSettingsStore((s) => s.darkMode);
  return darkMode ? Colors.dark : Colors.light;
}

export function useIsDarkMode() {
  return useSettingsStore((s) => s.darkMode);
}

