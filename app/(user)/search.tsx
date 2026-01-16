import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

// Dummy Kathmandu locations
const LOCATIONS = [
  { id: 1, name: 'New Road', address: 'Juddha Sadak, Kathmandu' },
  { id: 2, name: 'Thamel', address: 'Thamel Marg, Kathmandu' },
  { id: 3, name: 'Bagbazar', address: 'Bagbazar, Kathmandu' },
  { id: 4, name: 'Durbar Marg', address: 'Durbar Marg, Kathmandu' },
  { id: 5, name: 'Boudhanath', address: 'Boudha, Kathmandu' },
  { id: 6, name: 'Patan Durbar Square', address: 'Mangal Bazaar, Lalitpur' },
  { id: 7, name: 'Pulchowk', address: 'Pulchowk, Lalitpur' },
  { id: 8, name: 'Koteshwor', address: 'Koteshwor, Kathmandu' },
  { id: 9, name: 'Baluwatar', address: 'Baluwatar, Kathmandu' },
  { id: 10, name: 'Lazimpat', address: 'Lazimpat, Kathmandu' },
];

const SearchScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredLocations, setFilteredLocations] = useState(LOCATIONS);

  // Handle search
  const handleSearch = (text: string) => {
    setSearchQuery(text);
    
    if (text.trim() === '') {
      setFilteredLocations(LOCATIONS);
    } else {
      const filtered = LOCATIONS.filter(
        (location) =>
          location.name.toLowerCase().includes(text.toLowerCase()) ||
          location.address.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredLocations(filtered);
    }
  };

  // Handle location select
  const handleLocationSelect = (location: typeof LOCATIONS[0]) => {
    // Navigate to results screen with selected location
    router.push({
      pathname: '/(user)/search-results',
      params: { location: location.name },
    });
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
      </View>

      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Find Nearby Parking</Text>
        <Text style={styles.subtitle}>Enter your location to find them.</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search location"
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={handleSearch}
          autoFocus
        />
        <TouchableOpacity style={styles.filterIconButton}>
          <Ionicons name="options-outline" size={20} color="#22C55E" />
        </TouchableOpacity>
      </View>

      {/* Location List */}
      <FlatList
        data={filteredLocations}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.locationItem}
            onPress={() => handleLocationSelect(item)}
          >
            <View style={styles.locationIcon}>
              <Ionicons name="location" size={20} color="#22C55E" />
            </View>
            <View style={styles.locationInfo}>
              <Text style={styles.locationName}>{item.name}</Text>
              <Text style={styles.locationAddress}>{item.address}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
          </TouchableOpacity>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons name="location-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>No locations found</Text>
            <Text style={styles.emptySubtext}>
              Try searching for a different location
            </Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  titleContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 48,
    borderWidth: 2,
    borderColor: '#22C55E',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  filterIconButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 13,
    color: '#999',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
});

export default SearchScreen;