import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { styles } from './bookings.styles';

type BookingStatus = 'all' | 'active' | 'completed' | 'cancelled';

type Booking = {
  id: string;
  booking_reference: string;
  facility_name: string;
  customer_name: string;
  vehicle_plate: string;
  slot_number: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  total_amount: number;
  payment_status: string;
  booking_status: string;
};

export default function Bookings() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<BookingStatus>('all');

  // Dummy data - will be replaced with Supabase
  const dummyBookings: Booking[] = [
    {
      id: '1',
      booking_reference: 'TX-90210',
      facility_name: 'Grand Central',
      customer_name: 'Sarah Jenkins',
      vehicle_plate: 'BA-1-PA-1234',
      slot_number: 'A1',
      booking_date: '2026-03-21',
      start_time: '10:45 AM',
      end_time: '02:45 PM',
      total_amount: 45.00,
      payment_status: 'paid',
      booking_status: 'active',
    },
    {
      id: '2',
      booking_reference: 'TX-90211',
      facility_name: 'Sunset Plaza',
      customer_name: 'Marcus Thorne',
      vehicle_plate: 'BA-2-KA-5678',
      slot_number: 'B3',
      booking_date: '2026-03-21',
      start_time: '09:12 AM',
      end_time: '01:12 PM',
      total_amount: 22.50,
      payment_status: 'paid',
      booking_status: 'completed',
    },
    {
      id: '3',
      booking_reference: 'TX-90212',
      facility_name: 'Downtown Express',
      customer_name: 'Emily Chen',
      vehicle_plate: 'BA-3-JA-9012',
      slot_number: 'C2',
      booking_date: '2026-03-21',
      start_time: '08:30 AM',
      end_time: '12:30 PM',
      total_amount: 112.00,
      payment_status: 'pending',
      booking_status: 'active',
    },
    {
      id: '4',
      booking_reference: 'TX-90213',
      facility_name: 'Grand Central',
      customer_name: 'Robert Mills',
      vehicle_plate: 'BA-4-PA-3456',
      slot_number: 'D4',
      booking_date: '2026-03-20',
      start_time: '02:00 PM',
      end_time: '06:00 PM',
      total_amount: 67.50,
      payment_status: 'paid',
      booking_status: 'cancelled',
    },
  ];

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      // TODO: Fetch from Supabase
      // For now, use dummy data
      setTimeout(() => {
        setBookings(dummyBookings);
        setLoading(false);
        setRefreshing(false);
      }, 500);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const handleCancelBooking = (booking: Booking) => {
    Alert.alert(
      'Cancel Booking',
      `Are you sure you want to cancel booking ${booking.booking_reference}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: Update booking status in Supabase
              // TODO: Free up the slot
              const updatedBookings = bookings.map(b =>
                b.id === booking.id ? { ...b, booking_status: 'cancelled' } : b
              );
              setBookings(updatedBookings);
              Alert.alert('Success', 'Booking cancelled successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel booking');
            }
          },
        },
      ]
    );
  };

  const filteredBookings = bookings.filter(booking => {
    // Filter by status
    if (selectedStatus !== 'all' && booking.booking_status !== selectedStatus) {
      return false;
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        booking.booking_reference.toLowerCase().includes(query) ||
        booking.customer_name.toLowerCase().includes(query) ||
        booking.facility_name.toLowerCase().includes(query) ||
        booking.vehicle_plate.toLowerCase().includes(query)
      );
    }

    return true;
  });

  const getStatusCount = (status: BookingStatus) => {
    if (status === 'all') return bookings.length;
    return bookings.filter(b => b.booking_status === status).length;
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
        <Text style={styles.headerTitle}>Bookings</Text>
        <TouchableOpacity>
          <Ionicons name="filter-outline" size={24} color="#111827" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22C55E" />
        }
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search bookings..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Filter Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterTabs}>
          <TouchableOpacity
            style={[styles.filterTab, selectedStatus === 'all' && styles.filterTabActive]}
            onPress={() => setSelectedStatus('all')}
          >
            <Text style={[styles.filterTabText, selectedStatus === 'all' && styles.filterTabTextActive]}>
              All ({getStatusCount('all')})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterTab, selectedStatus === 'active' && styles.filterTabActive]}
            onPress={() => setSelectedStatus('active')}
          >
            <Text style={[styles.filterTabText, selectedStatus === 'active' && styles.filterTabTextActive]}>
              Active ({getStatusCount('active')})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterTab, selectedStatus === 'completed' && styles.filterTabActive]}
            onPress={() => setSelectedStatus('completed')}
          >
            <Text style={[styles.filterTabText, selectedStatus === 'completed' && styles.filterTabTextActive]}>
              Completed ({getStatusCount('completed')})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterTab, selectedStatus === 'cancelled' && styles.filterTabActive]}
            onPress={() => setSelectedStatus('cancelled')}
          >
            <Text style={[styles.filterTabText, selectedStatus === 'cancelled' && styles.filterTabTextActive]}>
              Cancelled ({getStatusCount('cancelled')})
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>No bookings found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? 'Try a different search' : 'Bookings will appear here'}
            </Text>
          </View>
        ) : (
          filteredBookings.map((booking) => (
            <View key={booking.id} style={styles.bookingCard}>
              {/* Booking Header */}
              <View style={styles.bookingHeader}>
                <View style={styles.bookingTitleRow}>
                  <Text style={styles.bookingReference}>{booking.booking_reference}</Text>
                  <View style={[
                    styles.statusBadge,
                    booking.booking_status === 'active' && styles.statusActive,
                    booking.booking_status === 'completed' && styles.statusCompleted,
                    booking.booking_status === 'cancelled' && styles.statusCancelled,
                  ]}>
                    <Text style={[
                      styles.statusText,
                      booking.booking_status === 'active' && styles.statusTextActive,
                      booking.booking_status === 'completed' && styles.statusTextCompleted,
                      booking.booking_status === 'cancelled' && styles.statusTextCancelled,
                    ]}>
                      {booking.booking_status.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={styles.facilityName}>• {booking.facility_name}</Text>
              </View>

              {/* Customer & Vehicle Info */}
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Ionicons name="person-outline" size={16} color="#6B7280" />
                  <Text style={styles.infoText}>{booking.customer_name}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Ionicons name="car-outline" size={16} color="#6B7280" />
                  <Text style={styles.infoText}>{booking.vehicle_plate}</Text>
                </View>
              </View>

              {/* Time & Slot Info */}
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Ionicons name="time-outline" size={16} color="#6B7280" />
                  <Text style={styles.infoText}>
                    {booking.start_time} - {booking.end_time}
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <Ionicons name="location-outline" size={16} color="#6B7280" />
                  <Text style={styles.infoText}>Slot {booking.slot_number}</Text>
                </View>
              </View>

              {/* Payment Info */}
              <View style={styles.paymentRow}>
                <Text style={styles.amountText}>Rs {booking.total_amount.toFixed(2)}</Text>
                <View style={[
                  styles.paymentBadge,
                  booking.payment_status === 'paid' ? styles.paymentPaid : styles.paymentPending
                ]}>
                  <Text style={[
                    styles.paymentText,
                    booking.payment_status === 'paid' ? styles.paymentTextPaid : styles.paymentTextPending
                  ]}>
                    {booking.payment_status.toUpperCase()}
                  </Text>
                </View>
              </View>

              {/* Cancel Button (only for active bookings) */}
              {booking.booking_status === 'active' && (
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => handleCancelBooking(booking)}
                >
                  <Ionicons name="close-circle-outline" size={18} color="#EF4444" />
                  <Text style={styles.cancelButtonText}>Cancel Booking</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}