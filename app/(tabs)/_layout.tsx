import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { SignOutButton } from '@/components/ui/SignOutButton';
import { theme } from '@/constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          paddingTop: 4,
        },
        tabBarLabelStyle: {
          fontFamily: theme.fonts.bodyMedium,
          fontSize: 11,
        },
        headerStyle: {
          backgroundColor: theme.colors.background,
        },
        headerTitleStyle: {
          fontFamily: theme.fonts.heading,
          fontSize: 22,
          color: theme.colors.text,
        },
        headerShadowVisible: false,
        sceneStyle: {
          backgroundColor: theme.colors.background,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trips',
          tabBarIcon: ({ color }) => <Ionicons name="airplane" size={24} color={color} />,
          headerRight: () => <SignOutButton />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color }) => <Ionicons name="map" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="timeline"
        options={{
          title: 'Timeline',
          tabBarIcon: ({ color }) => <Ionicons name="time" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="bucket-list"
        options={{
          title: 'Bucket List',
          tabBarIcon: ({ color }) => <Ionicons name="heart" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
