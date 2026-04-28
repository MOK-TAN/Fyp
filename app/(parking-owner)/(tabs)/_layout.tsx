import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';

function ScannerTabButton(props: BottomTabBarButtonProps) {
  return (
    <View style={styles.scannerWrapper}>
      <TouchableOpacity
        style={styles.scannerButton}
        onPress={props.onPress}   // ✅ types match perfectly
        activeOpacity={0.85}
      >
        <View style={styles.scannerRing} />
        <View style={styles.scannerInner}>
          <Ionicons name="qr-code-outline" size={28} color="#FFFFFF" />
        </View>
      </TouchableOpacity>
    </View>
  );
}

export default function ParkingOwnerLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#22C55E',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          height: 65,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'DASHBOARD',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'grid' : 'grid-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="facilities"
        options={{
          title: 'FACILITIES',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'business' : 'business-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />

      {/* ── CENTER SCANNER TAB ── */}
      <Tabs.Screen
        name="scanner"
        options={{
          title: '',
          tabBarIcon: () => null,
          tabBarLabel: () => null,
          tabBarButton: (props) => <ScannerTabButton {...props} />
        }}
      />

      <Tabs.Screen
        name="bookings"
        options={{
          title: 'BOOKINGS',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'calendar' : 'calendar-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'PROFILE',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  // Wrapper lifts the button above the tab bar
  scannerWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    // Pull the button upward so it floats above the bar
    marginBottom: 28,
  },

  // Subtle pulsing outer ring
  scannerRing: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },

  // The main circular green button
  scannerButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    // Shadow for iOS
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    // Shadow for Android
    elevation: 10,
  },

  // Gradient-like green fill (solid fallback)
  scannerInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
});


// before
// import { Ionicons } from '@expo/vector-icons';
// import { Tabs } from 'expo-router';

// export default function ParkingOwnerLayout() {
//   return (
//     <Tabs
//       screenOptions={{
//         headerShown: false,
//         tabBarActiveTintColor: '#22C55E',
//         tabBarInactiveTintColor: '#9CA3AF',
//         tabBarStyle: {
//           backgroundColor: '#FFFFFF',
//           borderTopWidth: 1,
//           borderTopColor: '#E5E7EB',
//           height: 65,
//           paddingBottom: 10,
//           paddingTop: 8,
//         },
//         tabBarLabelStyle: {
//           fontSize: 11,
//           fontWeight: '600',
//         },
//       }}
//     >
//       <Tabs.Screen
//         name="index"
//         options={{
//           title: 'DASHBOARD',
//           tabBarIcon: ({ color, focused }) => (
//             <Ionicons 
//               name={focused ? 'grid' : 'grid-outline'} 
//               size={24} 
//               color={color} 
//             />
//           ),
//         }}
//       />
//       <Tabs.Screen
//         name="facilities"
//         options={{
//           title: 'FACILITIES',
//           tabBarIcon: ({ color, focused }) => (
//             <Ionicons 
//               name={focused ? 'business' : 'business-outline'} 
//               size={24} 
//               color={color} 
//             />
//           ),
//         }}
//       />
//       <Tabs.Screen
//         name="bookings"
//         options={{
//           title: 'BOOKINGS',
//           tabBarIcon: ({ color, focused }) => (
//             <Ionicons 
//               name={focused ? 'calendar' : 'calendar-outline'} 
//               size={24} 
//               color={color} 
//             />
//           ),
//         }}
//       />
//       <Tabs.Screen
//         name="profile"
//         options={{
//           title: 'PROFILE',
//           tabBarIcon: ({ color, focused }) => (
//             <Ionicons 
//               name={focused ? 'person' : 'person-outline'} 
//               size={24} 
//               color={color} 
//             />
//           ),
//         }}
//       />
//     </Tabs>
//   );
// }