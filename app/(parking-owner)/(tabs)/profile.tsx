import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../../../lib/supabase';

import { styles } from './profile.styles';

export default function Profile() {
  const [ownerName, setOwnerName] = useState('Parking Owner');
  const [ownerEmail, setOwnerEmail] = useState('owner@parkease.com');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .single();

      if (profile) {
        setOwnerName(profile.full_name || 'Parking Owner');
        setOwnerEmail(profile.email || user.email || '');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await supabase.auth.signOut();
              await AsyncStorage.removeItem('auth_token');
              await AsyncStorage.removeItem('user_phone');
              router.replace('/(auth)/login');
            } catch (error) {
              Alert.alert('Error', 'Failed to logout');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header with Green Background */}
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity>
            <Ionicons name="settings-outline" size={24} color="#111827" />
          </TouchableOpacity>
        </View>

        {/* Avatar overlapping header */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={48} color="#9CA3AF" />
          </View>
        </View>
      </View>

      {/* Content with white background */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Info */}
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{ownerName}</Text>
          <Text style={styles.profileEmail}>{ownerEmail}</Text>
        </View>

        {/* Account Section */}
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.menuList}>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="person-outline" size={20} color="#111827" />
            <Text style={styles.menuText}>Profile</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="lock-closed-outline" size={20} color="#111827" />
            <Text style={styles.menuText}>Password</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="notifications-outline" size={20} color="#111827" />
            <Text style={styles.menuText}>Notifications</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="heart-outline" size={20} color="#111827" />
            <Text style={styles.menuText}>Favourites</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* More Section */}
        <Text style={styles.sectionTitle}>More</Text>
        <View style={styles.menuList}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/(parking-owner)/reviews')}
          >
            <Ionicons name="star-outline" size={20} color="#111827" />
            <Text style={styles.menuText}>Reviews</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/(parking-owner)/browse-lands')}
          >
            <Ionicons name="car-outline" size={22} color="#111827" />
            <Text style={styles.menuText}>Browse lands</Text>
            <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/(parking-owner)/my-lands')}
          >
            <Ionicons name="business-outline" size={22} color="#111827" />
            <Text style={styles.menuText}>My Rented Lands</Text>
            <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="help-circle-outline" size={20} color="#111827" />
            <Text style={styles.menuText}>Help</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            <Text style={[styles.menuText, { color: '#EF4444' }]}>Logout</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}