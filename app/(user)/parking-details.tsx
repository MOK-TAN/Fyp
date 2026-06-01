import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { styles } from './parking-details.styles';

const { width } = Dimensions.get('window');

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  profiles: {
    full_name: string;
  } | null;
}

interface ParkingFacility {
  id: string;
  name: string;
  address: string;
  price_per_hour: number;
  total_slots: number;
  amenities: string[];
  photos: string[];
}

export default function ParkingDetails() {
  const params = useLocalSearchParams();
  const parkingId = params.parkingId as string;

  const [facility, setFacility] = useState<ParkingFacility | null>(null);
  const [availableSlots, setAvailableSlots] = useState(0);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    fetchParkingDetails();
    fetchReviews();
    checkIfSaved();
  }, [parkingId]);

  const fetchParkingDetails = async () => {
    try {
      setLoading(true);

      // Fetch facility details
      const { data: facilityData, error: facilityError } = await supabase
        .from('parking_facilities')
        .select('*')
        .eq('id', parkingId)
        .single();

      if (facilityError) throw facilityError;

      // Fetch available slots count
      const { count } = await supabase
        .from('parking_slots')
        .select('*', { count: 'exact', head: true })
        .eq('facility_id', parkingId)
        .eq('is_available', true);

      setFacility(facilityData);
      setAvailableSlots(count || 0);
    } catch (error: any) {
      console.error('Error fetching parking details:', error);
      Alert.alert('Error', 'Failed to load parking details');
    } finally {
      setLoading(false);
    }
  };

