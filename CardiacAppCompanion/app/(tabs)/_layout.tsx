import { Tabs } from 'expo-router';
import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';

export default function TabLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: 60,
          paddingBottom: 8,
        },
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Live',
          tabBarIcon: ({ color }) => <MaterialIcons name="monitor-heart" size={26} color={color} />,
        }}
      />
      <Tabs.Screen
        name="trends"
        options={{
          title: 'Trends',
          tabBarIcon: ({ color }) => <MaterialIcons name="timeline" size={26} color={color} />,
        }}
      />
      <Tabs.Screen
        name="ode"
        options={{
          title: 'ODE Model',
          tabBarIcon: ({ color }) => <MaterialIcons name="functions" size={26} color={color} />,
        }}
      />
      <Tabs.Screen
        name="feed"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color }) => <MaterialIcons name="notifications-active" size={26} color={color} />,
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: 'Community',
          tabBarIcon: ({ color }) => <MaterialIcons name="groups" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <MaterialIcons name="settings" size={26} color={color} />,
        }}
      />
    </Tabs>
  );
}
