import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import BottomTabs from '../../components/BottomTabs';

// Dummy saved parking data with categories
const SAVED_PARKING = [
  {
    id: 1,
    name: 'New Road Parking',
    address: 'Juddha Sadak, Kathmandu',
    category: 'Work',
    distance: '2km',
    price: '199',
    lastVisited: '2 days ago',
    rating: 4.5,
    visits: 12,
  },
  {
    id: 2,
    name: 'Thamel Square',
    address: 'Thamel Marg, Kathmandu',
    category: 'Shopping',
    distance: '5km',
    price: '300',
    lastVisited: '1 week ago',
    rating: 4.8,
    visits: 5,
  },
  {
    id: 3,
    name: 'Durbar Marg Parking',
    address: 'Durbar Marg, Kathmandu',
    category: 'Home',
    distance: '4km',
    price: '400',
    lastVisited: 'Yesterday',
    rating: 4.7,
    visits: 8,
  },
  {
    id: 4,
    name: 'Boudha Parking',
    address: 'Boudhanath, Kathmandu',
    category: 'Other',
    distance: '8km',
    price: '200',
    lastVisited: '3 days ago',
    rating: 4.4,
    visits: 3,
  },
];

const SavedParking = () => {
  const [savedSpots, setSavedSpots] = useState(SAVED_PARKING);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Work', 'Home', 'Shopping', 'Other'];

  const handleUnsave = (id: number, name: string) => {
    Alert.alert(
      'Remove from Saved',
      `Remove "${name}" from your saved parking spots?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setSavedSpots(savedSpots.filter(spot => spot.id !== id));
          },
        },
      ]
    );
  };

  const handleSpotPress = (spot: typeof SAVED_PARKING[0]) => {
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
  };

  const getCategoryIcon = (category: string) => {
    switch(category) {
      case 'Work': return 'briefcase';
      case 'Home': return 'home';
      case 'Shopping': return 'cart';
      default: return 'location';
    }
  };

  const getCategoryColor = (category: string) => {
    switch(category) {
      case 'Work': return '#3B82F6';
      case 'Home': return '#22C55E';
      case 'Shopping': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const filteredSpots = selectedCategory === 'All' 
    ? savedSpots 
    : savedSpots.filter(spot => spot.category === selectedCategory);

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, index) => (
      <Ionicons
        key={index}
        name={index < Math.floor(rating) ? 'star' : 'star-outline'}
        size={12}
        color="#F59E0B"
      />
    ));
  };

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
                ? 'Start saving your favorite parking spots for quick access'
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
          /* Saved List */
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
                    
                    <View style={styles.parkingMeta}>
                      <View style={styles.ratingContainer}>
                        {renderStars(spot.rating)}
                        <Text style={styles.ratingText}>{spot.rating}</Text>
                      </View>
                      <View style={styles.metaDivider} />
                      <Ionicons name="navigate" size={12} color="#6B7280" />
                      <Text style={styles.metaText}>{spot.distance}</Text>
                    </View>
                    
                    <Text style={styles.parkingAddress} numberOfLines={1}>
                      {spot.address}
                    </Text>
                  </View>
                </View>

                {/* Card Footer */}
                <View style={styles.cardFooter}>
                  <View style={styles.categoryBadge} 
  >
                    <Ionicons 
                      name={getCategoryIcon(spot.category) as any} 
                      size={14} 
                      color={getCategoryColor(spot.category)} 
                    />
                    <Text style={[
                      styles.categoryBadgeText,
                      { color: getCategoryColor(spot.category) }
                    ]}>
                      {spot.category}
                    </Text>
                  </View>

                  <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                      <Ionicons name="time-outline" size={14} color="#6B7280" />
                      <Text style={styles.statText}>{spot.lastVisited}</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                      <Ionicons name="repeat-outline" size={14} color="#6B7280" />
                      <Text style={styles.statText}>{spot.visits} visits</Text>
                    </View>
                  </View>

                  <View style={styles.priceContainer}>
                    <Text style={styles.price}>Rs {spot.price}</Text>
                    <Text style={styles.priceUnit}>/hr</Text>
                  </View>
                </View>

                {/* Quick Action Buttons */}
                <View style={styles.quickActions}>
                  <TouchableOpacity 
                    style={styles.quickActionButton}
                    onPress={() => handleSpotPress(spot)}
                  >
                    <Ionicons name="navigate" size={16} color="#22C55E" />
                    <Text style={styles.quickActionText}>Directions</Text>
                  </TouchableOpacity>
                  
                  <View style={styles.actionDivider} />
                  
                  <TouchableOpacity 
                    style={styles.quickActionButton}
                    onPress={() => {
                      router.push({
                        pathname: '/(user)/bookings/select-slot',
                        params: {
                          parkingId: spot.id.toString(),
                          parkingName: spot.name,
                          pricePerHour: spot.price,
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
    backgroundColor: '#fff',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  categoriesSection: {
    backgroundColor: '#fff',
    paddingTop: 16,
    paddingBottom: 12,
  },
  categoriesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  categories: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryChipActive: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  categoryTextActive: {
    color: '#fff',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  emptyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
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
  cardHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  parkingIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  parkingMainInfo: {
    flex: 1,
  },
  parkingNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  parkingName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    flex: 1,
  },
  bookmarkButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginLeft: 4,
  },
  metaDivider: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 6,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginLeft: 4,
  },
  parkingAddress: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  statDivider: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: '#22C55E',
  },
  priceUnit: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginLeft: 2,
  },
  quickActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#22C55E',
    marginLeft: 6,
  },
  actionDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#F3F4F6',
  },
});

export default SavedParking;