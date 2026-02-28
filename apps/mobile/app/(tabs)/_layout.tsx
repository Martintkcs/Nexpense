import { Tabs } from 'expo-router';
import { Home, Receipt, BarChart2, Zap, Settings } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#4F46E5',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          borderTopColor: '#E5E7EB',
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
          title: 'Főoldal',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} strokeWidth={1.8} />,
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: 'Kiadások',
          tabBarIcon: ({ color, size }) => <Receipt size={size} color={color} strokeWidth={1.8} />,
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Kimutatások',
          tabBarIcon: ({ color, size }) => <BarChart2 size={size} color={color} strokeWidth={1.8} />,
        }}
      />
      <Tabs.Screen
        name="impulse"
        options={{
          title: 'Impulzus',
          tabBarIcon: ({ color, size }) => <Zap size={size} color={color} strokeWidth={1.8} />,
          tabBarBadge: 2,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Beállítások',
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} strokeWidth={1.8} />,
        }}
      />
    </Tabs>
  );
}
