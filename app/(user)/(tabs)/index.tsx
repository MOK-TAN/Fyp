import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Animated,
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

// Dummy parking data
const PARKING_SPOTS = [
  {
    id: 1,
    name: 'New Road Parking',
    address: 'New Road, Kathmandu',
    distance: '2km',
    price: '199',
    priceUnit: '/hour',
    rating: 4.5,
    slotsAvailable: 12,
    totalSlots: 20,
    amenities: ['CCTV', 'Covered', '24/7'],
    isOpen: true,
  },
  {
    id: 2,
    name: 'Thamel Square Parking',
    address: 'Thamel, Kathmandu',
    distance: '5km',
    price: '300',
    priceUnit: '/hour',
    rating: 4.8,
    slotsAvailable: 8,
    totalSlots: 15,
    amenities: ['CCTV', 'Security', 'Covered'],
    isOpen: true,
  },
  {
    id: 3,
    name: 'Bagbazar Parking Zone',
    address: 'Bagbazar, Kathmandu',
    distance: '3.5km',
    price: '250',
    priceUnit: '/hour',
    rating: 4.3,
    slotsAvailable: 5,
    totalSlots: 10,
    amenities: ['CCTV', '24/7'],
    isOpen: true,
  },
  {
    id: 4,
    name: 'Durbar Marg Parking',
    address: 'Durbar Marg, Kathmandu',
    distance: '4km',
    price: '400',
    priceUnit: '/hour',
    rating: 4.7,
    slotsAvailable: 0,
    totalSlots: 12,
    amenities: ['CCTV', 'Covered', 'Security', 'EV'],
    isOpen: false,
  },
  {
    id: 5,
    name: 'Boudha Stupa Parking',
    address: 'Boudhanath, Kathmandu',
    distance: '8km',
    price: '200',
    priceUnit: '/hour',
    rating: 4.4,
    slotsAvailable: 15,
    totalSlots: 25,
    amenities: ['CCTV', '24/7'],
    isOpen: true,
  },
];

