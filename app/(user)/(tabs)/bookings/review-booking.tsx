import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function ReviewBooking() {
  const params = useLocalSearchParams();
  
  const parkingId = params.parkingId as string;
  const parkingName = params.parkingName as string || 'Parking Spot';
  const pricePerHour = params.pricePerHour as string || '50';
  const date = params.date as string || '03/02/2026';
  const startTime = params.startTime as string || '10:00';
  const endTime = params.endTime as string || '12:00';
  const duration = params.duration as string || '2';
  const totalPrice = params.totalPrice as string || '100';
  const vehicleId = params.vehicleId as string || '1';
  const vehiclePlate = params.vehiclePlate as string || 'BA 12 PA 3456';
  const vehicleType = params.vehicleType as string || 'car';
  const vehicleModel = params.vehicleModel as string || 'Toyota Corolla';

  // Calculate breakdown
  const basePrice = parseFloat(totalPrice) || 100;
  const serviceFee = basePrice * 0.05; // 5% service fee
  const grandTotal = basePrice + serviceFee;

  // Get vehicle icon
  const getVehicleIcon = (type: string) => {
    switch (type) {
      case 'car': return 'car-outline';
      case 'bike': return 'bicycle-outline';
      case 'bus': return 'bus-outline';
      case 'truck': return 'ios-git-compare-outline';
      default: return 'car-outline';
    }
  };

  // Handle proceed to payment
  const handleProceedToPayment = () => {
    // router.push({
    //   pathname: '/(user)/booking/payment-selection',
    //   params: {
    //     parkingId,
    //     parkingName,
    //     pricePerHour,
    //     date,
    //     startTime,
    //     endTime,
    //     duration,
    //     totalPrice: grandTotal.toFixed(0),
    //     basePrice: basePrice.toFixed(0),
    //     serviceFee: serviceFee.toFixed(0),
    //     vehicleId,
    //     vehiclePlate,
    //     vehicleType,
    //     vehicleModel,
    //   },
    // });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review Booking</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Parking Details Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="location" size={24} color="#22C55E" />
            <Text style={styles.cardTitle}>Parking Details</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Location</Text>
            <Text style={styles.detailValue}>{parkingName}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>{date}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Time</Text>
            <Text style={styles.detailValue}>{startTime} - {endTime}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Duration</Text>
            <Text style={styles.detailValue}>{duration} hours</Text>
          </View>
        </View>

        {/* Vehicle Details Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons 
              name={getVehicleIcon(vehicleType) as any} 
              size={24} 
              color="#22C55E" 
            />
            <Text style={styles.cardTitle}>Vehicle Details</Text>
          </View>
          
          <View style={styles.vehicleInfo}>
            <View style={styles.vehicleIcon}>
              <Ionicons
                name={getVehicleIcon(vehicleType) as any}
                size={32}
                color="#22C55E"
              />
            </View>
            <View style={styles.vehicleDetails}>
              <Text style={styles.vehiclePlate}>{vehiclePlate}</Text>
              <Text style={styles.vehicleModel}>{vehicleModel}</Text>
              <Text style={styles.vehicleType}>
                {vehicleType.charAt(0).toUpperCase() + vehicleType.slice(1)}
              </Text>
            </View>
          </View>
        </View>

        {/* Price Breakdown Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="receipt-outline" size={24} color="#22C55E" />
            <Text style={styles.cardTitle}>Price Breakdown</Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>
              Base Price ({duration}h × Rs {pricePerHour})
            </Text>
            <Text style={styles.priceValue}>Rs {basePrice.toFixed(0)}</Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Service Fee (5%)</Text>
            <Text style={styles.priceValue}>Rs {serviceFee.toFixed(0)}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>Rs {grandTotal.toFixed(0)}</Text>
          </View>
        </View>

        {/* Important Notes */}
        <View style={styles.notesCard}>
          <View style={styles.noteRow}>
            <Ionicons name="information-circle" size={20} color="#6B7280" />
            <Text style={styles.noteText}>
              Please arrive on time to avoid cancellation
            </Text>
          </View>
          <View style={styles.noteRow}>
            <Ionicons name="time-outline" size={20} color="#6B7280" />
            <Text style={styles.noteText}>
              Grace period: 15 minutes after start time
            </Text>
          </View>
          <View style={styles.noteRow}>
            <Ionicons name="shield-checkmark" size={20} color="#6B7280" />
            <Text style={styles.noteText}>
              Your payment is secure and encrypted
            </Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Proceed to Payment Button */}
      <View style={styles.footer}>
        <View style={styles.footerTop}>
          <Text style={styles.footerLabel}>Total Amount</Text>
          <Text style={styles.footerPrice}>Rs {grandTotal.toFixed(0)}</Text>
        </View>
        <TouchableOpacity
          style={styles.proceedButton}
          onPress={handleProceedToPayment}
          activeOpacity={0.8}
        >
          <Text style={styles.proceedText}>Proceed to Payment</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
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
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginLeft: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleIcon: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  vehicleDetails: {
    flex: 1,
  },
  vehiclePlate: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  vehicleModel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 2,
  },
  vehicleType: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#22C55E',
  },
  notesCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  noteText: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  footer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  footerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  footerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  footerPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: '#22C55E',
  },
  proceedButton: {
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
  proceedText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
    marginRight: 8,
  },
});