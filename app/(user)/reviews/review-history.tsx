import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { supabase } from '../../../lib/supabase';

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  owner_response: string | null;
  response_at: string | null;
  facility_name: string;
};

export default function ReviewHistory() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('reviews')
        .select(`
          id,
          rating,
          comment,
          created_at,
          owner_response,
          response_at,
          parking_facilities (name)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formatted: Review[] = (data || []).map((r: any) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        created_at: r.created_at,
        owner_response: r.owner_response,
        response_at: r.response_at,
        facility_name: r.parking_facilities?.name || 'Parking Facility',
      }));

      setReviews(formatted);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchReviews();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <Ionicons
        key={i}
        name={i < rating ? 'star' : 'star-outline'}
        size={16}
        color="#F59E0B"
      />
    ));
  };

  const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  // Stats
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';
  const respondedCount = reviews.filter(r => r.owner_response).length;

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
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Reviews</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22C55E" />
        }
      >
        {/* Stats */}
        {reviews.length > 0 && (
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{reviews.length}</Text>
              <Text style={styles.statLabel}>Reviews</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{avgRating}</Text>
              <Text style={styles.statLabel}>Avg Rating</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{respondedCount}</Text>
              <Text style={styles.statLabel}>Responses</Text>
            </View>
          </View>
        )}

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>No Reviews Yet</Text>
            <Text style={styles.emptySubtext}>
              After completing a parking session, you can leave a review for the facility
            </Text>
            <TouchableOpacity
              style={styles.browseButton}
              onPress={() => router.replace('/(user)/(tabs)')}
            >
              <Text style={styles.browseButtonText}>Browse Parking</Text>
            </TouchableOpacity>
          </View>
        ) : (
          reviews.map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              {/* Facility Name */}
              <View style={styles.facilityRow}>
                <View style={styles.facilityIcon}>
                  <Ionicons name="car-sport" size={18} color="#22C55E" />
                </View>
                <Text style={styles.facilityName}>{review.facility_name}</Text>
              </View>

              {/* Rating + Date */}
              <View style={styles.ratingRow}>
                <View style={styles.starsRow}>{renderStars(review.rating)}</View>
                <Text style={styles.ratingLabel}>{ratingLabels[review.rating]}</Text>
                <Text style={styles.dateText}>{formatDate(review.created_at)}</Text>
              </View>

              {/* Comment */}
              {review.comment && (
                <Text style={styles.commentText}>{review.comment}</Text>
              )}

              {/* Owner Response */}
              {review.owner_response && (
                <View style={styles.responseBox}>
                  <View style={styles.responseHeader}>
                    <Ionicons name="chatbubble-ellipses" size={14} color="#22C55E" />
                    <Text style={styles.responseLabel}>Owner's Response</Text>
                    {review.response_at && (
                      <Text style={styles.responseDate}>{formatDate(review.response_at)}</Text>
                    )}
                  </View>
                  <Text style={styles.responseText}>{review.owner_response}</Text>
                </View>
              )}

              {/* Awaiting Response */}
              {!review.owner_response && (
                <View style={styles.pendingTag}>
                  <Ionicons name="time-outline" size={14} color="#9CA3AF" />
                  <Text style={styles.pendingText}>Awaiting owner response</Text>
                </View>
              )}
            </View>
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },

  // Stats
  statsCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: '#E5E7EB' },
  statItem: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: 24, fontWeight: '700', color: '#22C55E', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  statDivider: { width: 1, backgroundColor: '#E5E7EB' },

  // Review Card
  reviewCard: { backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: '#E5E7EB' },
  facilityRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  facilityIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center' },
  facilityName: { fontSize: 16, fontWeight: '600', color: '#111827', flex: 1 },

  // Rating
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  starsRow: { flexDirection: 'row' },
  ratingLabel: { fontSize: 13, fontWeight: '600', color: '#F59E0B', flex: 1 },
  dateText: { fontSize: 12, color: '#9CA3AF' },

  // Comment
  commentText: { fontSize: 14, color: '#374151', lineHeight: 22, marginBottom: 12 },

  // Owner Response
  responseBox: { backgroundColor: '#F0FDF4', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#BBF7D0' },
  responseHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  responseLabel: { fontSize: 12, fontWeight: '700', color: '#22C55E', flex: 1 },
  responseDate: { fontSize: 11, color: '#9CA3AF' },
  responseText: { fontSize: 13, color: '#374151', lineHeight: 20 },

  // Pending
  pendingTag: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 8 },
  pendingText: { fontSize: 12, color: '#9CA3AF' },

  // Empty
  emptyState: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 20 },
  emptyText: { fontSize: 20, fontWeight: '700', color: '#374151', marginTop: 16 },
  emptySubtext: { fontSize: 14, color: '#9CA3AF', marginTop: 8, textAlign: 'center', lineHeight: 20 },
  browseButton: { backgroundColor: '#22C55E', borderRadius: 12, paddingHorizontal: 32, paddingVertical: 14, marginTop: 24 },
  browseButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});