const UserDashboard = () => {
  const [showFilter, setShowFilter] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('nearby');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  
  // Active booking state
  const [hasActiveBooking, setHasActiveBooking] = useState(true);
  const [activeBookingTime, setActiveBookingTime] = useState(5400);
  const [activeParkingName] = useState('New Road Parking');
  const [activeSlot] = useState('A3');
  const [activeVehicle] = useState('BA 12 PA 3456');
  const [isActiveExpanded, setIsActiveExpanded] = useState(false);

  // Animation for active booking pulse
  const pulseAnim = new Animated.Value(1);

  useEffect(() => {
    if (hasActiveBooking) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [hasActiveBooking]);

  // Timer countdown
  useEffect(() => {
    if (hasActiveBooking && activeBookingTime > 0) {
      const timer = setInterval(() => {
        setActiveBookingTime(prev => {
          if (prev <= 0) return 0;
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [hasActiveBooking, activeBookingTime]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Filter parking spots
  const getFilteredSpots = () => {
    let filtered = [...PARKING_SPOTS];
    
    switch(selectedFilter) {
      case 'nearby':
        filtered.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
        break;
      case 'cheapest':
        filtered.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
        break;
      case 'available':
        filtered = filtered.filter(spot => spot.isOpen && spot.slotsAvailable > 0);
        break;
    }
    
    return filtered;
  };

  const filteredSpots = getFilteredSpots();

  const handleFilterApply = (filters: any) => {
    console.log('Filters applied:', filters);
  };

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, index) => (
      <Ionicons
        key={index}
        name={index < Math.floor(rating) ? 'star' : 'star-outline'}
        size={14}
        color="#F59E0B"
      />
    ));
  };

  return (
    <View style={styles.container}>
      {/* Header with Gradient */}
      <View style={styles.headerGradient}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>A</Text>
            </View>
            <View>
              <Text style={styles.greeting}>Good morning, Acharya</Text>
              <View style={styles.locationRow}>
                <Ionicons name="location" size={14} color="#22C55E" />
                <Text style={styles.location}>Naxal, Kathmandu</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>3</Text>
            </View>
            <Ionicons name="notifications" size={24} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar - PRIMARY ACTION */}
        <View style={styles.searchSection}>
          <TouchableOpacity 
            style={styles.searchBar}
            onPress={() => router.push('/(user)/search')}
            activeOpacity={0.7}
          >
            <Ionicons name="search" size={22} color="#22C55E" />
            <Text style={styles.searchPlaceholder}>Where do you want to park?</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.filterButtonMain}
            onPress={() => setShowFilter(true)}
          >
            <Ionicons name="options" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Quick Filter Chips */}
        <View style={styles.quickFilters}>
          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedFilter === 'nearby' && styles.filterChipActive
            ]}
            onPress={() => setSelectedFilter('nearby')}
          >
            <Ionicons 
              name="navigate" 
              size={16} 
              color={selectedFilter === 'nearby' ? '#fff' : '#22C55E'} 
            />
            <Text style={[
              styles.filterChipText,
              selectedFilter === 'nearby' && styles.filterChipTextActive
            ]}>
              Nearby
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedFilter === 'cheapest' && styles.filterChipActive
            ]}
            onPress={() => setSelectedFilter('cheapest')}
          >
            <Ionicons 
              name="cash" 
              size={16} 
              color={selectedFilter === 'cheapest' ? '#fff' : '#22C55E'} 
            />
            <Text style={[
              styles.filterChipText,
              selectedFilter === 'cheapest' && styles.filterChipTextActive
            ]}>
              Cheapest
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedFilter === 'available' && styles.filterChipActive
            ]}
            onPress={() => setSelectedFilter('available')}
          >
            <Ionicons 
              name="checkmark-circle" 
              size={16} 
              color={selectedFilter === 'available' ? '#fff' : '#22C55E'} 
            />
            <Text style={[
              styles.filterChipText,
              selectedFilter === 'available' && styles.filterChipTextActive
            ]}>
              Available
            </Text>
          </TouchableOpacity>
        </View>

        {/* Map View */}
        <View style={styles.mapContainer}>
          <Image
            source={require('../../../assets/images/map.png')}
            style={styles.map}
            resizeMode="cover"
          />
          <View style={styles.mapOverlay}>
            <View style={styles.mapPin}>
              <Ionicons name="location" size={24} color="#fff" />
            </View>
          </View>
        </View>

        {/* Active Booking - Compact & Expandable */}
        {hasActiveBooking && (
          <View style={styles.activeSection}>
            <Animated.View style={[
              styles.activeBookingCard,
              { transform: [{ scale: pulseAnim }] }
            ]}>
              <TouchableOpacity
                style={styles.activeBookingContent}
                onPress={() => router.push('/(user)/(tabs)/active-timer')}
                activeOpacity={0.8}
              >
                <View style={styles.activeBookingLeft}>
                  <View style={styles.activeBookingIcon}>
                    <Ionicons name="time" size={20} color="#fff" />
                  </View>
                  <View style={styles.activeBookingInfo}>
                    <Text style={styles.activeBookingLabel}>ACTIVE PARKING</Text>
                    <Text style={styles.activeBookingName}>
                      {activeParkingName} • Slot {activeSlot}
                    </Text>
                    <Text style={styles.activeBookingVehicle}>{activeVehicle}</Text>
                  </View>
                </View>
                <View style={styles.activeBookingRight}>
                  <Text style={styles.activeBookingTimer}>{formatTime(activeBookingTime)}</Text>
                  <Ionicons name="chevron-forward" size={20} color="#fff" />
                </View>
              </TouchableOpacity>
            </Animated.View>
          </View>
        )}

        {/* Parking List Section */}
        <View style={styles.parkingSection}>
          <View style={styles.parkingSectionHeader}>
            <Text style={styles.sectionTitle}>
              Parking Nearby ({filteredSpots.length})
            </Text>
            <View style={styles.viewToggle}>
              <TouchableOpacity
                style={[
                  styles.viewToggleBtn,
                  viewMode === 'list' && styles.viewToggleBtnActive
                ]}
                onPress={() => setViewMode('list')}
              >
                <Ionicons 
                  name="list" 
                  size={18} 
                  color={viewMode === 'list' ? '#fff' : '#6B7280'} 
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.viewToggleBtn,
                  viewMode === 'grid' && styles.viewToggleBtnActive
                ]}
                onPress={() => setViewMode('grid')}
              >
                <Ionicons 
                  name="grid" 
                  size={18} 
                  color={viewMode === 'grid' ? '#fff' : '#6B7280'} 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Parking Cards */}
          {viewMode === 'list' ? (
            // List View
            <>
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
                        pricePerHour: spot.price,
                        distance: spot.distance,
                      }
                    });
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.parkingCardHeader}>
                    <View style={styles.parkingIconContainer}>
                      <Ionicons name="car-sport" size={28} color="#22C55E" />
                    </View>
                    
                    <View style={styles.parkingCardInfo}>
                      <Text style={styles.parkingName}>{spot.name}</Text>
                      <View style={styles.parkingMeta}>
                        <View style={styles.ratingContainer}>
                          {renderStars(spot.rating)}
                          <Text style={styles.ratingText}>{spot.rating}</Text>
                        </View>
                        <View style={styles.metaDivider} />
                        <Ionicons name="navigate" size={14} color="#6B7280" />
                        <Text style={styles.distanceText}>{spot.distance}</Text>
                      </View>
                      <Text style={styles.parkingAddress}>{spot.address}</Text>
                    </View>
                  </View>

                  <View style={styles.parkingCardFooter}>
                    <View style={styles.availabilityBadge}>
                      <View style={[
                        styles.availabilityDot,
                        !spot.isOpen && styles.availabilityDotClosed
                      ]} />
                      <Text style={[
                        styles.availabilityText,
                        !spot.isOpen && styles.availabilityTextClosed
                      ]}>
                        {spot.isOpen 
                          ? `${spot.slotsAvailable} slots available`
                          : 'Full'}
                      </Text>
                    </View>

                    <View style={styles.priceContainerNew}>
                      <Text style={styles.priceNew}>Rs {spot.price}</Text>
                      <Text style={styles.priceUnitNew}>/hr</Text>
                    </View>
                  </View>

                  {/* Amenities */}
                  <View style={styles.amenitiesRow}>
                    {spot.amenities.slice(0, 3).map((amenity, index) => (
                      <View key={index} style={styles.amenityBadge}>
                        <Text style={styles.amenityBadgeText}>{amenity}</Text>
                      </View>
                    ))}
                    {spot.amenities.length > 3 && (
                      <Text style={styles.moreAmenities}>+{spot.amenities.length - 3}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </>
          ) : (
            // Grid View
            <View style={styles.parkingGrid}>
              {filteredSpots.map((spot) => (
                <TouchableOpacity
                  key={spot.id}
                  style={styles.parkingGridCard}
                  onPress={() => {
                    router.push({
                      pathname: '/(user)/parking-details',
                      params: {
                        parkingId: spot.id.toString(),
                        parkingName: spot.name,
                        parkingAddress: spot.address,
                        pricePerHour: spot.price,
                        distance: spot.distance,
                      }
                    });
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.gridCardTop}>
                    <View style={styles.gridIconContainer}>
                      <Ionicons name="car-sport" size={24} color="#22C55E" />
                    </View>
                    <View style={[
                      styles.gridStatusDot,
                      !spot.isOpen && styles.gridStatusDotClosed
                    ]} />
                  </View>
                  
                  <Text style={styles.gridParkingName} numberOfLines={1}>
                    {spot.name}
                  </Text>
                  
                  <View style={styles.gridRating}>
                    <Ionicons name="star" size={12} color="#F59E0B" />
                    <Text style={styles.gridRatingText}>{spot.rating}</Text>
                  </View>
                  
                  <View style={styles.gridFooter}>
                    <Text style={styles.gridPrice}>Rs {spot.price}/hr</Text>
                    <Text style={styles.gridDistance}>{spot.distance}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={{ height: 120 }} />
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
  headerGradient: {
    backgroundColor: '#fff',
    paddingBottom: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  greeting: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 4,
  },
  notificationButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#EF4444',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  notificationBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  searchSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 15,
    backgroundColor: '#fff',
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 2,
    borderColor: '#22C55E',
  },
  searchPlaceholder: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },
  filterButtonMain: {
    width: 56,
    height: 56,
    backgroundColor: '#22C55E',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  quickFilters: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 10,
    backgroundColor: '#fff',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#22C55E',
  },
  filterChipActive: {
    backgroundColor: '#22C55E',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#22C55E',
    marginLeft: 6,
  },
  filterChipTextActive: {
    color: '#fff',
  },
  mapContainer: {
    height: height * 0.25,
    backgroundColor: '#E5E7EB',
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  mapOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPin: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  activeSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  activeBookingCard: {
    backgroundColor: '#22C55E',
    borderRadius: 20,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  activeBookingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  activeBookingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  activeBookingIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activeBookingInfo: {
    flex: 1,
  },
  activeBookingLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 1,
    marginBottom: 4,
  },
  activeBookingName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  activeBookingVehicle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  activeBookingRight: {
    alignItems: 'flex-end',
  },
  activeBookingTimer: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 1,
    marginBottom: 4,
  },
  parkingSection: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -12,
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  parkingSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 2,
  },
  viewToggleBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  viewToggleBtnActive: {
    backgroundColor: '#22C55E',
  },
  parkingCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  parkingCardHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  parkingIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  parkingCardInfo: {
    flex: 1,
  },
  parkingName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 6,
  },
  parkingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginLeft: 4,
  },
  metaDivider: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 8,
  },
  distanceText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    marginLeft: 4,
  },
  parkingAddress: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  parkingCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  availabilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  availabilityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
    marginRight: 6,
  },
  availabilityDotClosed: {
    backgroundColor: '#EF4444',
  },
  availabilityText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#22C55E',
  },
  availabilityTextClosed: {
    color: '#EF4444',
  },
  priceContainerNew: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceNew: {
    fontSize: 20,
    fontWeight: '700',
    color: '#22C55E',
  },
  priceUnitNew: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginLeft: 2,
  },
  amenitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  amenityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#22C55E',
  },
  amenityBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#22C55E',
  },
  moreAmenities: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    paddingHorizontal: 8,
  },
  // Grid View Styles
  parkingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  parkingGridCard: {
    width: (width - 52) / 2,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  gridCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  gridIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridStatusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22C55E',
  },
  gridStatusDotClosed: {
    backgroundColor: '#EF4444',
  },
  gridParkingName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 6,
  },
  gridRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  gridRatingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginLeft: 4,
  },
  gridFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gridPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#22C55E',
  },
  gridDistance: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
});

