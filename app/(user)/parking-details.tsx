import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import BottomTabs from '../../components/BottomTabs';

const ParkingDetails = () => {
  const [isSaved, setIsSaved] = useState(false);

  const handleBooking = () => {
    // Navigate to booking screen or show booking modal
    console.log('Book parking');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Parking Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Parking Image */}
        <View style={styles.imageContainer}>
          <View style={styles.imagePlaceholder}>
            <Ionicons name="car" size={48} color="#22C55E" />
            <Text style={styles.imagePlaceholderText}>Parking Image</Text>
          </View>
        </View>

        {/* Parking Info */}
        <View style={styles.infoSection}>
          <View style={styles.infoHeader}>
            <View style={styles.infoLeft}>
              <Text style={styles.parkingName}>Kathmandu Mall Parking</Text>
              <Text style={styles.parkingAddress}>Sundhara, kathmandu</Text>
            </View>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={() => setIsSaved(!isSaved)}
            >
              <Ionicons
                name={isSaved ? 'bookmark' : 'bookmark-outline'}
                size={24}
                color={isSaved ? '#22C55E' : '#333'}
              />
            </TouchableOpacity>
          </View>

          {/* Distance and Time */}
          <View style={styles.badgesContainer}>
            <View style={styles.distanceBadge}>
              <Text style={styles.distanceBadgeText}>250 m</Text>
            </View>
            <View style={styles.timeBadge}>
              <Text style={styles.timeBadgeText}>8 AM - 9 PM</Text>
            </View>
          </View>
        </View>

        {/* Rules Section */}
        <View style={styles.rulesSection}>
          <Text style={styles.sectionTitle}>Rules</Text>
          <Text style={styles.rulesText}>
            These rules and regulations for the use of Kathmandu mall. In these
            Rules, unless the context otherwise requires effort{' '}
            <Text style={styles.moreLink}>more...</Text>
          </Text>
        </View>

        {/* Availability and Price */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>29 slots available</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>Rs 20 per hour</Text>
          </View>
        </View>

        {/* Book Button */}
        <View style={styles.bookButtonContainer}>
          <TouchableOpacity
            style={styles.bookButton}
            onPress={handleBooking}
            activeOpacity={0.8}
          >
            <Text style={styles.bookButtonText}>Book Parking</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Tabs */}
      <BottomTabs />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  imageContainer: {
    width: '100%',
    height: 220,
    backgroundColor: '#F3F4F6',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
  },
  imagePlaceholderText: {
    marginTop: 8,
    fontSize: 14,
    color: '#22C55E',
    fontWeight: '500',
  },
  infoSection: {
    padding: 20,
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  infoLeft: {
    flex: 1,
  },
  parkingName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 6,
  },
  parkingAddress: {
    fontSize: 14,
    color: '#999',
  },
  saveButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgesContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  distanceBadge: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  distanceBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  timeBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  timeBadgeText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
  },
  rulesSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  rulesText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  moreLink: {
    color: '#22C55E',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginTop: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#D1FAE5',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#22C55E',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#166534',
  },
  bookButtonContainer: {
    padding: 20,
    paddingBottom: 30,
  },
  bookButton: {
    backgroundColor: '#22C55E',
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#22C55E',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default ParkingDetails;