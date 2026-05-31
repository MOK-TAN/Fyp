// (land-owner)/profile.tsx
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { styles } from './styles';

const AANA_TO_SQFT = 342.25;

type Profile = {
  full_name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string | null;
};

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [summary, setSummary] = useState({
    totalAana: 0,
    rentedAana: 0,
    availableAana: 0,
  });

  const fetchProfile = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: prof } = await supabase
        .from('profiles')
        .select('full_name, email, phone, created_at')
        .eq('id', user.id)
        .single();

      setProfile(prof);

      const { data: lands } = await supabase
        .from('land_listings')
        .select('id, area_sqft, approval_status, is_available')
        .eq('owner_id', user.id);

      const approved = (lands || []).filter(l => l.approval_status === 'approved');
      const totalSqft = approved.reduce((sum, l) => sum + (l.area_sqft || 0), 0);

      const { data: activeAgs } = await supabase
        .from('land_agreements')
        .select('land_id')
        .eq('land_owner_id', user.id)
        .eq('status', 'active');

      const rentedIds = new Set((activeAgs || []).map(a => a.land_id));
      const rentedSqft = approved
        .filter(l => rentedIds.has(l.id))
        .reduce((sum, l) => sum + (l.area_sqft || 0), 0);

      setSummary({
        totalAana: Math.round((totalSqft / AANA_TO_SQFT) * 10) / 10,
        rentedAana: Math.round((rentedSqft / AANA_TO_SQFT) * 10) / 10,
        availableAana: Math.round(((totalSqft - rentedSqft) / AANA_TO_SQFT) * 10) / 10,
      });
    } catch (err) {
      console.error('Profile fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [fetchProfile])
  );

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
            router.replace('/(auth)/login' as any);
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#22C55E" />
      </View>
    );
  }

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-NP', { month: 'long', year: 'numeric' })
    : '—';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={60} color="#FFFFFF" />
          </View>
          <Text style={styles.profileName}>{profile?.full_name || 'Landowner'}</Text>
          <Text style={styles.profileRole}>Landowner</Text>
          <Text style={styles.profileEmail}>{profile?.email || '—'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoLeft}>
                <Ionicons name="call-outline" size={20} color="#6B7280" />
                <Text style={styles.infoLabel}>Phone</Text>
              </View>
              <Text style={styles.infoValue} numberOfLines={1}>
                {profile?.phone || 'Not set'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <View style={styles.infoLeft}>
                <Ionicons name="mail-outline" size={20} color="#6B7280" />
                <Text style={styles.infoLabel}>Email</Text>
              </View>
              <Text style={styles.infoValue} numberOfLines={1}>
                {profile?.email || '—'}
              </Text>
            </View>
            <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
              <View style={styles.infoLeft}>
                <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                <Text style={styles.infoLabel}>Member Since</Text>
              </View>
              <Text style={styles.infoValue}>{memberSince}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Land Summary</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoLeft}>
                <Ionicons name="leaf-outline" size={20} color="#22C55E" />
                <Text style={styles.infoLabel}>Total Approved Land</Text>
              </View>
              <Text style={styles.infoValue}>{summary.totalAana} Aana</Text>
            </View>
            <View style={styles.infoRow}>
              <View style={styles.infoLeft}>
                <Ionicons name="checkmark-circle-outline" size={20} color="#3B82F6" />
                <Text style={styles.infoLabel}>Rented Out</Text>
              </View>
              <Text style={styles.infoValue}>{summary.rentedAana} Aana</Text>
            </View>
            <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
              <View style={styles.infoLeft}>
                <Ionicons name="ellipse-outline" size={20} color="#9CA3AF" />
                <Text style={styles.infoLabel}>Available</Text>
              </View>
              <Text style={styles.infoValue}>{summary.availableAana} Aana</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(land-owner)/edit-profile')}>
            <Ionicons name="person-outline" size={22} color="#6B7280" />
            <Text style={styles.menuText}>Edit Profile</Text>
            <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(land-owner)/change-password')}>
            <Ionicons name="lock-closed-outline" size={22} color="#6B7280" />
            <Text style={styles.menuText}>Change Password</Text>
            <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
          </TouchableOpacity>

         

          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={22} color="#EF4444" />
            <Text style={[styles.menuText, { color: '#EF4444' }]}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}
