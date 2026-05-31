//before 2

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
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
import { supabase } from '../../../lib/supabase';
import { styles } from './bookings.styles';

type BookingStatus = 'all' | 'confirmed' | 'active' | 'completed' | 'cancelled';

type Booking = {
  id: string;
  booking_reference: string;
   facility_id: string; 
   user_id: string | null;
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
    payment_method: string | null;
  is_walkin: boolean;
  guest_name: string | null;
  guest_plate: string | null;
  slot_id: string;
  actual_start_time: string | null;
};

// ─── Live Timer Component ───────────────────────────────────────────────────
function LiveTimer({ actualStartTime }: { actualStartTime: string | null }) {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const startMs = actualStartTime
      ? new Date(actualStartTime).getTime()
      : Date.now();

    const tick = () => {
      const now = Date.now();
      setElapsed(Math.floor((now - startMs) / 1000));
    };

    tick();
    intervalRef.current = setInterval(tick, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [actualStartTime]);

  const hours = Math.floor(elapsed / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  const seconds = elapsed % 60;

  const pad = (n: number) => String(n).padStart(2, '0');
  const display = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

  return (
    <View style={timerStyles.container}>
      <Ionicons name="time-outline" size={16} color="#22C55E" />
      <Text style={timerStyles.text}>{display}</Text>
    </View>
  );
}

const timerStyles = {
  container: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
    alignSelf: 'flex-start' as const,
    marginBottom: 10,
  },
  text: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#15803D',
    fontVariant: ['tabular-nums'] as any,
    letterSpacing: 1,
  },
};

