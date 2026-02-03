import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

type PaymentMethod = 'esewa' | 'khalti' | 'cash';

export default function PaymentSelection() {
  const params = useLocalSearchParams();
  
  const parkingId = params.parkingId as string;
  const parkingName = params.parkingName as string || 'Parking Spot';
  const date = params.date as string || '03/02/2026';
  const startTime = params.startTime as string || '10:00';
  const endTime = params.endTime as string || '12:00';
  const duration = params.duration as string || '2';
  const totalPrice = params.totalPrice as string || '105';
  const basePrice = params.basePrice as string || '100';
  const serviceFee = params.serviceFee as string || '5';
  const vehicleId = params.vehicleId as string || '1';
  const vehiclePlate = params.vehiclePlate as string || 'BA 12 PA 3456';
  const vehicleType = params.vehicleType as string || 'car';
  const vehicleModel = params.vehicleModel as string || 'Toyota Corolla';

  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Handle payment
  const handlePayment = async () => {
    if (!selectedPayment) {
      Alert.alert('Payment Method Required', 'Please select a payment method to continue');
      return;
    }

    setIsProcessing(true);

    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      
      // Navigate to confirmation
    //   router.replace({
    //     pathname: '/(user)/booking/confirmation',
    //     params: {
    //       bookingReference: `PK${Date.now()}`,
    //       parkingId,
    //       parkingName,
    //       date,
    //       startTime,
    //       endTime,
    //       duration,
    //       totalPrice,
    //       vehiclePlate,
    //       vehicleType,
    //       vehicleModel,
    //       paymentMethod: selectedPayment,
    //     },
    //   });
    }, 1500);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          disabled={isProcessing}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Amount Card */}
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Total Amount to Pay</Text>
          <Text style={styles.amountValue}>Rs {totalPrice}</Text>
          <View style={styles.amountBreakdown}>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Base Price</Text>
              <Text style={styles.breakdownValue}>Rs {basePrice}</Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Service Fee</Text>
              <Text style={styles.breakdownValue}>Rs {serviceFee}</Text>
            </View>
          </View>
        </View>

        {/* Payment Methods */}
        <Text style={styles.sectionTitle}>Select Payment Method</Text>

        {/* eSewa */}
        <TouchableOpacity
          style={[
            styles.paymentCard,
            selectedPayment === 'esewa' && styles.paymentCardSelected
          ]}
          onPress={() => setSelectedPayment('esewa')}
          disabled={isProcessing}
          activeOpacity={0.7}
        >
          <View style={styles.radioContainer}>
            <View style={[
              styles.radioOuter,
              selectedPayment === 'esewa' && styles.radioOuterSelected
            ]}>
              {selectedPayment === 'esewa' && (
                <View style={styles.radioInner} />
              )}
            </View>
          </View>

          <View style={[
            styles.paymentIcon,
            selectedPayment === 'esewa' && styles.paymentIconSelected
          ]}>
            <Text style={styles.paymentIconText}>eSewa</Text>
          </View>

          <View style={styles.paymentInfo}>
            <Text style={styles.paymentName}>eSewa</Text>
            <Text style={styles.paymentDescription}>Digital wallet payment</Text>
          </View>

          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        {/* Khalti */}
        <TouchableOpacity
          style={[
            styles.paymentCard,
            selectedPayment === 'khalti' && styles.paymentCardSelected
          ]}
          onPress={() => setSelectedPayment('khalti')}
          disabled={isProcessing}
          activeOpacity={0.7}
        >
          <View style={styles.radioContainer}>
            <View style={[
              styles.radioOuter,
              selectedPayment === 'khalti' && styles.radioOuterSelected
            ]}>
              {selectedPayment === 'khalti' && (
                <View style={styles.radioInner} />
              )}
            </View>
          </View>

          <View style={[
            styles.paymentIcon,
            styles.paymentIconKhalti,
            selectedPayment === 'khalti' && styles.paymentIconSelected
          ]}>
            <Text style={[styles.paymentIconText, { color: '#5C2D91' }]}>Khalti</Text>
          </View>

          <View style={styles.paymentInfo}>
            <Text style={styles.paymentName}>Khalti</Text>
            <Text style={styles.paymentDescription}>Digital wallet payment</Text>
          </View>

          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        {/* Cash */}
        <TouchableOpacity
          style={[
            styles.paymentCard,
            selectedPayment === 'cash' && styles.paymentCardSelected
          ]}
          onPress={() => setSelectedPayment('cash')}
          disabled={isProcessing}
          activeOpacity={0.7}
        >
          <View style={styles.radioContainer}>
            <View style={[
              styles.radioOuter,
              selectedPayment === 'cash' && styles.radioOuterSelected
            ]}>
              {selectedPayment === 'cash' && (
                <View style={styles.radioInner} />
              )}
            </View>
          </View>

          <View style={[
            styles.paymentIcon,
            styles.paymentIconCash,
            selectedPayment === 'cash' && styles.paymentIconSelected
          ]}>
            <Ionicons name="cash-outline" size={28} color="#F59E0B" />
          </View>

          <View style={styles.paymentInfo}>
            <Text style={styles.paymentName}>Cash</Text>
            <Text style={styles.paymentDescription}>Pay at parking location</Text>
          </View>

          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        {/* Payment Info */}
        <View style={styles.infoCard}>
          <Ionicons name="shield-checkmark" size={24} color="#22C55E" />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>Secure Payment</Text>
            <Text style={styles.infoText}>
              Your payment information is encrypted and secure
            </Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Pay Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.payButton,
            (!selectedPayment || isProcessing) && styles.payButtonDisabled
          ]}
          onPress={handlePayment}
          disabled={!selectedPayment || isProcessing}
          activeOpacity={0.8}
        >
          {isProcessing ? (
            <Text style={styles.payButtonText}>Processing...</Text>
          ) : (
            <>
              <Text style={styles.payButtonText}>
                Pay Rs {totalPrice}
              </Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  amountCard: {
    backgroundColor: '#22C55E',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  amountLabel: {
    fontSize: 14,
    color: '#F0FDF4',
    marginBottom: 8,
    fontWeight: '500',
  },
  amountValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  amountBreakdown: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    paddingTop: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  breakdownLabel: {
    fontSize: 13,
    color: '#F0FDF4',
  },
  breakdownValue: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  paymentCardSelected: {
    borderColor: '#22C55E',
    backgroundColor: '#F0FDF4',
  },
  radioContainer: {
    marginRight: 12,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: '#22C55E',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22C55E',
  },
  paymentIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  paymentIconSelected: {
    backgroundColor: '#F0FDF4',
  },
  paymentIconKhalti: {
    backgroundColor: '#F3E8FF',
  },
  paymentIconCash: {
    backgroundColor: '#FEF3C7',
  },
  paymentIconText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#22C55E',
  },
  paymentInfo: {
    flex: 1,
  },
  paymentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  paymentDescription: {
    fontSize: 13,
    color: '#6B7280',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  infoTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  footer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  payButton: {
    flexDirection: 'row',
    backgroundColor: '#22C55E',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  payButtonDisabled: {
    backgroundColor: '#D1D5DB',
    shadowOpacity: 0,
    elevation: 0,
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
});