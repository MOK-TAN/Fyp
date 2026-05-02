// (parking-owner)/land-details/[id].tsx
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { supabase } from '../../../lib/supabase';

const AANA_TO_SQFT = 342.25;
const sqftToAana = (s: number) => Math.round((s / AANA_TO_SQFT) * 100) / 100;

type Land = {
  id: string;
  title: string;
  description: string | null;
  address: string;
  latitude: number | null;
  longitude: number | null;
  area_sqft: number;
  expected_rent: number | null;
  photos: string[] | null;
  is_available: boolean;
  approval_status: string;
  created_at: string;
  owner_id: string;
};

type Owner = {
  full_name: string | null;
  email: string | null;
  phone: string | null;
};

export default function LandDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [land, setLand] = useState<Land | null>(null);
  const [owner, setOwner] = useState<Owner | null>(null);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);

  // Modal form
  const [modalOpen, setModalOpen] = useState(false);
  const [proposedRent, setProposedRent] = useState('');
  const [startDate, setStartDate] = useState(''); // YYYY-MM-DD
  const [endDate, setEndDate] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [k: string]: string }>({});

  useEffect(() => {
    if (!id) return;
    fetchLand();
  }, [id]);

  const fetchLand = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: l, error } = await supabase
        .from('land_listings')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      setLand(l);

      // Owner info
      const { data: o } = await supabase
        .from('profiles')
        .select('full_name, email, phone')
        .eq('id', l.owner_id)
        .single();
      setOwner(o);

      // Existing pending request?
      const { data: existing } = await supabase
        .from('land_rental_requests')
        .select('id')
        .eq('land_id', id)
        .eq('parking_owner_id', user.id)
        .eq('status', 'pending')
        .maybeSingle();
      setHasPendingRequest(!!existing);

      // Prefill rent if expected_rent available
      if (l.expected_rent) setProposedRent(String(l.expected_rent));
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to load land details');
    } finally {
      setLoading(false);
    }
  };

  const validate = (): boolean => {
    const e: { [k: string]: string } = {};
    if (!proposedRent.trim() || parseFloat(proposedRent) <= 0)
      e.rent = 'Enter a valid rent amount';
    if (!startDate.match(/^\d{4}-\d{2}-\d{2}$/))
      e.start = 'Start date format: YYYY-MM-DD';
    if (!endDate.match(/^\d{4}-\d{2}-\d{2}$/))
      e.end = 'End date format: YYYY-MM-DD';

    if (startDate && endDate) {
      const s = new Date(startDate);
      const en = new Date(endDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (s < today) e.start = 'Start date must be today or later';
      if (en <= s) e.end = 'End date must be after start';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || !land) return;
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'Please log in to continue');
        return;
      }

      const { data: inserted, error } = await supabase
        .from('land_rental_requests')
        .insert({
          land_id: land.id,
          parking_owner_id: user.id,
          land_owner_id: land.owner_id,
          proposed_rent: parseFloat(proposedRent),
          proposed_start_date: startDate,
          proposed_end_date: endDate,
          message: message.trim() || null,
          status: 'pending',
        })
        .select('id')
        .single();
      if (error) throw error;

      // Notify land owner
      await supabase.from('notifications').insert({
        user_id: land.owner_id,
        type: 'rental_request_received',
        title: '🔔 New Rent Request',
        message: `A parking owner sent a rent request for "${land.title}" at Rs ${parseFloat(proposedRent).toLocaleString()}/month.`,
        rental_request_id: inserted.id,
        land_listing_id: land.id,
        data: { request_id: inserted.id, land_id: land.id },
      });

      setModalOpen(false);
      setHasPendingRequest(true);
      Alert.alert(
        'Request Sent! 🎉',
        'The land owner has been notified. You will get a notification when they respond.',
        [{ text: 'OK' }]
      );
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to send request.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={[s.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#22C55E" />
      </View>
    );
  }

  if (!land) {
    return (
      <View style={[s.container, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <Ionicons name="alert-circle-outline" size={56} color="#9CA3AF" />
        <Text style={{ fontSize: 16, fontWeight: '600', color: '#6B7280', marginTop: 16 }}>
          Land not found
        </Text>
        <TouchableOpacity
          style={{ marginTop: 16, padding: 12, backgroundColor: '#22C55E', borderRadius: 10 }}
          onPress={() => router.back()}
        >
          <Text style={{ color: '#fff', fontWeight: '700' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>{land.title}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={{ flex: 1 }}>
        {/* Hero */}
        <View style={s.hero}>
          <Ionicons name="leaf" size={56} color="#22C55E" />
        </View>

        {/* Title block */}
        <View style={s.section}>
          <Text style={s.title}>{land.title}</Text>
          <Text style={s.address}>📍 {land.address}</Text>

          <View style={s.metaRow}>
            <View style={s.metaCard}>
              <Ionicons name="resize-outline" size={20} color="#22C55E" />
              <Text style={s.metaValue}>{sqftToAana(land.area_sqft)} Aana</Text>
              <Text style={s.metaLabel}>{land.area_sqft.toLocaleString()} sq.ft</Text>
            </View>
            <View style={s.metaCard}>
              <Ionicons name="cash-outline" size={20} color="#22C55E" />
              <Text style={s.metaValue}>
                {land.expected_rent
                  ? `Rs ${land.expected_rent.toLocaleString()}`
                  : 'Negotiable'}
              </Text>
              <Text style={s.metaLabel}>{land.expected_rent ? 'per month' : 'open to offers'}</Text>
            </View>
          </View>
        </View>

        {/* Description */}
        {land.description && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Description</Text>
            <Text style={s.bodyText}>{land.description}</Text>
          </View>
        )}

        {/* Map */}
        {land.latitude != null && land.longitude != null && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Location</Text>
            <View style={s.mapWrap}>
              <MapView
                provider={PROVIDER_GOOGLE}
                style={{ flex: 1 }}
                initialRegion={{
                  latitude: Number(land.latitude),
                  longitude: Number(land.longitude),
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                pointerEvents="none"
              >
                <Marker
                  coordinate={{
                    latitude: Number(land.latitude),
                    longitude: Number(land.longitude),
                  }}
                />
              </MapView>
            </View>
          </View>
        )}

        {/* Owner */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Land Owner</Text>
          <View style={s.ownerCard}>
            <View style={s.ownerAvatar}>
              <Ionicons name="person" size={24} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.ownerName}>{owner?.full_name || 'Landowner'}</Text>
              <Text style={s.ownerSub}>Member · ParkEase verified listing</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 140 }} />
      </ScrollView>

      {/* Footer CTA */}
      <View style={s.footer}>
        {hasPendingRequest ? (
          <View style={[s.ctaButton, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="time" size={18} color="#D97706" />
            <Text style={[s.ctaText, { color: '#D97706' }]}>
              Request Pending - Awaiting Response
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            style={s.ctaButton}
            onPress={() => setModalOpen(true)}
            activeOpacity={0.85}
          >
            <Ionicons name="paper-plane" size={18} color="#fff" />
            <Text style={s.ctaText}>Send Rent Request</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Request Modal */}
      <Modal
        visible={modalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setModalOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={s.modalOverlay}
        >
          <View style={s.modalCard}>
            <View style={s.modalHandle} />

            <Text style={s.modalTitle}>Send Rent Request</Text>
            <Text style={s.modalSubtitle}>
              Propose your terms. The land owner can accept or reject.
            </Text>

            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
              {/* Rent */}
              <View style={s.field}>
                <Text style={s.label}>Proposed Monthly Rent (NPR)</Text>
                <View style={[s.input, errors.rent && s.inputError]}>
                  <Text style={s.prefix}>Rs</Text>
                  <TextInput
                    style={s.inputField}
                    placeholder="e.g., 45000"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    value={proposedRent}
                    onChangeText={(t) => {
                      setProposedRent(t.replace(/[^0-9.]/g, ''));
                      if (errors.rent) setErrors({ ...errors, rent: '' });
                    }}
                  />
                </View>
                {land.expected_rent && (
                  <Text style={s.hint}>
                    Owner&apos;s expected: Rs {land.expected_rent.toLocaleString()}/mo
                  </Text>
                )}
                {errors.rent && <Text style={s.errorText}>{errors.rent}</Text>}
              </View>

              {/* Start date */}
              <View style={s.field}>
                <Text style={s.label}>Start Date</Text>
                <View style={[s.input, errors.start && s.inputError]}>
                  <Ionicons name="calendar-outline" size={16} color="#9CA3AF" />
                  <TextInput
                    style={[s.inputField, { marginLeft: 6 }]}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#9CA3AF"
                    value={startDate}
                    onChangeText={(t) => {
                      setStartDate(t);
                      if (errors.start) setErrors({ ...errors, start: '' });
                    }}
                  />
                </View>
                {errors.start && <Text style={s.errorText}>{errors.start}</Text>}
              </View>

              {/* End date */}
              <View style={s.field}>
                <Text style={s.label}>End Date</Text>
                <View style={[s.input, errors.end && s.inputError]}>
                  <Ionicons name="calendar-outline" size={16} color="#9CA3AF" />
                  <TextInput
                    style={[s.inputField, { marginLeft: 6 }]}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#9CA3AF"
                    value={endDate}
                    onChangeText={(t) => {
                      setEndDate(t);
                      if (errors.end) setErrors({ ...errors, end: '' });
                    }}
                  />
                </View>
                {errors.end && <Text style={s.errorText}>{errors.end}</Text>}
              </View>

              {/* Message */}
              <View style={s.field}>
                <Text style={s.label}>Message <Text style={s.optional}>(optional)</Text></Text>
                <TextInput
                  style={[s.input, { height: 80, alignItems: 'flex-start', paddingVertical: 10 }]}
                  placeholder="Tell the owner about your plans for the land..."
                  placeholderTextColor="#9CA3AF"
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  maxLength={300}
                />
                <Text style={[s.hint, { textAlign: 'right' }]}>{message.length}/300</Text>
              </View>
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
              <TouchableOpacity
                style={s.cancelBtn}
                onPress={() => setModalOpen(false)}
                disabled={submitting}
              >
                <Text style={s.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.submitBtn, submitting && { opacity: 0.7 }]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="paper-plane" size={15} color="#fff" />
                    <Text style={s.submitBtnText}>Send Request</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 14,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#111827', flex: 1, marginHorizontal: 12, textAlign: 'center' },

  hero: {
    height: 180, backgroundColor: '#F0FDF4',
    justifyContent: 'center', alignItems: 'center',
  },

  section: { padding: 16, backgroundColor: '#fff', marginTop: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 10 },
  title: { fontSize: 22, fontWeight: '800', color: '#111827' },
  address: { fontSize: 14, color: '#6B7280', marginTop: 6 },
  bodyText: { fontSize: 14, color: '#374151', lineHeight: 21 },

  metaRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  metaCard: {
    flex: 1, backgroundColor: '#F9FAFB',
    borderRadius: 12, padding: 14, alignItems: 'flex-start',
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  metaValue: { fontSize: 16, fontWeight: '700', color: '#111827', marginTop: 8 },
  metaLabel: { fontSize: 12, color: '#6B7280', marginTop: 2 },

  mapWrap: {
    height: 180, borderRadius: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: '#E5E7EB',
  },

  ownerCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 12, backgroundColor: '#F9FAFB', borderRadius: 12,
  },
  ownerAvatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#22C55E',
    justifyContent: 'center', alignItems: 'center',
  },
  ownerName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  ownerSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', padding: 16, paddingBottom: 32,
    borderTopWidth: 1, borderTopColor: '#F3F4F6',
  },
  ctaButton: {
    backgroundColor: '#22C55E', borderRadius: 14, height: 52,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  ctaText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 32,
  },
  modalHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: '#D1D5DB', alignSelf: 'center', marginBottom: 12,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  modalSubtitle: { fontSize: 13, color: '#6B7280', marginTop: 4, marginBottom: 16 },

  field: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  optional: { fontWeight: '400', color: '#9CA3AF' },
  input: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB',
    borderRadius: 10, paddingHorizontal: 12, height: 46,
  },
  inputError: { borderColor: '#EF4444' },
  inputField: { flex: 1, fontSize: 14, color: '#111827' },
  prefix: { fontSize: 14, fontWeight: '600', color: '#6B7280', marginRight: 6 },
  hint: { fontSize: 11, color: '#9CA3AF', marginTop: 4 },
  errorText: { fontSize: 12, color: '#EF4444', marginTop: 4 },

  cancelBtn: {
    flex: 1, backgroundColor: '#F3F4F6', borderRadius: 12,
    height: 50, justifyContent: 'center', alignItems: 'center',
  },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  submitBtn: {
    flex: 1, backgroundColor: '#22C55E', borderRadius: 12,
    height: 50, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6,
  },
  submitBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});