const fetchReviews = async () => {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        id,
        rating,
        comment,
        created_at,
        profiles (
          full_name
        )
      `)
      .eq('facility_id', parkingId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    setReviews(data as any || []);
  } catch (error: any) {
    console.error('Error fetching reviews:', error);
  }
};

  const checkIfSaved = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('saved_parking')
        .select('id')
        .eq('user_id', user.id)
        .eq('facility_id', parkingId)
        .single();

      if (data) {
        setIsSaved(true);
      }
    } catch (error) {
      // Not saved
      setIsSaved(false);
    }
  };

  const handleToggleSave = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'Please login to save parking');
        return;
      }

      if (isSaved) {
        // Remove from saved
        const { error } = await supabase
          .from('saved_parking')
          .delete()
          .eq('user_id', user.id)
          .eq('facility_id', parkingId);

        if (error) throw error;
        setIsSaved(false);
        Alert.alert('Success', 'Removed from saved');
      } else {
        // Add to saved
        const { error } = await supabase
          .from('saved_parking')
          .insert({
            user_id: user.id,
            facility_id: parkingId,
            category: 'other',
          });

        if (error) throw error;
        setIsSaved(true);
        Alert.alert('Success', 'Added to saved parking');
      }
    } catch (error: any) {
      console.error('Error toggling save:', error);
      Alert.alert('Error', 'Failed to update saved parking');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  const getInitial = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : 'U';
  };

  const calculateAverageRating = () => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, index) => (
      <Ionicons
        key={index}
        name={index < rating ? 'star' : 'star-outline'}
        size={16}
        color="#F59E0B"
      />
    ));
  };

  const handleBookParking = () => {
    if (!facility) return;

    router.push({
      pathname: '/(user)/bookings/select-slot',
      params: {
        parkingId: facility.id,
        parkingName: facility.name,
        pricePerHour: facility.price_per_hour.toString(),
      }
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#22C55E" />
        <Text style={styles.loadingText}>Loading parking details...</Text>
      </View>
    );
  }

  if (!facility) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
        <Text style={styles.errorText}>Parking facility not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const images = facility.photos && facility.photos.length > 0 
    ? facility.photos 
    : ['https://via.placeholder.com/400x250/22C55E/FFFFFF?text=No+Image'];

  const amenities = Array.isArray(facility.amenities) ? facility.amenities : [];

  const amenityIcons: { [key: string]: string } = {
    'CCTV': 'videocam',
    'Covered': 'umbrella',
    '24/7': 'time',
    'Security': 'shield-checkmark',
    'EV Charging': 'flash',
    'Wheelchair Access': 'accessibility',
    'EV': 'flash',
    'Wheelchair': 'accessibility',
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButtonHeader}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Parking Details</Text>
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={handleToggleSave}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons 
            name={isSaved ? 'heart' : 'heart-outline'} 
            size={24} 
            color={isSaved ? '#EF4444' : '#333'} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        

        {/* Main Info */}
        <View style={styles.infoSection}>
          <View style={styles.titleRow}>
            <View style={styles.titleLeft}>
              <Text style={styles.parkingName}>{facility.name}</Text>
              <View style={styles.locationRow}>
                <Ionicons name="location" size={16} color="#6B7280" />
                <Text style={styles.address}>{facility.address}</Text>
              </View>
            </View>
            <View style={styles.distanceBadge}>
              <Ionicons name="navigate" size={16} color="#22C55E" />
              <Text style={styles.distanceText}>2km</Text>
            </View>
          </View>

          {/* Price and Rating */}
          <View style={styles.statsRow}>
            <View style={styles.priceContainer}>
              <Text style={styles.price}>Rs {facility.price_per_hour}</Text>
              <Text style={styles.priceUnit}>/hour</Text>
            </View>
            {reviews.length > 0 && (
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={20} color="#F59E0B" />
                <Text style={styles.ratingText}>{calculateAverageRating()}</Text>
                <Text style={styles.reviewCount}>({reviews.length} reviews)</Text>
              </View>
            )}
          </View>

          {/* Availability */}
          <View style={styles.availabilityCard}>
            <Ionicons 
              name={availableSlots > 0 ? "checkmark-circle" : "close-circle"} 
              size={24} 
              color={availableSlots > 0 ? "#22C55E" : "#EF4444"} 
            />
            <View style={styles.availabilityInfo}>
              <Text style={[
                styles.availabilityTitle,
                availableSlots === 0 && styles.availabilityTitleFull
              ]}>
                {availableSlots > 0 ? 'Available Now' : 'Full'}
              </Text>
              <Text style={styles.availabilityText}>
                {availableSlots} out of {facility.total_slots} slots free
              </Text>
            </View>
          </View>
        </View>

        {/* Amenities */}
        {amenities.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Amenities</Text>
            <View style={styles.amenitiesGrid}>
              {amenities.map((amenity, index) => (
                <View key={index} style={styles.amenityItem}>
                  <View style={styles.amenityIcon}>
                    <Ionicons 
                      name={amenityIcons[amenity] as any || 'checkmark-circle'} 
                      size={20} 
                      color="#22C55E" 
                    />
                  </View>
                  <Text style={styles.amenityText}>{amenity}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.aboutText}>
            Secure and convenient parking facility located in {facility.address}. 
            Perfect for daily commuters and visitors. Easy access from main road with 
            24/7 security surveillance.
          </Text>
        </View>

        {/* Reviews */}
        {reviews.length > 0 && (
          <View style={styles.section}>
            <View style={styles.reviewsHeader}>
              <Text style={styles.sectionTitle}>Reviews ({reviews.length})</Text>
              {reviews.length > 2 && (
                <TouchableOpacity>
                  <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
              )}
            </View>

            {reviews.slice(0, 2).map((review) => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewLeft}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
  {getInitial(review.profiles?.full_name || 'U')}
</Text>
                    </View>
                    <View>
                      <Text style={styles.reviewName}>
                        {review.profiles?.full_name || 'Anonymous'}
                      </Text>
                      <Text style={styles.reviewDate}>
                        {formatDate(review.created_at)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.reviewRating}>
                    {renderStars(review.rating)}
                  </View>
                </View>
                <Text style={styles.reviewComment}>{review.comment}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Book Button */}
      <View style={styles.footer}>
        <View style={styles.footerInfo}>
          <Text style={styles.footerPrice}>Rs {facility.price_per_hour}/hour</Text>
          <Text style={styles.footerSubtext}>Best price guaranteed</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.bookButton,
            availableSlots === 0 && styles.bookButtonDisabled
          ]}
          onPress={handleBookParking}
          disabled={availableSlots === 0}
          activeOpacity={0.8}
        >
          <Text style={styles.bookButtonText}>
            {availableSlots > 0 ? 'Book Parking' : 'Full'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}