export default UserDashboard;

// import { Ionicons } from '@expo/vector-icons';
// import { router } from 'expo-router';
// import React, { useEffect, useState } from 'react';
// import {
//   Dimensions,
//   Image,
//   ScrollView,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from 'react-native';
// import BottomTabs from '../../../components/BottomTabs';
// import FilterModal from '../../../components/FilterModal';

// const { width, height } = Dimensions.get('window');

// // Dummy parking data for Kathmandu locations
// const PARKING_SPOTS = [
//   {
//     id: 1,
//     name: 'New Road Parking',
//     address: 'New Road, Kathmandu',
//     distance: '2km',
//     price: 'Rs 199',
//     priceUnit: '/hour',
//     image: 'https://via.placeholder.com/60',
//     rating: 4.5,
//   },
//   {
//     id: 2,
//     name: 'Thamel Square Parking',
//     address: 'Thamel, Kathmandu',
//     distance: '5km',
//     price: 'Rs 300',
//     priceUnit: '/hour',
//     image: 'https://via.placeholder.com/60',
//     rating: 4.8,
//   },
//   {
//     id: 3,
//     name: 'Bagbazar Parking Zone',
//     address: 'Bagbazar, Kathmandu',
//     distance: '3.5km',
//     price: 'Rs 250',
//     priceUnit: '/hour',
//     image: 'https://via.placeholder.com/60',
//     rating: 4.3,
//   },
//   {
//     id: 4,
//     name: 'Durbar Marg Parking',
//     address: 'Durbar Marg, Kathmandu',
//     distance: '4km',
//     price: 'Rs 400',
//     priceUnit: '/hour',
//     image: 'https://via.placeholder.com/60',
//     rating: 4.7,
//   },
//   {
//     id: 5,
//     name: 'Boudha Stupa Parking',
//     address: 'Boudhanath, Kathmandu',
//     distance: '8km',
//     price: 'Rs 200',
//     priceUnit: '/hour',
//     image: 'https://via.placeholder.com/60',
//     rating: 4.4,
//   },
// ];

