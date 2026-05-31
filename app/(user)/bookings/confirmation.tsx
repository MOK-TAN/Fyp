import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Animated,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { styles } from './confirmation.styles';

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
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      setShowSuccess(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const getPaymentMethodName = (method: string) => {
    switch (method) {
      
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
        <View style={styles.successBadge}>
          <View style={styles.successBadgeIcon}>
            <Ionicons name="checkmark" size={40} color="#fff" />
          </View>
        </View>

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

        <View style={styles.detailsCard}>
          <Text style={styles.cardTitle}>Booking Details</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Parking Location</Text>
            <Text style={styles.detailValue}>{parkingName}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Parking Slot</Text>
            <View style={styles.slotBadge}>
              <Text style={styles.slotBadgeText}>{params.slotNumber}</Text>
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