import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useColors } from '@/lib/useColors';

export default function TabLayout() {
  const colors = useColors();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: {
          borderTopColor: colors.tabBorder,
          backgroundColor: colors.tabBar,
          height: 82,
          paddingTop: 8,
          paddingBottom: 20,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: 'Főoldal',
          title: 'Főoldal',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          tabBarLabel: 'Kiadások',
          title: 'Kiadások',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="receipt-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          tabBarLabel: 'Kimutatások',
          title: 'Kimutatások',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="chart-bar" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="impulse"
        options={{
          tabBarLabel: 'Impulzus',
          title: 'Impulzus',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="lightning-bolt-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarLabel: 'Beállítások',
          title: 'Beállítások',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cog-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