// const UserDashboard = () => {
//   const [searchQuery, setSearchQuery] = useState('');
//   const [showFilter, setShowFilter] = useState(false);
  
//   // Active booking state (demo - in real app, fetch from database)
//   const [hasActiveBooking, setHasActiveBooking] = useState(true);
//   const [activeBookingTime, setActiveBookingTime] = useState(5400); // 1.5 hours in seconds
//   const [activeParkingName] = useState('New Road Parking');
//   const [activeVehicle] = useState('BA 12 PA 3456');

//   // Timer countdown
//   useEffect(() => {
//     if (hasActiveBooking && activeBookingTime > 0) {
//       const timer = setInterval(() => {
//         setActiveBookingTime(prev => {
//           if (prev <= 0) {
//             return 0;
//           }
//           return prev - 1;
//         });
//       }, 1000);
//       return () => clearInterval(timer);
//     }
//   }, [hasActiveBooking, activeBookingTime]);

//   // Format time as HH:MM:SS
//   const formatTime = (seconds: number) => {
//     const h = Math.floor(seconds / 3600);
//     const m = Math.floor((seconds % 3600) / 60);
//     const s = seconds % 60;
//     return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
//   };

//   // Filter parking spots based on search
//   const filteredSpots = PARKING_SPOTS.filter((spot) =>
//     spot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
//     spot.address.toLowerCase().includes(searchQuery.toLowerCase())
//   );

