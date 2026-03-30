import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import BottomTabs from '../../components/BottomTabs';
import { supabase } from '../../lib/supabase';

type SavedSpot = {
  id: string;
  facility_id: string;
  category: string;
  name: string;
  address: string;
  price_per_hour: number;
  total_slots: number;
  available_slots: number;
};

const SavedParking = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savedSpots, setSavedSpots] = useState<SavedSpot[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Work', 'Home', 'Shopping', 'Other'];

  // Re-fetch on focus (in case user saved/unsaved from another screen)
  useFocusEffect(
    useCallback(() => {
      fetchSavedParking();
    }, [])
  );

  const fetchSavedParking = async () => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('saved_parking')
        .select(`
          id,
          facility_id,
          category,
          parking_facilities (
            name,
            address,
            price_per_hour,
            total_slots
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get available slot counts for each facility
      const spots: SavedSpot[] = [];

      for (const item of (data || [])) {
        const facility = (item as any).parking_facilities;
        if (!facility) continue;

        const { count } = await supabase
          .from('parking_slots')
          .select('*', { count: 'exact', head: true })
          .eq('facility_id', item.facility_id)
          .eq('is_available', true)
          .eq('is_occupied', false);

        spots.push({
          id: item.id,
          facility_id: item.facility_id,
          category: item.category || 'Other',
          name: facility.name,
          address: facility.address,
          price_per_hour: facility.price_per_hour,
          total_slots: facility.total_slots,
          available_slots: count || 0,
        });
      }

      setSavedSpots(spots);
    } catch (error) {
      console.error('Error fetching saved parking:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchSavedParking();
  };

  const handleUnsave = (id: string, name: string) => {
    Alert.alert(
      'Remove from Saved',
      `Remove "${name}" from your saved parking spots?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('saved_parking')
                .delete()
                .eq('id', id);

              if (error) throw error;

              setSavedSpots(prev => prev.filter(spot => spot.id !== id));
            } catch (error) {
              console.error('Unsave error:', error);
              Alert.alert('Error', 'Failed to remove from saved');
            }
          },
        },
      ]
    );
  };

  const handleUpdateCategory = (spotId: string, newCategory: string) => {
    Alert.alert(
      'Change Category',
      `Move to "${newCategory}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Move',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('saved_parking')
                .update({ category: newCategory.toLowerCase() })
                .eq('id', spotId);

              if (error) throw error;

              setSavedSpots(prev =>
                prev.map(s => s.id === spotId ? { ...s, category: newCategory.toLowerCase() } : s)
              );
            } catch (error) {
              console.error('Category update error:', error);
            }
          },
        },
      ]
    );
  };

  const handleSpotPress = (spot: SavedSpot) => {
    router.push({
      pathname: '/(user)/parking-details',
      params: {
        parkingId: spot.facility_id,
        parkingName: spot.name,
        parkingAddress: spot.address,
        pricePerHour: spot.price_per_hour.toString(),
      }
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'work': return 'briefcase';
      case 'home': return 'home';
      case 'shopping': return 'cart';
      default: return 'location';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'work': return '#3B82F6';
      case 'home': return '#22C55E';
      case 'shopping': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const filteredSpots = selectedCategory === 'All'
    ? savedSpots
    : savedSpots.filter(spot => spot.category.toLowerCase() === selectedCategory.toLowerCase());

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#22C55E" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Saved Parking</Text>
          <Text style={styles.subtitle}>{savedSpots.length} locations saved</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22C55E" />
        }
      >
        {/* Category Filters */}
        <View style={styles.categoriesSection}>
          <Text style={styles.categoriesLabel}>Categories</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categories}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryChip,
                  selectedCategory === category && styles.categoryChipActive
                ]}
                onPress={() => setSelectedCategory(category)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.categoryText,
                  selectedCategory === category && styles.categoryTextActive
                ]}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Empty State */}
        {filteredSpots.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="bookmark-outline" size={64} color="#D1D5DB" />
            </View>
            <Text style={styles.emptyTitle}>No Saved Parking</Text>
            <Text style={styles.emptySubtitle}>
              {selectedCategory === 'All'
                ? 'Tap the heart icon on any parking facility to save it here'
                : `No parking spots saved in ${selectedCategory} category`}
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push('/(user)/(tabs)')}
            >
              <Text style={styles.emptyButtonText}>Browse Parking</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {filteredSpots.map((spot) => (
              <TouchableOpacity
                key={spot.id}
                style={styles.parkingCard}
                onPress={() => handleSpotPress(spot)}
                activeOpacity={0.7}
              >
                {/* Card Header */}
                <View style={styles.cardHeader}>
                  <View style={styles.parkingIconContainer}>
                    <Ionicons name="car-sport" size={28} color="#22C55E" />
                  </View>

                  <View style={styles.parkingMainInfo}>
                    <View style={styles.parkingNameRow}>
                      <Text style={styles.parkingName} numberOfLines={1}>
                        {spot.name}
                      </Text>
                      <TouchableOpacity
                        style={styles.bookmarkButton}
                        onPress={() => handleUnsave(spot.id, spot.name)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Ionicons name="bookmark" size={22} color="#22C55E" />
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.parkingAddress} numberOfLines={1}>
                      {spot.address}
                    </Text>

                    <View style={styles.availabilityRow}>
                      <View style={[
                        styles.availabilityDot,
                        { backgroundColor: spot.available_slots > 0 ? '#22C55E' : '#EF4444' }
                      ]} />
                      <Text style={styles.availabilityText}>
                        {spot.available_slots > 0
                          ? `${spot.available_slots}/${spot.total_slots} slots available`
                          : 'Full'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Card Footer */}
                <View style={styles.cardFooter}>
                  <TouchableOpacity
                    style={styles.categoryBadge}
                    onPress={() => {
                      const nextCategories = ['Work', 'Home', 'Shopping', 'Other'];
                      const currentIndex = nextCategories.findIndex(c => c.toLowerCase() === spot.category.toLowerCase());
                      const nextCategory = nextCategories[(currentIndex + 1) % nextCategories.length];
                      handleUpdateCategory(spot.id, nextCategory);
                    }}
                  >
                    <Ionicons
                      name={getCategoryIcon(spot.category) as any}
                      size={14}
                      color={getCategoryColor(spot.category)}
                    />
                    <Text style={[styles.categoryBadgeText, { color: getCategoryColor(spot.category) }]}>
                      {spot.category.charAt(0).toUpperCase() + spot.category.slice(1)}
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.priceContainer}>
                    <Text style={styles.price}>Rs {spot.price_per_hour}</Text>
                    <Text style={styles.priceUnit}>/hr</Text>
                  </View>
                </View>

                {/* Quick Actions */}
                <View style={styles.quickActions}>
                  <TouchableOpacity
                    style={styles.quickActionButton}
                    onPress={() => handleSpotPress(spot)}
                  >
                    <Ionicons name="information-circle-outline" size={16} color="#22C55E" />
                    <Text style={styles.quickActionText}>Details</Text>
                  </TouchableOpacity>

                  <View style={styles.actionDivider} />

                  <TouchableOpacity
                    style={styles.quickActionButton}
                    onPress={() => {
                      router.push({
                        pathname: '/(user)/bookings/select-slot',
                        params: {
                          parkingId: spot.facility_id,
                          parkingName: spot.name,
                          pricePerHour: spot.price_per_hour.toString(),
                        }
                      });
                    }}
                  >
                    <Ionicons name="time" size={16} color="#22C55E" />
                    <Text style={styles.quickActionText}>Book Now</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <BottomTabs />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { backgroundColor: '#fff', paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  headerContent: { alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#6B7280' },
  scrollContent: { paddingBottom: 20 },

  // Categories
  categoriesSection: { backgroundColor: '#fff', paddingTop: 16, paddingBottom: 12 },
  categoriesLabel: { fontSize: 14, fontWeight: '600', color: '#6B7280', marginBottom: 12, paddingHorizontal: 20 },
  categories: { paddingHorizontal: 20, gap: 8 },
  categoryChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  categoryChipActive: { backgroundColor: '#22C55E', borderColor: '#22C55E' },
  categoryText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  categoryTextActive: { color: '#fff' },

  // Empty
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80, paddingHorizontal: 40 },
  emptyIconContainer: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  emptyButton: { backgroundColor: '#22C55E', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
  emptyButtonText: { fontSize: 15, fontWeight: '600', color: '#fff' },

  // List
  listContainer: { paddingHorizontal: 20, paddingTop: 16 },
  parkingCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E5E7EB' },

  // Card Header
  cardHeader: { flexDirection: 'row', marginBottom: 12 },
  parkingIconContainer: { width: 56, height: 56, borderRadius: 14, backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  parkingMainInfo: { flex: 1 },
  parkingNameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  parkingName: { fontSize: 16, fontWeight: '700', color: '#111827', flex: 1 },
  bookmarkButton: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  parkingAddress: { fontSize: 13, color: '#9CA3AF', marginBottom: 6 },
  availabilityRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  availabilityDot: { width: 8, height: 8, borderRadius: 4 },
  availabilityText: { fontSize: 12, fontWeight: '500', color: '#6B7280' },

  // Card Footer
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  categoryBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: '#F9FAFB', gap: 4 },
  categoryBadgeText: { fontSize: 12, fontWeight: '600' },
  priceContainer: { flexDirection: 'row', alignItems: 'baseline' },
  price: { fontSize: 18, fontWeight: '700', color: '#22C55E' },
  priceUnit: { fontSize: 12, fontWeight: '500', color: '#6B7280', marginLeft: 2 },

  // Quick Actions
  quickActions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 12 },
  quickActionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, gap: 6 },
  quickActionText: { fontSize: 14, fontWeight: '600', color: '#22C55E' },
  actionDivider: { width: 1, height: '100%', backgroundColor: '#F3F4F6' },
});

export default SavedParking;