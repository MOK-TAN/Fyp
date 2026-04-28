import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../../../lib/supabase';
import { styles } from './index.styles';

type RecentActivity = {
  id: string;
  booking_reference: string;
  facility_name: string;
  customer_name: string;
  total_amount: number;
  payment_status: string;
  created_at: string;
};

export default function OwnerDashboard() {

  const [unreadCount, setUnreadCount] = useState(0);


  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ownerName, setOwnerName] = useState('Owner');
  const [stats, setStats] = useState({
    todayEarnings: 0,
    todayBookings: 0,
    totalSlots: 0,
    occupiedSlots: 0,
    facilities: 0,
    totalEarnings: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get unread notifications count
const { count: unreadNotifCount } = await supabase
  .from('notifications')
  .select('*', { count: 'exact', head: true })
  .eq('user_id', user.id)
  .eq('is_read', false);

setUnreadCount(unreadNotifCount || 0);

      // Get owner name
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      if (profile?.full_name) {
        setOwnerName(profile.full_name);
      }

      // Get owner's facilities
      const { data: facilitiesData } = await supabase
        .from('parking_facilities')
        .select('*')
        .eq('owner_id', user.id);

      const facilitiesCount = facilitiesData?.length || 0;

      if (facilitiesData && facilitiesData.length > 0) {
        const facilityIds = facilitiesData.map(f => f.id);

        // Get total and occupied slots
        const { data: slotsData } = await supabase
          .from('parking_slots')
          .select('is_occupied')
          .in('facility_id', facilityIds);

        const totalSlots = slotsData?.length || 0;
        const occupiedSlots = slotsData?.filter(s => s.is_occupied).length || 0;

        // Get today's bookings
        const today = new Date().toISOString().split('T')[0];
        const { data: todayBookingsData } = await supabase
          .from('bookings')
          .select('*')
          .in('facility_id', facilityIds)
          .gte('created_at', today);

        const todayBookings = todayBookingsData?.length || 0;

        // Get today's earnings (after 10% platform commission)
        const { data: todayEarningsData } = await supabase
          .from('bookings')
          .select('total_amount')
          .in('facility_id', facilityIds)
          .gte('created_at', today)
          .eq('payment_status', 'paid');

        const todayEarnings = todayEarningsData?.reduce((sum, b) => sum + (b.total_amount * 0.9), 0) || 0;

        // Get total all-time earnings (after 10% platform commission)
        const { data: allEarningsData } = await supabase
          .from('bookings')
          .select('total_amount')
          .in('facility_id', facilityIds)
          .eq('payment_status', 'paid');

        const totalEarnings = allEarningsData?.reduce((sum, b) => sum + (b.total_amount * 0.9), 0) || 0;

        // Get recent activity (last 5 bookings)
        const { data: recentData } = await supabase
          .from('bookings')
          .select(`
            id,
            booking_reference,
            total_amount,
            payment_status,
            created_at,
            parking_facilities(name),
            profiles(full_name)
          `)
          .in('facility_id', facilityIds)
          .order('created_at', { ascending: false })
          .limit(5);

        const formattedActivity = recentData?.map((b: any) => ({
          id: b.id,
          booking_reference: b.booking_reference,
          facility_name: b.parking_facilities?.name || 'Unknown',
          customer_name: b.profiles?.full_name || 'Guest',
          total_amount: b.total_amount,
          payment_status: b.payment_status,
          created_at: b.created_at,
        })) || [];

        setRecentActivity(formattedActivity);

        setStats({
          todayEarnings: Math.round(todayEarnings),
          todayBookings,
          totalSlots,
          occupiedSlots,
          facilities: facilitiesCount,
          totalEarnings: Math.round(totalEarnings),
        });
      } else {
        setStats({
          todayEarnings: 0,
          todayBookings: 0,
          totalSlots: 0,
          occupiedSlots: 0,
          facilities: 0,
          totalEarnings: 0,
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const getOccupancyRate = () => {
    if (stats.totalSlots === 0) return 0;
    return Math.round((stats.occupiedSlots / stats.totalSlots) * 100);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#22C55E" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      {/* <View style={styles.header}>
        <View>
          <Text style={styles.headerGreeting}>Welcome back,</Text>
          <Text style={styles.headerTitle}>{ownerName}</Text>
        </View>
        <TouchableOpacity style={styles.profileButton}>
          <View style={styles.profileCircle}>
            <Ionicons name="person" size={20} color="#6B7280" />
          </View>
        </TouchableOpacity>
      </View> */}

      {/* Header */}
<View style={styles.header}>
  <View>
    <Text style={styles.headerGreeting}>Welcome back,</Text>
    <Text style={styles.headerTitle}>{ownerName}</Text>
  </View>
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
    <TouchableOpacity
      style={{ position: 'relative', padding: 8 }}
      onPress={() => router.push('/(parking-owner)/notifications')}
    >
      <Ionicons name="notifications-outline" size={24} color="#111827" />
      {unreadCount > 0 && (
        <View style={{
          position: 'absolute',
          top: 2,
          right: 2,
          backgroundColor: '#EF4444',
          borderRadius: 10,
          minWidth: 18,
          height: 18,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 4,
        }}>
          <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
    <TouchableOpacity style={styles.profileButton}>
      <View style={styles.profileCircle}>
        <Ionicons name="person" size={20} color="#6B7280" />
      </View>
    </TouchableOpacity>
  </View>
</View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22C55E" />
        }
      >

        {/* Scan QR Button — Prominent at top */}
        <TouchableOpacity
          style={styles.scanButton}
          onPress={() => router.push('/(parking-owner)/(tabs)/scanner')}
          activeOpacity={0.8}
        >
          <View style={styles.scanButtonLeft}>
            <View style={styles.scanIconContainer}>
              <Ionicons name="qr-code" size={28} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.scanButtonTitle}>Scan QR Code</Text>
              <Text style={styles.scanButtonSubtitle}>Verify customer booking on arrival</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Earnings Summary */}
        <View style={styles.earningsSummary}>
          <View style={styles.earningsHeader}>
            <Text style={styles.earningsTitle}>Total Earnings to Date</Text>
            <Text style={styles.earningsAmount}>Rs {stats.totalEarnings.toLocaleString()}</Text>
          </View>
          <View style={styles.earningsRow}>
            <View style={styles.earningsItem}>
              <Text style={styles.earningsLabel}>Today's Revenue</Text>
              <Text style={styles.earningsValue}>Rs {stats.todayEarnings.toLocaleString()}</Text>
            </View>
            <View style={styles.earningsDivider} />
            <View style={styles.earningsItem}>
              <Text style={styles.earningsLabel}>Platform Fee (10%)</Text>
              <Text style={styles.earningsValue}>Rs {Math.round(stats.todayEarnings * 0.11).toLocaleString()}</Text>
            </View>
          </View>
        </View>

        {/* Select Metric for Detail */}
        <Text style={styles.sectionTitle}>Select Metric for Detail</Text>

        {/* Metrics Cards */}
        <View style={styles.metricsList}>
          {/* Slots */}
          <TouchableOpacity style={styles.metricCard}>
            <View style={styles.metricLeft}>
              <View style={[styles.metricIcon, { backgroundColor: '#DCFCE7' }]}>
                <Ionicons name="trending-up" size={24} color="#16A34A" />
              </View>
              <View style={styles.metricInfo}>
                <Text style={styles.metricTitle}>Slots</Text>
                <Text style={styles.metricSubtitle}>
                  {stats.occupiedSlots}/{stats.totalSlots} occupied ({getOccupancyRate()}%)
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          {/* New Bookings */}
          <TouchableOpacity style={styles.metricCard}>
            <View style={styles.metricLeft}>
              <View style={[styles.metricIcon, { backgroundColor: '#DBEAFE' }]}>
                <Ionicons name="calendar" size={24} color="#3B82F6" />
              </View>
              <View style={styles.metricInfo}>
                <Text style={styles.metricTitle}>New Bookings</Text>
                <Text style={styles.metricSubtitle}>
                  {stats.todayBookings} bookings in the last 24h
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Facility */}
          <TouchableOpacity
            style={styles.metricCard}
            onPress={() => router.push('/(parking-owner)/(tabs)/facilities')}
          >
            <View style={styles.metricLeft}>
              <View style={[styles.metricIcon, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="business" size={24} color="#D97706" />
              </View>
              <View style={styles.metricInfo}>
                <Text style={styles.metricTitle}>Facility</Text>
                <Text style={styles.metricSubtitle}>
                  {stats.facilities} facilities operational
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* System Status */}
        <View style={styles.systemStatus}>
          <View style={styles.systemIconContainer}>
            <Ionicons name="shield-checkmark" size={20} color="#22C55E" />
          </View>
          <View style={styles.systemInfo}>
            <Text style={styles.systemTitle}>System Monitoring Active</Text>
            <Text style={styles.systemSubtitle}>
              Real-time data synchronization is encrypted and secure.
            </Text>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.activityHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity onPress={() => router.push('/(parking-owner)/(tabs)/bookings')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.activityList}>
          {recentActivity.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>No recent activity</Text>
              <Text style={styles.emptySubtext}>Bookings will appear here once customers start parking</Text>
            </View>
          ) : (
            recentActivity.map((activity) => (
              <View key={activity.id} style={styles.activityItem}>
                <View style={styles.activityLeft}>
                  <Text style={styles.activityReference}>{activity.booking_reference}</Text>
                  <Text style={styles.activityFacility}>• {activity.facility_name}</Text>
                  <Text style={styles.activityCustomer}>
                    {activity.customer_name} • {formatTime(activity.created_at)}
                  </Text>
                </View>
                <View style={styles.activityRight}>
                  <Text style={styles.activityAmount}>Rs {activity.total_amount.toFixed(2)}</Text>
                  <View style={[
                    styles.statusBadge,
                    activity.payment_status === 'paid' ? styles.statusPaid : styles.statusPending
                  ]}>
                    <Text style={[
                      styles.statusText,
                      activity.payment_status === 'paid' ? styles.statusTextPaid : styles.statusTextPending
                    ]}>
                      {activity.payment_status.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Generate Report Button */}
        <TouchableOpacity style={styles.reportButton}>
          <Text style={styles.reportButtonText}>Generate Weekly Report</Text>
          <Ionicons name="arrow-forward" size={20} color="#6B7280" />
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}