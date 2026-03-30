import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import BottomTabs from '../../components/BottomTabs';
import { supabase } from '../../lib/supabase';

type Booking = {
  id: string;
  booking_reference: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  duration_hours: number;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  booking_status: string;
  is_timer_active: boolean;
  facility_id: string;
  slot_id: string;
  facility_name: string;
  facility_address: string;
  slot_number: string;
  vehicle_plate: string;
};

type TabType = 'upcoming' | 'completed' | 'cancelled';

const BookingHistory = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          booking_reference,
          booking_date,
          start_time,
          end_time,
          duration_hours,
          total_amount,
          payment_method,
          payment_status,
          booking_status,
          is_timer_active,
          facility_id,
          slot_id,
          parking_facilities (name, address),
          parking_slots (slot_number),
          vehicles (plate_number)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formatted: Booking[] = (data || []).map((b: any) => ({
        id: b.id,
        booking_reference: b.booking_reference,
        booking_date: b.booking_date,
        start_time: b.start_time,
        end_time: b.end_time,
        duration_hours: b.duration_hours,
        total_amount: b.total_amount,
        payment_method: b.payment_method,
        payment_status: b.payment_status,
        booking_status: b.booking_status,
        is_timer_active: b.is_timer_active,
        facility_id: b.facility_id,
        slot_id: b.slot_id,
        facility_name: b.parking_facilities?.name || 'Parking',
        facility_address: b.parking_facilities?.address || '',
        slot_number: b.parking_slots?.slot_number || '-',
        vehicle_plate: b.vehicles?.plate_number || 'N/A',
      }));

      setBookings(formatted);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
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
      `Cancel booking ${booking.booking_reference}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('bookings')
                .update({ booking_status: 'cancelled', is_timer_active: false })
                .eq('id', booking.id);

              if (error) throw error;

              // Release slot
              await supabase
                .from('parking_slots')
                .update({ is_available: true, is_occupied: false, current_booking_id: null })
                .eq('id', booking.slot_id);

              setBookings(prev =>
                prev.map(b => b.id === booking.id ? { ...b, booking_status: 'cancelled' } : b)
              );

              Alert.alert('Success', 'Booking cancelled');
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel booking');
            }
          },
        },
      ]
    );
  };

  const formatTime12h = (time: string) => {
    const parts = time.split(':');
    const hours = parseInt(parts[0]);
    const minutes = parts[1];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes} ${ampm}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  const getPaymentMethodName = (method: string) => {
    switch (method) {
      case 'esewa': return 'eSewa';
      case 'khalti': return 'Khalti';
      case 'cash': return 'Cash';
      default: return method;
    }
  };

  // Filter bookings by tab
  const filteredBookings = bookings.filter(b => {
    switch (activeTab) {
      case 'upcoming':
        return b.booking_status === 'confirmed' || b.booking_status === 'active';
      case 'completed':
        return b.booking_status === 'completed';
      case 'cancelled':
        return b.booking_status === 'cancelled';
      default:
        return true;
    }
  });

  const getTabCount = (tab: TabType) => {
    switch (tab) {
      case 'upcoming':
        return bookings.filter(b => b.booking_status === 'confirmed' || b.booking_status === 'active').length;
      case 'completed':
        return bookings.filter(b => b.booking_status === 'completed').length;
      case 'cancelled':
        return bookings.filter(b => b.booking_status === 'cancelled').length;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return '#3B82F6';
      case 'active': return '#22C55E';
      case 'completed': return '#6B7280';
      case 'cancelled': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'confirmed': return '#DBEAFE';
      case 'active': return '#D1FAE5';
      case 'completed': return '#F3F4F6';
      case 'cancelled': return '#FEE2E2';
      default: return '#F3F4F6';
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#22C55E" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Bookings</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {(['upcoming', 'completed', 'cancelled'] as TabType[]).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)} ({getTabCount(tab)})
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22C55E" />
        }
      >
        {filteredBookings.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>
              {activeTab === 'upcoming' ? 'No upcoming bookings' :
               activeTab === 'completed' ? 'No completed bookings' :
               'No cancelled bookings'}
            </Text>
            <Text style={styles.emptySubtext}>
              {activeTab === 'upcoming' ? 'Book a parking spot to get started' : 'Your booking history will appear here'}
            </Text>
          </View>
        ) : (
          filteredBookings.map((booking) => (
            <View key={booking.id} style={styles.bookingCard}>
              {/* Card Header */}
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View style={styles.bookingIcon}>
                    <Ionicons name="car-sport" size={24} color="#22C55E" />
                  </View>
                  <View>
                    <Text style={styles.bookingName}>{booking.facility_name}</Text>
                    <Text style={styles.bookingAddress}>{booking.facility_address}</Text>
                  </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusBg(booking.booking_status) }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(booking.booking_status) }]}>
                    {booking.booking_status.toUpperCase()}
                  </Text>
                </View>
              </View>

              {/* Details */}
              <View style={styles.detailsGrid}>
                <View style={styles.detailItem}>
                  <Ionicons name="calendar-outline" size={14} color="#9CA3AF" />
                  <Text style={styles.detailText}>{formatDate(booking.booking_date)}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="time-outline" size={14} color="#9CA3AF" />
                  <Text style={styles.detailText}>
                    {formatTime12h(booking.start_time)} - {formatTime12h(booking.end_time)}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="grid-outline" size={14} color="#9CA3AF" />
                  <Text style={styles.detailText}>Slot {booking.slot_number}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="car-outline" size={14} color="#9CA3AF" />
                  <Text style={styles.detailText}>{booking.vehicle_plate}</Text>
                </View>
              </View>

              {/* Footer */}
              <View style={styles.cardFooter}>
                <View>
                  <Text style={styles.amountLabel}>Total</Text>
                  <Text style={styles.amountValue}>Rs {booking.total_amount}</Text>
                </View>
                <Text style={styles.refText}>{booking.booking_reference}</Text>
              </View>

              {/* Actions */}
              {booking.booking_status === 'active' && (
                <TouchableOpacity
                  style={styles.viewTimerButton}
                  onPress={() => router.push('/(user)/(tabs)/active-timer')}
                >
                  <Ionicons name="time" size={18} color="#fff" />
                  <Text style={styles.viewTimerText}>View Active Timer</Text>
                </TouchableOpacity>
              )}

              {booking.booking_status === 'confirmed' && (
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.cancelBookingButton}
                    onPress={() => handleCancelBooking(booking)}
                  >
                    <Text style={styles.cancelBookingText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.viewTicketButton}
                    onPress={() => router.push({
                      pathname: '/(user)/bookings/confirmation',
                      params: {
                        parkingName: booking.facility_name,
                        slotId: booking.slot_number,
                        date: booking.booking_date,
                        startTime: booking.start_time,
                        endTime: booking.end_time,
                        vehiclePlate: booking.vehicle_plate,
                        vehicleModel: '',
                        totalPrice: booking.total_amount.toString(),
                        bookingReference: booking.booking_reference,
                        paymentMethod: booking.payment_method,
                      }
                    })}
                  >
                    <Text style={styles.viewTicketText}>View Ticket</Text>
                  </TouchableOpacity>
                </View>
              )}

              {booking.booking_status === 'completed' && (
                <TouchableOpacity
                  style={styles.reviewButton}
                  onPress={() => router.push({
                    pathname: '/(user)/reviews/submit-review',
                    params: {
                      facilityId: booking.facility_id,
                      facilityName: booking.facility_name,
                      bookingId: booking.id,
                    }
                  })}
                >
                  <Ionicons name="star-outline" size={18} color="#22C55E" />
                  <Text style={styles.reviewButtonText}>Leave a Review</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <BottomTabs />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  title: { fontSize: 22, fontWeight: '700', color: '#111827', textAlign: 'center' },
  tabsContainer: { flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 20, paddingBottom: 16, gap: 8 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: '#F3F4F6', alignItems: 'center' },
  activeTab: { backgroundColor: '#22C55E' },
  tabText: { fontSize: 12, fontWeight: '600', color: '#9CA3AF' },
  activeTabText: { color: '#fff' },
  content: { padding: 20 },

  // Booking Card
  bookingCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  bookingIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center' },
  bookingName: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 2 },
  bookingAddress: { fontSize: 12, color: '#9CA3AF' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },

  // Details
  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 4, width: '45%' },
  detailText: { fontSize: 13, color: '#6B7280' },

  // Footer
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: 14, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  amountLabel: { fontSize: 11, color: '#9CA3AF', marginBottom: 2 },
  amountValue: { fontSize: 18, fontWeight: '700', color: '#111827' },
  refText: { fontSize: 12, fontWeight: '600', color: '#22C55E' },

  // Actions
  viewTimerButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#22C55E', borderRadius: 10, paddingVertical: 12, marginTop: 14, gap: 8 },
  viewTimerText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  cancelBookingButton: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#FEE2E2', backgroundColor: '#FEF2F2' },
  cancelBookingText: { fontSize: 14, fontWeight: '600', color: '#EF4444' },
  viewTicketButton: { flex: 2, alignItems: 'center', paddingVertical: 12, borderRadius: 10, backgroundColor: '#111827' },
  viewTicketText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  reviewButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0FDF4', borderRadius: 10, paddingVertical: 12, marginTop: 14, gap: 6, borderWidth: 1, borderColor: '#BBF7D0' },
  reviewButtonText: { fontSize: 14, fontWeight: '600', color: '#22C55E' },

  // Empty
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#374151', marginTop: 16 },
  emptySubtext: { fontSize: 14, color: '#9CA3AF', marginTop: 8 },
});

export default BookingHistory;