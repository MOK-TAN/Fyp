import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';

export default function ActiveParking() {
  // Demo data (in real app, fetch from database/state)
  const [timeRemaining, setTimeRemaining] = useState(5400); // 1.5 hours in seconds
  const [parkingName] = useState('New Road Parking');
  const [parkingAddress] = useState('New Road, Kathmandu');
  const [bookingReference] = useState('PK20260204001');
  const [vehiclePlate] = useState('BA 12 PA 3456');
  const [vehicleModel] = useState('Toyota Corolla');
  const [startTime] = useState('10:00 AM');
  const [endTime] = useState('12:00 PM');
  const [totalAmount] = useState('105');

  // Timer countdown
  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 0) return 0;
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeRemaining]);

  // Format time as HH:MM:SS
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Check if overtime (less than 15 minutes remaining)
  const isNearingEnd = timeRemaining < 900; // 15 minutes
  const isOvertime = timeRemaining <= 0;

  // Handle extend time
  const handleExtendTime = () => {
    Alert.alert(
      'Extend Parking Time',
      'Would you like to extend your parking by 1 hour?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Extend',
          onPress: () => {
            setTimeRemaining(prev => prev + 3600); // Add 1 hour
            Alert.alert('Success', 'Parking time extended by 1 hour');
          },
        },
      ]
    );
  };

  // Handle end parking
  const handleEndParking = () => {
    Alert.alert(
      'End Parking',
      'Are you sure you want to end your parking session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End',
          style: 'destructive',
          onPress: () => {
            // Navigate to review screen
            router.push({
              pathname: '/(user)/reviews/submit-review',
              params: {
                parkingId: '1',
                parkingName: parkingName,
                bookingId: bookingReference,
              }
            });
          },
        },
      ]
    );
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
        <Text style={styles.headerTitle}>Active Parking</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Timer Card */}
        <View style={[
          styles.timerCard,
          isOvertime && styles.timerCardOvertime,
          isNearingEnd && !isOvertime && styles.timerCardWarning
        ]}>
          <Text style={styles.timerLabel}>
            {isOvertime ? 'OVERTIME' : 'TIME REMAINING'}
          </Text>
          <Text style={[
            styles.timerText,
            isOvertime && styles.timerTextOvertime
          ]}>
            {formatTime(Math.abs(timeRemaining))}
          </Text>
          {isNearingEnd && !isOvertime && (
            <Text style={styles.warningText}>⚠️ Parking ending soon</Text>
          )}
          {isOvertime && (
            <Text style={styles.overtimeText}>⚠️ Additional charges may apply</Text>
          )}
        </View>

        {/* QR Code Card */}
        <View style={styles.qrCard}>
          <Text style={styles.qrTitle}>Show QR at Exit</Text>
          <View style={styles.qrCodeWrapper}>
            <QRCode
              value={bookingReference}
              size={180}
              backgroundColor="white"
            />
          </View>
          <Text style={styles.qrReference}>{bookingReference}</Text>
        </View>

        {/* show the qr code and when scan then it can make that timer run */}

        {/* Parking Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.cardTitle}>Parking Details</Text>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="location" size={20} color="#22C55E" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Location</Text>
              <Text style={styles.detailValue}>{parkingName}</Text>
              <Text style={styles.detailSubValue}>{parkingAddress}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="time" size={20} color="#22C55E" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Time Slot</Text>
              <Text style={styles.detailValue}>{startTime} - {endTime}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="car" size={20} color="#22C55E" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Vehicle</Text>
              <Text style={styles.detailValue}>{vehiclePlate}</Text>
              <Text style={styles.detailSubValue}>{vehicleModel}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="cash" size={20} color="#22C55E" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Amount Paid</Text>
              <Text style={styles.detailValue}>Rs {totalAmount}</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.extendButton}
            onPress={handleExtendTime}
            activeOpacity={0.7}
          >
            <Ionicons name="time-outline" size={20} color="#22C55E" />
            <Text style={styles.extendText}>Extend Time</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.endButton}
            onPress={handleEndParking}
            activeOpacity={0.7}
          >
            <Ionicons name="stop-circle-outline" size={20} color="#fff" />
            <Text style={styles.endText}>End Parking</Text>
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
            <Text style={styles.noteText}>Overtime charges: Rs 20 per 15 minutes</Text>
          </View>
          <View style={styles.noteItem}>
            <Ionicons name="car-outline" size={18} color="#6B7280" />
            <Text style={styles.noteText}>Ensure vehicle is parked in designated slot</Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
  timerCard: {
    backgroundColor: '#22C55E',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  timerCardWarning: {
    backgroundColor: '#F59E0B',
  },
  timerCardOvertime: {
    backgroundColor: '#EF4444',
  },
  timerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    opacity: 0.9,
    marginBottom: 8,
    letterSpacing: 2,
  },
  timerText: {
    fontSize: 56,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 2,
  },
  timerTextOvertime: {
    color: '#fff',
  },
  warningText: {
    fontSize: 13,
    color: '#fff',
    marginTop: 8,
    fontWeight: '500',
  },
  overtimeText: {
    fontSize: 13,
    color: '#fff',
    marginTop: 8,
    fontWeight: '600',
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
    marginBottom: 16,
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
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  detailSubValue: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 16,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  extendButton: {
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
  extendText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#22C55E',
    marginLeft: 8,
  },
  endButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    borderRadius: 12,
    padding: 16,
  },
  endText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  notesCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  noteItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  noteText: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
});