export default function Bookings() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<BookingStatus>('all');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get owner's facility IDs
      const { data: facilities } = await supabase
        .from('parking_facilities')
        .select('id')
        .eq('owner_id', user.id);

      if (!facilities || facilities.length === 0) {
        setBookings([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const facilityIds = facilities.map(f => f.id);

      // Fetch all bookings for owner's facilities with joins
      const { data, error } = await supabase
        .from('bookings')
        .select(`
  id,
  booking_reference,
  user_id,
  facility_id,
  booking_date,
  start_time,
  end_time,
  total_amount,
  payment_status,
  booking_status,
  slot_id,
  actual_start_time,
  payment_method,
  is_walkin,
  guest_name,
  guest_plate,
  parking_facilities (name),
  profiles (full_name),
  vehicles (plate_number),
  parking_slots (slot_number)
`)
        .in('facility_id', facilityIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedBookings: Booking[] = (data || []).map((b: any) => ({
        id: b.id,
  booking_reference: b.booking_reference,
  facility_id: b.facility_id,
  user_id: b.user_id,
  facility_name: b.parking_facilities?.name || 'Unknown',
        customer_name: b.is_walkin ? (b.guest_name || 'Walk-in Guest') : (b.profiles?.full_name || 'Guest'),
        vehicle_plate: b.is_walkin ? (b.guest_plate || 'N/A') : (b.vehicles?.plate_number || 'N/A'),
        slot_number: b.parking_slots?.slot_number || '-',
        booking_date: b.booking_date,
        start_time: b.start_time,
        end_time: b.end_time,
        total_amount: b.total_amount,
        payment_status: b.payment_status,
        booking_status: b.booking_status,
        payment_method: b.payment_method || null,
        is_walkin: b.is_walkin || false,
        guest_name: b.guest_name || null,
        guest_plate: b.guest_plate || null,
        slot_id: b.slot_id,
        actual_start_time: b.actual_start_time || null,
      }));

      setBookings(formattedBookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      Alert.alert('Error', 'Failed to load bookings');
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
      `Are you sure you want to cancel booking ${booking.booking_reference}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              // Update booking status
              const { error: bookingError } = await supabase
                .from('bookings')
                .update({
                  booking_status: 'cancelled',
                  is_timer_active: false,
                })
                .eq('id', booking.id);

              if (bookingError) throw bookingError;

              // Notify the user their booking was cancelled (skip walk-in guests)
              if (booking.user_id) {
                try {
                  await supabase.from('notifications').insert({
                    user_id: booking.user_id,
                    type: 'booking_cancelled',
                    title: 'Booking Cancelled',
                    message: `Your booking at ${booking.facility_name} (${booking.booking_reference}) has been cancelled by the parking owner.`,
                    booking_id: booking.id,
                    facility_id: booking.facility_id,
                  });
                } catch (notifError) {
                  console.error('Notification error:', notifError);
                }
              }

              // Free up the slot
              const { error: slotError } = await supabase
                .from('parking_slots')
                .update({
                  is_available: true,
                  is_occupied: false,
                  current_booking_id: null,
                })
                .eq('id', booking.slot_id);

              if (slotError) {
                console.error('Slot release error:', slotError);
              }

              // Update local state
              setBookings(prev =>
                prev.map(b =>
                  b.id === booking.id ? { ...b, booking_status: 'cancelled' } : b
                )
              );

              Alert.alert('Success', 'Booking cancelled successfully');
            } catch (error: any) {
              console.error('Cancel error:', error);
              Alert.alert('Error', 'Failed to cancel booking');
            }
          },
        },
      ]
    );
  };

  const handleActivateBooking = (booking: Booking) => {
    Alert.alert(
      'Activate Parking',
      `Start parking timer for ${booking.customer_name}?\n\nSlot: ${booking.slot_number}\nVehicle: ${booking.vehicle_plate}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Activate',
          onPress: async () => {
            try {
              const now = new Date().toISOString();

              const { error } = await supabase
                .from('bookings')
                .update({
                  booking_status: 'active',
                  is_timer_active: true,
                  actual_start_time: now,
                })
                .eq('id', booking.id);

              if (error) throw error;

              // Update local state
              setBookings(prev =>
                prev.map(b =>
                  b.id === booking.id
                    ? { ...b, booking_status: 'active', actual_start_time: now }
                    : b
                )
              );

              Alert.alert('Parking Activated', `Timer started for ${booking.customer_name} at slot ${booking.slot_number}`);
            } catch (error: any) {
              console.error('Activate error:', error);
              Alert.alert('Error', 'Failed to activate parking');
            }
          },
        },
      ]
    );
  };

  // Owner stops an active session, then verifies cash payment
  const handleStopParking = (booking: Booking) => {
    Alert.alert(
      'Stop Parking',
      `End the session for ${booking.customer_name} (slot ${booking.slot_number})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Stop',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error: bErr } = await supabase
                .from('bookings')
                .update({
                  booking_status: 'completed',
                  is_timer_active: false,
                  actual_end_time: new Date().toISOString(),
                })
                .eq('id', booking.id);
              if (bErr) throw bErr;

              const { error: sErr } = await supabase
                .from('parking_slots')
                .update({ is_available: true, is_occupied: false, current_booking_id: null })
                .eq('id', booking.slot_id);
              if (sErr) console.error('Slot release error:', sErr);

              setBookings(prev =>
                prev.map(b =>
                  b.id === booking.id ? { ...b, booking_status: 'completed' } : b
                )
              );

              // Khalti is already paid — only ask for cash
              if (booking.payment_method === 'cash' && booking.payment_status !== 'paid') {
                Alert.alert(
                  'Payment Received?',
                  `Did ${booking.customer_name} pay Rs ${booking.total_amount} in cash?`,
                  [
                    { text: 'Unpaid', style: 'cancel', onPress: () => markPayment(booking, false) },
                    { text: 'Paid', onPress: () => markPayment(booking, true) },
                  ]
                );
              } else {
                Alert.alert('Session Ended', 'Parking session completed.');
              }
            } catch (error) {
              console.error('Stop parking error:', error);
              Alert.alert('Error', 'Failed to stop parking');
            }
          },
        },
      ]
    );
  };

  // Owner marks a cash booking paid / unpaid
  const markPayment = async (booking: Booking, paid: boolean) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ payment_status: paid ? 'paid' : 'pending' })
        .eq('id', booking.id);
      if (error) throw error;

      setBookings(prev =>
        prev.map(b =>
          b.id === booking.id ? { ...b, payment_status: paid ? 'paid' : 'pending' } : b
        )
      );

      // Notify the user (skip walk-in guests with no user_id)
      if (paid && booking.user_id && !booking.is_walkin) {
        try {
          await supabase.from('notifications').insert({
            user_id: booking.user_id,
            type: 'payment_success',
            title: 'Payment Confirmed',
            message: `Your cash payment of Rs ${booking.total_amount} for ${booking.booking_reference} has been confirmed.`,
            booking_id: booking.id,
            facility_id: booking.facility_id,
          });
        } catch (notifErr) {
          console.error('Notification error:', notifErr);
        }
      }

      Alert.alert(paid ? 'Marked Paid' : 'Marked Unpaid', paid ? 'Payment confirmed.' : 'Left as pending.');
    } catch (error) {
      console.error('Mark payment error:', error);
      Alert.alert('Error', 'Failed to update payment status');
    }
  };

  const formatTime = (time: string) => {
    // time comes as "HH:MM:SS" or "HH:MM" from DB
    const parts = time.split(':');
    const hours = parseInt(parts[0]);
    const minutes = parts[1];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes} ${ampm}`;
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
        <TouchableOpacity onPress={onRefresh}>
          <Ionicons name="refresh-outline" size={24} color="#111827" />
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
            style={[styles.filterTab, selectedStatus === 'confirmed' && styles.filterTabActive]}
            onPress={() => setSelectedStatus('confirmed')}
          >
            <Text style={[styles.filterTabText, selectedStatus === 'confirmed' && styles.filterTabTextActive]}>
              Confirmed ({getStatusCount('confirmed')})
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
              {searchQuery ? 'Try a different search' : 'Bookings will appear here when customers book'}
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
                    booking.booking_status === 'confirmed' && styles.statusActive,
                    booking.booking_status === 'active' && styles.statusActive,
                    booking.booking_status === 'completed' && styles.statusCompleted,
                    booking.booking_status === 'cancelled' && styles.statusCancelled,
                  ]}>
                    <Text style={[
                      styles.statusText,
                      booking.booking_status === 'confirmed' && styles.statusTextActive,
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
                    {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
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

              {/* Activate Button (only for confirmed bookings) */}
              {booking.booking_status === 'confirmed' && (
                <View style={styles.actionButtonsRow}>
                  <TouchableOpacity
                    style={styles.activateButton}
                    onPress={() => handleActivateBooking(booking)}
                  >
                    <Ionicons name="play-circle" size={18} color="#fff" />
                    <Text style={styles.activateButtonText}>Activate Parking</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cancelButtonSmall}
                    onPress={() => handleCancelBooking(booking)}
                  >
                    <Ionicons name="close-circle-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              )}

              {/* Live Timer + Cancel Button (only for active bookings) */}
              {/* {booking.booking_status === 'active' && (
                <View>
                  <LiveTimer actualStartTime={booking.actual_start_time} />
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => handleCancelBooking(booking)}
                  >
                    <Ionicons name="close-circle-outline" size={18} color="#EF4444" />
                    <Text style={styles.cancelButtonText}>Cancel Booking</Text>
                  </TouchableOpacity>
                </View>
              )} */}

              {/* Live Timer + Stop / Cancel (active bookings) */}
              {booking.booking_status === 'active' && (
                <View>
                  <LiveTimer actualStartTime={booking.actual_start_time} />
                  <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#22C55E', borderRadius: 12, paddingVertical: 14, marginTop: 12 }}
                    onPress={() => handleStopParking(booking)}
                  >
                    <Ionicons name="stop-circle-outline" size={18} color="#fff" />
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Stop Parking</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => handleCancelBooking(booking)}
                  >
                    <Ionicons name="close-circle-outline" size={18} color="#EF4444" />
                    <Text style={styles.cancelButtonText}>Cancel Booking</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Verify cash payment (completed cash bookings not yet paid) */}
              {booking.booking_status === 'completed' &&
                booking.payment_method === 'cash' &&
                booking.payment_status !== 'paid' && (
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                    <TouchableOpacity
                      style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#22C55E', borderRadius: 12, paddingVertical: 12 }}
                      onPress={() => markPayment(booking, true)}
                    >
                      <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Mark Paid</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#EF4444', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 18 }}
                      onPress={() => markPayment(booking, false)}
                    >
                      <Text style={{ color: '#EF4444', fontWeight: '700', fontSize: 14 }}>Unpaid</Text>
                    </TouchableOpacity>
                  </View>
                )}
            </View>
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}