//   // Handle filter apply
//   const handleFilterApply = (filters: any) => {
//     console.log('Filters applied:', filters);
//   };

//   return (
//     <View style={styles.container}>
//       {/* Header */}
//       <View style={styles.header}>
//         <View style={styles.headerLeft}>
//           <View style={styles.avatar}>
//             <Text style={styles.avatarText}>A</Text>
//           </View>
//           <View>
//             <Text style={styles.greeting}>Good morning, Acharya</Text>
//             <Text style={styles.location}>naxal, kathmandu</Text>
//           </View>
//         </View>
//         <TouchableOpacity style={styles.notificationButton}>
//           <Ionicons name="notifications-outline" size={24} color="#333" />
//         </TouchableOpacity>
//       </View>

//       <ScrollView 
//         style={styles.scrollView}
//         showsVerticalScrollIndicator={false}
//       >
        

//         {/* Search Bar */}
//         <View style={styles.searchContainer}>
//           <TouchableOpacity 
//             style={styles.searchBar}
//             onPress={() => router.push('/(user)/search')}
//             activeOpacity={0.7}
//           >
//             <Ionicons name="search-outline" size={20} color="#999" />
//             <Text style={styles.searchPlaceholder}>Search for parking</Text>
//           </TouchableOpacity>
//           <TouchableOpacity 
//             style={styles.filterButton}
//             onPress={() => setShowFilter(true)}
//           >
//             <Ionicons name="options-outline" size={20} color="#22C55E" />
//           </TouchableOpacity>
//         </View>

