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
import { styles } from './index.styles';

type DashboardStats = {
  todayEarnings: number;
  monthEarnings: number;
  activeBookings: number;
  totalListings: number;
  occupiedSpaces: number;
  totalCapacity: number;
};

type RecentBooking = {
  id: string;
  booking_reference: string;
  customer_name: string;
  listing_name: string;
  check_in: string;
  check_out: string;
  total_amount: number;
  nights: number;
};

export default function LandOwnerDashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    todayEarnings: 1250,
    monthEarnings: 12500,
    activeBookings: 3,
    totalListings: 2,
    occupiedSpaces: 2,
    totalCapacity: 5,
  });
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([
    {
      id: '1',
      booking_reference: 'LB20260321001',
      customer_name: 'John Doe',
      listing_name: 'Secure Compound - Boudha',
      check_in: '2026-03-21',
      check_out: '2026-03-24',
      total_amount: 750,
      nights: 3,
    },
    {
      id: '2',
      booking_reference: 'LB20260321002',
      customer_name: 'Jane Smith',
      listing_name: 'Covered Garage - Thamel',
      check_in: '2026-03-22',
      check_out: '2026-03-23',
      total_amount: 400,
      nights: 1,
    },
  ]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // TODO: Fetch from Supabase
      setTimeout(() => {
        setLoading(false);
        setRefreshing(false);
      }, 500);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <TouchableOpacity>
          <View style={styles.profileCircle}>
            <Ionicons name="person" size={20} color="#6B7280" />
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22C55E" />
        }
      >
        {/* Earnings Summary */}
        <View style={styles.earningsSummary}>
          <View style={styles.earningsHeader}>
            <Text style={styles.earningsTitle}>Total Earnings</Text>
            <Text style={styles.earningsAmount}>Rs {stats.monthEarnings.toLocaleString()}</Text>
          </View>
          <View style={styles.earningsRow}>
            <View style={styles.earningsItem}>
              <Text style={styles.earningsLabel}>Today's Revenue</Text>
              <Text style={styles.earningsValue}>Rs {stats.todayEarnings.toLocaleString()}</Text>
            </View>
            <View style={styles.earningsDivider} />
            <View style={styles.earningsItem}>
              <Text style={styles.earningsLabel}>Active Bookings</Text>
              <Text style={styles.earningsValue}>{stats.activeBookings}</Text>
            </View>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="home" size={24} color="#3B82F6" />
            </View>
            <Text style={styles.statValue}>{stats.totalListings}</Text>
            <Text style={styles.statLabel}>Total Listings</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#D1FAE5' }]}>
              <Ionicons name="car" size={24} color="#22C55E" />
            </View>
            <Text style={styles.statValue}>{stats.occupiedSpaces}/{stats.totalCapacity}</Text>
            <Text style={styles.statLabel}>Occupied</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/(land-owner)/listing/add')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#D1FAE5' }]}>
              <Ionicons name="add-circle" size={28} color="#22C55E" />
            </View>
            <Text style={styles.actionText}>Add Listing</Text>
            <Text style={styles.actionSubtext}>List your space</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/(land-owner)/(tabs)/listings')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="home" size={28} color="#3B82F6" />
            </View>
            <Text style={styles.actionText}>My Listings</Text>
            <Text style={styles.actionSubtext}>Manage properties</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/(land-owner)/(tabs)/bookings')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="calendar" size={28} color="#F59E0B" />
            </View>
            <Text style={styles.actionText}>Bookings</Text>
            <Text style={styles.actionSubtext}>View reservations</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <View style={[styles.actionIcon, { backgroundColor: '#E0E7FF' }]}>
              <Ionicons name="wallet" size={28} color="#6366F1" />
            </View>
            <Text style={styles.actionText}>Earnings</Text>
            <Text style={styles.actionSubtext}>Track income</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Bookings */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Bookings</Text>
          <TouchableOpacity onPress={() => router.push('/(land-owner)/(tabs)/bookings')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {recentBookings.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>No recent bookings</Text>
          </View>
        ) : (
          <View style={styles.bookingsList}>
            {recentBookings.map((booking) => (
              <View key={booking.id} style={styles.bookingCard}>
                <View style={styles.bookingHeader}>
                  <Text style={styles.bookingReference}>{booking.booking_reference}</Text>
                  <Text style={styles.bookingAmount}>Rs {booking.total_amount}</Text>
                </View>
                <Text style={styles.bookingListing}>{booking.listing_name}</Text>
                <View style={styles.bookingInfo}>
                  <View style={styles.bookingInfoItem}>
                    <Ionicons name="person-outline" size={14} color="#6B7280" />
                    <Text style={styles.bookingInfoText}>{booking.customer_name}</Text>
                  </View>
                  <View style={styles.bookingInfoItem}>
                    <Ionicons name="moon-outline" size={14} color="#6B7280" />
                    <Text style={styles.bookingInfoText}>{booking.nights} nights</Text>
                  </View>
                </View>
                <View style={styles.bookingDates}>
                  <Text style={styles.bookingDate}>
                    {new Date(booking.check_in).toLocaleDateString()} - {new Date(booking.check_out).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}