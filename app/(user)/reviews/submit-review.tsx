import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../../../lib/supabase';

export default function SubmitReview() {
  const params = useLocalSearchParams();
  const facilityId = params.facilityId as string;
  const facilityName = params.facilityName as string || 'Parking Facility';
  const bookingId = params.bookingId as string;

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a star rating');
      return;
    }

    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'Please login to submit a review');
        setSubmitting(false);
        return;
      }

      const { error } = await supabase
        .from('reviews')
        .insert({
          user_id: user.id,
          facility_id: facilityId,
          booking_id: bookingId || null,
          rating: rating,
          comment: comment.trim() || null,
        });

      if (error) {
        if (error.message.includes('duplicate') || error.message.includes('already exists')) {
          Alert.alert('Already Reviewed', 'You have already submitted a review for this booking.', [
            { text: 'OK', onPress: () => router.replace('/(user)/(tabs)') }
          ]);
        } else {
          console.error('Review error:', error);
          Alert.alert('Error', 'Failed to submit review: ' + error.message);
        }
        return;
      }

      Alert.alert(
        'Thank You!',
        'Your review has been submitted successfully.',
        [{ text: 'OK', onPress: () => router.replace('/(user)/(tabs)') }]
      );
    } catch (error) {
      console.error('Submit error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    router.replace('/(user)/(tabs)');
  };

  const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rate Your Experience</Text>
        <TouchableOpacity onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Facility Info */}
        <View style={styles.facilityCard}>
          <View style={styles.facilityIcon}>
            <Ionicons name="car-sport" size={32} color="#22C55E" />
          </View>
          <Text style={styles.facilityName}>{facilityName}</Text>
          <Text style={styles.facilitySubtext}>How was your parking experience?</Text>
        </View>

        {/* Star Rating */}
        <View style={styles.ratingSection}>
          <Text style={styles.ratingLabel}>Tap to Rate</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map(star => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                activeOpacity={0.7}
                style={styles.starButton}
              >
                <Ionicons
                  name={star <= rating ? 'star' : 'star-outline'}
                  size={44}
                  color={star <= rating ? '#F59E0B' : '#D1D5DB'}
                />
              </TouchableOpacity>
            ))}
          </View>
          {rating > 0 && (
            <Text style={styles.ratingText}>{ratingLabels[rating]}</Text>
          )}
        </View>

        {/* Comment Input */}
        <View style={styles.commentSection}>
          <Text style={styles.commentLabel}>Write a Review (Optional)</Text>
          <TextInput
            style={styles.commentInput}
            placeholder="Tell us about your experience — parking quality, staff, cleanliness, accessibility..."
            placeholderTextColor="#9CA3AF"
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            maxLength={500}
          />
          <Text style={styles.charCount}>{comment.length}/500</Text>
        </View>

        {/* Quick Tags */}
        <View style={styles.tagsSection}>
          <Text style={styles.tagsLabel}>Quick Feedback</Text>
          <View style={styles.tagsGrid}>
            {['Clean', 'Safe', 'Easy Access', 'Good Staff', 'Well Lit', 'Affordable'].map(tag => (
              <TouchableOpacity
                key={tag}
                style={[
                  styles.tag,
                  comment.includes(tag) && styles.tagActive,
                ]}
                onPress={() => {
                  if (comment.includes(tag)) {
                    setComment(prev => prev.replace(tag + '. ', '').replace(tag, ''));
                  } else {
                    setComment(prev => (prev ? prev + ' ' + tag + '.' : tag + '.'));
                  }
                }}
              >
                <Text style={[
                  styles.tagText,
                  comment.includes(tag) && styles.tagTextActive,
                ]}>
                  {tag}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, (rating === 0 || submitting) && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={rating === 0 || submitting}
          activeOpacity={0.8}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>SUBMIT REVIEW</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
  skipText: { fontSize: 15, fontWeight: '600', color: '#9CA3AF' },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 24 },

  // Facility
  facilityCard: { alignItems: 'center', marginBottom: 32 },
  facilityIcon: { width: 72, height: 72, borderRadius: 20, backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  facilityName: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 6, textAlign: 'center' },
  facilitySubtext: { fontSize: 14, color: '#6B7280' },

  // Rating
  ratingSection: { alignItems: 'center', marginBottom: 32 },
  ratingLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 16 },
  starsRow: { flexDirection: 'row', gap: 12 },
  starButton: { padding: 4 },
  ratingText: { fontSize: 16, fontWeight: '600', color: '#F59E0B', marginTop: 12 },

  // Comment
  commentSection: { marginBottom: 24 },
  commentLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  commentInput: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 16, fontSize: 15, color: '#111827', minHeight: 120, lineHeight: 22 },
  charCount: { fontSize: 12, color: '#9CA3AF', textAlign: 'right', marginTop: 6 },

  // Tags
  tagsSection: { marginBottom: 24 },
  tagsLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 10 },
  tagsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB' },
  tagActive: { backgroundColor: '#22C55E', borderColor: '#22C55E' },
  tagText: { fontSize: 13, fontWeight: '500', color: '#6B7280' },
  tagTextActive: { color: '#fff' },

  // Footer
  footer: { backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  submitButton: { backgroundColor: '#22C55E', height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  submitButtonDisabled: { backgroundColor: '#D1D5DB' },
  submitButtonText: { fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },
});