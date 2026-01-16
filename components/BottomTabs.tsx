import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

const BottomTabs = () => {
  const router = useRouter();
  const pathname = usePathname();

  const tabs = [
    {
      name: 'Home',
      icon: 'home',
      iconOutline: 'home-outline',
      route: '/(user)/(tabs)',
    },
    {
      name: 'Save',
      icon: 'bookmark',
      iconOutline: 'bookmark-outline',
      route: '/(user)/saved',
    },
    {
      name: 'Booking',
      icon: 'calendar',
      iconOutline: 'calendar-outline',
      route: '/(user)/booking-history',
    },
    {
      name: 'Profile',
      icon: 'person',
      iconOutline: 'person-outline',
      route: '/(user)/profile',
    },
  ];

  const isActive = (route: string) => {
    if (route === '/(user)/(tabs)') {
      return pathname === '/(user)/(tabs)' || pathname === '/(user)';
    }
    return pathname === route;
  };

  return (
    <View style={styles.container}>
      {tabs.map((tab, index) => {
        const active = isActive(tab.route);
        
        return (
          <TouchableOpacity
            key={index}
            style={styles.tab}
            onPress={() => router.push(tab.route as any)}
            activeOpacity={0.7}
          >
            {/* Active Indicator */}
            {active && <View style={styles.activeIndicator} />}
            
            {/* Icon */}
            <Ionicons
              name={(active ? tab.icon : tab.iconOutline) as any}
              size={24}
              color={active ? '#22C55E' : '#9CA3AF'}
            />
            
            {/* Label - Optional, remove if you want icons only */}
            {/* <Text style={[styles.label, active && styles.activeLabel]}>
              {tab.name}
            </Text> */}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingBottom: 20,
    paddingTop: 10,
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    position: 'relative',
  },
  activeIndicator: {
    position: 'absolute',
    top: -10,
    width: 40,
    height: 3,
    backgroundColor: '#22C55E',
    borderRadius: 2,
  },
  label: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
    fontWeight: '500',
  },
  activeLabel: {
    color: '#22C55E',
    fontWeight: '600',
  },
});

export default BottomTabs;