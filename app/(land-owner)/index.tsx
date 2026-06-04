// (land-owner)/index.tsx
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { styles } from './styles';

const AANA_TO_SQFT = 342.25;

type RecentNotif = {
  id: string;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
};

export default function LandownerDashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ownerName, setOwnerName] = useState('Landowner');

  const [stats, setStats] = useState({
    totalAana: 0,
    activeAgreements: 0,
    monthlyIncome: 0,
    pendingRequests: 0,
  });
  const [recentNotifs, setRecentNotifs] = useState<RecentNotif[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();
      if (profile?.full_name) setOwnerName(profile.full_name);

      // Approved land area
      const { data: lands } = await supabase
        .from('land_listings')
        .select('area_sqft, approval_status')
        .eq('owner_id', user.id)
        
      const totalSqft = (lands || [])
        .filter(l => l.approval_status === 'approved')
        .reduce((sum, l) => sum + (l.area_sqft || 0), 0);

      // Active agreements + monthly income
      const { data: agreements } = await supabase
        .from('land_agreements')
        .select('monthly_rent, status')
        .eq('land_owner_id', user.id)
        .eq('status', 'active');

      const monthlyIncome = (agreements || []).reduce(
        (sum, a) => sum + Number(a.monthly_rent || 0),
        0
      );

      // Pending rental requests
      const { count: pendingReqs } = await supabase
        .from('land_rental_requests')
        .select('*', { count: 'exact', head: true })
        .eq('land_owner_id', user.id)
        .eq('status', 'pending');

      setStats({
        totalAana: Math.round((totalSqft / AANA_TO_SQFT) * 10) / 10,
        activeAgreements: agreements?.length || 0,
        monthlyIncome,
        pendingRequests: pendingReqs || 0,
      });

      // Recent activity
      const { data: notifs } = await supabase
        .from('notifications')
        .select('id, title, message, created_at, is_read')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);
      setRecentNotifs(notifs || []);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const formatTime = (s: string) => {
    const diffMins = Math.floor((Date.now() - new Date(s).getTime()) / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return `${Math.floor(diffHrs / 24)}d ago`;
  };

  const statCards = [
    { label: 'Approved Land', value: `${stats.totalAana} Aana`, icon: 'leaf' as const },
    { label: 'Active Agreements', value: String(stats.activeAgreements), icon: 'document-text' as const },
    { label: 'Monthly Income', value: `Rs ${stats.monthlyIncome.toLocaleString()}`, icon: 'cash' as const },
    { label: 'Pending Requests', value: String(stats.pendingRequests), icon: 'time' as const },
  ];

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#22C55E" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Namaste,</Text>
        <Text style={styles.headerTitle}>{ownerName}</Text>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22C55E" />
        }
      >
        <View style={styles.statsGrid}>
          {statCards.map((stat, i) => (
            <View key={i} style={styles.statCard}>
              <Ionicons name={stat.icon} size={32} color="#22C55E" />
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/(land-owner)/add-land-plot' as any)}
        >
          <Ionicons name="add-circle" size={24} color="#fff" />
          <Text style={styles.actionButtonText}>Add New Land Plot</Text>
        </TouchableOpacity>

        <View style={[styles.section, { marginTop: 24 }]}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {recentNotifs.length === 0 ? (
            <View style={[styles.card, { alignItems: 'center', paddingVertical: 28 }]}>
              <Ionicons name="notifications-off-outline" size={36} color="#D1D5DB" />
              <Text style={{ color: '#9CA3AF', marginTop: 8, fontSize: 13 }}>
                No activity yet
              </Text>
            </View>
          ) : (
            recentNotifs.map((n) => (
              <View key={n.id} style={styles.card}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontWeight: '600', flex: 1 }} numberOfLines={1}>
                    {n.title}
                  </Text>
                  {!n.is_read && (
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#22C55E', marginLeft: 8, marginTop: 6 }} />
                  )}
                </View>
                <Text style={{ color: '#6B7280', marginTop: 4, fontSize: 13 }} numberOfLines={2}>
                  {n.message}
                </Text>
                <Text style={{ color: '#22C55E', marginTop: 8, fontSize: 12 }}>
                  {formatTime(n.created_at)}
                </Text>
              </View>
            ))
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}
