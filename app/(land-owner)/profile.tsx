// (landowner)/profile.tsx
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { styles } from './styles';

export default function Profile() {
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            router.replace('/login');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={60} color="#FFFFFF" />
          </View>
          <Text style={styles.profileName}>Ram Bahadur Shrestha</Text>
          <Text style={styles.profileRole}>Landowner</Text>
          <Text style={styles.profileEmail}>rambahadur.shrestha@gmail.com</Text>
        </View>

        {/* Profile Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={20} color="#6B7280" />
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>+977 9841 234567</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={20} color="#6B7280" />
              <Text style={styles.infoLabel}>Address</Text>
              <Text style={styles.infoValue}>Koteshwor, Kathmandu</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={20} color="#6B7280" />
              <Text style={styles.infoLabel}>Member Since</Text>
              <Text style={styles.infoValue}>March 2024</Text>
            </View>
          </View>
        </View>

        {/* Land Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Land Summary</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Total Land Owned</Text>
              <Text style={styles.infoValue}>18.5 Ropani</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Rented Land</Text>
              <Text style={styles.infoValue}>12.8 Ropani</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Available Land</Text>
              <Text style={styles.infoValue}>5.7 Ropani</Text>
            </View>
          </View>
        </View>

        {/* Settings / Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="settings-outline" size={22} color="#6B7280" />
            <Text style={styles.menuText}>Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="help-circle-outline" size={22} color="#6B7280" />
            <Text style={styles.menuText}>Help & Support</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={22} color="#EF4444" />
            <Text style={[styles.menuText, { color: '#EF4444' }]}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}