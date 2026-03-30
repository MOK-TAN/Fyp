import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Linking,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { TextInput } from "react-native";
import MapView, { Callout, Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';



import BottomTabs from '../../../components/BottomTabs';
import FilterModal from '../../../components/FilterModal';
import { supabase } from '../../../lib/supabase';
import { styles } from './index.styles';

interface ParkingSpot {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  price: string;
  rating: number;
  slotsAvailable: number;
  totalSlots: number;
  amenities: string[];
  isOpen: boolean;
}

interface SavedLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  note?: string;
}

const UserDashboard = () => {
  const [showFilter, setShowFilter] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'nearby' | 'cheapest' | 'available'>('nearby');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const [parkingSpots, setParkingSpots] = useState<ParkingSpot[]>([]);
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationLoading, setLocationLoading] = useState(true);

  // for saving location
  const [showSaveModal, setShowSaveModal] = useState(false);
const [selectedCoords, setSelectedCoords] = useState<{ latitude: number; longitude: number } | null>(null);
const [locationName, setLocationName] = useState("");
const [locationNote, setLocationNote] = useState("");

  // ✅ Fixed: Added this missing state
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const mapRef = useRef<MapView>(null);

  // Active booking
  const [hasActiveBooking, setHasActiveBooking] = useState(false);
  const [activeBooking, setActiveBooking] = useState<any>(null);
  const [activeBookingTime, setActiveBookingTime] = useState(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const [mapRegion, setMapRegion] = useState<Region>({
    latitude: 27.7172,
    longitude: 85.3240,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  // ====================== NAVIGATION ======================
const startNavigation = (latitude: number, longitude: number, title: string) => {
  Alert.alert("Open in Maps", "Choose an app", [
    {
      text: "Apple Maps",
      onPress: async () => {
        const url = `http://maps.apple.com/?daddr=${latitude},${longitude}`;
        await Linking.openURL(url);
      },
    },
    {
      text: "Google Maps",
      onPress: async () => {
        const url = `comgooglemaps://?daddr=${latitude},${longitude}&directionsmode=driving`;

        const supported = await Linking.canOpenURL(url);

        if (supported) {
          await Linking.openURL(url);
        } else {
          // fallback to browser
          await Linking.openURL(
            `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
          );
        }
      },
    },
    {
      text: "Cancel",
      style: "cancel",
    },
  ]);
};

  // Fetch parking facilities
  const fetchParkingFacilities = async () => {
    try {
      const { data: facilities, error } = await supabase
        .from('parking_facilities')
        .select(`
          id, name, address, latitude, longitude, 
          price_per_hour, total_slots, amenities, is_active
        `)
        .eq('is_active', true)
        .eq('is_approved', true);

      if (error) throw error;

      if (facilities) {
        const facilitiesWithSlots = await Promise.all(
          facilities.map(async (facility: any) => {
            const { count: availableCount } = await supabase
              .from('parking_slots')
              .select('*', { count: 'exact', head: true })
              .eq('facility_id', facility.id)
              .eq('is_available', true);

            return {
              id: facility.id,
              name: facility.name,
              address: facility.address,
              latitude: parseFloat(facility.latitude || '0'),
              longitude: parseFloat(facility.longitude || '0'),
              price: facility.price_per_hour.toString(),
              rating: 4.5,
              slotsAvailable: availableCount || 0,
              totalSlots: facility.total_slots,
              amenities: Array.isArray(facility.amenities) ? facility.amenities : [],
              isOpen: facility.is_active && (availableCount || 0) > 0,
            };
          })
        );
        setParkingSpots(facilitiesWithSlots);
      }
    } catch (error: any) {
      console.error('Error fetching facilities:', error);
      Alert.alert('Error', 'Failed to load parking facilities');
    }
  };

  const fetchSavedLocations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('saved_locations')
        .select('id, name, latitude, longitude, note')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedLocations(data || []);
    } catch (error) {
      console.error('Error fetching saved locations:', error);
    }
  };

  const getUserLocation = async () => {
    try {
      setLocationLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = location.coords;

      setUserLocation({ latitude, longitude });   // ← Now this works

      const newRegion: Region = {
        latitude,
        longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };

      setMapRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 1000);
    } catch (error) {
      console.error('Location error:', error);
    } finally {
      setLocationLoading(false);
    }
  };

  const handleLongPress = (e: any) => {
  const coordinate = e.nativeEvent.coordinate;

  setSelectedCoords(coordinate);
  setShowSaveModal(true);
};

//save function

const saveLocation = async () => {
  if (!locationName || locationName.trim().length < 2) {
    Alert.alert("Error", "Enter valid name");
    return;
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !selectedCoords) return;

    const { error } = await supabase.from("saved_locations").insert({
      user_id: user.id,
      name: locationName.trim(),
      latitude: selectedCoords.latitude,
      longitude: selectedCoords.longitude,
      note: locationNote || null,
    });

    if (error) throw error;

    Alert.alert("Success", "Location saved!");
    setShowSaveModal(false);
    setLocationName("");
    setLocationNote("");
    fetchSavedLocations();
  } catch (error) {
    console.error(error);
    Alert.alert("Error", "Failed to save");
  }
};

  // const handleLongPress = (e: any) => {
  //   const coordinate = e.nativeEvent.coordinate;
  //   Alert.prompt(
  //     'Save Location',
  //     'Enter a name for this location',
  //     [
  //       { text: 'Cancel', style: 'cancel' },
  //       {
  //         text: 'Save',
  //         onPress: async (name?: string) => {
  //           if (!name || name.trim().length < 2) {
  //             Alert.alert('Error', 'Please enter a valid name');
  //             return;
  //           }
  //           try {
  //             const { data: { user } } = await supabase.auth.getUser();
  //             if (!user) return;

  //             const { error } = await supabase.from('saved_locations').insert({
  //               user_id: user.id,
  //               name: name.trim(),
  //               latitude: coordinate.latitude,
  //               longitude: coordinate.longitude,
  //             });

  //             if (error) throw error;
  //             Alert.alert('Success', 'Location saved!');
  //             fetchSavedLocations();
  //           } catch (error) {
  //             Alert.alert('Error', 'Failed to save location');
  //           }
  //         },
  //       },
  //     ],
  //     'plain-text'
  //   );
  // };

  const fetchActiveBooking = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: booking, error } = await supabase
        .from('bookings')
        .select(`
          *,
          parking_facilities (name),
          parking_slots (slot_number),
          vehicles (plate_number)
        `)
        .eq('user_id', user.id)
        .eq('booking_status', 'active')
        .eq('is_timer_active', true)
        .single();

      if (error || !booking) {
        setHasActiveBooking(false);
        setActiveBooking(null);
        return;
      }

      setActiveBooking(booking);
      setHasActiveBooking(true);

      const endTime = new Date(`${booking.booking_date}T${booking.end_time}`);
      const now = new Date();
      const remaining = Math.floor((endTime.getTime() - now.getTime()) / 1000);
      setActiveBookingTime(remaining > 0 ? remaining : 0);
    } catch (error) {
      console.error('Error fetching active booking:', error);
    }
  };

  useEffect(() => {
    if (hasActiveBooking) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [hasActiveBooking]);

  useEffect(() => {
    if (hasActiveBooking && activeBookingTime > 0) {
      const timer = setInterval(() => {
        setActiveBookingTime(prev => prev <= 0 ? 0 : prev - 1);
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

  const getFilteredSpots = () => {
    let filtered = [...parkingSpots];
    if (selectedFilter === 'cheapest') {
      filtered.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    } else if (selectedFilter === 'available') {
      filtered = filtered.filter(spot => spot.isOpen && spot.slotsAvailable > 0);
    }
    return filtered;
  };

  const filteredSpots = getFilteredSpots();

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

  const handleParkingPress = (spot: ParkingSpot) => {
    router.push({
      pathname: '/(user)/parking-details',
      params: {
        parkingId: spot.id,
        parkingName: spot.name,
        parkingAddress: spot.address,
        pricePerHour: spot.price,
      },
    });
  };

  // Initial load
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([
        fetchParkingFacilities(),
        fetchSavedLocations(),
        getUserLocation(),
        fetchActiveBooking(),
      ]);
      setLoading(false);
    };
    init();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchSavedLocations();
      fetchActiveBooking();
    }, [])
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#22C55E" />
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  return (





    <View style={styles.container}>
      {/* Header - same as before */}
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
            <Ionicons name="notifications" size={24} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Search + Filter */}
        <View style={styles.searchSection}>
          <TouchableOpacity style={styles.searchBar} onPress={() => router.push('/(user)/search')}>
            <Ionicons name="search" size={22} color="#22C55E" />
            <Text style={styles.searchPlaceholder}>Where do you want to park?</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterButtonMain} onPress={() => setShowFilter(true)}>
            <Ionicons name="options" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Quick Filters */}
        <View style={styles.quickFilters}>
          <TouchableOpacity
            style={[styles.filterChip, selectedFilter === 'nearby' && styles.filterChipActive]}
            onPress={() => setSelectedFilter('nearby')}
          >
            <Ionicons name="navigate" size={16} color={selectedFilter === 'nearby' ? '#fff' : '#22C55E'} />
            <Text style={[styles.filterChipText, selectedFilter === 'nearby' && styles.filterChipTextActive]}>Nearby</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, selectedFilter === 'cheapest' && styles.filterChipActive]}
            onPress={() => setSelectedFilter('cheapest')}
          >
            <Ionicons name="cash" size={16} color={selectedFilter === 'cheapest' ? '#fff' : '#22C55E'} />
            <Text style={[styles.filterChipText, selectedFilter === 'cheapest' && styles.filterChipTextActive]}>Cheapest</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, selectedFilter === 'available' && styles.filterChipActive]}
            onPress={() => setSelectedFilter('available')}
          >
            <Ionicons name="checkmark-circle" size={16} color={selectedFilter === 'available' ? '#fff' : '#22C55E'} />
            <Text style={[styles.filterChipText, selectedFilter === 'available' && styles.filterChipTextActive]}>Available</Text>
          </TouchableOpacity>
        </View>

        {/* Map */}
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
            region={mapRegion}
            showsUserLocation={true}
            showsMyLocationButton={false}
            onLongPress={handleLongPress}
            onRegionChangeComplete={setMapRegion}
          >
            {/* Parking Facilities */}
            {parkingSpots.map((spot) => (
              <Marker
                key={`facility-${spot.id}`}
                coordinate={{ latitude: spot.latitude, longitude: spot.longitude }}
                pinColor="#22C55E"
              >
                <Callout tooltip>
                  <View style={styles.calloutContainer}>
                    <Text style={styles.calloutTitle}>{spot.name}</Text>
                    <Text style={styles.calloutAddress}>{spot.address}</Text>

                    <View style={styles.calloutInfo}>
                      <Text style={styles.calloutPrice}>Rs {spot.price}/hr</Text>
                      <Text style={{ color: spot.isOpen ? '#22C55E' : '#EF4444' }}>
                        {spot.slotsAvailable} slots
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.navigateButton}
                      onPress={() => startNavigation(spot.latitude, spot.longitude, spot.name)}
                    >
                      <Text style={styles.navigateButtonText}>Navigate Here</Text>
                    </TouchableOpacity>
                  </View>
                </Callout>
              </Marker>
            ))}

            {/* Personal Saved Locations */}
            {savedLocations.map((loc) => (
              <Marker
                key={`saved-${loc.id}`}
                coordinate={{ latitude: loc.latitude, longitude: loc.longitude }}
                pinColor="#3B82F6"
              >
                <Callout tooltip>
                  <View style={styles.calloutContainer}>
                    <Text style={styles.calloutTitle}>{loc.name}</Text>
                    {loc.note && <Text style={styles.calloutAddress}>{loc.note}</Text>}

                    <TouchableOpacity
                      style={[styles.navigateButton, { backgroundColor: '#3B82F6' }]}
                      onPress={() => startNavigation(loc.latitude, loc.longitude, loc.name)}
                    >
                      <Text style={styles.navigateButtonText}>Navigate Here</Text>
                    </TouchableOpacity>
                  </View>
                </Callout>
              </Marker>
            ))}
          </MapView>

          <TouchableOpacity style={styles.myLocationButton} onPress={getUserLocation}>
            <Ionicons name="locate" size={24} color="#22C55E" />
          </TouchableOpacity>
        </View>

        //         {/* Active Booking - your original */}
//         {hasActiveBooking && activeBooking && (
          <View style={styles.activeSection}>
            <Animated.View style={[styles.activeBookingCard, { transform: [{ scale: pulseAnim }] }]}>
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
                      {activeBooking.parking_facilities?.name || 'Parking'} • Slot {activeBooking.parking_slots?.slot_number || '-'}
                    </Text>
                    <Text style={styles.activeBookingVehicle}>
                      {activeBooking.vehicles?.plate_number || 'Vehicle'}
                    </Text>
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

            {/* Parking List / Grid */}
         <View style={styles.parkingSection}>
           <View style={styles.parkingSectionHeader}>
             <Text style={styles.sectionTitle}>Parking Nearby ({filteredSpots.length})</Text>
             <View style={styles.viewToggle}>
               <TouchableOpacity
                style={[styles.viewToggleBtn, viewMode === 'list' && styles.viewToggleBtnActive]}
                onPress={() => setViewMode('list')}
              >
                <Ionicons name="list" size={18} color={viewMode === 'list' ? '#fff' : '#6B7280'} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.viewToggleBtn, viewMode === 'grid' && styles.viewToggleBtnActive]}
                onPress={() => setViewMode('grid')}
              >
                <Ionicons name="grid" size={18} color={viewMode === 'grid' ? '#fff' : '#6B7280'} />
              </TouchableOpacity>
            </View>
          </View>

          {viewMode === 'list' ? (
            filteredSpots.map((spot) => (
              <TouchableOpacity
                key={spot.id}
                style={styles.parkingCard}
                onPress={() => handleParkingPress(spot)}
                activeOpacity={0.7}
              >
                {/* ... rest of your list card (same as original) ... */}
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
                      <Text style={styles.distanceText}>Nearby</Text>   {/* Fixed here */}
                    </View>
                    <Text style={styles.parkingAddress}>{spot.address}</Text>
                  </View>
                </View>

                <View style={styles.parkingCardFooter}>
                  <View style={styles.availabilityBadge}>
                    <View style={[styles.availabilityDot, !spot.isOpen && styles.availabilityDotClosed]} />
                    <Text style={[styles.availabilityText, !spot.isOpen && styles.availabilityTextClosed]}>
                      {spot.isOpen ? `${spot.slotsAvailable} slots available` : 'Full'}
                    </Text>
                  </View>
                  <View style={styles.priceContainerNew}>
                    <Text style={styles.priceNew}>Rs {spot.price}</Text>
                    <Text style={styles.priceUnitNew}>/hr</Text>
                  </View>
                </View>

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
            ))
          ) : (
            <View style={styles.parkingGrid}>
              {filteredSpots.map((spot) => (
                <TouchableOpacity
                  key={spot.id}
                  style={styles.parkingGridCard}
                  onPress={() => handleParkingPress(spot)}
                  activeOpacity={0.7}
                >
                  <View style={styles.gridCardTop}>
                    <View style={styles.gridIconContainer}>
                      <Ionicons name="car-sport" size={24} color="#22C55E" />
                    </View>
                    <View style={[styles.gridStatusDot, !spot.isOpen && styles.gridStatusDotClosed]} />
                  </View>
                  <Text style={styles.gridParkingName} numberOfLines={1}>{spot.name}</Text>
                  <View style={styles.gridRating}>
                    <Ionicons name="star" size={12} color="#F59E0B" />
                    <Text style={styles.gridRatingText}>{spot.rating}</Text>
                  </View>
                  <View style={styles.gridFooter}>
                    <Text style={styles.gridPrice}>Rs {spot.price}/hr</Text>
                    <Text style={styles.gridDistance}>Nearby</Text>   {/* Fixed here */}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={{ height: 140 }} />
      </ScrollView>

      <FilterModal visible={showFilter} onClose={() => setShowFilter(false)} onApply={() => {}} />
      <BottomTabs />

          {showSaveModal && (
  <View style={{
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  }}>
    <View style={{
      backgroundColor: "#fff",
      borderRadius: 12,
      padding: 16,
    }}>
      <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>
        Save Location
      </Text>

      <TextInput
        placeholder="Location name"
        value={locationName}
        onChangeText={setLocationName}
        style={{
          borderWidth: 1,
          borderColor: "#ddd",
          borderRadius: 8,
          padding: 10,
          marginBottom: 10,
        }}
      />

      <TextInput
        placeholder="Note (optional)"
        value={locationNote}
        onChangeText={setLocationNote}
        multiline
        style={{
          borderWidth: 1,
          borderColor: "#ddd",
          borderRadius: 8,
          padding: 10,
          height: 80,
          marginBottom: 15,
        }}
      />

      <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
        <TouchableOpacity onPress={() => setShowSaveModal(false)}>
          <Text style={{ marginRight: 20 }}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={saveLocation}>
          <Text style={{ color: "#22C55E", fontWeight: "bold" }}>Save</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
)}
    </View>
  );
};

export default UserDashboard;



//before 1

// import { Ionicons } from '@expo/vector-icons';
// import { router, useFocusEffect } from 'expo-router';
// import React, { useCallback, useEffect, useRef, useState } from 'react';
// import {
//   ActivityIndicator,
//   Alert,
//   Animated,
//   Platform,
//   ScrollView,
//   Text,
//   TouchableOpacity,
//   View,
// } from 'react-native';
// import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
// import * as Location from 'expo-location';

// import BottomTabs from '../../../components/BottomTabs';
// import FilterModal from '../../../components/FilterModal';
// import { supabase } from '../../../lib/supabase';
// import { styles } from './index.styles';

// interface ParkingSpot {
//   id: string;
//   name: string;
//   address: string;
//   latitude: number;
//   longitude: number;
//   price: string;
//   priceUnit: string;
//   rating: number;
//   slotsAvailable: number;
//   totalSlots: number;
//   amenities: string[];
//   isOpen: boolean;
//   // distance is removed - we'll show "Nearby" or calculate later
// }

// interface SavedLocation {
//   id: string;
//   name: string;
//   latitude: number;
//   longitude: number;
//   note?: string;
// }

// const UserDashboard = () => {
//   const [showFilter, setShowFilter] = useState(false);
//   const [selectedFilter, setSelectedFilter] = useState<'nearby' | 'cheapest' | 'available'>('nearby');
//   const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

//   const [parkingSpots, setParkingSpots] = useState<ParkingSpot[]>([]);
//   const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [locationLoading, setLocationLoading] = useState(true);

//   const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
//   const mapRef = useRef<MapView>(null);

//   // Active booking
//   const [hasActiveBooking, setHasActiveBooking] = useState(false);
//   const [activeBooking, setActiveBooking] = useState<any>(null);
//   const [activeBookingTime, setActiveBookingTime] = useState(0);
//   const pulseAnim = useRef(new Animated.Value(1)).current;

//   const [mapRegion, setMapRegion] = useState<Region>({
//     latitude: 27.7172,
//     longitude: 85.3240,
//     latitudeDelta: 0.05,
//     longitudeDelta: 0.05,
//   });

//   // ==================== FETCH FUNCTIONS ====================
//   const fetchParkingFacilities = async () => {
//     try {
//       const { data: facilities, error } = await supabase
//         .from('parking_facilities')
//         .select(`
//           id, name, address, latitude, longitude, 
//           price_per_hour, total_slots, amenities, is_active
//         `)
//         .eq('is_active', true)
//         .eq('is_approved', true);

//       if (error) throw error;

//       if (facilities) {
//         const facilitiesWithSlots = await Promise.all(
//           facilities.map(async (facility: any) => {
//             const { count: availableCount } = await supabase
//               .from('parking_slots')
//               .select('*', { count: 'exact', head: true })
//               .eq('facility_id', facility.id)
//               .eq('is_available', true);

//             return {
//               id: facility.id,
//               name: facility.name,
//               address: facility.address,
//               latitude: parseFloat(facility.latitude || '0'),
//               longitude: parseFloat(facility.longitude || '0'),
//               price: facility.price_per_hour.toString(),
//               priceUnit: '/hr',
//               rating: 4.5,
//               slotsAvailable: availableCount || 0,
//               totalSlots: facility.total_slots,
//               amenities: Array.isArray(facility.amenities) ? facility.amenities : [],
//               isOpen: facility.is_active && (availableCount || 0) > 0,
//             };
//           })
//         );

//         setParkingSpots(facilitiesWithSlots);
//       }
//     } catch (error: any) {
//       console.error('Error fetching parking facilities:', error);
//       Alert.alert('Error', 'Failed to load parking facilities');
//     }
//   };

//   const fetchSavedLocations = async () => {
//     try {
//       const { data: { user } } = await supabase.auth.getUser();
//       if (!user) return;

//       const { data, error } = await supabase
//         .from('saved_locations')
//         .select('id, name, latitude, longitude, note')
//         .eq('user_id', user.id)
//         .order('created_at', { ascending: false });

//       if (error) throw error;
//       setSavedLocations(data || []);
//     } catch (error) {
//       console.error('Error fetching saved locations:', error);
//     }
//   };

//   const getUserLocation = async () => {
//     try {
//       setLocationLoading(true);
//       const { status } = await Location.requestForegroundPermissionsAsync();
//       if (status !== 'granted') {
//         Alert.alert('Permission Denied', 'Location permission is needed for the map.');
//         return;
//       }

//       const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
//       const { latitude, longitude } = location.coords;

//       setUserLocation({ latitude, longitude });

//       const newRegion: Region = {
//         latitude,
//         longitude,
//         latitudeDelta: 0.02,
//         longitudeDelta: 0.02,
//       };

//       setMapRegion(newRegion);
//       mapRef.current?.animateToRegion(newRegion, 1000);
//     } catch (error) {
//       console.error('Location error:', error);
//     } finally {
//       setLocationLoading(false);
//     }
//   };

//   const handleLongPress = (e: any) => {
//     const coordinate = e.nativeEvent.coordinate;
//     Alert.prompt(
//       'Save Location',
//       'Enter a name for this location',
//       [
//         { text: 'Cancel', style: 'cancel' },
//         {
//           text: 'Save',
//           onPress: async (name?: string) => {
//             if (!name || name.trim().length < 2) {
//               Alert.alert('Error', 'Please enter a valid name');
//               return;
//             }
//             try {
//               const { data: { user } } = await supabase.auth.getUser();
//               if (!user) return;

//               const { error } = await supabase.from('saved_locations').insert({
//                 user_id: user.id,
//                 name: name.trim(),
//                 latitude: coordinate.latitude,
//                 longitude: coordinate.longitude,
//               });

//               if (error) throw error;
//               Alert.alert('Success', 'Location saved!');
//               fetchSavedLocations();
//             } catch (error) {
//               Alert.alert('Error', 'Failed to save location');
//             }
//           },
//         },
//       ],
//       'plain-text'
//     );
//   };

//   const fetchActiveBooking = async () => {
//     try {
//       const { data: { user } } = await supabase.auth.getUser();
//       if (!user) return;

//       const { data: booking, error } = await supabase
//         .from('bookings')
//         .select(`
//           *,
//           parking_facilities (name),
//           parking_slots (slot_number),
//           vehicles (plate_number)
//         `)
//         .eq('user_id', user.id)
//         .eq('booking_status', 'active')
//         .eq('is_timer_active', true)
//         .single();

//       if (error || !booking) {
//         setHasActiveBooking(false);
//         setActiveBooking(null);
//         return;
//       }

//       setActiveBooking(booking);
//       setHasActiveBooking(true);

//       const endTime = new Date(`${booking.booking_date}T${booking.end_time}`);
//       const now = new Date();
//       const remaining = Math.floor((endTime.getTime() - now.getTime()) / 1000);
//       setActiveBookingTime(remaining > 0 ? remaining : 0);
//     } catch (error) {
//       console.error('Error fetching active booking:', error);
//     }
//   };

//   useEffect(() => {
//     if (hasActiveBooking) {
//       Animated.loop(
//         Animated.sequence([
//           Animated.timing(pulseAnim, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
//           Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
//         ])
//       ).start();
//     }
//   }, [hasActiveBooking]);

//   useEffect(() => {
//     if (hasActiveBooking && activeBookingTime > 0) {
//       const timer = setInterval(() => {
//         setActiveBookingTime(prev => prev <= 0 ? 0 : prev - 1);
//       }, 1000);
//       return () => clearInterval(timer);
//     }
//   }, [hasActiveBooking, activeBookingTime]);

//   const formatTime = (seconds: number) => {
//     const h = Math.floor(seconds / 3600);
//     const m = Math.floor((seconds % 3600) / 60);
//     const s = seconds % 60;
//     return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
//   };

//   const getFilteredSpots = () => {
//     let filtered = [...parkingSpots];
//     switch (selectedFilter) {
//       case 'cheapest':
//         filtered.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
//         break;
//       case 'available':
//         filtered = filtered.filter(spot => spot.isOpen && spot.slotsAvailable > 0);
//         break;
//       case 'nearby':
//       default:
//         break;
//     }
//     return filtered;
//   };

//   const filteredSpots = getFilteredSpots();

//   const renderStars = (rating: number) => {
//     return [...Array(5)].map((_, index) => (
//       <Ionicons
//         key={index}
//         name={index < Math.floor(rating) ? 'star' : 'star-outline'}
//         size={14}
//         color="#F59E0B"
//       />
//     ));
//   };

//   // Initial load
//   useEffect(() => {
//     const init = async () => {
//       setLoading(true);
//       await Promise.all([
//         fetchParkingFacilities(),
//         fetchSavedLocations(),
//         getUserLocation(),
//         fetchActiveBooking()
//       ]);
//       setLoading(false);
//     };
//     init();
//   }, []);

//   useFocusEffect(
//     useCallback(() => {
//       fetchSavedLocations();
//       fetchActiveBooking();
//     }, [])
//   );

//   const handleParkingPress = (spot: ParkingSpot) => {
//     router.push({
//       pathname: '/(user)/parking-details',
//       params: {
//         parkingId: spot.id,
//         parkingName: spot.name,
//         parkingAddress: spot.address,
//         pricePerHour: spot.price,
//         distance: 'Nearby',   // Changed from spot.distance
//       },
//     });
//   };

//   const handleSavedLocationPress = (loc: SavedLocation) => {
//     mapRef.current?.animateToRegion({
//       latitude: loc.latitude,
//       longitude: loc.longitude,
//       latitudeDelta: 0.015,
//       longitudeDelta: 0.015,
//     }, 800);
//   };

//   if (loading) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color="#22C55E" />
//         <Text style={styles.loadingText}>Loading map and parking spots...</Text>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       {/* Header - same as before */}
//       <View style={styles.headerGradient}>
//         <View style={styles.header}>
//           <View style={styles.headerLeft}>
//             <View style={styles.avatar}>
//               <Text style={styles.avatarText}>A</Text>
//             </View>
//             <View>
//               <Text style={styles.greeting}>Good morning, Acharya</Text>
//               <View style={styles.locationRow}>
//                 <Ionicons name="location" size={14} color="#22C55E" />
//                 <Text style={styles.location}>Naxal, Kathmandu</Text>
//               </View>
//             </View>
//           </View>
//           <TouchableOpacity style={styles.notificationButton}>
//             <Ionicons name="notifications" size={24} color="#333" />
//           </TouchableOpacity>
//         </View>
//       </View>

//       <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
//         {/* Search Section - same */}
//         <View style={styles.searchSection}>
//           <TouchableOpacity style={styles.searchBar} onPress={() => router.push('/(user)/search')} activeOpacity={0.7}>
//             <Ionicons name="search" size={22} color="#22C55E" />
//             <Text style={styles.searchPlaceholder}>Where do you want to park?</Text>
//           </TouchableOpacity>
//           <TouchableOpacity style={styles.filterButtonMain} onPress={() => setShowFilter(true)}>
//             <Ionicons name="options" size={22} color="#fff" />
//           </TouchableOpacity>
//         </View>

//         {/* Quick Filters - same as your original */}
//         <View style={styles.quickFilters}>
//           <TouchableOpacity
//             style={[styles.filterChip, selectedFilter === 'nearby' && styles.filterChipActive]}
//             onPress={() => setSelectedFilter('nearby')}
//           >
//             <Ionicons name="navigate" size={16} color={selectedFilter === 'nearby' ? '#fff' : '#22C55E'} />
//             <Text style={[styles.filterChipText, selectedFilter === 'nearby' && styles.filterChipTextActive]}>Nearby</Text>
//           </TouchableOpacity>

//           <TouchableOpacity
//             style={[styles.filterChip, selectedFilter === 'cheapest' && styles.filterChipActive]}
//             onPress={() => setSelectedFilter('cheapest')}
//           >
//             <Ionicons name="cash" size={16} color={selectedFilter === 'cheapest' ? '#fff' : '#22C55E'} />
//             <Text style={[styles.filterChipText, selectedFilter === 'cheapest' && styles.filterChipTextActive]}>Cheapest</Text>
//           </TouchableOpacity>

//           <TouchableOpacity
//             style={[styles.filterChip, selectedFilter === 'available' && styles.filterChipActive]}
//             onPress={() => setSelectedFilter('available')}
//           >
//             <Ionicons name="checkmark-circle" size={16} color={selectedFilter === 'available' ? '#fff' : '#22C55E'} />
//             <Text style={[styles.filterChipText, selectedFilter === 'available' && styles.filterChipTextActive]}>Available</Text>
//           </TouchableOpacity>
//         </View>

//         {/* Map */}
//         <View style={styles.mapContainer}>
//           <MapView
//             ref={mapRef}
//             style={styles.map}
//             provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
//             region={mapRegion}
//             showsUserLocation={true}
//             showsMyLocationButton={false}
//             onLongPress={handleLongPress}
//             onRegionChangeComplete={setMapRegion}
//           >
//             {parkingSpots.map((spot) => (
//               <Marker
//                 key={`facility-${spot.id}`}
//                 coordinate={{ latitude: spot.latitude, longitude: spot.longitude }}
//                 title={spot.name}
//                 description={`Rs ${spot.price}/hr • ${spot.slotsAvailable} slots`}
//                 pinColor="#22C55E"
//                 onPress={() => handleParkingPress(spot)}
//               />
//             ))}

//             {savedLocations.map((loc) => (
//               <Marker
//                 key={`saved-${loc.id}`}
//                 coordinate={{ latitude: loc.latitude, longitude: loc.longitude }}
//                 title={loc.name}
//                 description={loc.note || 'Personal location'}
//                 pinColor="#3B82F6"
//                 onPress={() => handleSavedLocationPress(loc)}
//               />
//             ))}
//           </MapView>

//           <TouchableOpacity style={styles.myLocationButton} onPress={getUserLocation} disabled={locationLoading}>
//             <Ionicons name="locate" size={24} color="#22C55E" />
//           </TouchableOpacity>
//         </View>

//         {/* Active Booking - your original */}
//         {hasActiveBooking && activeBooking && (
//           <View style={styles.activeSection}>
//             <Animated.View style={[styles.activeBookingCard, { transform: [{ scale: pulseAnim }] }]}>
//               <TouchableOpacity
//                 style={styles.activeBookingContent}
//                 onPress={() => router.push('/(user)/(tabs)/active-timer')}
//                 activeOpacity={0.8}
//               >
//                 <View style={styles.activeBookingLeft}>
//                   <View style={styles.activeBookingIcon}>
//                     <Ionicons name="time" size={20} color="#fff" />
//                   </View>
//                   <View style={styles.activeBookingInfo}>
//                     <Text style={styles.activeBookingLabel}>ACTIVE PARKING</Text>
//                     <Text style={styles.activeBookingName}>
//                       {activeBooking.parking_facilities?.name || 'Parking'} • Slot {activeBooking.parking_slots?.slot_number || '-'}
//                     </Text>
//                     <Text style={styles.activeBookingVehicle}>
//                       {activeBooking.vehicles?.plate_number || 'Vehicle'}
//                     </Text>
//                   </View>
//                 </View>
//                 <View style={styles.activeBookingRight}>
//                   <Text style={styles.activeBookingTimer}>{formatTime(activeBookingTime)}</Text>
//                   <Ionicons name="chevron-forward" size={20} color="#fff" />
//                 </View>
//               </TouchableOpacity>
//             </Animated.View>
//           </View>
//         )}

//         {/* Parking List / Grid */}
//         <View style={styles.parkingSection}>
//           <View style={styles.parkingSectionHeader}>
//             <Text style={styles.sectionTitle}>Parking Nearby ({filteredSpots.length})</Text>
//             <View style={styles.viewToggle}>
//               <TouchableOpacity
//                 style={[styles.viewToggleBtn, viewMode === 'list' && styles.viewToggleBtnActive]}
//                 onPress={() => setViewMode('list')}
//               >
//                 <Ionicons name="list" size={18} color={viewMode === 'list' ? '#fff' : '#6B7280'} />
//               </TouchableOpacity>
//               <TouchableOpacity
//                 style={[styles.viewToggleBtn, viewMode === 'grid' && styles.viewToggleBtnActive]}
//                 onPress={() => setViewMode('grid')}
//               >
//                 <Ionicons name="grid" size={18} color={viewMode === 'grid' ? '#fff' : '#6B7280'} />
//               </TouchableOpacity>
//             </View>
//           </View>

//           {viewMode === 'list' ? (
//             filteredSpots.map((spot) => (
//               <TouchableOpacity
//                 key={spot.id}
//                 style={styles.parkingCard}
//                 onPress={() => handleParkingPress(spot)}
//                 activeOpacity={0.7}
//               >
//                 {/* ... rest of your list card (same as original) ... */}
//                 <View style={styles.parkingCardHeader}>
//                   <View style={styles.parkingIconContainer}>
//                     <Ionicons name="car-sport" size={28} color="#22C55E" />
//                   </View>
//                   <View style={styles.parkingCardInfo}>
//                     <Text style={styles.parkingName}>{spot.name}</Text>
//                     <View style={styles.parkingMeta}>
//                       <View style={styles.ratingContainer}>
//                         {renderStars(spot.rating)}
//                         <Text style={styles.ratingText}>{spot.rating}</Text>
//                       </View>
//                       <View style={styles.metaDivider} />
//                       <Ionicons name="navigate" size={14} color="#6B7280" />
//                       <Text style={styles.distanceText}>Nearby</Text>   {/* Fixed here */}
//                     </View>
//                     <Text style={styles.parkingAddress}>{spot.address}</Text>
//                   </View>
//                 </View>

//                 <View style={styles.parkingCardFooter}>
//                   <View style={styles.availabilityBadge}>
//                     <View style={[styles.availabilityDot, !spot.isOpen && styles.availabilityDotClosed]} />
//                     <Text style={[styles.availabilityText, !spot.isOpen && styles.availabilityTextClosed]}>
//                       {spot.isOpen ? `${spot.slotsAvailable} slots available` : 'Full'}
//                     </Text>
//                   </View>
//                   <View style={styles.priceContainerNew}>
//                     <Text style={styles.priceNew}>Rs {spot.price}</Text>
//                     <Text style={styles.priceUnitNew}>/hr</Text>
//                   </View>
//                 </View>

//                 <View style={styles.amenitiesRow}>
//                   {spot.amenities.slice(0, 3).map((amenity, index) => (
//                     <View key={index} style={styles.amenityBadge}>
//                       <Text style={styles.amenityBadgeText}>{amenity}</Text>
//                     </View>
//                   ))}
//                   {spot.amenities.length > 3 && (
//                     <Text style={styles.moreAmenities}>+{spot.amenities.length - 3}</Text>
//                   )}
//                 </View>
//               </TouchableOpacity>
//             ))
//           ) : (
//             <View style={styles.parkingGrid}>
//               {filteredSpots.map((spot) => (
//                 <TouchableOpacity
//                   key={spot.id}
//                   style={styles.parkingGridCard}
//                   onPress={() => handleParkingPress(spot)}
//                   activeOpacity={0.7}
//                 >
//                   <View style={styles.gridCardTop}>
//                     <View style={styles.gridIconContainer}>
//                       <Ionicons name="car-sport" size={24} color="#22C55E" />
//                     </View>
//                     <View style={[styles.gridStatusDot, !spot.isOpen && styles.gridStatusDotClosed]} />
//                   </View>
//                   <Text style={styles.gridParkingName} numberOfLines={1}>{spot.name}</Text>
//                   <View style={styles.gridRating}>
//                     <Ionicons name="star" size={12} color="#F59E0B" />
//                     <Text style={styles.gridRatingText}>{spot.rating}</Text>
//                   </View>
//                   <View style={styles.gridFooter}>
//                     <Text style={styles.gridPrice}>Rs {spot.price}/hr</Text>
//                     <Text style={styles.gridDistance}>Nearby</Text>   {/* Fixed here */}
//                   </View>
//                 </TouchableOpacity>
//               ))}
//             </View>
//           )}
//         </View>

//         <View style={{ height: 140 }} />
//       </ScrollView>

//       <FilterModal visible={showFilter} onClose={() => setShowFilter(false)} onApply={() => {}} />
//       <BottomTabs />
//     </View>
//   );
// };

// export default UserDashboard;


//before 

// import { Ionicons } from '@expo/vector-icons';
// import { router, useFocusEffect } from 'expo-router';
// import React, { useCallback, useEffect, useState } from 'react';
// import {
//   ActivityIndicator,
//   Alert,
//   Animated,
//   Image,
//   ScrollView,
//   Text,
//   TouchableOpacity,
//   View,
// } from 'react-native';
// import BottomTabs from '../../../components/BottomTabs';
// import FilterModal from '../../../components/FilterModal';
// import { supabase } from '../../../lib/supabase';
// import { styles } from './index.styles';

// interface ParkingSpot {
//   id: string;
//   name: string;
//   address: string;
//   distance: string;
//   price: string;
//   priceUnit: string;
//   rating: number;
//   slotsAvailable: number;
//   totalSlots: number;
//   amenities: string[];
//   isOpen: boolean;
// }

// const UserDashboard = () => {
//   const [showFilter, setShowFilter] = useState(false);
//   const [selectedFilter, setSelectedFilter] = useState('nearby');
//   const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
//   const [parkingSpots, setParkingSpots] = useState<ParkingSpot[]>([]);
//   const [loading, setLoading] = useState(true);
  
//   // Active booking state - from database
//   const [hasActiveBooking, setHasActiveBooking] = useState(false);
//   const [activeBooking, setActiveBooking] = useState<any>(null);
//   const [activeBookingTime, setActiveBookingTime] = useState(0);

//   // Animation for active booking pulse
//   const pulseAnim = new Animated.Value(1);

//   // Fetch facilities once on mount
//   useEffect(() => {
//     fetchParkingFacilities();
//   }, []);

//   // Re-fetch active booking every time screen comes into focus
//   useFocusEffect(
//     useCallback(() => {
//       setHasActiveBooking(false);
//       setActiveBooking(null);
//       setActiveBookingTime(0);
//       fetchActiveBooking();
//     }, [])
//   );

//   const fetchParkingFacilities = async () => {
//     try {
//       setLoading(true);

//       const { data: facilities, error } = await supabase
//         .from('parking_facilities')
//         .select(`
//           id,
//           name,
//           address,
//           price_per_hour,
//           total_slots,
//           amenities,
//           is_active
//         `)
//         .eq('is_active', true)
//         .eq('is_approved', true);

//       if (error) throw error;

//       if (facilities) {
//         const facilitiesWithSlots = await Promise.all(
//           facilities.map(async (facility) => {
//             const { count: availableCount } = await supabase
//               .from('parking_slots')
//               .select('*', { count: 'exact', head: true })
//               .eq('facility_id', facility.id)
//               .eq('is_available', true);

//             const amenitiesArray = Array.isArray(facility.amenities) 
//               ? facility.amenities 
//               : [];

//             return {
//               id: facility.id,
//               name: facility.name,
//               address: facility.address,
//               distance: '2km',
//               price: facility.price_per_hour.toString(),
//               priceUnit: '/hour',
//               rating: 4.5,
//               slotsAvailable: availableCount || 0,
//               totalSlots: facility.total_slots,
//               amenities: amenitiesArray,
//               isOpen: facility.is_active && (availableCount || 0) > 0,
//             };
//           })
//         );

//         setParkingSpots(facilitiesWithSlots);
//       }
//     } catch (error: any) {
//       console.error('Error fetching parking facilities:', error);
//       Alert.alert('Error', 'Failed to load parking facilities');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchActiveBooking = async () => {
//     try {
//       const { data: { user } } = await supabase.auth.getUser();
//       if (!user) return;

//       const { data: booking, error } = await supabase
//         .from('bookings')
//         .select(`
//           *,
//           parking_facilities (name),
//           parking_slots (slot_number),
//           vehicles (plate_number)
//         `)
//         .eq('user_id', user.id)
//         .eq('booking_status', 'active')
//         .eq('is_timer_active', true)
//         .single();

//       if (error) {
//         setHasActiveBooking(false);
//         return;
//       }

//       if (booking) {
//         setActiveBooking(booking);
//         setHasActiveBooking(true);

//         const endTime = new Date(`${booking.booking_date}T${booking.end_time}`);
//         const now = new Date();
//         const remainingSeconds = Math.floor((endTime.getTime() - now.getTime()) / 1000);
        
//         setActiveBookingTime(remainingSeconds > 0 ? remainingSeconds : 0);
//       }
//     } catch (error) {
//       console.error('Error fetching active booking:', error);
//     }
//   };

//   useEffect(() => {
//     if (hasActiveBooking) {
//       Animated.loop(
//         Animated.sequence([
//           Animated.timing(pulseAnim, {
//             toValue: 1.05,
//             duration: 1000,
//             useNativeDriver: true,
//           }),
//           Animated.timing(pulseAnim, {
//             toValue: 1,
//             duration: 1000,
//             useNativeDriver: true,
//           }),
//         ])
//       ).start();
//     }
//   }, [hasActiveBooking]);

//   useEffect(() => {
//     if (hasActiveBooking && activeBookingTime > 0) {
//       const timer = setInterval(() => {
//         setActiveBookingTime(prev => {
//           if (prev <= 0) return 0;
//           return prev - 1;
//         });
//       }, 1000);
//       return () => clearInterval(timer);
//     }
//   }, [hasActiveBooking, activeBookingTime]);

//   const formatTime = (seconds: number) => {
//     const h = Math.floor(seconds / 3600);
//     const m = Math.floor((seconds % 3600) / 60);
//     const s = seconds % 60;
//     return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
//   };

//   const getFilteredSpots = () => {
//     let filtered = [...parkingSpots];
    
//     switch(selectedFilter) {
//       case 'nearby':
//         filtered.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
//         break;
//       case 'cheapest':
//         filtered.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
//         break;
//       case 'available':
//         filtered = filtered.filter(spot => spot.isOpen && spot.slotsAvailable > 0);
//         break;
//     }
    
//     return filtered;
//   };

//   const filteredSpots = getFilteredSpots();

//   const handleFilterApply = (filters: any) => {
//     console.log('Filters applied:', filters);
//   };

//   const renderStars = (rating: number) => {
//     return [...Array(5)].map((_, index) => (
//       <Ionicons
//         key={index}
//         name={index < Math.floor(rating) ? 'star' : 'star-outline'}
//         size={14}
//         color="#F59E0B"
//       />
//     ));
//   };

//   if (loading) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color="#22C55E" />
//         <Text style={styles.loadingText}>Loading parking facilities...</Text>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <View style={styles.headerGradient}>
//         <View style={styles.header}>
//           <View style={styles.headerLeft}>
//             <View style={styles.avatar}>
//               <Text style={styles.avatarText}>A</Text>
//             </View>
//             <View>
//               <Text style={styles.greeting}>Good morning, Acharya</Text>
//               <View style={styles.locationRow}>
//                 <Ionicons name="location" size={14} color="#22C55E" />
//                 <Text style={styles.location}>Naxal, Kathmandu</Text>
//               </View>
//             </View>
//           </View>
//           <TouchableOpacity style={styles.notificationButton}>
//             <View style={styles.notificationBadge}>
//               <Text style={styles.notificationBadgeText}>3</Text>
//             </View>
//             <Ionicons name="notifications" size={24} color="#333" />
//           </TouchableOpacity>
//         </View>
//       </View>

//       <ScrollView 
//         style={styles.scrollView}
//         showsVerticalScrollIndicator={false}
//       >
//         <View style={styles.searchSection}>
//           <TouchableOpacity 
//             style={styles.searchBar}
//             onPress={() => router.push('/(user)/search')}
//             activeOpacity={0.7}
//           >
//             <Ionicons name="search" size={22} color="#22C55E" />
//             <Text style={styles.searchPlaceholder}>Where do you want to park?</Text>
//           </TouchableOpacity>
//           <TouchableOpacity 
//             style={styles.filterButtonMain}
//             onPress={() => setShowFilter(true)}
//           >
//             <Ionicons name="options" size={22} color="#fff" />
//           </TouchableOpacity>
//         </View>

//         <View style={styles.quickFilters}>
//           <TouchableOpacity
//             style={[
//               styles.filterChip,
//               selectedFilter === 'nearby' && styles.filterChipActive
//             ]}
//             onPress={() => setSelectedFilter('nearby')}
//           >
//             <Ionicons 
//               name="navigate" 
//               size={16} 
//               color={selectedFilter === 'nearby' ? '#fff' : '#22C55E'} 
//             />
//             <Text style={[
//               styles.filterChipText,
//               selectedFilter === 'nearby' && styles.filterChipTextActive
//             ]}>
//               Nearby
//             </Text>
//           </TouchableOpacity>

//           <TouchableOpacity
//             style={[
//               styles.filterChip,
//               selectedFilter === 'cheapest' && styles.filterChipActive
//             ]}
//             onPress={() => setSelectedFilter('cheapest')}
//           >
//             <Ionicons 
//               name="cash" 
//               size={16} 
//               color={selectedFilter === 'cheapest' ? '#fff' : '#22C55E'} 
//             />
//             <Text style={[
//               styles.filterChipText,
//               selectedFilter === 'cheapest' && styles.filterChipTextActive
//             ]}>
//               Cheapest
//             </Text>
//           </TouchableOpacity>

//           <TouchableOpacity
//             style={[
//               styles.filterChip,
//               selectedFilter === 'available' && styles.filterChipActive
//             ]}
//             onPress={() => setSelectedFilter('available')}
//           >
//             <Ionicons 
//               name="checkmark-circle" 
//               size={16} 
//               color={selectedFilter === 'available' ? '#fff' : '#22C55E'} 
//             />
//             <Text style={[
//               styles.filterChipText,
//               selectedFilter === 'available' && styles.filterChipTextActive
//             ]}>
//               Available
//             </Text>
//           </TouchableOpacity>
//         </View>

//         <View style={styles.mapContainer}>
//           <Image
//             source={require('../../../assets/images/map.png')}
//             style={styles.map}
//             resizeMode="cover"
//           />
//           <View style={styles.mapOverlay}>
//             <View style={styles.mapPin}>
//               <Ionicons name="location" size={24} color="#fff" />
//             </View>
//           </View>
//         </View>

//         {/* Active Booking - Only shows if user has active parking */}
//         {hasActiveBooking && activeBooking && (
//           <View style={styles.activeSection}>
//             <Animated.View style={[
//               styles.activeBookingCard,
//               { transform: [{ scale: pulseAnim }] }
//             ]}>
//               <TouchableOpacity
//                 style={styles.activeBookingContent}
//                 onPress={() => router.push('/(user)/(tabs)/active-timer')}
//                 activeOpacity={0.8}
//               >
//                 <View style={styles.activeBookingLeft}>
//                   <View style={styles.activeBookingIcon}>
//                     <Ionicons name="time" size={20} color="#fff" />
//                   </View>
//                   <View style={styles.activeBookingInfo}>
//                     <Text style={styles.activeBookingLabel}>ACTIVE PARKING</Text>
//                     <Text style={styles.activeBookingName}>
//                       {activeBooking.parking_facilities?.name || 'Parking'} • Slot {activeBooking.parking_slots?.slot_number || '-'}
//                     </Text>
//                     <Text style={styles.activeBookingVehicle}>
//                       {activeBooking.vehicles?.plate_number || 'Vehicle'}
//                     </Text>
//                   </View>
//                 </View>
//                 <View style={styles.activeBookingRight}>
//                   <Text style={styles.activeBookingTimer}>{formatTime(activeBookingTime)}</Text>
//                   <Ionicons name="chevron-forward" size={20} color="#fff" />
//                 </View>
//               </TouchableOpacity>
//             </Animated.View>
//           </View>
//         )}

//         <View style={styles.parkingSection}>
//           <View style={styles.parkingSectionHeader}>
//             <Text style={styles.sectionTitle}>
//               Parking Nearby ({filteredSpots.length})
//             </Text>
//             <View style={styles.viewToggle}>
//               <TouchableOpacity
//                 style={[
//                   styles.viewToggleBtn,
//                   viewMode === 'list' && styles.viewToggleBtnActive
//                 ]}
//                 onPress={() => setViewMode('list')}
//               >
//                 <Ionicons 
//                   name="list" 
//                   size={18} 
//                   color={viewMode === 'list' ? '#fff' : '#6B7280'} 
//                 />
//               </TouchableOpacity>
//               <TouchableOpacity
//                 style={[
//                   styles.viewToggleBtn,
//                   viewMode === 'grid' && styles.viewToggleBtnActive
//                 ]}
//                 onPress={() => setViewMode('grid')}
//               >
//                 <Ionicons 
//                   name="grid" 
//                   size={18} 
//                   color={viewMode === 'grid' ? '#fff' : '#6B7280'} 
//                 />
//               </TouchableOpacity>
//             </View>
//           </View>

//           {filteredSpots.length === 0 && (
//             <View style={styles.emptyState}>
//               <Ionicons name="car-sport-outline" size={64} color="#D1D5DB" />
//               <Text style={styles.emptyStateText}>No parking facilities found</Text>
//               <TouchableOpacity 
//                 style={styles.retryButton}
//                 onPress={fetchParkingFacilities}
//               >
//                 <Text style={styles.retryButtonText}>Retry</Text>
//               </TouchableOpacity>
//             </View>
//           )}

//           {viewMode === 'list' ? (
//             <>
//               {filteredSpots.map((spot) => (
//                 <TouchableOpacity
//                   key={spot.id}
//                   style={styles.parkingCard}
//                   onPress={() => {
//                     router.push({
//                       pathname: '/(user)/parking-details',
//                       params: {
//                         parkingId: spot.id,
//                         parkingName: spot.name,
//                         parkingAddress: spot.address,
//                         pricePerHour: spot.price,
//                         distance: spot.distance,
//                       }
//                     });
//                   }}
//                   activeOpacity={0.7}
//                 >
//                   <View style={styles.parkingCardHeader}>
//                     <View style={styles.parkingIconContainer}>
//                       <Ionicons name="car-sport" size={28} color="#22C55E" />
//                     </View>
                    
//                     <View style={styles.parkingCardInfo}>
//                       <Text style={styles.parkingName}>{spot.name}</Text>
//                       <View style={styles.parkingMeta}>
//                         <View style={styles.ratingContainer}>
//                           {renderStars(spot.rating)}
//                           <Text style={styles.ratingText}>{spot.rating}</Text>
//                         </View>
//                         <View style={styles.metaDivider} />
//                         <Ionicons name="navigate" size={14} color="#6B7280" />
//                         <Text style={styles.distanceText}>{spot.distance}</Text>
//                       </View>
//                       <Text style={styles.parkingAddress}>{spot.address}</Text>
//                     </View>
//                   </View>

//                   <View style={styles.parkingCardFooter}>
//                     <View style={styles.availabilityBadge}>
//                       <View style={[
//                         styles.availabilityDot,
//                         !spot.isOpen && styles.availabilityDotClosed
//                       ]} />
//                       <Text style={[
//                         styles.availabilityText,
//                         !spot.isOpen && styles.availabilityTextClosed
//                       ]}>
//                         {spot.isOpen 
//                           ? `${spot.slotsAvailable} slots available`
//                           : 'Full'}
//                       </Text>
//                     </View>

//                     <View style={styles.priceContainerNew}>
//                       <Text style={styles.priceNew}>Rs {spot.price}</Text>
//                       <Text style={styles.priceUnitNew}>/hr</Text>
//                     </View>
//                   </View>

//                   <View style={styles.amenitiesRow}>
//                     {spot.amenities.slice(0, 3).map((amenity, index) => (
//                       <View key={index} style={styles.amenityBadge}>
//                         <Text style={styles.amenityBadgeText}>{amenity}</Text>
//                       </View>
//                     ))}
//                     {spot.amenities.length > 3 && (
//                       <Text style={styles.moreAmenities}>+{spot.amenities.length - 3}</Text>
//                     )}
//                   </View>
//                 </TouchableOpacity>
//               ))}
//             </>
//           ) : (
//             <View style={styles.parkingGrid}>
//               {filteredSpots.map((spot) => (
//                 <TouchableOpacity
//                   key={spot.id}
//                   style={styles.parkingGridCard}
//                   onPress={() => {
//                     router.push({
//                       pathname: '/(user)/parking-details',
//                       params: {
//                         parkingId: spot.id,
//                         parkingName: spot.name,
//                         parkingAddress: spot.address,
//                         pricePerHour: spot.price,
//                         distance: spot.distance,
//                       }
//                     });
//                   }}
//                   activeOpacity={0.7}
//                 >
//                   <View style={styles.gridCardTop}>
//                     <View style={styles.gridIconContainer}>
//                       <Ionicons name="car-sport" size={24} color="#22C55E" />
//                     </View>
//                     <View style={[
//                       styles.gridStatusDot,
//                       !spot.isOpen && styles.gridStatusDotClosed
//                     ]} />
//                   </View>
                  
//                   <Text style={styles.gridParkingName} numberOfLines={1}>
//                     {spot.name}
//                   </Text>
                  
//                   <View style={styles.gridRating}>
//                     <Ionicons name="star" size={12} color="#F59E0B" />
//                     <Text style={styles.gridRatingText}>{spot.rating}</Text>
//                   </View>
                  
//                   <View style={styles.gridFooter}>
//                     <Text style={styles.gridPrice}>Rs {spot.price}/hr</Text>
//                     <Text style={styles.gridDistance}>{spot.distance}</Text>
//                   </View>
//                 </TouchableOpacity>
//               ))}
//             </View>
//           )}
//         </View>

//         <View style={{ height: 120 }} />
//       </ScrollView>

//       <FilterModal
//         visible={showFilter}
//         onClose={() => setShowFilter(false)}
//         onApply={handleFilterApply}
//       />

//       <BottomTabs />
//     </View>
//   );
// };

// export default UserDashboard;