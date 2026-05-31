import { Ionicons } from '@expo/vector-icons';
import { Tabs, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function AdminLayout() {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/(auth)/login');
        return;
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (profile?.role !== 'admin') {
        router.replace('/(auth)/login');
        return;
      }
      setChecking(false);
    })();
  }, []);

  if (checking) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#22C55E" />
      </View>
    );
  }

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

// import { Tabs } from 'expo-router';
// import { Ionicons } from '@expo/vector-icons';

// export default function AdminLayout() {
//   return (
//     <Tabs
//       screenOptions={{
//         headerShown: false,
//         tabBarActiveTintColor: '#22C55E',
//       }}
//     >
//       <Tabs.Screen
//         name="index"
//         options={{
//           title: 'index',
//           tabBarIcon: ({ color, size }) => (
//             <Ionicons name="grid" size={size} color={color} />
//           ),
//         }}
//       />

//       <Tabs.Screen
//         name="approvals"
//         options={{
//           title: 'Approvals',
//           tabBarIcon: ({ color, size }) => (
//             <Ionicons name="checkmark-done" size={size} color={color} />
//           ),
//         }}
//       />

//       <Tabs.Screen
//         name="monitors"
//         options={{
//           title: 'monitors',
//           tabBarIcon: ({ color, size }) => (
//             <Ionicons name="eye" size={size} color={color} />
//           ),
//         }}
//       />

//       <Tabs.Screen
//         name="reports"
//         options={{
//           title: 'reports',
//           tabBarIcon: ({ color, size }) => (
//             <Ionicons name="bar-chart" size={size} color={color} />
//           ),
//         }}
//       />

//       <Tabs.Screen
//         name="users"
//         options={{
//           title: 'Users',
//           tabBarIcon: ({ color, size }) => (
//             <Ionicons name="people" size={size} color={color} />
//           ),
//         }}
//       />
//     </Tabs>
//   );
// }