//         {/* Active Parking Card - NEW */}
//         {hasActiveBooking && (
//           <View style={styles.activeParkingContainer}>
//             <TouchableOpacity
//               style={styles.activeCard}
//               onPress={() => router.push('/(user)/(tabs)/active-timer')}
//               activeOpacity={0.8}
//             >
//               <View style={styles.activeCardTop}>
//                 <View style={styles.activeCardLeft}>
//                   <View style={styles.activeIconContainer}>
//                     <Ionicons name="time" size={28} color="#22C55E" />
//                   </View>
//                   <View>
//                     <Text style={styles.activeLabel}>Active Parking</Text>
//                     <Text style={styles.activeParkingNameText}>{activeParkingName}</Text>
//                     <Text style={styles.activeVehicleText}>{activeVehicle}</Text>
//                   </View>
//                 </View>
//                 <Ionicons name="chevron-forward" size={24} color="#22C55E" />
//               </View>
              
//               <View style={styles.timerContainer}>
//                 <Ionicons name="timer-outline" size={20} color="#22C55E" />
//                 <Text style={styles.timerText}>{formatTime(activeBookingTime)}</Text>
//               </View>
//             </TouchableOpacity>
//           </View>
//         )}

//         {/* Map View */}
//         <View style={styles.mapContainer}>
//           <Image
//             source={require('../../../assets/images/map.png')}
//             style={styles.map}
//             resizeMode="cover"
//           />
//         </View>

//         {/* Parking Nearby Section */}
//         <View style={styles.parkingSection}>
//           <Text style={styles.sectionTitle}>Parking Nearby</Text>
          
//           {filteredSpots.map((spot) => (
//             <TouchableOpacity
//               key={spot.id}
//               style={styles.parkingCard}
//               onPress={() => {
//                 router.push({
//                   pathname: '/(user)/parking-details',
//                   params: {
//                     parkingId: spot.id.toString(),
//                     parkingName: spot.name,
//                     parkingAddress: spot.address,
//                     pricePerHour: spot.price.replace('Rs ', ''),
//                     distance: spot.distance,
//                   }
//                 });
//               }}
//               activeOpacity={0.7}
//             >
//               <View style={styles.parkingImageContainer}>
//                 <View style={styles.parkingImagePlaceholder}>
//                   <Ionicons name="car-outline" size={24} color="#22C55E" />
//                 </View>
//               </View>
              
//               <View style={styles.parkingInfo}>
//                 <Text style={styles.parkingName}>{spot.name}</Text>
//                 <Text style={styles.parkingAddress}>{spot.address}</Text>
//               </View>
              
//               <View style={styles.parkingRight}>
//                 <Text style={styles.distance}>{spot.distance}</Text>
//                 <View style={styles.priceContainer}>
//                   <Text style={styles.price}>{spot.price}</Text>
//                   <Text style={styles.priceUnit}>{spot.priceUnit}</Text>
//                 </View>
//               </View>
//             </TouchableOpacity>
//           ))}
//         </View>
//       </ScrollView>

//       {/* Filter Modal */}
//       <FilterModal
//         visible={showFilter}
//         onClose={() => setShowFilter(false)}
//         onApply={handleFilterApply}
//       />

