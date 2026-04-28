import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../../../lib/supabase';

type PaymentMethod = 'esewa' | 'khalti' | 'cash';

export default function PaymentSelection() {
  const params = useLocalSearchParams();

  const parkingId = params.parkingId as string;
  const parkingName = params.parkingName as string || 'Parking Spot';
  const pricePerHour = params.pricePerHour as string || '50';
  const slotId = params.slotId as string;
  const date = params.date as string || '';
  const startTime = params.startTime as string || '';
  const endTime = params.endTime as string || '';
  const duration = params.duration as string || '0';
  const vehicleId = params.vehicleId as string || '';
  const vehiclePlate = params.vehiclePlate as string || '';
  const vehicleType = params.vehicleType as string || '';
  const vehicleModel = params.vehicleModel as string || '';
  const basePrice = params.basePrice as string || '0';
  const serviceFee = params.serviceFee as string || '0';
  const totalPrice = params.totalPrice as string || '0';

  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const generateBookingReference = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `PK${year}${month}${day}${random}`;
  };

  const handlePayment = async () => {
    if (!selectedPayment) {
      Alert.alert('Error', 'Please select a payment method');
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Get authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'Please login to continue');
        setIsProcessing(false);
        return;
      }

      const userId = user.id;
      const bookingReference = generateBookingReference();
      let finalVehicleId = vehicleId;

      // 2. If manual vehicle entry, create vehicle first
      if (vehicleId.startsWith('manual-')) {
        const { data: newVehicle, error: vehicleError } = await supabase
          .from('vehicles')
          .insert({
            user_id: userId,
            plate_number: vehiclePlate,
            model: vehicleModel,
            vehicle_type: vehicleType || 'car',
            color: 'Not specified',
            is_default: false,
          })
          .select()
          .single();

        if (vehicleError) {
          console.error('Error creating vehicle:', vehicleError);
          Alert.alert('Error', 'Failed to save vehicle. Please try again.');
          setIsProcessing(false);
          return;
        }

        finalVehicleId = newVehicle.id;
      }

      // 3. Create booking in database
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          user_id: userId,
          facility_id: parkingId,
          slot_id: slotId,
          vehicle_id: finalVehicleId,
          booking_reference: bookingReference,
          booking_date: date,
          start_time: startTime,
          end_time: endTime,
          duration_hours: parseFloat(duration),
          base_price: parseFloat(basePrice),
          service_fee: parseFloat(serviceFee),
          total_amount: parseFloat(totalPrice),
          payment_method: selectedPayment,
          payment_status: selectedPayment === 'cash' ? 'pending' : 'paid',
          booking_status: 'confirmed',
          is_timer_active: false,
        })
        .select()
        .single();

      if (bookingError) {
        console.error('Booking error:', bookingError);
        Alert.alert('Booking Failed', bookingError.message || 'Failed to create booking. Please try again.');
        setIsProcessing(false);
        return;
      }

      // 4. Update slot — mark as occupied
      const { error: slotError } = await supabase
        .from('parking_slots')
        .update({
          is_available: false,
          is_occupied: true,
          current_booking_id: booking.id,
        })
        .eq('id', slotId);

      if (slotError) {
        console.error('Slot update error:', slotError);
        // Booking was created but slot update failed — not critical, log it
      }

      // 4.5. Send notifications
      try {
        const { data: facility } = await supabase
          .from('parking_facilities')
          .select('owner_id, name')
          .eq('id', parkingId)
          .single();

        if (facility) {
          const isPaid = selectedPayment !== 'cash';
          const paymentLabel = isPaid ? `${selectedPayment.toUpperCase()} (Paid)` : 'Cash (Pending)';

          await supabase.from('notifications').insert([
            // User: booking confirmed
            {
              user_id: userId,
              type: 'booking_confirmed',
              title: 'Booking Confirmed',
              message: `Your booking at ${facility.name} is confirmed. Ref: ${bookingReference}`,
              booking_id: booking.id,
              facility_id: parkingId,
            },
            // Owner: new booking
            {
              user_id: facility.owner_id,
              type: 'booking_confirmed',
              title: 'New Booking Received',
              message: `New booking at ${facility.name} for slot ${slotId}. Ref: ${bookingReference}`,
              booking_id: booking.id,
              facility_id: parkingId,
            },
            // Owner: payment status
            {
              user_id: facility.owner_id,
              type: isPaid ? 'payment_success' : 'payment_failed',
              title: isPaid ? 'Payment Received' : 'Payment Pending',
              message: `Payment for ${bookingReference}: ${paymentLabel}. Amount: Rs ${totalPrice}`,
              booking_id: booking.id,
              facility_id: parkingId,
              data: {
                payment_method: selectedPayment,
                payment_status: isPaid ? 'paid' : 'pending',
                amount: parseFloat(totalPrice),
              },
            },
          ]);
        }
      } catch (notifError) {
        console.error('Notification error:', notifError);
      }

      // 5. Navigate to confirmation with real data
      setIsProcessing(false);

      router.push({
        pathname: '/(user)/bookings/confirmation',
        params: {
          parkingId,
          parkingName,
          pricePerHour,
          slotId,
          date,
          startTime,
          endTime,
          duration,
          vehicleId: finalVehicleId,
          vehiclePlate,
          vehicleType,
          vehicleModel,
          basePrice,
          serviceFee,
          totalPrice,
          bookingReference,
          paymentMethod: selectedPayment,
        },
      });
    } catch (error: any) {
      console.error('Payment error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Method</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Total Amount</Text>
          <Text style={styles.amountValue}>Rs {totalPrice}</Text>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownText}>Base: Rs {basePrice}</Text>
            <Text style={styles.breakdownDot}>•</Text>
            <Text style={styles.breakdownText}>Fee: Rs {serviceFee}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Select Payment Method</Text>

        <TouchableOpacity
          style={[styles.paymentCard, selectedPayment === 'esewa' && styles.paymentCardSelected]}
          onPress={() => setSelectedPayment('esewa')}
          activeOpacity={0.7}
        >
          <View style={styles.radioContainer}>
            <View style={[styles.radioOuter, selectedPayment === 'esewa' && styles.radioOuterSelected]}>
              {selectedPayment === 'esewa' && <View style={styles.radioInner} />}
            </View>
          </View>
          <View style={[styles.paymentIcon, { backgroundColor: '#D1FAE5' }]}>
            <Ionicons name="wallet" size={28} color="#22C55E" />
          </View>
          <View style={styles.paymentInfo}>
            <Text style={styles.paymentName}>eSewa</Text>
            <Text style={styles.paymentDesc}>Pay with eSewa digital wallet</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.paymentCard, selectedPayment === 'khalti' && styles.paymentCardSelected]}
          onPress={() => setSelectedPayment('khalti')}
          activeOpacity={0.7}
        >
          <View style={styles.radioContainer}>
            <View style={[styles.radioOuter, selectedPayment === 'khalti' && styles.radioOuterSelected]}>
              {selectedPayment === 'khalti' && <View style={styles.radioInner} />}
            </View>
          </View>
          <View style={[styles.paymentIcon, { backgroundColor: '#EDE9FE' }]}>
            <Ionicons name="card" size={28} color="#7C3AED" />
          </View>
          <View style={styles.paymentInfo}>
            <Text style={styles.paymentName}>Khalti</Text>
            <Text style={styles.paymentDesc}>Pay with Khalti digital wallet</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.paymentCard, selectedPayment === 'cash' && styles.paymentCardSelected]}
          onPress={() => setSelectedPayment('cash')}
          activeOpacity={0.7}
        >
          <View style={styles.radioContainer}>
            <View style={[styles.radioOuter, selectedPayment === 'cash' && styles.radioOuterSelected]}>
              {selectedPayment === 'cash' && <View style={styles.radioInner} />}
            </View>
          </View>
          <View style={[styles.paymentIcon, { backgroundColor: '#FED7AA' }]}>
            <Ionicons name="cash" size={28} color="#EA580C" />
          </View>
          <View style={styles.paymentInfo}>
            <Text style={styles.paymentName}>Cash</Text>
            <Text style={styles.paymentDesc}>Pay at parking location</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        <View style={styles.secureCard}>
          <Ionicons name="shield-checkmark" size={24} color="#22C55E" />
          <View style={styles.secureInfo}>
            <Text style={styles.secureTitle}>Secure Payment</Text>
            <Text style={styles.secureText}>Your payment information is encrypted and secure</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.payButton, (!selectedPayment || isProcessing) && styles.payButtonDisabled]}
          onPress={handlePayment}
          disabled={!selectedPayment || isProcessing}
          activeOpacity={0.8}
        >
          {isProcessing ? (
            <>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={[styles.payButtonText, { marginLeft: 12 }]}>Processing...</Text>
            </>
          ) : (
            <>
              <Text style={styles.payButtonText}>Pay Rs {totalPrice}</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#333' },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  amountCard: { backgroundColor: '#22C55E', borderRadius: 16, padding: 24, marginBottom: 24, alignItems: 'center', shadowColor: '#22C55E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  amountLabel: { fontSize: 14, color: '#fff', opacity: 0.9, marginBottom: 8 },
  amountValue: { fontSize: 40, fontWeight: '700', color: '#fff', marginBottom: 8 },
  breakdownRow: { flexDirection: 'row', alignItems: 'center' },
  breakdownText: { fontSize: 13, color: '#fff', opacity: 0.9 },
  breakdownDot: { fontSize: 13, color: '#fff', opacity: 0.9, marginHorizontal: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 16 },
  paymentCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 2, borderColor: '#E5E7EB' },
  paymentCardSelected: { borderColor: '#22C55E', backgroundColor: '#F0FDF4' },
  radioContainer: { marginRight: 12 },
  radioOuter: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#D1D5DB', justifyContent: 'center', alignItems: 'center' },
  radioOuterSelected: { borderColor: '#22C55E' },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#22C55E' },
  paymentIcon: { width: 56, height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  paymentInfo: { flex: 1 },
  paymentName: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 4 },
  paymentDesc: { fontSize: 13, color: '#6B7280' },
  secureCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDF4', borderRadius: 12, padding: 16, marginTop: 8 },
  secureInfo: { marginLeft: 12, flex: 1 },
  secureTitle: { fontSize: 14, fontWeight: '600', color: '#22C55E', marginBottom: 4 },
  secureText: { fontSize: 12, color: '#6B7280', lineHeight: 16 },
  footer: { backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  payButton: { flexDirection: 'row', backgroundColor: '#22C55E', height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center', shadowColor: '#22C55E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  payButtonDisabled: { backgroundColor: '#D1D5DB', shadowOpacity: 0, elevation: 0 },
  payButtonText: { fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: 0.5, marginRight: 8 },
});