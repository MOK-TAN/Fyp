import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../../../lib/supabase';
import { styles } from './facilities.styles';

// type Facility = {
//   id: string;
//   name: string;
//   address: string;
//   total_slots: number;
//   price_per_hour: number;
//   is_active: boolean;
//   is_approved: boolean;
// };

// ONLY CHANGE: type
type Facility = {
  id: string;
  name: string;
  address: string;
  total_slots: number;
  price_per_hour: number;
  is_active: boolean;
  approval_status: 'pending' | 'approved' | 'rejected';
};

type Review = {
  id: string;
  rating: number;
  comment: string;
  owner_response: string | null;
};

export default function Facilities() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // ── Reviews state ──
  const [expandedFacilityId, setExpandedFacilityId] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Record<string, Review[]>>({});
  const [loadingReviews, setLoadingReviews] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchFacilities();
  }, []);

  const fetchFacilities = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('parking_facilities')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFacilities(data || []);
    } catch (error) {
      console.error('Error fetching facilities:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchFacilities();
  };

  // ====================== DELETE FACILITY ======================
  const handleDeleteFacility = (facility: Facility) => {
    Alert.alert(
      'Delete Facility',
      `Are you sure you want to delete "${facility.name}"?\n\n` +
      `This will permanently delete the facility and all its ${facility.total_slots} parking slots.\n\n` +
      `This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => confirmDeleteFacility(facility) },
      ]
    );
  };

  const confirmDeleteFacility = async (facility: Facility) => {
    setDeletingId(facility.id);
    try {
      const { error } = await supabase
        .from('parking_facilities')
        .delete()
        .eq('id', facility.id);

      if (error) {
        Alert.alert('Error', `Failed to delete facility: ${error.message}`);
        return;
      }

      Alert.alert('Deleted Successfully', `"${facility.name}" and all its slots have been deleted.`, [{ text: 'OK' }]);
      fetchFacilities();
    } catch (error: any) {
      Alert.alert('Error', 'Something went wrong while deleting the facility.');
    } finally {
      setDeletingId(null);
    }
  };
  // ============================================================

  // ========================= REVIEWS ==========================
  const toggleReviews = (facilityId: string) => {
    if (expandedFacilityId === facilityId) {
      setExpandedFacilityId(null);
      return;
    }
    setExpandedFacilityId(facilityId);
    if (!reviews[facilityId]) {
      fetchReviews(facilityId);
    }
  };

  const fetchReviews = async (facilityId: string) => {
    setLoadingReviews(facilityId);
    const { data, error } = await supabase
      .from('reviews')
      .select('id, rating, comment, owner_response')
      .eq('facility_id', facilityId)
      .order('created_at', { ascending: false });

    if (!error) {
      setReviews(prev => ({ ...prev, [facilityId]: data }));
    }
    setLoadingReviews(null);
  };

  const handleReply = async (reviewId: string, facilityId: string) => {
    const text = replyText[reviewId];
    if (!text) return;

    const { error } = await supabase
      .from('reviews')
      .update({ owner_response: text, response_at: new Date() })
      .eq('id', reviewId);

    if (!error) {
      fetchReviews(facilityId);
      setReplyText(prev => ({ ...prev, [reviewId]: '' }));
    }
  };

  const renderStars = (rating: number) => '⭐'.repeat(rating);
  // ============================================================

  const handleAddFacility = () => {
    router.push('/(parking-owner)/facility/add');
  };

  const handleManageFacility = (facilityId: string) => {
    router.push({
      pathname: '/(parking-owner)/facility/[id]',
      params: { id: facilityId },
    });
  };

  // const handleEditFacility = (facilityId: string) => {
  //   Alert.alert('Coming Soon', 'Edit facility feature will be available soon.');
  // };

    const handleEditFacility = (facilityId: string) => {
    router.push({
      pathname: '/(parking-owner)/facility/edit/[id]',
      params: { id: facilityId },
    });
  };

  const filteredFacilities = facilities.filter(facility =>
    facility.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    facility.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // const activeFacilities = filteredFacilities.filter(f => f.is_active);
  const activeFacilities = filteredFacilities.filter(
  f => f.approval_status === 'approved' && f.is_active
);

  if (loading && facilities.length === 0) {
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
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Facilities</Text>
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
            placeholder="Search facilities..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Add New Facility Button */}
        <TouchableOpacity style={styles.addButton} onPress={handleAddFacility}>
          <Ionicons name="add-circle" size={24} color="#FFFFFF" />
          <Text style={styles.addButtonText}>ADD NEW FACILITY</Text>
        </TouchableOpacity>

        {/* Active Listings */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active Listings</Text>
          <Text style={styles.totalCount}>{activeFacilities.length} TOTAL</Text>
        </View>

        {/* Facilities List */}
        {filteredFacilities.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="business-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>No facilities found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? 'Try a different search' : 'Add your first parking facility'}
            </Text>
          </View>
        ) : (
          filteredFacilities.map((facility) => (
            <View key={facility.id} style={styles.facilityCard}>
              {/* Facility Header */}
              <View style={styles.facilityHeader}>
                <View style={styles.facilityTitleRow}>
                  <Text style={styles.facilityName}>{facility.name}</Text>
                  {/* 
                  <View style={[
                    styles.statusBadge,
                    facility.is_active ? styles.statusActive : styles.statusInactive
                  ]}>
                    <Text style={[
                      styles.statusText,
                      facility.is_active ? styles.statusTextActive : styles.statusTextInactive
                    ]}>
                      {facility.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </Text>
                  </View>
                  */}

                  <View style={[
  styles.statusBadge,
  facility.approval_status === 'pending'
    ? styles.statusPending
    : facility.approval_status === 'rejected'
    ? styles.statusRejected
    : facility.is_active
    ? styles.statusActive
    : styles.statusInactive
]}>
  <Text style={[
    styles.statusText,
    facility.approval_status === 'pending'
      ? styles.statusTextPending
      : facility.approval_status === 'rejected'
      ? styles.statusTextRejected
      : facility.is_active
      ? styles.statusTextActive
      : styles.statusTextInactive
  ]}>
    {
      facility.approval_status === 'pending'
        ? 'PENDING'
        : facility.approval_status === 'rejected'
        ? 'REJECTED'
        : facility.is_active
        ? 'ACTIVE'
        : 'INACTIVE'
    }
  </Text>
</View>
                </View>
                <View style={styles.locationRow}>
                  <Ionicons name="location-outline" size={14} color="#6B7280" />
                  <Text style={styles.locationText}>{facility.address}</Text>
                </View>
              </View>

              {/* Facility Stats */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>TOTAL SLOTS</Text>
                  <Text style={styles.statValue}>{facility.total_slots} Slots</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>PRICE / HOUR</Text>
                  <Text style={styles.statValue}>Rs {facility.price_per_hour}</Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.manageButton}
                  onPress={() => handleManageFacility(facility.id)}
                >
                  <Text style={styles.manageButtonText}>MANAGE</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => handleEditFacility(facility.id)}
                >
                  <Ionicons name="pencil" size={20} color="#6B7280" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteFacility(facility)}
                  disabled={deletingId === facility.id}
                >
                  {deletingId === facility.id ? (
                    <ActivityIndicator size="small" color="#EF4444" />
                  ) : (
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                  )}
                </TouchableOpacity>
              </View>

              {/* ── REVIEWS SECTION ── */}
              <TouchableOpacity
                style={styles.reviewsToggle}
                onPress={() => toggleReviews(facility.id)}
              >
                <Ionicons name="chatbubble-outline" size={16} color="#6B7280" />
                <Text style={styles.reviewsToggleText}>
                  {expandedFacilityId === facility.id ? 'Hide Reviews' : 'Show Reviews'}
                </Text>
                <Ionicons
                  name={expandedFacilityId === facility.id ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color="#6B7280"
                />
              </TouchableOpacity>

              {expandedFacilityId === facility.id && (
                <View style={styles.reviewsContainer}>
                  {loadingReviews === facility.id ? (
                    <ActivityIndicator size="small" color="#22C55E" style={{ marginVertical: 12 }} />
                  ) : !reviews[facility.id] || reviews[facility.id].length === 0 ? (
                    <Text style={styles.noReviewsText}>No reviews yet.</Text>
                  ) : (
                    reviews[facility.id].map((review) => (
                      <View key={review.id} style={styles.reviewCard}>
                        {/* Rating + Comment */}
                        <Text style={styles.reviewStars}>{renderStars(review.rating)}</Text>
                        <Text style={styles.reviewComment}>{review.comment}</Text>

                        {/* Owner response (if exists) */}
                        {review.owner_response ? (
                          <View style={styles.ownerResponseBox}>
                            <Text style={styles.ownerResponseLabel}>Your Response:</Text>
                            <Text style={styles.ownerResponseText}>{review.owner_response}</Text>
                          </View>
                        ) : null}

                        {/* Reply input — always shown */}
                        <View style={styles.replyRow}>
                          <TextInput
                            style={styles.replyInput}
                            placeholder="Write a reply..."
                            placeholderTextColor="#9CA3AF"
                            value={replyText[review.id] || ''}
                            onChangeText={(text) =>
                              setReplyText(prev => ({ ...prev, [review.id]: text }))
                            }
                          />
                          <TouchableOpacity
                            style={styles.replyButton}
                            onPress={() => handleReply(review.id, facility.id)}
                          >
                            <Ionicons name="send" size={16} color="#FFFFFF" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))
                  )}
                </View>
              )}
              {/* ─────────────────── */}

              {/* Awaiting Review */}
              {/* {!facility.is_approved && ( */}
              {facility.approval_status === 'pending' && (
                <View style={styles.reviewBanner}>
                  <Text style={styles.reviewText}>AWAITING REVIEW</Text>
                </View>
              )}

              {facility.approval_status === 'rejected' && (
  <View style={styles.reviewBanner}>
    <Text style={[styles.reviewText, { color: '#EF4444' }]}>REJECTED BY ADMIN</Text>
  </View>
)}
            </View>
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}


// before 1

// import { Ionicons } from '@expo/vector-icons';
// import { router } from 'expo-router';
// import React, { useEffect, useState } from 'react';
// import {
//   ActivityIndicator,
//   Alert,
//   RefreshControl,
//   ScrollView,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
// } from 'react-native';
// import { supabase } from '../../../lib/supabase';
// import { styles } from './facilities.styles';

// type Facility = {
//   id: string;
//   name: string;
//   address: string;
//   total_slots: number;
//   price_per_hour: number;
//   is_active: boolean;
//   is_approved: boolean;
// };

// export default function Facilities() {
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [deletingId, setDeletingId] = useState<string | null>(null); // Track which facility is being deleted
//   const [facilities, setFacilities] = useState<Facility[]>([]);
//   const [searchQuery, setSearchQuery] = useState('');

//   useEffect(() => {
//     fetchFacilities();
//   }, []);

//   const fetchFacilities = async () => {
//     try {
//       setLoading(true);

//       const { data: { user } } = await supabase.auth.getUser();
//       if (!user) return;

//       const { data, error } = await supabase
//         .from('parking_facilities')
//         .select('*')
//         .eq('owner_id', user.id)
//         .order('created_at', { ascending: false });

//       if (error) throw error;

//       setFacilities(data || []);
//     } catch (error) {
//       console.error('Error fetching facilities:', error);
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   };

//   const onRefresh = () => {
//     setRefreshing(true);
//     fetchFacilities();
//   };

//   // ====================== DELETE FACILITY ======================
//   const handleDeleteFacility = (facility: Facility) => {
//     Alert.alert(
//       'Delete Facility',
//       `Are you sure you want to delete "${facility.name}"?\n\n` +
//       `This will permanently delete the facility and all its ${facility.total_slots} parking slots.\n\n` +
//       `This action cannot be undone.`,
//       [
//         { text: 'Cancel', style: 'cancel' },
//         {
//           text: 'Delete',
//           style: 'destructive',
//           onPress: () => confirmDeleteFacility(facility),
//         },
//       ]
//     );
//   };

//   const confirmDeleteFacility = async (facility: Facility) => {
//     setDeletingId(facility.id);

//     try {
//       const { error } = await supabase
//         .from('parking_facilities')
//         .delete()
//         .eq('id', facility.id);

//       if (error) {
//         console.error('Delete error:', error);
//         Alert.alert('Error', `Failed to delete facility: ${error.message}`);
//         return;
//       }

//       Alert.alert(
//         'Deleted Successfully',
//         `"${facility.name}" and all its slots have been deleted.`,
//         [{ text: 'OK' }]
//       );

//       // Refresh the list
//       fetchFacilities();

//     } catch (error: any) {
//       console.error('Delete failed:', error);
//       Alert.alert('Error', 'Something went wrong while deleting the facility.');
//     } finally {
//       setDeletingId(null);
//     }
//   };
//   // ============================================================

//   const handleAddFacility = () => {
//     router.push('/(parking-owner)/facility/add');
//   };

//   const handleManageFacility = (facilityId: string) => {
//     router.push({
//       pathname: '/(parking-owner)/facility/[id]',
//       params: { id: facilityId },
//     });
//   };

//   const handleEditFacility = (facilityId: string) => {
//     // TODO: Implement edit later
//     Alert.alert('Coming Soon', 'Edit facility feature will be available soon.');
//   };

//   const filteredFacilities = facilities.filter(facility =>
//     facility.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
//     facility.address.toLowerCase().includes(searchQuery.toLowerCase())
//   );

//   const activeFacilities = filteredFacilities.filter(f => f.is_active);

//   if (loading && facilities.length === 0) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color="#22C55E" />
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       {/* Header */}
//       <View style={styles.header}>
//         <TouchableOpacity onPress={() => router.back()}>
//           <Ionicons name="arrow-back" size={24} color="#111827" />
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>My Facilities</Text>
//         <TouchableOpacity>
//           <Ionicons name="notifications-outline" size={24} color="#111827" />
//         </TouchableOpacity>
//       </View>

//       <ScrollView
//         style={styles.content}
//         showsVerticalScrollIndicator={false}
//         refreshControl={
//           <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22C55E" />
//         }
//       >
//         {/* Search Bar */}
//         <View style={styles.searchContainer}>
//           <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
//           <TextInput
//             style={styles.searchInput}
//             placeholder="Search facilities..."
//             placeholderTextColor="#9CA3AF"
//             value={searchQuery}
//             onChangeText={setSearchQuery}
//           />
//         </View>

//         {/* Add New Facility Button */}
//         <TouchableOpacity style={styles.addButton} onPress={handleAddFacility}>
//           <Ionicons name="add-circle" size={24} color="#FFFFFF" />
//           <Text style={styles.addButtonText}>ADD NEW FACILITY</Text>
//         </TouchableOpacity>

//         {/* Active Listings */}
//         <View style={styles.sectionHeader}>
//           <Text style={styles.sectionTitle}>Active Listings</Text>
//           <Text style={styles.totalCount}>{activeFacilities.length} TOTAL</Text>
//         </View>

//         {/* Facilities List */}
//         {filteredFacilities.length === 0 ? (
//           <View style={styles.emptyState}>
//             <Ionicons name="business-outline" size={64} color="#D1D5DB" />
//             <Text style={styles.emptyText}>No facilities found</Text>
//             <Text style={styles.emptySubtext}>
//               {searchQuery ? 'Try a different search' : 'Add your first parking facility'}
//             </Text>
//           </View>
//         ) : (
//           filteredFacilities.map((facility) => (
//             <View key={facility.id} style={styles.facilityCard}>
//               {/* Facility Header */}
//               <View style={styles.facilityHeader}>
//                 <View style={styles.facilityTitleRow}>
//                   <Text style={styles.facilityName}>{facility.name}</Text>
//                   <View style={[
//                     styles.statusBadge,
//                     facility.is_active ? styles.statusActive : styles.statusInactive
//                   ]}>
//                     <Text style={[
//                       styles.statusText,
//                       facility.is_active ? styles.statusTextActive : styles.statusTextInactive
//                     ]}>
//                       {facility.is_active ? 'ACTIVE' : 'INACTIVE'}
//                     </Text>
//                   </View>
//                 </View>
//                 <View style={styles.locationRow}>
//                   <Ionicons name="location-outline" size={14} color="#6B7280" />
//                   <Text style={styles.locationText}>{facility.address}</Text>
//                 </View>
//               </View>

//               {/* Facility Stats */}
//               <View style={styles.statsRow}>
//                 <View style={styles.statItem}>
//                   <Text style={styles.statLabel}>TOTAL SLOTS</Text>
//                   <Text style={styles.statValue}>{facility.total_slots} Slots</Text>
//                 </View>
//                 <View style={styles.statDivider} />
//                 <View style={styles.statItem}>
//                   <Text style={styles.statLabel}>PRICE / HOUR</Text>
//                   <Text style={styles.statValue}>Rs {facility.price_per_hour}</Text>
//                 </View>
//               </View>

//               {/* Action Buttons */}
//               <View style={styles.actionRow}>
//                 <TouchableOpacity
//                   style={styles.manageButton}
//                   onPress={() => handleManageFacility(facility.id)}
//                 >
//                   <Text style={styles.manageButtonText}>MANAGE</Text>
//                 </TouchableOpacity>

//                 <TouchableOpacity
//                   style={styles.editButton}
//                   onPress={() => handleEditFacility(facility.id)}
//                 >
//                   <Ionicons name="pencil" size={20} color="#6B7280" />
//                 </TouchableOpacity>

//                 {/* Delete Button */}
//                 <TouchableOpacity
//                   style={styles.deleteButton}
//                   onPress={() => handleDeleteFacility(facility)}
//                   disabled={deletingId === facility.id}
//                 >
//                   {deletingId === facility.id ? (
//                     <ActivityIndicator size="small" color="#EF4444" />
//                   ) : (
//                     <Ionicons name="trash-outline" size={20} color="#EF4444" />
//                   )}
//                 </TouchableOpacity>
//               </View>

//               {/* Awaiting Review */}
//               {!facility.is_approved && (
//                 <View style={styles.reviewBanner}>
//                   <Text style={styles.reviewText}>AWAITING REVIEW</Text>
//                 </View>
//               )}
//             </View>
//           ))
//         )}

//         <View style={{ height: 100 }} />
//       </ScrollView>
//     </View>
//   );
// }


//before 

// import { Ionicons } from '@expo/vector-icons';
// import { router } from 'expo-router';
// import React, { useEffect, useState } from 'react';
// import {
//   ActivityIndicator,
//   RefreshControl,
//   ScrollView,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
// } from 'react-native';
// import { supabase } from '../../../lib/supabase';
// import { styles } from './facilities.styles';

// type Facility = {
//   id: string;
//   name: string;
//   address: string;
//   total_slots: number;
//   price_per_hour: number;
//   is_active: boolean;
//   is_approved: boolean;
// };

// export default function Facilities() {
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [facilities, setFacilities] = useState<Facility[]>([]);
//   const [searchQuery, setSearchQuery] = useState('');

//   useEffect(() => {
//     fetchFacilities();
//   }, []);

//   const fetchFacilities = async () => {
//     try {
//       setLoading(true);

//       const { data: { user } } = await supabase.auth.getUser();
//       if (!user) return;

//       const { data, error } = await supabase
//         .from('parking_facilities')
//         .select('*')
//         .eq('owner_id', user.id)
//         .order('created_at', { ascending: false });

//       if (error) throw error;

//       setFacilities(data || []);
//     } catch (error) {
//       console.error('Error fetching facilities:', error);
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   };

//   const onRefresh = () => {
//     setRefreshing(true);
//     fetchFacilities();
//   };

//   const handleAddFacility = () => {
//     router.push('/(parking-owner)/facility/add');
//   };

//   const handleManageFacility = (facilityId: string) => {
//     router.push({
//       pathname: '/(parking-owner)/facility/[id]',
//       params: { id: facilityId },
//     });
//   };

//   const handleEditFacility = (facilityId: string) => {
//     // TODO: Navigate to edit facility
//     // router.push(`/parking-owner/facility/edit/${facilityId}`);
//   };

//   const filteredFacilities = facilities.filter(facility =>
//     facility.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
//     facility.address.toLowerCase().includes(searchQuery.toLowerCase())
//   );

//   const activeFacilities = filteredFacilities.filter(f => f.is_active);

//   if (loading) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color="#22C55E" />
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       {/* Header */}
//       <View style={styles.header}>
//         <TouchableOpacity onPress={() => router.back()}>
//           <Ionicons name="arrow-back" size={24} color="#111827" />
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>My Facilities</Text>
//         <TouchableOpacity>
//           <Ionicons name="notifications-outline" size={24} color="#111827" />
//         </TouchableOpacity>
//       </View>

//       <ScrollView
//         style={styles.content}
//         showsVerticalScrollIndicator={false}
//         refreshControl={
//           <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22C55E" />
//         }
//       >
//         {/* Search Bar */}
//         <View style={styles.searchContainer}>
//           <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
//           <TextInput
//             style={styles.searchInput}
//             placeholder="Search facilities..."
//             placeholderTextColor="#9CA3AF"
//             value={searchQuery}
//             onChangeText={setSearchQuery}
//           />
//         </View>

//         {/* Add New Facility Button */}
//         <TouchableOpacity style={styles.addButton} onPress={handleAddFacility}>
//           <Ionicons name="add-circle" size={24} color="#FFFFFF" />
//           <Text style={styles.addButtonText}>ADD NEW FACILITY</Text>
//         </TouchableOpacity>

//         {/* Active Listings */}
//         <View style={styles.sectionHeader}>
//           <Text style={styles.sectionTitle}>Active Listings</Text>
//           <Text style={styles.totalCount}>{activeFacilities.length} TOTAL</Text>
//         </View>

//         {/* Facilities List */}
//         {filteredFacilities.length === 0 ? (
//           <View style={styles.emptyState}>
//             <Ionicons name="business-outline" size={64} color="#D1D5DB" />
//             <Text style={styles.emptyText}>No facilities found</Text>
//             <Text style={styles.emptySubtext}>
//               {searchQuery ? 'Try a different search' : 'Add your first parking facility'}
//             </Text>
//           </View>
//         ) : (
//           filteredFacilities.map((facility) => (
//             <View key={facility.id} style={styles.facilityCard}>
//               {/* Facility Header */}
//               <View style={styles.facilityHeader}>
//                 <View style={styles.facilityTitleRow}>
//                   <Text style={styles.facilityName}>{facility.name}</Text>
//                   <View style={[
//                     styles.statusBadge,
//                     facility.is_active ? styles.statusActive : styles.statusInactive
//                   ]}>
//                     <Text style={[
//                       styles.statusText,
//                       facility.is_active ? styles.statusTextActive : styles.statusTextInactive
//                     ]}>
//                       {facility.is_active ? 'ACTIVE' : 'INACTIVE'}
//                     </Text>
//                   </View>
//                 </View>
//                 <View style={styles.locationRow}>
//                   <Ionicons name="location-outline" size={14} color="#6B7280" />
//                   <Text style={styles.locationText}>{facility.address}</Text>
//                 </View>
//               </View>

//               {/* Facility Stats */}
//               <View style={styles.statsRow}>
//                 <View style={styles.statItem}>
//                   <Text style={styles.statLabel}>TOTAL SLOTS</Text>
//                   <Text style={styles.statValue}>{facility.total_slots} Slots</Text>
//                 </View>
//                 <View style={styles.statDivider} />
//                 <View style={styles.statItem}>
//                   <Text style={styles.statLabel}>PRICE / HOUR</Text>
//                   <Text style={styles.statValue}>Rs {facility.price_per_hour}</Text>
//                 </View>
//               </View>

//               {/* Action Buttons */}
//               <View style={styles.actionRow}>
//                 <TouchableOpacity
//                   style={styles.manageButton}
//                   onPress={() => handleManageFacility(facility.id)}
//                 >
//                   <Text style={styles.manageButtonText}>MANAGE</Text>
//                 </TouchableOpacity>
//                 <TouchableOpacity
//                   style={styles.editButton}
//                   onPress={() => handleEditFacility(facility.id)}
//                 >
//                   <Ionicons name="pencil" size={20} color="#6B7280" />
//                 </TouchableOpacity>
//               </View>

//               {/* Awaiting Review */}
//               {!facility.is_approved && (
//                 <View style={styles.reviewBanner}>
//                   <Text style={styles.reviewText}>AWAITING REVIEW</Text>
//                 </View>
//               )}
//             </View>
//           ))
//         )}

//         <View style={{ height: 100 }} />
//       </ScrollView>
//     </View>
//   );
// }