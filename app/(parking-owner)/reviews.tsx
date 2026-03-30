import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { supabase } from '../../lib/supabase';

type Review = {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  owner_response: string | null;
  response_at: string | null;
  facility_id: string;
  facility_name: string;
  customer_name: string;
};

type FacilityOption = {
  id: string;
  name: string;
};

export default function OwnerReviews() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [facilities, setFacilities] = useState<FacilityOption[]>([]);
  const [selectedFacility, setSelectedFacility] = useState('all');
  const [selectedRating, setSelectedRating] = useState(0); // 0 = all

  // Response modal
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [respondingTo, setRespondingTo] = useState<Review | null>(null);
  const [responseText, setResponseText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get owner's facilities
      const { data: facilitiesData } = await supabase
        .from('parking_facilities')
        .select('id, name')
        .eq('owner_id', user.id);

      if (!facilitiesData || facilitiesData.length === 0) {
        setReviews([]);
        setFacilities([]);
        setLoading(false);
        return;
      }

      setFacilities(facilitiesData);
      const facilityIds = facilitiesData.map(f => f.id);

      // Fetch all reviews for owner's facilities
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          id,
          rating,
          comment,
          created_at,
          owner_response,
          response_at,
          facility_id,
          parking_facilities (name),
          profiles (full_name)
        `)
        .in('facility_id', facilityIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedReviews: Review[] = (data || []).map((r: any) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        created_at: r.created_at,
        owner_response: r.owner_response,
        response_at: r.response_at,
        facility_id: r.facility_id,
        facility_name: r.parking_facilities?.name || 'Unknown',
        customer_name: r.profiles?.full_name || 'Anonymous',
      }));

      setReviews(formattedReviews);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      Alert.alert('Error', 'Failed to load reviews');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchReviews();
  };

  const handleOpenResponse = (review: Review) => {
    setRespondingTo(review);
    setResponseText(review.owner_response || '');
    setShowResponseModal(true);
  };

  const handleSubmitResponse = async () => {
    if (!respondingTo || !responseText.trim()) {
      Alert.alert('Error', 'Please enter a response');
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('reviews')
        .update({
          owner_response: responseText.trim(),
          response_at: new Date().toISOString(),
        })
        .eq('id', respondingTo.id);

      if (error) throw error;

      // Update local state
      setReviews(prev =>
        prev.map(r =>
          r.id === respondingTo.id
            ? { ...r, owner_response: responseText.trim(), response_at: new Date().toISOString() }
            : r
        )
      );

      setShowResponseModal(false);
      Alert.alert('Success', 'Response submitted');
    } catch (error: any) {
      console.error('Response error:', error);
      Alert.alert('Error', 'Failed to submit response');
    } finally {
      setSubmitting(false);
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

  // Filters
  const filteredReviews = reviews.filter(r => {
    if (selectedFacility !== 'all' && r.facility_id !== selectedFacility) return false;
    if (selectedRating > 0 && r.rating !== selectedRating) return false;
    return true;
  });

  // Stats
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';
  const totalReviews = reviews.length;
  const respondedCount = reviews.filter(r => r.owner_response).length;
  const pendingCount = totalReviews - respondedCount;

  const renderStars = (rating: number, size: number = 16) => {
    return [...Array(5)].map((_, i) => (
      <Ionicons
        key={i}
        name={i < rating ? 'star' : 'star-outline'}
        size={size}
        color="#F59E0B"
      />
    ));
  };

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
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reviews & Ratings</Text>
        <TouchableOpacity onPress={onRefresh}>
          <Ionicons name="refresh-outline" size={24} color="#111827" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22C55E" />
        }
      >
        {/* Stats Card */}
        <View style={styles.statsCard}>
          <View style={styles.ratingBig}>
            <Text style={styles.ratingBigNumber}>{avgRating}</Text>
            <View style={styles.ratingBigStars}>{renderStars(Math.round(parseFloat(avgRating)), 20)}</View>
            <Text style={styles.ratingBigCount}>{totalReviews} reviews</Text>
          </View>
          <View style={styles.statsDivider} />
          <View style={styles.statsRight}>
            <View style={styles.statItem}>
              <View style={[styles.statDot, { backgroundColor: '#22C55E' }]} />
              <Text style={styles.statText}>Responded: {respondedCount}</Text>
            </View>
            <View style={styles.statItem}>
              <View style={[styles.statDot, { backgroundColor: '#F59E0B' }]} />
              <Text style={styles.statText}>Pending: {pendingCount}</Text>
            </View>
          </View>
        </View>

        {/* Facility Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterChip, selectedFacility === 'all' && styles.filterChipActive]}
            onPress={() => setSelectedFacility('all')}
          >
            <Text style={[styles.filterChipText, selectedFacility === 'all' && styles.filterChipTextActive]}>
              All Facilities
            </Text>
          </TouchableOpacity>
          {facilities.map(f => (
            <TouchableOpacity
              key={f.id}
              style={[styles.filterChip, selectedFacility === f.id && styles.filterChipActive]}
              onPress={() => setSelectedFacility(f.id)}
            >
              <Text style={[styles.filterChipText, selectedFacility === f.id && styles.filterChipTextActive]}>
                {f.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Rating Filter */}
        <View style={styles.ratingFilter}>
          <TouchableOpacity
            style={[styles.ratingChip, selectedRating === 0 && styles.ratingChipActive]}
            onPress={() => setSelectedRating(0)}
          >
            <Text style={[styles.ratingChipText, selectedRating === 0 && styles.ratingChipTextActive]}>All</Text>
          </TouchableOpacity>
          {[5, 4, 3, 2, 1].map(r => (
            <TouchableOpacity
              key={r}
              style={[styles.ratingChip, selectedRating === r && styles.ratingChipActive]}
              onPress={() => setSelectedRating(selectedRating === r ? 0 : r)}
            >
              <Ionicons name="star" size={12} color={selectedRating === r ? '#fff' : '#F59E0B'} />
              <Text style={[styles.ratingChipText, selectedRating === r && styles.ratingChipTextActive]}>{r}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Reviews List */}
        {filteredReviews.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>No reviews yet</Text>
            <Text style={styles.emptySubtext}>Reviews from customers will appear here</Text>
          </View>
        ) : (
          filteredReviews.map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              {/* Review Header */}
              <View style={styles.reviewHeader}>
                <View style={styles.reviewLeft}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{getInitial(review.customer_name)}</Text>
                  </View>
                  <View>
                    <Text style={styles.reviewName}>{review.customer_name}</Text>
                    <Text style={styles.reviewDate}>{formatDate(review.created_at)}</Text>
                  </View>
                </View>
                <View style={styles.reviewStars}>{renderStars(review.rating, 14)}</View>
              </View>

              {/* Facility Tag */}
              <View style={styles.facilityTag}>
                <Ionicons name="business-outline" size={12} color="#6B7280" />
                <Text style={styles.facilityTagText}>{review.facility_name}</Text>
              </View>

              {/* Comment */}
              {review.comment && (
                <Text style={styles.reviewComment}>{review.comment}</Text>
              )}

              {/* Owner Response */}
              {review.owner_response ? (
                <View style={styles.responseBox}>
                  <View style={styles.responseHeader}>
                    <Ionicons name="chatbubble-ellipses" size={14} color="#22C55E" />
                    <Text style={styles.responseLabel}>Your Response</Text>
                    <Text style={styles.responseDate}>
                      {review.response_at ? formatDate(review.response_at) : ''}
                    </Text>
                  </View>
                  <Text style={styles.responseText}>{review.owner_response}</Text>
                  <TouchableOpacity
                    style={styles.editResponseButton}
                    onPress={() => handleOpenResponse(review)}
                  >
                    <Ionicons name="pencil-outline" size={14} color="#22C55E" />
                    <Text style={styles.editResponseText}>Edit Response</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.respondButton}
                  onPress={() => handleOpenResponse(review)}
                >
                  <Ionicons name="chatbubble-outline" size={16} color="#22C55E" />
                  <Text style={styles.respondButtonText}>Respond to Review</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Response Modal */}
      <Modal
        visible={showResponseModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowResponseModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {respondingTo?.owner_response ? 'Edit Response' : 'Respond to Review'}
              </Text>
              <TouchableOpacity onPress={() => setShowResponseModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Original Review */}
            {respondingTo && (
              <View style={styles.originalReview}>
                <View style={styles.originalHeader}>
                  <Text style={styles.originalName}>{respondingTo.customer_name}</Text>
                  <View style={{ flexDirection: 'row' }}>{renderStars(respondingTo.rating, 14)}</View>
                </View>
                <Text style={styles.originalComment}>{respondingTo.comment || 'No comment'}</Text>
              </View>
            )}

            {/* Response Input */}
            <Text style={styles.inputLabel}>Your Response</Text>
            <TextInput
              style={styles.responseInput}
              placeholder="Write a professional and helpful response..."
              placeholderTextColor="#9CA3AF"
              value={responseText}
              onChangeText={setResponseText}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <Text style={styles.charCount}>{responseText.length}/500</Text>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, (!responseText.trim() || submitting) && styles.submitButtonDisabled]}
              onPress={handleSubmitResponse}
              disabled={!responseText.trim() || submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {respondingTo?.owner_response ? 'UPDATE RESPONSE' : 'SUBMIT RESPONSE'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
  content: { flex: 1, paddingTop: 20 },

  // Stats
  statsCard: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 20, borderWidth: 1, borderColor: '#E5E7EB' },
  ratingBig: { alignItems: 'center', flex: 1 },
  ratingBigNumber: { fontSize: 40, fontWeight: '700', color: '#111827' },
  ratingBigStars: { flexDirection: 'row', marginTop: 4, marginBottom: 4 },
  ratingBigCount: { fontSize: 13, color: '#6B7280' },
  statsDivider: { width: 1, backgroundColor: '#E5E7EB', marginHorizontal: 20 },
  statsRight: { flex: 1, justifyContent: 'center', gap: 12 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statDot: { width: 10, height: 10, borderRadius: 5 },
  statText: { fontSize: 14, color: '#374151', fontWeight: '500' },

  // Filters
  filterRow: { paddingHorizontal: 20, marginBottom: 12 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', marginRight: 8 },
  filterChipActive: { backgroundColor: '#22C55E', borderColor: '#22C55E' },
  filterChipText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  filterChipTextActive: { color: '#FFFFFF' },
  ratingFilter: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 20, gap: 8 },
  ratingChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', gap: 4 },
  ratingChipActive: { backgroundColor: '#F59E0B', borderColor: '#F59E0B' },
  ratingChipText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  ratingChipTextActive: { color: '#FFFFFF' },

  // Review Card
  reviewCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  reviewLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#DCFCE7', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 16, fontWeight: '700', color: '#22C55E' },
  reviewName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  reviewDate: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  reviewStars: { flexDirection: 'row' },
  facilityTag: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 10 },
  facilityTagText: { fontSize: 12, color: '#6B7280' },
  reviewComment: { fontSize: 14, color: '#374151', lineHeight: 20, marginBottom: 14 },

  // Owner Response
  responseBox: { backgroundColor: '#F0FDF4', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#BBF7D0' },
  responseHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  responseLabel: { fontSize: 12, fontWeight: '700', color: '#22C55E', flex: 1 },
  responseDate: { fontSize: 11, color: '#9CA3AF' },
  responseText: { fontSize: 13, color: '#374151', lineHeight: 18 },
  editResponseButton: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10 },
  editResponseText: { fontSize: 12, fontWeight: '600', color: '#22C55E' },

  // Respond Button
  respondButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#F0FDF4', borderRadius: 10, paddingVertical: 12, borderWidth: 1, borderColor: '#BBF7D0' },
  respondButtonText: { fontSize: 14, fontWeight: '600', color: '#22C55E' },

  // Empty
  emptyState: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 20 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#374151', marginTop: 16 },
  emptySubtext: { fontSize: 14, color: '#9CA3AF', marginTop: 8 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  originalReview: { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: '#E5E7EB' },
  originalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  originalName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  originalComment: { fontSize: 13, color: '#6B7280', lineHeight: 18 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  responseInput: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 16, fontSize: 15, color: '#111827', minHeight: 120, lineHeight: 22 },
  charCount: { fontSize: 12, color: '#9CA3AF', textAlign: 'right', marginTop: 6, marginBottom: 16 },
  submitButton: { backgroundColor: '#22C55E', borderRadius: 12, height: 52, justifyContent: 'center', alignItems: 'center' },
  submitButtonDisabled: { backgroundColor: '#D1D5DB' },
  submitButtonText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.5 },
});