import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AdminLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#22C55E',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'index',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="approvals"
        options={{
          title: 'Approvals',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="checkmark-done" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="monitors"
        options={{
          title: 'monitors',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="eye" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="reports"
        options={{
          title: 'reports',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bar-chart" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="users"
        options={{
          title: 'Users',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}