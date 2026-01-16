import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import BottomTabs from '../../components/BottomTabs';

// Dummy booking data
const BOOKINGS = {
  active: [
    {
      id: 1,
      name: 'New Road Parking',
      address: 'New Road, Kathmandu',
      price: 'Rs 20',
      priceUnit: '/ 4 hour',
      status: 'Now Active',
      statusColor: '#22C55E',
    },
    {
      id: 2,
      name: 'Thamel Square',
      address: 'Thamel, Kathmandu',
      price: 'Rs 30',
      priceUnit: '/ 4 hour',
      status: 'Starts in 1hr',
      statusColor: '#666',
    },
  ],
  completed: [
    {
      id: 3,
      name: 'Durbar Marg Parking',
      address: 'Durbar Marg, Kathmandu',
      price: 'Rs 50',
      priceUnit: '/ 3 hour',
      date: 'Jan 3, 2026',
    },
    {
      id: 4,
      name: 'Boudha Parking',
      address: 'Boudhanath, Kathmandu',
      price: 'Rs 25',
      priceUnit: '/ 2 hour',
      date: 'Jan 2, 2026',
    },
  ],
};

const BookingHistory = () => {
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');

  const currentBookings = activeTab === 'active' ? BOOKINGS.active : BOOKINGS.completed;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Booking's</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'active' && styles.activeTab]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>
            ACTIVE
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
          onPress={() => setActiveTab('completed')}
        >
          <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>
            COMPLETED
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {currentBookings.map((booking) => (
          <View key={booking.id} style={styles.bookingCard}>
            <View style={styles.bookingImageContainer}>
              <View style={styles.bookingImagePlaceholder}>
                <Ionicons name="car" size={24} color="#22C55E" />
              </View>
            </View>

            <View style={styles.bookingInfo}>
              <Text style={styles.bookingName}>{booking.name}</Text>
              <Text style={styles.bookingAddress}>{booking.address}</Text>
              
              <View style={styles.priceRow}>
                <Text style={styles.price}>{booking.price}</Text>
                <Text style={styles.priceUnit}>{booking.priceUnit}</Text>
                
                {activeTab === 'active' && 'status' in booking && (
                  <View style={[styles.statusBadge, { backgroundColor: booking.statusColor === '#22C55E' ? '#D1FAE5' : '#F3F4F6' }]}>
                    <Text style={[styles.statusText, { color: booking.statusColor }]}>
                      {booking.status}
                    </Text>
                  </View>
                )}
                
                {activeTab === 'completed' && 'date' in booking && (
                  <Text style={styles.dateText}>{booking.date}</Text>
                )}
              </View>
            </View>
          </View>
        ))}

        {/* Action Buttons */}
        {activeTab === 'active' && (
          <View style={styles.actionButtonsContainer}>
            {BOOKINGS.active.map((booking) => (
              <View key={`actions-${booking.id}`} style={styles.actionButtons}>
                <TouchableOpacity style={styles.outlineButton}>
                  <Text style={styles.outlineButtonText}>View Ticket</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.primaryButton}>
                  <Text style={styles.primaryButtonText}>
                    {booking.status === 'Now Active' ? 'View Timer' : 'Direction'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Bottom Tabs */}
      <BottomTabs />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingBottom: 10,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#22C55E',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
  },
  activeTabText: {
    color: '#fff',
  },
  content: {
    padding: 20,
    paddingBottom: 20,
  },
  bookingCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  bookingImageContainer: {
    marginRight: 12,
  },
  bookingImagePlaceholder: {
    width: 70,
    height: 70,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookingInfo: {
    flex: 1,
  },
  bookingName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  bookingAddress: {
    fontSize: 13,
    color: '#999',
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#22C55E',
  },
  priceUnit: {
    fontSize: 12,
    color: '#999',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  dateText: {
    fontSize: 12,
    color: '#999',
  },
  actionButtonsContainer: {
    gap: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  outlineButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  outlineButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  primaryButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#22C55E',
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});

export default BookingHistory;