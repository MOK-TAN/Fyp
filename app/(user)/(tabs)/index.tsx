import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import BottomTabs from '../../../components/BottomTabs';
import FilterModal from '../../../components/FilterModal';

const { width, height } = Dimensions.get('window');

// Dummy parking data for Kathmandu locations
const PARKING_SPOTS = [
  {
    id: 1,
    name: 'New Road Parking',
    address: 'New Road, Kathmandu',
    distance: '2km',
    price: 'Rs 199',
    priceUnit: '/hour',
    image: 'https://via.placeholder.com/60',
    rating: 4.5,
  },
  {
    id: 2,
    name: 'Thamel Square Parking',
    address: 'Thamel, Kathmandu',
    distance: '5km',
    price: 'Rs 300',
    priceUnit: '/hour',
    image: 'https://via.placeholder.com/60',
    rating: 4.8,
  },
  {
    id: 3,
    name: 'Bagbazar Parking Zone',
    address: 'Bagbazar, Kathmandu',
    distance: '3.5km',
    price: 'Rs 250',
    priceUnit: '/hour',
    image: 'https://via.placeholder.com/60',
    rating: 4.3,
  },
  {
    id: 4,
    name: 'Durbar Marg Parking',
    address: 'Durbar Marg, Kathmandu',
    distance: '4km',
    price: 'Rs 400',
    priceUnit: '/hour',
    image: 'https://via.placeholder.com/60',
    rating: 4.7,
  },
  {
    id: 5,
    name: 'Boudha Stupa Parking',
    address: 'Boudhanath, Kathmandu',
    distance: '8km',
    price: 'Rs 200',
    priceUnit: '/hour',
    image: 'https://via.placeholder.com/60',
    rating: 4.4,
  },
];

const UserDashboard = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  
  // Active booking state (demo - in real app, fetch from database)
  const [hasActiveBooking, setHasActiveBooking] = useState(true);
  const [activeBookingTime, setActiveBookingTime] = useState(5400); // 1.5 hours in seconds
  const [activeParkingName] = useState('New Road Parking');
  const [activeVehicle] = useState('BA 12 PA 3456');

  // Timer countdown
  useEffect(() => {
    if (hasActiveBooking && activeBookingTime > 0) {
      const timer = setInterval(() => {
        setActiveBookingTime(prev => {
          if (prev <= 0) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [hasActiveBooking, activeBookingTime]);

  // Format time as HH:MM:SS
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Filter parking spots based on search
  const filteredSpots = PARKING_SPOTS.filter((spot) =>
    spot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    spot.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle filter apply
  const handleFilterApply = (filters: any) => {
    console.log('Filters applied:', filters);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>A</Text>
          </View>
          <View>
            <Text style={styles.greeting}>Good morning, Acharya</Text>
            <Text style={styles.location}>naxal, kathmandu</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.notificationButton}>
          <Ionicons name="notifications-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Active Parking Card - NEW */}
        {hasActiveBooking && (
          <View style={styles.activeParkingContainer}>
            <TouchableOpacity
              style={styles.activeCard}
              onPress={() => router.push('/(user)/(tabs)/active-timer')}
              activeOpacity={0.8}
            >
              <View style={styles.activeCardTop}>
                <View style={styles.activeCardLeft}>
                  <View style={styles.activeIconContainer}>
                    <Ionicons name="time" size={28} color="#22C55E" />
                  </View>
                  <View>
                    <Text style={styles.activeLabel}>Active Parking</Text>
                    <Text style={styles.activeParkingNameText}>{activeParkingName}</Text>
                    <Text style={styles.activeVehicleText}>{activeVehicle}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#22C55E" />
              </View>
              
              <View style={styles.timerContainer}>
                <Ionicons name="timer-outline" size={20} color="#22C55E" />
                <Text style={styles.timerText}>{formatTime(activeBookingTime)}</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TouchableOpacity 
            style={styles.searchBar}
            onPress={() => router.push('/(user)/search')}
            activeOpacity={0.7}
          >
            <Ionicons name="search-outline" size={20} color="#999" />
            <Text style={styles.searchPlaceholder}>Search for parking</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => setShowFilter(true)}
          >
            <Ionicons name="options-outline" size={20} color="#22C55E" />
          </TouchableOpacity>
        </View>

        {/* Map View */}
        <View style={styles.mapContainer}>
          <Image
            source={require('../../../assets/images/map.png')}
            style={styles.map}
            resizeMode="cover"
          />
        </View>

        {/* Parking Nearby Section */}
        <View style={styles.parkingSection}>
          <Text style={styles.sectionTitle}>Parking Nearby</Text>
          
          {filteredSpots.map((spot) => (
            <TouchableOpacity
              key={spot.id}
              style={styles.parkingCard}
              onPress={() => {
                router.push({
                  pathname: '/(user)/parking-details',
                  params: {
                    parkingId: spot.id.toString(),
                    parkingName: spot.name,
                    parkingAddress: spot.address,
                    pricePerHour: spot.price.replace('Rs ', ''),
                    distance: spot.distance,
                  }
                });
              }}
              activeOpacity={0.7}
            >
              <View style={styles.parkingImageContainer}>
                <View style={styles.parkingImagePlaceholder}>
                  <Ionicons name="car-outline" size={24} color="#22C55E" />
                </View>
              </View>
              
              <View style={styles.parkingInfo}>
                <Text style={styles.parkingName}>{spot.name}</Text>
                <Text style={styles.parkingAddress}>{spot.address}</Text>
              </View>
              
              <View style={styles.parkingRight}>
                <Text style={styles.distance}>{spot.distance}</Text>
                <View style={styles.priceContainer}>
                  <Text style={styles.price}>{spot.price}</Text>
                  <Text style={styles.priceUnit}>{spot.priceUnit}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Filter Modal */}
      <FilterModal
        visible={showFilter}
        onClose={() => setShowFilter(false)}
        onApply={handleFilterApply}
      />

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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: '#fff',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  greeting: {
    fontSize: 14,
    color: '#999',
  },
  location: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  notificationButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  // Active Parking Card Styles
  activeParkingContainer: {
    paddingHorizontal: 20,
    paddingTop: 15,
    backgroundColor: '#fff',
  },
  activeCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#22C55E',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 15,
  },
  activeCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  activeCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  activeIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activeLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  activeParkingNameText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 2,
  },
  activeVehicleText: {
    fontSize: 12,
    color: '#6B7280',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    justifyContent: 'center',
  },
  timerText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#22C55E',
    marginLeft: 8,
    letterSpacing: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 48,
    marginRight: 10,
  },
  searchPlaceholder: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#999',
  },
  filterButton: {
    width: 48,
    height: 48,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapContainer: {
    height: height * 0.3,
    backgroundColor: '#E5E7EB',
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  parkingSection: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 15,
  },
  parkingCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  parkingImageContainer: {
    marginRight: 12,
  },
  parkingImagePlaceholder: {
    width: 60,
    height: 60,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  parkingInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  parkingName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  parkingAddress: {
    fontSize: 12,
    color: '#999',
  },
  parkingRight: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  distance: {
    fontSize: 13,
    fontWeight: '600',
    color: '#22C55E',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  priceUnit: {
    fontSize: 11,
    color: '#999',
  },
});

export default UserDashboard;