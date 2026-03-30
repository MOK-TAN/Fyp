import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { supabase } from '../../../lib/supabase';

type ActiveBooking = {
  id: string;
  booking_reference: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  duration_hours: number;
  total_amount: number;
  payment_method: string;
  facility_id: string;
  slot_id: string;
  facility_name: string;
  facility_address: string;
  slot_number: string;
  vehicle_plate: string;
  vehicle_model: string;
  price_per_hour: number;
  actual_start_time: string | null;
};

export default function ActiveParking() {
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<ActiveBooking | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [bookedDurationSeconds, setBookedDurationSeconds] = useState(0);
  const [extending, setExtending] = useState(false);
  const [ending, setEnding] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Re-fetch when screen comes into focus (fixes showing after end parking)
  useFocusEffect(
    useCallback(() => {
      // Clear previous state first
      if (timerRef.current) clearInterval(timerRef.current);
      setBooking(null);
      setElapsedSeconds(0);
      
      // Then fetch fresh data
      fetchActiveBooking();
      
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }, [])
  );

  const fetchActiveBooking = async () => {
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
          facility_id,
          slot_id,
          actual_start_time,
          parking_facilities (name, address, price_per_hour),
          parking_slots (slot_number),
          vehicles (plate_number, model)
        `)
        .eq('user_id', user.id)
        .eq('booking_status', 'active')
        .eq('is_timer_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        setBooking(null);
        setLoading(false);
        return;
      }

      const b = data as any;
      const activeBooking: ActiveBooking = {
        id: b.id,
        booking_reference: b.booking_reference,
        booking_date: b.booking_date,
        start_time: b.start_time,
        end_time: b.end_time,
        duration_hours: b.duration_hours,
        total_amount: b.total_amount,
        payment_method: b.payment_method,
        facility_id: b.facility_id,
        slot_id: b.slot_id,
        facility_name: b.parking_facilities?.name || 'Parking',
        facility_address: b.parking_facilities?.address || '',
        slot_number: b.parking_slots?.slot_number || '-',
        vehicle_plate: b.vehicles?.plate_number || 'N/A',
        vehicle_model: b.vehicles?.model || '',
        price_per_hour: b.parking_facilities?.price_per_hour || 0,
        actual_start_time: b.actual_start_time,
      };

      setBooking(activeBooking);

      // Calculate elapsed time since activation (counts UP)
      const startTime = b.actual_start_time
        ? new Date(b.actual_start_time)
        : new Date(); // fallback to now if no actual_start_time

      const now = new Date();
      const elapsed = Math.max(0, Math.floor((now.getTime() - startTime.getTime()) / 1000));
      setElapsedSeconds(elapsed);

      // Calculate booked duration in seconds for warning/overtime
      const bookedSecs = b.duration_hours * 3600;
      setBookedDurationSeconds(bookedSecs);
    } catch (error) {
      console.error('Error fetching active booking:', error);
    } finally {
      setLoading(false);
    }
  };

  // Timer counts UP
  useEffect(() => {
    if (!booking) return;

    timerRef.current = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [booking]);

  const formatTimer = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatTime12h = (time: string) => {
    const parts = time.split(':');
    const hours = parseInt(parts[0]);
    const minutes = parts[1];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes} ${ampm}`;
  };

  // Warning: within 15 min of booked duration
  const isNearingEnd = bookedDurationSeconds > 0 && elapsedSeconds >= (bookedDurationSeconds - 900) && elapsedSeconds < bookedDurationSeconds;
  // Overtime: exceeded booked duration
  const isOvertime = bookedDurationSeconds > 0 && elapsedSeconds >= bookedDurationSeconds;

  const handleExtendTime = () => {
    if (!booking) return;

    Alert.alert(
      'Extend Parking Time',
      `Extend by 1 hour for Rs ${booking.price_per_hour}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Extend',
          onPress: async () => {
            setExtending(true);
            try {
              const currentEnd = new Date(`${booking.booking_date}T${booking.end_time}+05:45`);
              currentEnd.setHours(currentEnd.getHours() + 1);
              const newEndTime = `${currentEnd.getHours().toString().padStart(2, '0')}:${currentEnd.getMinutes().toString().padStart(2, '0')}:00`;

              const newDuration = booking.duration_hours + 1;
              const newTotal = booking.total_amount + booking.price_per_hour;

              const { error } = await supabase
                .from('bookings')
                .update({
                  end_time: newEndTime,
                  duration_hours: newDuration,
                  total_amount: newTotal,
                })
                .eq('id', booking.id);

              if (error) throw error;

              setBooking(prev => prev ? {
                ...prev,
                end_time: newEndTime,
                duration_hours: newDuration,
                total_amount: newTotal,
              } : null);
              setBookedDurationSeconds(prev => prev + 3600);

              Alert.alert('Success', 'Parking extended by 1 hour');
            } catch (error) {
              console.error('Extend error:', error);
              Alert.alert('Error', 'Failed to extend parking');
            } finally {
              setExtending(false);
            }
          },
        },
      ]
    );
  };

  const handleEndParking = () => {
    if (!booking) return;

    Alert.alert(
      'End Parking',
      'Are you sure you want to end your parking session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Session',
          style: 'destructive',
          onPress: async () => {
            setEnding(true);

            // Stop the timer immediately
            if (timerRef.current) clearInterval(timerRef.current);

            try {
              const { error: bookingError } = await supabase
                .from('bookings')
                .update({
                  booking_status: 'completed',
                  is_timer_active: false,
                  actual_end_time: new Date().toISOString(),
                })
                .eq('id', booking.id);

              if (bookingError) throw bookingError;

              const { error: slotError } = await supabase
                .from('parking_slots')
                .update({
                  is_available: true,
                  is_occupied: false,
                  current_booking_id: null,
                })
                .eq('id', booking.slot_id);

              if (slotError) console.error('Slot release error:', slotError);

              // Clear booking state so empty state shows
              setBooking(null);

              // Navigate to review
              router.push({
                pathname: '/(user)/reviews/submit-review',
                params: {
                  facilityId: booking.facility_id,
                  facilityName: booking.facility_name,
                  bookingId: booking.id,
                },
              });
            } catch (error) {
              console.error('End parking error:', error);
              Alert.alert('Error', 'Failed to end parking session');
              setEnding(false);
            }
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

  if (!booking) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Active Parking</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 }}>
          <Ionicons name="car-sport-outline" size={80} color="#D1D5DB" />
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#374151', marginTop: 20, textAlign: 'center' }}>
            No Active Parking
          </Text>
          <Text style={{ fontSize: 14, color: '#9CA3AF', marginTop: 8, textAlign: 'center' }}>
            Your active parking session will appear here after the owner scans your QR code
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: '#22C55E', borderRadius: 12, paddingHorizontal: 32, paddingVertical: 14, marginTop: 24 }}
            onPress={() => router.replace('/(user)/(tabs)')}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Browse Parking</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Active Parking</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Timer Card — Counts UP */}
        <View style={[
          styles.timerCard,
          isOvertime && styles.timerCardOvertime,
          isNearingEnd && !isOvertime && styles.timerCardWarning
        ]}>
          <Text style={styles.timerLabel}>
            {isOvertime ? 'OVERTIME' : 'PARKED FOR'}
          </Text>
          <Text style={styles.timerText}>
            {formatTimer(elapsedSeconds)}
          </Text>
          {isNearingEnd && !isOvertime && (
            <Text style={styles.warningText}>Your booked time is ending soon</Text>
          )}
          {isOvertime && (
            <Text style={styles.overtimeText}>You've exceeded your booked {booking.duration_hours}h — additional charges may apply</Text>
          )}
          {!isNearingEnd && !isOvertime && (
            <Text style={styles.bookedTimeText}>Booked: {booking.duration_hours}h</Text>
          )}
        </View>

        {/* QR Code Card */}
        <View style={styles.qrCard}>
          <Text style={styles.qrTitle}>Show QR at Exit</Text>
          <View style={styles.qrCodeWrapper}>
            <QRCode value={booking.booking_reference} size={180} backgroundColor="white" />
          </View>
          <Text style={styles.qrReference}>{booking.booking_reference}</Text>
        </View>

        {/* Parking Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.cardTitle}>Parking Details</Text>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="location" size={20} color="#22C55E" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Location</Text>
              <Text style={styles.detailValue}>{booking.facility_name}</Text>
              <Text style={styles.detailSubValue}>{booking.facility_address}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="grid" size={20} color="#22C55E" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Slot</Text>
              <Text style={styles.detailValue}>{booking.slot_number}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="time" size={20} color="#22C55E" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Booked Time</Text>
              <Text style={styles.detailValue}>
                {formatTime12h(booking.start_time)} - {formatTime12h(booking.end_time)}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="car" size={20} color="#22C55E" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Vehicle</Text>
              <Text style={styles.detailValue}>{booking.vehicle_plate}</Text>
              {booking.vehicle_model ? <Text style={styles.detailSubValue}>{booking.vehicle_model}</Text> : null}
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="cash" size={20} color="#22C55E" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Amount</Text>
              <Text style={styles.detailValue}>Rs {booking.total_amount}</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.extendButton, extending && { opacity: 0.6 }]}
            onPress={handleExtendTime}
            disabled={extending}
            activeOpacity={0.7}
          >
            {extending ? (
              <ActivityIndicator size="small" color="#22C55E" />
            ) : (
              <>
                <Ionicons name="time-outline" size={20} color="#22C55E" />
                <Text style={styles.extendText}>Extend Time</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.endButton, ending && { opacity: 0.6 }]}
            onPress={handleEndParking}
            disabled={ending}
            activeOpacity={0.7}
          >
            {ending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="stop-circle-outline" size={20} color="#fff" />
                <Text style={styles.endText}>End Parking</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Important Notes */}
        <View style={styles.notesCard}>
          <Text style={styles.notesTitle}>Important Information</Text>
          <View style={styles.noteItem}>
            <Ionicons name="information-circle-outline" size={18} color="#6B7280" />
            <Text style={styles.noteText}>Show QR code at exit gate</Text>
          </View>
          <View style={styles.noteItem}>
            <Ionicons name="time-outline" size={18} color="#6B7280" />
            <Text style={styles.noteText}>Rate: Rs {booking.price_per_hour} per hour</Text>
          </View>
          <View style={styles.noteItem}>
            <Ionicons name="car-outline" size={18} color="#6B7280" />
            <Text style={styles.noteText}>Ensure vehicle is parked in slot {booking.slot_number}</Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#333' },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  timerCard: { backgroundColor: '#22C55E', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 20, shadowColor: '#22C55E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  timerCardWarning: { backgroundColor: '#F59E0B' },
  timerCardOvertime: { backgroundColor: '#EF4444' },
  timerLabel: { fontSize: 14, fontWeight: '600', color: '#fff', opacity: 0.9, marginBottom: 8, letterSpacing: 2 },
  timerText: { fontSize: 56, fontWeight: '700', color: '#fff', letterSpacing: 2 },
  warningText: { fontSize: 13, color: '#fff', marginTop: 8, fontWeight: '500' },
  overtimeText: { fontSize: 13, color: '#fff', marginTop: 8, fontWeight: '600', textAlign: 'center' },
  bookedTimeText: { fontSize: 13, color: '#fff', opacity: 0.8, marginTop: 8 },
  qrCard: { backgroundColor: '#fff', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5 },
  qrTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 16 },
  qrCodeWrapper: { padding: 16, backgroundColor: '#fff', borderRadius: 12, marginBottom: 16 },
  qrReference: { fontSize: 14, fontWeight: '600', color: '#22C55E', letterSpacing: 1 },
  detailsCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 16 },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  detailIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  detailContent: { flex: 1 },
  detailLabel: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
  detailValue: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 2 },
  detailSubValue: { fontSize: 13, color: '#9CA3AF' },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginBottom: 16 },
  actionsContainer: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  extendButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 2, borderColor: '#22C55E', gap: 8 },
  extendText: { fontSize: 14, fontWeight: '600', color: '#22C55E' },
  endButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#EF4444', borderRadius: 12, padding: 16, gap: 8 },
  endText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  notesCard: { backgroundColor: '#FEF3C7', borderRadius: 12, padding: 16, marginBottom: 20 },
  notesTitle: { fontSize: 14, fontWeight: '700', color: '#333', marginBottom: 12 },
  noteItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8, gap: 8 },
  noteText: { fontSize: 13, color: '#6B7280', flex: 1, lineHeight: 18 },
});