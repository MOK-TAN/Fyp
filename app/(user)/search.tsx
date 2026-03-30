import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../../lib/supabase';

type Facility = {
  id: string;
  name: string;
  address: string;
  price_per_hour: number;
  total_slots: number;
  available_slots: number;
  amenities: string[];
};

const SearchScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Fetch all facilities on mount (for browse mode)
  useEffect(() => {
    fetchFacilities('');
  }, []);

  const fetchFacilities = async (query: string) => {
    try {
      setLoading(true);

      let request = supabase
        .from('parking_facilities')
        .select('id, name, address, price_per_hour, total_slots, amenities')
        .eq('is_active', true)
        .eq('is_approved', true)
        .order('name', { ascending: true });

      if (query.trim()) {
        request = request.or(`name.ilike.%${query.trim()}%,address.ilike.%${query.trim()}%`);
      }

      const { data, error } = await request.limit(20);

      if (error) throw error;

      // Fetch available slots for each
      const facilitiesWithSlots: Facility[] = [];

      for (const f of (data || [])) {
        const { count } = await supabase
          .from('parking_slots')
          .select('*', { count: 'exact', head: true })
          .eq('facility_id', f.id)
          .eq('is_available', true)
          .eq('is_occupied', false);

        facilitiesWithSlots.push({
          id: f.id,
          name: f.name,
          address: f.address,
          price_per_hour: f.price_per_hour,
          total_slots: f.total_slots,
          available_slots: count || 0,
          amenities: Array.isArray(f.amenities) ? f.amenities : [],
        });
      }

      setFacilities(facilitiesWithSlots);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchFacilities(searchQuery);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleFacilityPress = (facility: Facility) => {
    // Save to recent searches
    if (searchQuery.trim() && !recentSearches.includes(searchQuery.trim())) {
      setRecentSearches(prev => [searchQuery.trim(), ...prev].slice(0, 5));
    }

    router.push({
      pathname: '/(user)/parking-details',
      params: {
        parkingId: facility.id,
        parkingName: facility.name,
        parkingAddress: facility.address,
        pricePerHour: facility.price_per_hour.toString(),
      }
    });
  };

  const handleRecentSearch = (term: string) => {
    setSearchQuery(term);
  };

  const renderFacility = ({ item }: { item: Facility }) => (
    <TouchableOpacity
      style={styles.facilityCard}
      onPress={() => handleFacilityPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.facilityIcon}>
        <Ionicons name="car-sport" size={24} color="#22C55E" />
      </View>
      <View style={styles.facilityInfo}>
        <Text style={styles.facilityName}>{item.name}</Text>
        <Text style={styles.facilityAddress}>{item.address}</Text>
        <View style={styles.facilityMeta}>
          <View style={styles.availabilityBadge}>
            <View style={[
              styles.availDot,
              { backgroundColor: item.available_slots > 0 ? '#22C55E' : '#EF4444' }
            ]} />
            <Text style={styles.availText}>
              {item.available_slots > 0 ? `${item.available_slots} slots` : 'Full'}
            </Text>
          </View>
          <Text style={styles.priceText}>Rs {item.price_per_hour}/hr</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Find Nearby Parking</Text>
        <Text style={styles.subtitle}>Search by name or location</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search parking facilities..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoFocus
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#D1D5DB" />
          </TouchableOpacity>
        )}
      </View>

      {/* Recent Searches */}
      {recentSearches.length > 0 && searchQuery === '' && (
        <View style={styles.recentSection}>
          <Text style={styles.recentTitle}>Recent Searches</Text>
          <View style={styles.recentList}>
            {recentSearches.map((term, index) => (
              <TouchableOpacity
                key={index}
                style={styles.recentChip}
                onPress={() => handleRecentSearch(term)}
              >
                <Ionicons name="time-outline" size={14} color="#6B7280" />
                <Text style={styles.recentText}>{term}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Results */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#22C55E" />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      ) : (
        <FlatList
          data={facilities}
          keyExtractor={(item) => item.id}
          renderItem={renderFacility}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          ListHeaderComponent={
            facilities.length > 0 ? (
              <Text style={styles.resultsCount}>
                {facilities.length} {searchQuery ? 'results' : 'facilities available'}
              </Text>
            ) : null
          }
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyText}>No parking facilities found</Text>
                <Text style={styles.emptySubtext}>
                  {searchQuery ? `No results for "${searchQuery}"` : 'No facilities available right now'}
                </Text>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: 10 },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  titleContainer: { paddingHorizontal: 20, marginBottom: 20 },
  title: { fontSize: 28, fontWeight: '700', color: '#111827', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#9CA3AF' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 16, backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 15, height: 48, borderWidth: 2, borderColor: '#22C55E', gap: 10 },
  searchInput: { flex: 1, fontSize: 16, color: '#111827' },

  // Recent
  recentSection: { paddingHorizontal: 20, marginBottom: 16 },
  recentTitle: { fontSize: 14, fontWeight: '600', color: '#6B7280', marginBottom: 10 },
  recentList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  recentChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#F3F4F6' },
  recentText: { fontSize: 13, color: '#6B7280' },

  // Results
  resultsCount: { fontSize: 14, fontWeight: '600', color: '#6B7280', marginBottom: 12 },
  listContainer: { paddingHorizontal: 20, paddingBottom: 20 },

  // Facility Card
  facilityCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  facilityIcon: { width: 52, height: 52, borderRadius: 14, backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  facilityInfo: { flex: 1 },
  facilityName: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 3 },
  facilityAddress: { fontSize: 13, color: '#9CA3AF', marginBottom: 6 },
  facilityMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  availabilityBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  availDot: { width: 7, height: 7, borderRadius: 4 },
  availText: { fontSize: 12, fontWeight: '500', color: '#6B7280' },
  priceText: { fontSize: 14, fontWeight: '700', color: '#22C55E' },

  // Loading
  loadingContainer: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  loadingText: { fontSize: 14, color: '#9CA3AF' },

  // Empty
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#374151', marginTop: 16 },
  emptySubtext: { fontSize: 14, color: '#9CA3AF', marginTop: 8 },
});

export default SearchScreen;