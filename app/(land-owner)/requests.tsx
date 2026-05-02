// (land-owner)/requests.tsx
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { styles } from './styles';

type RentalRequest = {
  id: string;
  land_id: string;
  parking_owner_id: string;
  proposed_rent: number;
  proposed_start_date: string;
  proposed_end_date: string;
  message: string | null;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  response_message: string | null;
  created_at: string;
  land_listings: { title: string; address: string } | null;
  profiles: { full_name: string; email: string } | null;
};

type FilterTab = 'pending' | 'history';

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-NP', { day: 'numeric', month: 'short', year: 'numeric' });

export default function Requests() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requests, setRequests] = useState<RentalRequest[]>([]);
  const [activeTab, setActiveTab] = useState<FilterTab>('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Reject modal
  const [rejectModal, setRejectModal] = useState<{ id: string; from: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  const fetchRequests = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('land_rental_requests')
        .select(`
          *,
          land_listings ( title, address ),
          profiles!land_rental_requests_parking_owner_id_fkey ( full_name, email )
        `)
        .eq('land_owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests((data as any) || []);
    } catch (err) {
      console.error('Fetch requests error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchRequests();
    }, [fetchRequests])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchRequests();
  };

  const sendNotification = async (
    userId: string,
    type: 'rental_request_accepted' | 'rental_request_rejected',
    title: string,
    message: string,
    requestId: string
  ) => {
    try {
      await supabase.from('notifications').insert({
        user_id: userId,
        type,
        title,
        message,
        rental_request_id: requestId,
        data: { request_id: requestId },
      });
    } catch (e) {
      console.error('Notification send error:', e);
    }
  };

  const handleAccept = async (req: RentalRequest) => {
    Alert.alert(
      'Accept Request?',
      `This creates a binding agreement at Rs ${Number(req.proposed_rent).toLocaleString()}/month from ${formatDate(req.proposed_start_date)} to ${formatDate(req.proposed_end_date)}. The land will become unavailable to others.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          style: 'default',
          onPress: async () => {
            setProcessingId(req.id);
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) return;

              // 1) Update request to accepted
              const { error: reqErr } = await supabase
                .from('land_rental_requests')
                .update({
                  status: 'accepted',
                  responded_at: new Date().toISOString(),
                })
                .eq('id', req.id);
              if (reqErr) throw reqErr;

              // 2) Create agreement
              const { error: agErr } = await supabase
                .from('land_agreements')
                .insert({
                  request_id: req.id,
                  land_id: req.land_id,
                  parking_owner_id: req.parking_owner_id,
                  land_owner_id: user.id,
                  monthly_rent: req.proposed_rent,
                  start_date: req.proposed_start_date,
                  end_date: req.proposed_end_date,
                  status: 'active',
                });
              if (agErr) throw agErr;

              // 3) Mark land unavailable
              await supabase
                .from('land_listings')
                .update({ is_available: false })
                .eq('id', req.land_id);

              // 4) Auto-cancel other pending requests for the same land
              await supabase
                .from('land_rental_requests')
                .update({
                  status: 'cancelled',
                  response_message: 'Land has been rented to another party.',
                  responded_at: new Date().toISOString(),
                })
                .eq('land_id', req.land_id)
                .eq('status', 'pending')
                .neq('id', req.id);

              // 5) Notify parking owner
              await sendNotification(
                req.parking_owner_id,
                'rental_request_accepted',
                '🎉 Rent Request Accepted!',
                `Your request for "${req.land_listings?.title || 'land'}" was accepted. Agreement is now active.`,
                req.id
              );

              setRequests(prev =>
                prev.map(r =>
                  r.id === req.id ? { ...r, status: 'accepted' as const } : r
                )
              );
              Alert.alert('Accepted ✓', 'Agreement created. Parking owner has been notified.');
            } catch (e: any) {
              Alert.alert('Error', e?.message || 'Failed to accept request.');
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
  };

  const openRejectModal = (req: RentalRequest) => {
    setRejectReason('');
    setRejectModal({
      id: req.id,
      from: req.profiles?.full_name || 'Parking Owner',
    });
  };

  const handleRejectConfirm = async () => {
    if (!rejectModal || !rejectReason.trim()) return;
    setIsRejecting(true);
    try {
      const req = requests.find(r => r.id === rejectModal.id);
      if (!req) return;

      const { error } = await supabase
        .from('land_rental_requests')
        .update({
          status: 'rejected',
          response_message: rejectReason.trim(),
          responded_at: new Date().toISOString(),
        })
        .eq('id', rejectModal.id);

      if (error) throw error;

      await sendNotification(
        req.parking_owner_id,
        'rental_request_rejected',
        'Rent Request Rejected',
        `Your request for "${req.land_listings?.title || 'land'}" was rejected. Reason: ${rejectReason.trim()}`,
        rejectModal.id
      );

      setRequests(prev =>
        prev.map(r =>
          r.id === rejectModal.id
            ? { ...r, status: 'rejected' as const, response_message: rejectReason.trim() }
            : r
        )
      );
      setRejectModal(null);
      Alert.alert('Rejected', 'Parking owner has been notified.');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to reject.');
    } finally {
      setIsRejecting(false);
    }
  };

  const visible = requests.filter(r =>
    activeTab === 'pending' ? r.status === 'pending' : r.status !== 'pending'
  );

  const pendingCount = requests.filter(r => r.status === 'pending').length;

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
        <Text style={styles.headerTitle}>Rental Requests</Text>
      </View>

      {/* Tabs */}
      <View style={modalStyles.tabBar}>
        {(['pending', 'history'] as FilterTab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[modalStyles.tab, activeTab === tab && modalStyles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[modalStyles.tabText, activeTab === tab && modalStyles.tabTextActive]}>
              {tab === 'pending' ? `Pending${pendingCount > 0 ? ` (${pendingCount})` : ''}` : 'History'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22C55E" />
        }
      >
        {visible.length === 0 ? (
          <View style={[styles.card, { alignItems: 'center', paddingVertical: 50 }]}>
            <Ionicons
              name={activeTab === 'pending' ? 'mail-open-outline' : 'archive-outline'}
              size={56}
              color="#D1D5DB"
            />
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#6B7280', marginTop: 16 }}>
              {activeTab === 'pending' ? 'No pending requests' : 'No history yet'}
            </Text>
            <Text style={{ fontSize: 13, color: '#9CA3AF', marginTop: 6, textAlign: 'center' }}>
              {activeTab === 'pending'
                ? "You'll see new requests from parking owners here"
                : 'Past responded requests will appear here'}
            </Text>
          </View>
        ) : (
          visible.map((req) => {
            const isProcessing = processingId === req.id;
            const statusBadge =
              req.status === 'accepted'
                ? { label: 'Accepted', bg: '#DCFCE7', text: '#15803D' }
                : req.status === 'rejected'
                ? { label: 'Rejected', bg: '#FEE2E2', text: '#DC2626' }
                : req.status === 'cancelled'
                ? { label: 'Cancelled', bg: '#F3F4F6', text: '#6B7280' }
                : { label: 'Pending', bg: '#FEF3C7', text: '#D97706' };

            return (
              <View key={req.id} style={styles.card}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={{ fontSize: 16, fontWeight: '700' }} numberOfLines={1}>
                      {req.land_listings?.title || 'Untitled Plot'}
                    </Text>
                    <Text style={{ color: '#6B7280', fontSize: 13, marginTop: 3 }} numberOfLines={1}>
                      from {req.profiles?.full_name || 'Parking Owner'}
                    </Text>
                  </View>
                  <View style={{
                    paddingHorizontal: 10, paddingVertical: 4,
                    borderRadius: 20, backgroundColor: statusBadge.bg,
                  }}>
                    <Text style={{ color: statusBadge.text, fontWeight: '600', fontSize: 11 }}>
                      {statusBadge.label}
                    </Text>
                  </View>
                </View>

                <View style={{ marginTop: 14, gap: 8 }}>
                  <Text style={{ fontSize: 13 }}>
                    💰 Proposed Rent:{' '}
                    <Text style={{ fontWeight: '700', color: '#22C55E' }}>
                      Rs {Number(req.proposed_rent).toLocaleString()}/month
                    </Text>
                  </Text>
                  <Text style={{ fontSize: 13, color: '#374151' }}>
                    📅 {formatDate(req.proposed_start_date)} → {formatDate(req.proposed_end_date)}
                  </Text>
                  {req.message && (
                    <View style={{
                      backgroundColor: '#F9FAFB', padding: 10, borderRadius: 8, marginTop: 4,
                    }}>
                      <Text style={{ fontSize: 12, color: '#6B7280', fontWeight: '600' }}>Message:</Text>
                      <Text style={{ fontSize: 13, color: '#111827', marginTop: 4 }}>{req.message}</Text>
                    </View>
                  )}
                  {req.status !== 'pending' && req.response_message && (
                    <View style={{
                      backgroundColor: '#FEF2F2', padding: 10, borderRadius: 8,
                      borderWidth: 1, borderColor: '#FECACA', marginTop: 4,
                    }}>
                      <Text style={{ fontSize: 12, color: '#991B1B', fontWeight: '600' }}>
                        Your response:
                      </Text>
                      <Text style={{ fontSize: 13, color: '#7F1D1D', marginTop: 4 }}>
                        {req.response_message}
                      </Text>
                    </View>
                  )}
                </View>

                {req.status === 'pending' && (
                  isProcessing ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, justifyContent: 'center' }}>
                      <ActivityIndicator size="small" color="#22C55E" />
                      <Text style={{ color: '#6B7280', fontSize: 13 }}>Processing...</Text>
                    </View>
                  ) : (
                    <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
                      <TouchableOpacity
                        style={{
                          flex: 1, backgroundColor: '#22C55E', padding: 13,
                          borderRadius: 12, alignItems: 'center',
                          flexDirection: 'row', justifyContent: 'center', gap: 6,
                        }}
                        onPress={() => handleAccept(req)}
                      >
                        <Ionicons name="checkmark-circle" size={16} color="#fff" />
                        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Accept</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={{
                          flex: 1, backgroundColor: '#fff',
                          borderWidth: 1.5, borderColor: '#EF4444',
                          padding: 12, borderRadius: 12, alignItems: 'center',
                          flexDirection: 'row', justifyContent: 'center', gap: 6,
                        }}
                        onPress={() => openRejectModal(req)}
                      >
                        <Ionicons name="close-circle" size={16} color="#EF4444" />
                        <Text style={{ color: '#EF4444', fontWeight: '700', fontSize: 14 }}>Reject</Text>
                      </TouchableOpacity>
                    </View>
                  )
                )}
              </View>
            );
          })
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Reject Modal */}
      <Modal
        visible={!!rejectModal}
        transparent
        animationType="fade"
        onRequestClose={() => setRejectModal(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={modalStyles.modalOverlay}
        >
          <View style={modalStyles.modalCard}>
            <Text style={modalStyles.modalTitle}>Reject Request</Text>
            <Text style={modalStyles.modalSubtitle}>
              Let {rejectModal?.from} know why you&apos;re rejecting this request.
            </Text>

            <View style={modalStyles.quickRow}>
              {['Rent too low', 'Dates not suitable', 'Already have offer', 'Need to verify'].map((q) => (
                <TouchableOpacity
                  key={q}
                  style={modalStyles.quickChip}
                  onPress={() => setRejectReason(q)}
                >
                  <Text style={modalStyles.quickChipText}>{q}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={modalStyles.reasonInput}
              placeholder="Add reason..."
              placeholderTextColor="#9CA3AF"
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
              numberOfLines={3}
              maxLength={250}
            />
            <Text style={modalStyles.charCount}>{rejectReason.length}/250</Text>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <TouchableOpacity
                style={modalStyles.modalCancelBtn}
                onPress={() => setRejectModal(null)}
                disabled={isRejecting}
              >
                <Text style={modalStyles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  modalStyles.modalConfirmBtn,
                  (!rejectReason.trim() || isRejecting) && { opacity: 0.5 }
                ]}
                onPress={handleRejectConfirm}
                disabled={!rejectReason.trim() || isRejecting}
              >
                {isRejecting
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={modalStyles.modalConfirmText}>Reject</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const modalStyles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: '#22C55E' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  tabTextActive: { color: '#22C55E' },

  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', paddingHorizontal: 24,
  },
  modalCard: {
    backgroundColor: '#fff', borderRadius: 18, padding: 22,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  modalSubtitle: { fontSize: 13, color: '#6B7280', marginTop: 6 },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  quickChip: {
    backgroundColor: '#F3F4F6', paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 16,
  },
  quickChipText: { fontSize: 12, color: '#374151', fontWeight: '500' },
  reasonInput: {
    backgroundColor: '#F9FAFB', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB',
    padding: 12, fontSize: 14, color: '#111827',
    marginTop: 14, minHeight: 80, textAlignVertical: 'top',
  },
  charCount: { fontSize: 11, color: '#9CA3AF', textAlign: 'right', marginTop: 4 },
  modalCancelBtn: {
    flex: 1, backgroundColor: '#F3F4F6', padding: 14,
    borderRadius: 12, alignItems: 'center',
  },
  modalCancelText: { fontWeight: '600', color: '#374151' },
  modalConfirmBtn: {
    flex: 1, backgroundColor: '#EF4444', padding: 14,
    borderRadius: 12, alignItems: 'center',
    flexDirection: 'row', justifyContent: 'center', gap: 6,
  },
  modalConfirmText: { color: '#fff', fontWeight: '700' },
});
