import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';

export default function Confirmation() {
  const params = useLocalSearchParams();
  
  const parkingName = params.parkingName as string || 'Parking Spot';
  const slotId = params.slotId as string || 'A1';
  const date = params.date as string || '';
  const startTime = params.startTime as string || '';
  const endTime = params.endTime as string || '';
  const vehiclePlate = params.vehiclePlate as string || '';
  const vehicleModel = params.vehicleModel as string || '';
  const totalPrice = params.totalPrice as string || '0';
  const bookingReference = params.bookingReference as string || 'PK00000000';
  const paymentMethod = params.paymentMethod as string || 'cash';

  const [showSuccess, setShowSuccess] = useState(true);
  const scaleAnim = new Animated.Value(0);

  useEffect(() => {
    // Success animation
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();

    // Hide success overlay after 2 seconds
    const timer = setTimeout(() => {
      setShowSuccess(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const getPaymentMethodName = (method: string) => {
    switch (method) {
      case 'esewa': return 'eSewa';
      case 'khalti': return 'Khalti';
      case 'cash': return 'Cash';
      default: return 'Cash';
    }
  };

  const handleDone = () => {
    router.replace('/(user)/(tabs)');
  };

  return (
    <View style={styles.container}>
      {/* Success Overlay */}
      {showSuccess && (
        <View style={styles.successOverlay}>
          <Animated.View style={[
            styles.successContent,
            { transform: [{ scale: scaleAnim }] }
          ]}>
            <View style={styles.successIconContainer}>
              <Ionicons name="checkmark" size={64} color="#fff" />
            </View>
            <Text style={styles.successText}>Booking Confirmed!</Text>
          </Animated.View>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <View style={{ width: 24 }} />
        <Text style={styles.headerTitle}>Booking Confirmed</Text>
        <TouchableOpacity
          onPress={handleDone}
          style={styles.closeButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Badge */}
        <View style={styles.successBadge}>
          <View style={styles.successBadgeIcon}>
            <Ionicons name="checkmark" size={40} color="#fff" />
          </View>
        </View>

        {/* QR Code Card */}
        <View style={styles.qrCard}>
          <Text style={styles.qrTitle}>Your Parking QR Code</Text>
          <View style={styles.qrCodeWrapper}>
            <QRCode
              value={bookingReference}
              size={200}
              backgroundColor="white"
            />
          </View>
          <Text style={styles.qrReference}>{bookingReference}</Text>
        </View>

        {/* Booking Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.cardTitle}>Booking Details</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Parking Location</Text>
            <Text style={styles.detailValue}>{parkingName}</Text>
          </View>

          <View style={styles.divider} />

          {/* Slot Display */}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Parking Slot</Text>
            <View style={styles.slotBadge}>
              <Text style={styles.slotBadgeText}>{slotId}</Text>
            </View>
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
            <Text style={styles.detailLabel}>Vehicle</Text>
            <View>
              <Text style={styles.detailValue}>{vehiclePlate}</Text>
              <Text style={styles.detailSubValue}>{vehicleModel}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Total Paid</Text>
            <Text style={styles.detailValuePrice}>Rs {totalPrice}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment Method</Text>
            <Text style={styles.detailValue}>{getPaymentMethodName(paymentMethod)}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton} activeOpacity={0.7}>
            <Ionicons name="download-outline" size={20} color="#22C55E" />
            <Text style={styles.actionText}>Download QR</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} activeOpacity={0.7}>
            <Ionicons name="share-social-outline" size={20} color="#22C55E" />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
        </View>

        {/* Important Information */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle" size={24} color="#F59E0B" />
            <Text style={styles.infoTitle}>Important Information</Text>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="qr-code" size={18} color="#6B7280" />
            <Text style={styles.infoText}>
              Show this QR code at the entrance to access your parking slot
            </Text>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="time" size={18} color="#6B7280" />
            <Text style={styles.infoText}>
              Please arrive on time. Late arrivals may result in slot reassignment
            </Text>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="shield-checkmark" size={18} color="#6B7280" />
            <Text style={styles.infoText}>
              Keep your QR code safe and do not share it with others
            </Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Done Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.doneButton}
          onPress={handleDone}
          activeOpacity={0.8}
        >
          <Text style={styles.doneText}>Done</Text>
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
  successOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  successContent: {
    alignItems: 'center',
  },
  successIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  successBadge: {
    alignItems: 'center',
    marginBottom: 24,
  },
  successBadgeIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  qrCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  qrTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
  },
  qrCodeWrapper: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
  },
  qrReference: {
    fontSize: 14,
    fontWeight: '600',
    color: '#22C55E',
    letterSpacing: 1,
  },
  detailsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
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
  },
  detailSubValue: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 2,
  },
  detailValuePrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#22C55E',
  },
  slotBadge: {
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#22C55E',
  },
  slotBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#22C55E',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#22C55E',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#22C55E',
    marginLeft: 8,
  },
  infoCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginLeft: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 12,
    flex: 1,
    lineHeight: 18,
  },
  footer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  doneButton: {
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
  doneText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
});