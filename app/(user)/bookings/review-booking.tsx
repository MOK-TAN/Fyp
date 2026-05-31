import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { styles } from './review-booking.styles';

export default function ReviewBooking() {
  const params = useLocalSearchParams();
  
  const parkingId = params.parkingId as string;
  const parkingName = params.parkingName as string || 'Parking Spot';
  const pricePerHour = params.pricePerHour as string || '50';
  const slotId = params.slotId as string || 'A1';
  const slotNumber = params.slotNumber as string || slotId;
  const date = params.date as string || '';
  const startTime = params.startTime as string || '';
  const endTime = params.endTime as string || '';
  const duration = params.duration as string || '0';
  const vehicleId = params.vehicleId as string || '';
  const vehiclePlate = params.vehiclePlate as string || '';
  const vehicleType = params.vehicleType as string || '';
  const vehicleModel = params.vehicleModel as string || '';

  const basePrice = parseFloat(duration) * parseFloat(pricePerHour);
  const serviceFee = basePrice * 0.05;
  const totalPrice = basePrice + serviceFee;

  const handleProceedToPayment = () => {
    router.push({
      pathname: '/(user)/bookings/payment-selection',
      params: {
        parkingId,
        parkingName,
        pricePerHour,
        slotId,
        slotNumber,
        date,
        startTime,
        endTime,
        duration,
        vehicleId,
        vehiclePlate,
        vehicleType,
        vehicleModel,
        basePrice: basePrice.toFixed(2),
        serviceFee: serviceFee.toFixed(2),
        totalPrice: totalPrice.toFixed(2),
      },
    });
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
        <Text style={styles.headerTitle}>Review Booking</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="location" size={24} color="#22C55E" />
            <Text style={styles.cardTitle}>Parking Details</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Location</Text>
            <Text style={styles.detailValue}>{parkingName}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Parking Slot</Text>
            <View style={styles.slotBadge}>
              {/* <Text style={styles.slotBadgeText}>{slotId}</Text> */}
              <Text style={styles.slotBadgeText}>{slotNumber}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>{date}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Time</Text>
            <Text style={styles.detailValue}>{startTime} - {endTime}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Duration</Text>
            <Text style={styles.detailValue}>{duration} hours</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="car" size={24} color="#22C55E" />
            <Text style={styles.cardTitle}>Vehicle Details</Text>
          </View>

          <View style={styles.vehicleInfo}>
            <View style={styles.vehicleIconContainer}>
              <Ionicons 
                name={vehicleType === 'bike' ? 'bicycle' : 'car'} 
                size={32} 
                color="#22C55E" 
              />
            </View>
            <View style={styles.vehicleText}>
              <Text style={styles.vehiclePlate}>{vehiclePlate}</Text>
              <Text style={styles.vehicleModel}>{vehicleModel}</Text>
              <Text style={styles.vehicleTypeText}>
                {vehicleType?.charAt(0)?.toUpperCase() + vehicleType?.slice(1) || 'Car'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="receipt" size={24} color="#22C55E" />
            <Text style={styles.cardTitle}>Price Breakdown</Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>
              Base Price ({duration}h × Rs {pricePerHour})
            </Text>
            <Text style={styles.priceValue}>Rs {basePrice.toFixed(2)}</Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Service Fee (5%)</Text>
            <Text style={styles.priceValue}>Rs {serviceFee.toFixed(2)}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>Rs {totalPrice.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.notesCard}>
          <View style={styles.notesHeader}>
            <Ionicons name="information-circle" size={24} color="#F59E0B" />
            <Text style={styles.notesTitle}>Important Information</Text>
          </View>

          <View style={styles.noteItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.noteText}>
              Please arrive at least 5 minutes before your start time
            </Text>
          </View>

          <View style={styles.noteItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.noteText}>
              Grace period of 15 minutes after booking end time
            </Text>
          </View>

          <View style={styles.noteItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.noteText}>
              Payment is secure and processed by trusted partners
            </Text>
          </View>

          <View style={styles.noteItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.noteText}>
              Your slot {slotNumber} will be reserved upon payment confirmation
            </Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <Text style={styles.footerLabel}>Total Amount</Text>
          <Text style={styles.footerAmount}>Rs {totalPrice.toFixed(2)}</Text>
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