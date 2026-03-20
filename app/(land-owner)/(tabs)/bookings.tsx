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
  listing_name: string;
  customer_name: string;
  customer_phone: string;
  vehicle_plate: string;
  vehicle_type: string;
  check_in: string;
  check_out: string;
  nights: number;
  total_amount: number;
  payment_status: string;
  booking_status: string;
};

export default function Bookings() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([
    {
      id: '1',
      booking_reference: 'LB20260321001',
      listing_name: 'Secure Compound - Boudha',
      customer_name: 'John Doe',
      customer_phone: '9876543210',
      vehicle_plate: 'BA-1-PA-1234',
      vehicle_type: 'Car',
      check_in: '2026-03-21',
      check_out: '2026-03-24',
      nights: 3,
      total_amount: 750,
      payment_status: 'paid',
      booking_status: 'active',
    },
    {
      id: '2',
      booking_reference: 'LB20260321002',
      listing_name: 'Covered Garage - Thamel',
      customer_name: 'Jane Smith',
      customer_phone: '9812345678',
      vehicle_plate: 'BA-2-KA-5678',
      vehicle_type: 'Car',
      check_in: '2026-03-22',
      check_out: '2026-03-23',
      nights: 1,
      total_amount: 400,
      payment_status: 'paid',
      booking_status: 'completed',
    },
    {
      id: '3',
      booking_reference: 'LB20260320001',
      listing_name: 'Open Space - New Road',
      customer_name: 'Mike Johnson',
      customer_phone: '9801234567',
      vehicle_plate: 'BA-3-JA-9012',
      vehicle_type: 'Bike',
      check_in: '2026-03-20',
      check_out: '2026-03-22',
      nights: 2,
      total_amount: 300,
      payment_status: 'paid',
      booking_status: 'cancelled',
    },
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<BookingStatus>('all');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      // TODO: Fetch from Supabase
      setTimeout(() => {
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
      `Are you sure you want to cancel booking ${booking.booking_reference}?\n\nCustomer: ${booking.customer_name}`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: Update booking status in Supabase
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
        booking.listing_name.toLowerCase().includes(query) ||
        booking.vehicle_plate.toLowerCase().includes(query)
      );
    }

    return true;
  });

  const getStatusCount = (status: BookingStatus) => {
    if (status === 'all') return bookings.length;
    return bookings.filter(b => b.booking_status === status).length;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
          <View style={styles.bookingsList}>
            {filteredBookings.map((booking) => (
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
                  <Text style={styles.listingName}>• {booking.listing_name}</Text>
                </View>

                {/* Customer Info */}
                <View style={styles.infoSection}>
                  <View style={styles.infoRow}>
                    <Ionicons name="person-outline" size={16} color="#6B7280" />
                    <Text style={styles.infoText}>{booking.customer_name}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Ionicons name="call-outline" size={16} color="#6B7280" />
                    <Text style={styles.infoText}>{booking.customer_phone}</Text>
                  </View>
                </View>

                {/* Vehicle Info */}
                <View style={styles.infoSection}>
                  <View style={styles.infoRow}>
                    <Ionicons name="car-outline" size={16} color="#6B7280" />
                    <Text style={styles.infoText}>{booking.vehicle_plate} ({booking.vehicle_type})</Text>
                  </View>
                </View>

                {/* Dates Info */}
                <View style={styles.datesSection}>
                  <View style={styles.dateBox}>
                    <Text style={styles.dateLabel}>Check-in</Text>
                    <Text style={styles.dateValue}>{formatDate(booking.check_in)}</Text>
                  </View>
                  <Ionicons name="arrow-forward" size={20} color="#9CA3AF" />
                  <View style={styles.dateBox}>
                    <Text style={styles.dateLabel}>Check-out</Text>
                    <Text style={styles.dateValue}>{formatDate(booking.check_out)}</Text>
                  </View>
                  <View style={styles.nightsBadge}>
                    <Ionicons name="moon" size={12} color="#6366F1" />
                    <Text style={styles.nightsText}>{booking.nights}N</Text>
                  </View>
                </View>

                {/* Payment Info */}
                <View style={styles.paymentRow}>
                  <Text style={styles.amountText}>Rs {booking.total_amount}</Text>
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
            ))}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}