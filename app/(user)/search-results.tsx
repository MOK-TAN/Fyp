import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import FilterModal from '../../components/FilterModal';

// Dummy parking data for Kathmandu
const PARKING_RESULTS = [
  {
    id: 1,
    name: 'New Road Parking',
    address: 'Juddha Sadak, Kathmandu',
    distance: '2km',
    price: 'Rs 20',
    priceUnit: '/hour',
  },
  {
    id: 2,
    name: 'Thamel Square Parking',
    address: 'Thamel Marg, Kathmandu',
    distance: '5km',
    price: 'Rs 30',
    priceUnit: '/hour',
  },
  {
    id: 3,
    name: 'Durbar Marg Parking',
    address: 'Durbar Marg, Kathmandu',
    distance: '4km',
    price: 'Rs 50',
    priceUnit: '/hour',
  },
  {
    id: 4,
    name: 'Boudha Parking',
    address: 'Boudhanath, Kathmandu',
    distance: '8km',
    price: 'Rs 25',
    priceUnit: '/hour',
  },
  {
    id: 5,
    name: 'Patan Parking',
    address: 'Mangal Bazaar, Lalitpur',
    distance: '6km',
    price: 'Rs 20',
    priceUnit: '/hour',
  },
  {
    id: 6,
    name: 'Pulchowk Parking',
    address: 'Pulchowk, Lalitpur',
    distance: '7km',
    price: 'Rs 30',
    priceUnit: '/hour',
  },
  {
    id: 7,
    name: 'Koteshwor Parking',
    address: 'Koteshwor, Kathmandu',
    distance: '9km',
    price: 'Rs 20',
    priceUnit: '/hour',
  },
];

const SearchResults = () => {
  const params = useLocalSearchParams();
  const location = params.location || 'Kathmandu';
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [filteredResults, setFilteredResults] = useState(PARKING_RESULTS);

  // Handle search
  const handleSearch = (text: string) => {
    setSearchQuery(text);
    
    if (text.trim() === '') {
      setFilteredResults(PARKING_RESULTS);
    } else {
      const filtered = PARKING_RESULTS.filter(
        (parking) =>
          parking.name.toLowerCase().includes(text.toLowerCase()) ||
          parking.address.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredResults(filtered);
    }
  };

  // Handle filter apply
  const handleFilterApply = (filters: any) => {
    console.log('Filters applied:', filters);
    // Apply filtering logic here
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
        <Text style={styles.headerTitle}>Results Found</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for parking"
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilter(true)}
        >
          <Ionicons name="options-outline" size={20} color="#22C55E" />
        </TouchableOpacity>
      </View>

      {/* Results Count */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>Results({filteredResults.length})</Text>
      </View>

      {/* Parking List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      >
        {filteredResults.map((parking) => (
          <TouchableOpacity
            key={parking.id}
            style={styles.parkingCard}
            activeOpacity={0.7}
            onPress={() => {
              router.push({
                pathname: '/(user)/parking-details',
                params: {
                  parkingId: parking.id.toString(),
                  parkingName: parking.name,
                  parkingAddress: parking.address,
                  pricePerHour: parking.price.replace('Rs ', ''),
                  distance: parking.distance,
                }
              });
            }}
          >
            <View style={styles.parkingImageContainer}>
              <View style={styles.parkingImagePlaceholder}>
                <Ionicons name="car" size={24} color="#22C55E" />
              </View>
            </View>
            
            <View style={styles.parkingInfo}>
              <Text style={styles.parkingName}>{parking.name}</Text>
              <Text style={styles.parkingAddress}>{parking.address}</Text>
            </View>
            
            <View style={styles.parkingRight}>
              <Text style={styles.distance}>{parking.distance}</Text>
              <View style={styles.priceContainer}>
                <Text style={styles.price}>{parking.price}</Text>
                <Text style={styles.priceUnit}>{parking.priceUnit}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Filter Modal */}
      <FilterModal
        visible={showFilter}
        onClose={() => setShowFilter(false)}
        onApply={handleFilterApply}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
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
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
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
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#333',
  },
  filterButton: {
    width: 48,
    height: 48,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultsHeader: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  resultsCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
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
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
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
    color: '#22C55E',
  },
  priceUnit: {
    fontSize: 11,
    color: '#999',
  },
});

export default SearchResults;