//       {/* Bottom Tabs */}
//       <BottomTabs />
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#F9FAFB',
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: 20,
//     paddingTop: 50,
//     paddingBottom: 15,
//     backgroundColor: '#fff',
//   },
//   headerLeft: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   avatar: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: '#E5E7EB',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginRight: 12,
//   },
//   avatarText: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#333',
//   },
//   greeting: {
//     fontSize: 14,
//     color: '#999',
//   },
//   location: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#333',
//   },
//   notificationButton: {
//     width: 40,
//     height: 40,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   scrollView: {
//     flex: 1,
//   },
//   // Active Parking Card Styles
//   activeParkingContainer: {
//     paddingHorizontal: 20,
//     paddingTop: 15,
//     backgroundColor: '#fff',
//   },
//   activeCard: {
//     backgroundColor: '#F0FDF4',
//     borderRadius: 16,
//     padding: 16,
//     borderWidth: 2,
//     borderColor: '#22C55E',
//     shadowColor: '#22C55E',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.2,
//     shadowRadius: 8,
//     elevation: 5,
//     marginBottom: 15,
//   },
//   activeCardTop: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 12,
//   },
//   activeCardLeft: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     flex: 1,
//   },
//   activeIconContainer: {
//     width: 50,
//     height: 50,
//     borderRadius: 25,
//     backgroundColor: '#fff',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginRight: 12,
//   },
//   activeLabel: {
//     fontSize: 12,
//     color: '#6B7280',
//     marginBottom: 2,
//   },
//   activeParkingNameText: {
//     fontSize: 16,
//     fontWeight: '700',
//     color: '#333',
//     marginBottom: 2,
//   },
//   activeVehicleText: {
//     fontSize: 12,
//     color: '#6B7280',
//   },
//   timerContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#fff',
//     borderRadius: 8,
//     padding: 10,
//     justifyContent: 'center',
//   },
//   timerText: {
//     fontSize: 24,
//     fontWeight: '700',
//     color: '#22C55E',
//     marginLeft: 8,
//     letterSpacing: 1,
//   },
//   searchContainer: {
//     flexDirection: 'row',
//     paddingHorizontal: 20,
//     paddingVertical: 15,
//     backgroundColor: '#fff',
//     alignItems: 'center',
//   },
//   searchBar: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#F3F4F6',
//     borderRadius: 12,
//     paddingHorizontal: 15,
//     height: 48,
//     marginRight: 10,
//   },
//   searchPlaceholder: {
//     flex: 1,
//     marginLeft: 10,
//     fontSize: 14,
//     color: '#999',
//   },
//   filterButton: {
//     width: 48,
//     height: 48,
//     backgroundColor: '#F0FDF4',
//     borderRadius: 12,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   mapContainer: {
//     height: height * 0.3,
//     backgroundColor: '#E5E7EB',
//     position: 'relative',
//   },
//   map: {
//     width: '100%',
//     height: '100%',
//   },
//   parkingSection: {
//     flex: 1,
//     backgroundColor: '#fff',
//     borderTopLeftRadius: 24,
//     borderTopRightRadius: 24,
//     marginTop: -20,
//     paddingTop: 20,
//     paddingHorizontal: 20,
//     paddingBottom: 100,
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: '#333',
//     marginBottom: 15,
//   },
//   parkingCard: {
//     flexDirection: 'row',
//     backgroundColor: '#fff',
//     borderRadius: 16,
//     padding: 12,
//     marginBottom: 12,
//     shadowColor: '#000',
//     shadowOffset: {
//       width: 0,
//       height: 2,
//     },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 3,
//     borderWidth: 1,
//     borderColor: '#E5E7EB',
//   },
//   parkingImageContainer: {
//     marginRight: 12,
//   },
//   parkingImagePlaceholder: {
//     width: 60,
//     height: 60,
//     backgroundColor: '#F0FDF4',
//     borderRadius: 12,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   parkingInfo: {
//     flex: 1,
//     justifyContent: 'center',
//   },
//   parkingName: {
//     fontSize: 15,
//     fontWeight: '600',
//     color: '#333',
//     marginBottom: 4,
//   },
//   parkingAddress: {
//     fontSize: 12,
//     color: '#999',
//   },
//   parkingRight: {
//     alignItems: 'flex-end',
//     justifyContent: 'space-between',
//   },
//   distance: {
//     fontSize: 13,
//     fontWeight: '600',
//     color: '#22C55E',
//   },
//   priceContainer: {
//     alignItems: 'flex-end',
//   },
//   price: {
//     fontSize: 16,
//     fontWeight: '700',
//     color: '#333',
//   },
//   priceUnit: {
//     fontSize: 11,
//     color: '#999',
//   },
// });

// export default UserDashboard;