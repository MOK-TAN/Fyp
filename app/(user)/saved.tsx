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
  View,
} from 'react-native';
import BottomTabs from '../../components/BottomTabs';
import { supabase } from '../../lib/supabase';

type SavedItem = {
  id: string;
  type: 'facility' | 'personal';        // Important: to distinguish both types
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  price_per_hour?: number;
  total_slots?: number;
  available_slots?: number;
  category?: string;
  note?: string;
};

const SavedParking = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Work', 'Home', 'Shopping', 'Other'];

  // Fetch BOTH saved parking facilities AND personal saved locations
  const fetchAllSavedItems = async () => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch Saved Facilities (official parking)
      const { data: savedFacilities } = await supabase
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

      // 2. Fetch Personal Saved Locations (long press)
      const { data: personalLocations } = await supabase
        .from('saved_locations')
        .select('id, name, latitude, longitude, note')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      const items: SavedItem[] = [];

      // Process Saved Facilities
      for (const item of savedFacilities || []) {
        const facility = (item as any).parking_facilities;
        if (!facility) continue;

        const { count } = await supabase
          .from('parking_slots')
          .select('*', { count: 'exact', head: true })
          .eq('facility_id', item.facility_id)
          .eq('is_available', true);

        items.push({
          id: item.id,
          type: 'facility',
          name: facility.name,
          address: facility.address,
          price_per_hour: facility.price_per_hour,
          total_slots: facility.total_slots,
          available_slots: count || 0,
          category: item.category || 'Other',
        });
      }

      // Process Personal Locations
      for (const loc of personalLocations || []) {
        items.push({
          id: loc.id,
          type: 'personal',
          name: loc.name,
          latitude: loc.latitude,
          longitude: loc.longitude,
          note: loc.note,
          category: 'Other', // Personal pins don't have category for now
        });
      }

      setSavedItems(items);
    } catch (error) {
      console.error('Error fetching saved items:', error);
      Alert.alert('Error', 'Failed to load saved locations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAllSavedItems();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchAllSavedItems();
  };

  const handleUnsave = (id: string, name: string, type: 'facility' | 'personal') => {
    Alert.alert(
      'Remove',
      `Remove "${name}" from saved?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const table = type === 'facility' ? 'saved_parking' : 'saved_locations';
              const { error } = await supabase.from(table).delete().eq('id', id);

              if (error) throw error;

              setSavedItems(prev => prev.filter(item => item.id !== id));
            } catch (error) {
              Alert.alert('Error', 'Failed to remove');
            }
          },
        },
      ]
    );
  };

  const handleItemPress = (item: SavedItem) => {
    if (item.type === 'facility') {
      router.push({
        pathname: '/(user)/parking-details',
        params: {
          parkingId: item.id, // Wait, actually we need facility_id for facility
          parkingName: item.name,
          parkingAddress: item.address || '',
          pricePerHour: item.price_per_hour?.toString() || '',
        },
      });
    } else {
      // For personal location - you can later navigate to map centered on this location
      Alert.alert(
        item.name,
        `Location: ${item.latitude?.toFixed(5)}, ${item.longitude?.toFixed(5)}\n\n${item.note || ''}`,
        [{ text: 'OK' }]
      );
      // Future: Center map or open directions
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'work': return 'briefcase';
      case 'home': return 'home';
      case 'shopping': return 'cart';
      default: return 'location';
    }
  };

  const filteredItems = selectedCategory === 'All'
    ? savedItems
    : savedItems.filter(item => 
        item.type === 'facility' && 
        item.category?.toLowerCase() === selectedCategory.toLowerCase()
      );

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#22C55E" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Saved Locations</Text>
          <Text style={styles.subtitle}>{savedItems.length} total saved</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22C55E" />}
      >
        {/* Category Filters (only for facilities) */}
        <View style={styles.categoriesSection}>
          <Text style={styles.categoriesLabel}>Filter</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[styles.categoryChip, selectedCategory === category && styles.categoryChipActive]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text style={[styles.categoryText, selectedCategory === category && styles.categoryTextActive]}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {filteredItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="bookmark-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No Saved Items</Text>
            <Text style={styles.emptySubtitle}>
              Long press on map or save parking facilities to see them here
            </Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {filteredItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.parkingCard}
                onPress={() => handleItemPress(item)}
                activeOpacity={0.7}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.parkingIconContainer}>
                    <Ionicons 
  name={item.type === 'personal' ? "location" : "car-sport"} 
  size={28} 
  color={item.type === 'personal' ? "#3B82F6" : "#22C55E"} 
/>
                  </View>

                  <View style={styles.parkingMainInfo}>
                    <View style={styles.parkingNameRow}>
                      <Text style={styles.parkingName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <TouchableOpacity
                        onPress={() => handleUnsave(item.id, item.name, item.type)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Ionicons name="trash-outline" size={22} color="#EF4444" />
                      </TouchableOpacity>
                    </View>

                    {item.address && (
                      <Text style={styles.parkingAddress} numberOfLines={1}>
                        {item.address}
                      </Text>
                    )}

                    {item.type === 'facility' && item.available_slots !== undefined && (
                      <View style={styles.availabilityRow}>
                        <View style={[styles.availabilityDot, { backgroundColor: item.available_slots > 0 ? '#22C55E' : '#EF4444' }]} />
                        <Text style={styles.availabilityText}>
                          {item.available_slots > 0 
                            ? `${item.available_slots}/${item.total_slots} slots` 
                            : 'Full'}
                        </Text>
                      </View>
                    )}

                    {item.type === 'personal' && item.note && (
                      <Text style={styles.noteText}>{item.note}</Text>
                    )}
                  </View>
                </View>

                {item.type === 'facility' && (
                  <View style={styles.cardFooter}>
                    <View style={styles.categoryBadge}>
                      <Ionicons name={getCategoryIcon(item.category || 'other') as any} size={14} color="#22C55E" />
                      <Text style={styles.categoryBadgeText}>
                        {(item.category || 'Other').charAt(0).toUpperCase() + (item.category || 'Other').slice(1)}
                      </Text>
                    </View>

                    {item.price_per_hour && (
                      <View style={styles.priceContainer}>
                        <Text style={styles.price}>Rs {item.price_per_hour}</Text>
                        <Text style={styles.priceUnit}>/hr</Text>
                      </View>
                    )}
                  </View>
                )}
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
  // ... Keep all your existing styles ...
  // Just add this new one for personal notes
  noteText: {
    fontSize: 13,
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 4,
  },

  
  // ... rest of your styles remain the same
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

//before 

// import React from 'react';

// type SavedSpot = {
//   id: string;
//   facility_id: string;
//   category: string;
//   name: string;
//   address: string;
//   price_per_hour: number;
//   total_slots: number;
//   available_slots: number;
// };

// const SavedParking = () => {
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [savedSpots, setSavedSpots] = useState<SavedSpot[]>([]);
//   const [selectedCategory, setSelectedCategory] = useState('All');

//   const categories = ['All', 'Work', 'Home', 'Shopping', 'Other'];

//   // Re-fetch on focus (in case user saved/unsaved from another screen)
//   useFocusEffect(
//     useCallback(() => {
//       fetchSavedParking();
//     }, [])
//   );

//   const fetchSavedParking = async () => {
//     try {
//       setLoading(true);

//       const { data: { user } } = await supabase.auth.getUser();
//       if (!user) return;

//       const { data, error } = await supabase
//         .from('saved_parking')
//         .select(`
//           id,
//           facility_id,
//           category,
//           parking_facilities (
//             name,
//             address,
//             price_per_hour,
//             total_slots
//           )
//         `)
//         .eq('user_id', user.id)
//         .order('created_at', { ascending: false });

//       if (error) throw error;

//       // Get available slot counts for each facility
//       const spots: SavedSpot[] = [];

//       for (const item of (data || [])) {
//         const facility = (item as any).parking_facilities;
//         if (!facility) continue;

//         const { count } = await supabase
//           .from('parking_slots')
//           .select('*', { count: 'exact', head: true })
//           .eq('facility_id', item.facility_id)
//           .eq('is_available', true)
//           .eq('is_occupied', false);

//         spots.push({
//           id: item.id,
//           facility_id: item.facility_id,
//           category: item.category || 'Other',
//           name: facility.name,
//           address: facility.address,
//           price_per_hour: facility.price_per_hour,
//           total_slots: facility.total_slots,
//           available_slots: count || 0,
//         });
//       }

//       setSavedSpots(spots);
//     } catch (error) {
//       console.error('Error fetching saved parking:', error);
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   };

//   const onRefresh = () => {
//     setRefreshing(true);
//     fetchSavedParking();
//   };

//   const handleUnsave = (id: string, name: string) => {
//     Alert.alert(
//       'Remove from Saved',
//       `Remove "${name}" from your saved parking spots?`,
//       [
//         { text: 'Cancel', style: 'cancel' },
//         {
//           text: 'Remove',
//           style: 'destructive',
//           onPress: async () => {
//             try {
//               const { error } = await supabase
//                 .from('saved_parking')
//                 .delete()
//                 .eq('id', id);

//               if (error) throw error;

//               setSavedSpots(prev => prev.filter(spot => spot.id !== id));
//             } catch (error) {
//               console.error('Unsave error:', error);
//               Alert.alert('Error', 'Failed to remove from saved');
//             }
//           },
//         },
//       ]
//     );
//   };

//   const handleUpdateCategory = (spotId: string, newCategory: string) => {
//     Alert.alert(
//       'Change Category',
//       `Move to "${newCategory}"?`,
//       [
//         { text: 'Cancel', style: 'cancel' },
//         {
//           text: 'Move',
//           onPress: async () => {
//             try {
//               const { error } = await supabase
//                 .from('saved_parking')
//                 .update({ category: newCategory.toLowerCase() })
//                 .eq('id', spotId);

//               if (error) throw error;

//               setSavedSpots(prev =>
//                 prev.map(s => s.id === spotId ? { ...s, category: newCategory.toLowerCase() } : s)
//               );
//             } catch (error) {
//               console.error('Category update error:', error);
//             }
//           },
//         },
//       ]
//     );
//   };

//   const handleSpotPress = (spot: SavedSpot) => {
//     router.push({
//       pathname: '/(user)/parking-details',
//       params: {
//         parkingId: spot.facility_id,
//         parkingName: spot.name,
//         parkingAddress: spot.address,
//         pricePerHour: spot.price_per_hour.toString(),
//       }
//     });
//   };

//   const getCategoryIcon = (category: string) => {
//     switch (category.toLowerCase()) {
//       case 'work': return 'briefcase';
//       case 'home': return 'home';
//       case 'shopping': return 'cart';
//       default: return 'location';
//     }
//   };

//   const getCategoryColor = (category: string) => {
//     switch (category.toLowerCase()) {
//       case 'work': return '#3B82F6';
//       case 'home': return '#22C55E';
//       case 'shopping': return '#F59E0B';
//       default: return '#6B7280';
//     }
//   };

//   const filteredSpots = selectedCategory === 'All'
//     ? savedSpots
//     : savedSpots.filter(spot => spot.category.toLowerCase() === selectedCategory.toLowerCase());

//   if (loading) {
//     return (
//       <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
//         <ActivityIndicator size="large" color="#22C55E" />
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       {/* Header */}
//       <View style={styles.header}>
//         <View style={styles.headerContent}>
//           <Text style={styles.title}>Saved Parking</Text>
//           <Text style={styles.subtitle}>{savedSpots.length} locations saved</Text>
//         </View>
//       </View>

//       <ScrollView
//         showsVerticalScrollIndicator={false}
//         contentContainerStyle={styles.scrollContent}
//         refreshControl={
//           <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22C55E" />
//         }
//       >
//         {/* Category Filters */}
//         <View style={styles.categoriesSection}>
//           <Text style={styles.categoriesLabel}>Categories</Text>
//           <ScrollView
//             horizontal
//             showsHorizontalScrollIndicator={false}
//             contentContainerStyle={styles.categories}
//           >
//             {categories.map((category) => (
//               <TouchableOpacity
//                 key={category}
//                 style={[
//                   styles.categoryChip,
//                   selectedCategory === category && styles.categoryChipActive
//                 ]}
//                 onPress={() => setSelectedCategory(category)}
//                 activeOpacity={0.7}
//               >
//                 <Text style={[
//                   styles.categoryText,
//                   selectedCategory === category && styles.categoryTextActive
//                 ]}>
//                   {category}
//                 </Text>
//               </TouchableOpacity>
//             ))}
//           </ScrollView>
//         </View>

//         {/* Empty State */}
//         {filteredSpots.length === 0 ? (
//           <View style={styles.emptyState}>
//             <View style={styles.emptyIconContainer}>
//               <Ionicons name="bookmark-outline" size={64} color="#D1D5DB" />
//             </View>
//             <Text style={styles.emptyTitle}>No Saved Parking</Text>
//             <Text style={styles.emptySubtitle}>
//               {selectedCategory === 'All'
//                 ? 'Tap the heart icon on any parking facility to save it here'
//                 : `No parking spots saved in ${selectedCategory} category`}
//             </Text>
//             <TouchableOpacity
//               style={styles.emptyButton}
//               onPress={() => router.push('/(user)/(tabs)')}
//             >
//               <Text style={styles.emptyButtonText}>Browse Parking</Text>
//             </TouchableOpacity>
//           </View>
//         ) : (
//           <View style={styles.listContainer}>
//             {filteredSpots.map((spot) => (
//               <TouchableOpacity
//                 key={spot.id}
//                 style={styles.parkingCard}
//                 onPress={() => handleSpotPress(spot)}
//                 activeOpacity={0.7}
//               >
//                 {/* Card Header */}
//                 <View style={styles.cardHeader}>
//                   <View style={styles.parkingIconContainer}>
//                     <Ionicons name="car-sport" size={28} color="#22C55E" />
//                   </View>

//                   <View style={styles.parkingMainInfo}>
//                     <View style={styles.parkingNameRow}>
//                       <Text style={styles.parkingName} numberOfLines={1}>
//                         {spot.name}
//                       </Text>
//                       <TouchableOpacity
//                         style={styles.bookmarkButton}
//                         onPress={() => handleUnsave(spot.id, spot.name)}
//                         hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
//                       >
//                         <Ionicons name="bookmark" size={22} color="#22C55E" />
//                       </TouchableOpacity>
//                     </View>

//                     <Text style={styles.parkingAddress} numberOfLines={1}>
//                       {spot.address}
//                     </Text>

//                     <View style={styles.availabilityRow}>
//                       <View style={[
//                         styles.availabilityDot,
//                         { backgroundColor: spot.available_slots > 0 ? '#22C55E' : '#EF4444' }
//                       ]} />
//                       <Text style={styles.availabilityText}>
//                         {spot.available_slots > 0
//                           ? `${spot.available_slots}/${spot.total_slots} slots available`
//                           : 'Full'}
//                       </Text>
//                     </View>
//                   </View>
//                 </View>

//                 {/* Card Footer */}
//                 <View style={styles.cardFooter}>
//                   <TouchableOpacity
//                     style={styles.categoryBadge}
//                     onPress={() => {
//                       const nextCategories = ['Work', 'Home', 'Shopping', 'Other'];
//                       const currentIndex = nextCategories.findIndex(c => c.toLowerCase() === spot.category.toLowerCase());
//                       const nextCategory = nextCategories[(currentIndex + 1) % nextCategories.length];
//                       handleUpdateCategory(spot.id, nextCategory);
//                     }}
//                   >
//                     <Ionicons
//                       name={getCategoryIcon(spot.category) as any}
//                       size={14}
//                       color={getCategoryColor(spot.category)}
//                     />
//                     <Text style={[styles.categoryBadgeText, { color: getCategoryColor(spot.category) }]}>
//                       {spot.category.charAt(0).toUpperCase() + spot.category.slice(1)}
//                     </Text>
//                   </TouchableOpacity>

//                   <View style={styles.priceContainer}>
//                     <Text style={styles.price}>Rs {spot.price_per_hour}</Text>
//                     <Text style={styles.priceUnit}>/hr</Text>
//                   </View>
//                 </View>

//                 {/* Quick Actions */}
//                 <View style={styles.quickActions}>
//                   <TouchableOpacity
//                     style={styles.quickActionButton}
//                     onPress={() => handleSpotPress(spot)}
//                   >
//                     <Ionicons name="information-circle-outline" size={16} color="#22C55E" />
//                     <Text style={styles.quickActionText}>Details</Text>
//                   </TouchableOpacity>

//                   <View style={styles.actionDivider} />

//                   <TouchableOpacity
//                     style={styles.quickActionButton}
//                     onPress={() => {
//                       router.push({
//                         pathname: '/(user)/bookings/select-slot',
//                         params: {
//                           parkingId: spot.facility_id,
//                           parkingName: spot.name,
//                           pricePerHour: spot.price_per_hour.toString(),
//                         }
//                       });
//                     }}
//                   >
//                     <Ionicons name="time" size={16} color="#22C55E" />
//                     <Text style={styles.quickActionText}>Book Now</Text>
//                   </TouchableOpacity>
//                 </View>
//               </TouchableOpacity>
//             ))}
//           </View>
//         )}

//         <View style={{ height: 100 }} />
//       </ScrollView>

//       <BottomTabs />
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: '#F9FAFB' },
//   header: { backgroundColor: '#fff', paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
//   headerContent: { alignItems: 'center' },
//   title: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 4 },
//   subtitle: { fontSize: 14, color: '#6B7280' },
//   scrollContent: { paddingBottom: 20 },

//   // Categories
//   categoriesSection: { backgroundColor: '#fff', paddingTop: 16, paddingBottom: 12 },
//   categoriesLabel: { fontSize: 14, fontWeight: '600', color: '#6B7280', marginBottom: 12, paddingHorizontal: 20 },
//   categories: { paddingHorizontal: 20, gap: 8 },
//   categoryChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
//   categoryChipActive: { backgroundColor: '#22C55E', borderColor: '#22C55E' },
//   categoryText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
//   categoryTextActive: { color: '#fff' },

//   // Empty
//   emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80, paddingHorizontal: 40 },
//   emptyIconContainer: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
//   emptyTitle: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 8 },
//   emptySubtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
//   emptyButton: { backgroundColor: '#22C55E', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
//   emptyButtonText: { fontSize: 15, fontWeight: '600', color: '#fff' },

//   // List
//   listContainer: { paddingHorizontal: 20, paddingTop: 16 },
//   parkingCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E5E7EB' },

//   // Card Header
//   cardHeader: { flexDirection: 'row', marginBottom: 12 },
//   parkingIconContainer: { width: 56, height: 56, borderRadius: 14, backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
//   parkingMainInfo: { flex: 1 },
//   parkingNameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
//   parkingName: { fontSize: 16, fontWeight: '700', color: '#111827', flex: 1 },
//   bookmarkButton: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
//   parkingAddress: { fontSize: 13, color: '#9CA3AF', marginBottom: 6 },
//   availabilityRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
//   availabilityDot: { width: 8, height: 8, borderRadius: 4 },
//   availabilityText: { fontSize: 12, fontWeight: '500', color: '#6B7280' },

//   // Card Footer
//   cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
//   categoryBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: '#F9FAFB', gap: 4 },
//   categoryBadgeText: { fontSize: 12, fontWeight: '600' },
//   priceContainer: { flexDirection: 'row', alignItems: 'baseline' },
//   price: { fontSize: 18, fontWeight: '700', color: '#22C55E' },
//   priceUnit: { fontSize: 12, fontWeight: '500', color: '#6B7280', marginLeft: 2 },

//   // Quick Actions
//   quickActions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 12 },
//   quickActionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, gap: 6 },
//   quickActionText: { fontSize: 14, fontWeight: '600', color: '#22C55E' },
//   actionDivider: { width: 1, height: '100%', backgroundColor: '#F3F4F6' },
// });

// export default SavedParking;