import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { styles } from './listings.styles';

type Listing = {
  id: string;
  title: string;
  location: string;
  capacity: number;
  price_per_night: number;
  is_available: boolean;
  amenities: string[];
  photo_url?: string;
};

export default function Listings() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [listings, setListings] = useState<Listing[]>([
    {
      id: '1',
      title: 'Secure Compound - Boudha',
      location: 'Boudha, Kathmandu',
      capacity: 2,
      price_per_night: 250,
      is_available: true,
      amenities: ['Fenced', 'Lighting', 'Watchman'],
    },
    {
      id: '2',
      title: 'Covered Garage - Thamel',
      location: 'Thamel, Kathmandu',
      capacity: 1,
      price_per_night: 400,
      is_available: true,
      amenities: ['Covered', 'CCTV', 'Locked Gate'],
    },
    {
      id: '3',
      title: 'Open Space - New Road',
      location: 'New Road, Kathmandu',
      capacity: 3,
      price_per_night: 150,
      is_available: false,
      amenities: ['Open', 'Lighting'],
    },
  ]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      setLoading(true);
      // TODO: Fetch from Supabase
      setTimeout(() => {
        setLoading(false);
        setRefreshing(false);
      }, 500);
    } catch (error) {
      console.error('Error fetching listings:', error);
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchListings();
  };

  const handleAddListing = () => {
    // router.push('/(land-owner)/listing/add');
  };

  const handleViewListing = (listingId: string) => {
    // router.push(`/(land-owner)/listing/${listingId}`);
  };

  const handleEditListing = (listingId: string) => {
    // router.push(`/(land-owner)/listing/edit/${listingId}`);
  };

  const filteredListings = listings.filter(listing =>
    listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    listing.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeListings = filteredListings.filter(l => l.is_available);
  const inactiveListings = filteredListings.filter(l => !l.is_available);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#22C55E" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Listings</Text>
        <TouchableOpacity>
          <Ionicons name="notifications-outline" size={24} color="#111827" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22C55E" />
        }
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search listings..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Add New Listing Button */}
        <TouchableOpacity style={styles.addButton} onPress={handleAddListing}>
          <Ionicons name="add-circle" size={24} color="#FFFFFF" />
          <Text style={styles.addButtonText}>ADD NEW LISTING</Text>
        </TouchableOpacity>

        {/* Active Listings */}
        {activeListings.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Active Listings</Text>
              <Text style={styles.totalCount}>{activeListings.length} TOTAL</Text>
            </View>

            {activeListings.map((listing) => (
              <View key={listing.id} style={styles.listingCard}>
                {/* Photo Placeholder */}
                <View style={styles.listingImage}>
                  <Ionicons name="home" size={32} color="#D1D5DB" />
                </View>

                {/* Listing Details */}
                <View style={styles.listingContent}>
                  <View style={styles.listingHeader}>
                    <View style={styles.listingTitleRow}>
                      <Text style={styles.listingTitle} numberOfLines={1}>
                        {listing.title}
                      </Text>
                      <View style={styles.statusBadge}>
                        <Text style={styles.statusText}>ACTIVE</Text>
                      </View>
                    </View>
                    <View style={styles.locationRow}>
                      <Ionicons name="location-outline" size={14} color="#6B7280" />
                      <Text style={styles.locationText} numberOfLines={1}>
                        {listing.location}
                      </Text>
                    </View>
                  </View>

                  {/* Stats */}
                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <Ionicons name="car-outline" size={16} color="#6B7280" />
                      <Text style={styles.statText}>{listing.capacity} vehicles</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                      <Ionicons name="moon-outline" size={16} color="#6B7280" />
                      <Text style={styles.statText}>Rs {listing.price_per_night}/night</Text>
                    </View>
                  </View>

                  {/* Amenities */}
                  <View style={styles.amenitiesRow}>
                    {listing.amenities.slice(0, 3).map((amenity, index) => (
                      <View key={index} style={styles.amenityBadge}>
                        <Text style={styles.amenityText}>{amenity}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={styles.viewButton}
                      onPress={() => handleViewListing(listing.id)}
                    >
                      <Text style={styles.viewButtonText}>VIEW DETAILS</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => handleEditListing(listing.id)}
                    >
                      <Ionicons name="pencil" size={20} color="#6B7280" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </>
        )}

        {/* Inactive Listings */}
        {inactiveListings.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Inactive Listings</Text>
              <Text style={styles.totalCount}>{inactiveListings.length} TOTAL</Text>
            </View>

            {inactiveListings.map((listing) => (
              <View key={listing.id} style={[styles.listingCard, styles.listingCardInactive]}>
                {/* Photo Placeholder */}
                <View style={[styles.listingImage, styles.listingImageInactive]}>
                  <Ionicons name="home" size={32} color="#9CA3AF" />
                </View>

                {/* Listing Details */}
                <View style={styles.listingContent}>
                  <View style={styles.listingHeader}>
                    <View style={styles.listingTitleRow}>
                      <Text style={styles.listingTitle} numberOfLines={1}>
                        {listing.title}
                      </Text>
                      <View style={styles.statusBadgeInactive}>
                        <Text style={styles.statusTextInactive}>INACTIVE</Text>
                      </View>
                    </View>
                    <View style={styles.locationRow}>
                      <Ionicons name="location-outline" size={14} color="#6B7280" />
                      <Text style={styles.locationText} numberOfLines={1}>
                        {listing.location}
                      </Text>
                    </View>
                  </View>

                  {/* Stats */}
                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <Ionicons name="car-outline" size={16} color="#6B7280" />
                      <Text style={styles.statText}>{listing.capacity} vehicles</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                      <Ionicons name="moon-outline" size={16} color="#6B7280" />
                      <Text style={styles.statText}>Rs {listing.price_per_night}/night</Text>
                    </View>
                  </View>

                  {/* Amenities */}
                  <View style={styles.amenitiesRow}>
                    {listing.amenities.slice(0, 3).map((amenity, index) => (
                      <View key={index} style={styles.amenityBadge}>
                        <Text style={styles.amenityText}>{amenity}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={styles.viewButton}
                      onPress={() => handleViewListing(listing.id)}
                    >
                      <Text style={styles.viewButtonText}>VIEW DETAILS</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => handleEditListing(listing.id)}
                    >
                      <Ionicons name="pencil" size={20} color="#6B7280" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </>
        )}

        {/* Empty State */}
        {filteredListings.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="home-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>No listings found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? 'Try a different search' : 'Add your first listing to get started'}
            </Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}