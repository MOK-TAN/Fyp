import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
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

const AMENITY_OPTIONS = [
  { key: 'CCTV', icon: 'videocam', label: 'CCTV' },
  { key: 'Covered', icon: 'umbrella', label: 'Covered' },
  { key: '24/7', icon: 'time', label: '24/7' },
  { key: 'Security', icon: 'shield-checkmark', label: 'Security' },
  { key: 'EV Charging', icon: 'flash', label: 'EV Charging' },
  { key: 'Wheelchair Access', icon: 'accessibility', label: 'Wheelchair' },
];

export default function AddFacility() {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [pricePerHour, setPricePerHour] = useState('');
  const [totalSlots, setTotalSlots] = useState('');
  const [slotsPerSection, setSlotsPerSection] = useState('5');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Errors
  const [nameError, setNameError] = useState('');
  const [addressError, setAddressError] = useState('');
  const [priceError, setPriceError] = useState('');
  const [slotsError, setSlotsError] = useState('');

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities(prev =>
      prev.includes(amenity)
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    );
  };

  const validateForm = (): boolean => {
    let isValid = true;

    if (!name.trim()) {
      setNameError('Facility name is required');
      isValid = false;
    } else {
      setNameError('');
    }

    if (!address.trim()) {
      setAddressError('Address is required');
      isValid = false;
    } else {
      setAddressError('');
    }

    if (!pricePerHour.trim()) {
      setPriceError('Price is required');
      isValid = false;
    } else if (parseFloat(pricePerHour) <= 0) {
      setPriceError('Price must be greater than 0');
      isValid = false;
    } else {
      setPriceError('');
    }

    if (!totalSlots.trim()) {
      setSlotsError('Number of slots is required');
      isValid = false;
    } else if (parseInt(totalSlots) <= 0 || parseInt(totalSlots) > 200) {
      setSlotsError('Slots must be between 1 and 200');
      isValid = false;
    } else {
      setSlotsError('');
    }

    return isValid;
  };

  const generateSlots = (facilityId: string, total: number, perSection: number) => {
    const slots: { facility_id: string; slot_number: string; section: string; is_available: boolean; is_occupied: boolean }[] = [];
    const sections = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let slotCount = 0;

    for (let s = 0; s < sections.length && slotCount < total; s++) {
      const section = sections[s];
      for (let n = 1; n <= perSection && slotCount < total; n++) {
        slots.push({
          facility_id: facilityId,
          slot_number: `${section}${n}`,
          section: section,
          is_available: true,
          is_occupied: false,
        });
        slotCount++;
      }
    }

    return slots;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'Please login to continue');
        setIsSubmitting(false);
        return;
      }

      // 1. Create facility
      const { data: facility, error: facilityError } = await supabase
        .from('parking_facilities')
        .insert({
          owner_id: user.id,
          name: name.trim(),
          address: address.trim(),
          total_slots: parseInt(totalSlots),
          price_per_hour: parseFloat(pricePerHour),
          amenities: selectedAmenities,
          photos: [],
          is_active: true,
          is_approved: true, // Auto-approve for now; change to false for admin review
        })
        .select()
        .single();

      if (facilityError) {
        console.error('Facility error:', facilityError);
        Alert.alert('Error', 'Failed to create facility: ' + facilityError.message);
        setIsSubmitting(false);
        return;
      }

      // 2. Generate and insert slots
      const slotsData = generateSlots(
        facility.id,
        parseInt(totalSlots),
        parseInt(slotsPerSection) || 5
      );

      const { error: slotsError } = await supabase
        .from('parking_slots')
        .insert(slotsData);

      if (slotsError) {
        console.error('Slots error:', slotsError);
        // Facility was created but slots failed
        Alert.alert(
          'Partial Success',
          'Facility created but slots could not be generated. You can add them manually.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
        return;
      }

      Alert.alert(
        'Facility Created!',
        `${name.trim()} has been created with ${totalSlots} slots.`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      console.error('Submit error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const slotPreview = () => {
    const total = parseInt(totalSlots) || 0;
    const perSec = parseInt(slotsPerSection) || 5;
    if (total <= 0) return '';
    const numSections = Math.ceil(total / perSec);
    const sections = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.slice(0, numSections);
    return `Sections ${sections.split('').join(', ')} (${perSec} slots each)`;
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New Facility</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Facility Name */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Facility Name *</Text>
          <View style={[styles.inputWrapper, nameError && styles.inputError]}>
            <Ionicons name="business-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="e.g. Thamel Central Parking"
              placeholderTextColor="#D1D5DB"
              value={name}
              onChangeText={(t) => { setName(t); if (nameError) setNameError(''); }}
              editable={!isSubmitting}
            />
          </View>
          {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
        </View>

        {/* Address */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Address *</Text>
          <View style={[styles.inputWrapper, addressError && styles.inputError]}>
            <Ionicons name="location-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="e.g. Thamel Marg, Kathmandu"
              placeholderTextColor="#D1D5DB"
              value={address}
              onChangeText={(t) => { setAddress(t); if (addressError) setAddressError(''); }}
              editable={!isSubmitting}
            />
          </View>
          {addressError ? <Text style={styles.errorText}>{addressError}</Text> : null}
        </View>

        {/* Price and Slots Row */}
        <View style={styles.row}>
          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <Text style={styles.label}>Price/Hour (Rs) *</Text>
            <View style={[styles.inputWrapper, priceError && styles.inputError]}>
              <Text style={styles.rsPrefix}>Rs</Text>
              <TextInput
                style={styles.input}
                placeholder="80"
                placeholderTextColor="#D1D5DB"
                value={pricePerHour}
                onChangeText={(t) => { setPricePerHour(t); if (priceError) setPriceError(''); }}
                keyboardType="numeric"
                editable={!isSubmitting}
              />
            </View>
            {priceError ? <Text style={styles.errorText}>{priceError}</Text> : null}
          </View>

          <View style={{ width: 12 }} />

          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <Text style={styles.label}>Total Slots *</Text>
            <View style={[styles.inputWrapper, slotsError && styles.inputError]}>
              <Ionicons name="grid-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="20"
                placeholderTextColor="#D1D5DB"
                value={totalSlots}
                onChangeText={(t) => { setTotalSlots(t); if (slotsError) setSlotsError(''); }}
                keyboardType="numeric"
                editable={!isSubmitting}
              />
            </View>
            {slotsError ? <Text style={styles.errorText}>{slotsError}</Text> : null}
          </View>
        </View>

        {/* Slots Per Section */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Slots Per Section</Text>
          <View style={styles.slotOptions}>
            {['4', '5', '6', '8', '10'].map(n => (
              <TouchableOpacity
                key={n}
                style={[styles.slotOption, slotsPerSection === n && styles.slotOptionActive]}
                onPress={() => setSlotsPerSection(n)}
              >
                <Text style={[styles.slotOptionText, slotsPerSection === n && styles.slotOptionTextActive]}>
                  {n}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {totalSlots && parseInt(totalSlots) > 0 && (
            <Text style={styles.slotPreview}>{slotPreview()}</Text>
          )}
        </View>

        {/* Amenities */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Amenities</Text>
          <View style={styles.amenitiesGrid}>
            {AMENITY_OPTIONS.map(amenity => (
              <TouchableOpacity
                key={amenity.key}
                style={[
                  styles.amenityChip,
                  selectedAmenities.includes(amenity.key) && styles.amenityChipActive,
                ]}
                onPress={() => toggleAmenity(amenity.key)}
                disabled={isSubmitting}
              >
                <Ionicons
                  name={amenity.icon as any}
                  size={18}
                  color={selectedAmenities.includes(amenity.key) ? '#FFFFFF' : '#6B7280'}
                />
                <Text style={[
                  styles.amenityChipText,
                  selectedAmenities.includes(amenity.key) && styles.amenityChipTextActive,
                ]}>
                  {amenity.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Summary Card */}
        {name.trim() && pricePerHour && totalSlots && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Name</Text>
              <Text style={styles.summaryValue}>{name.trim()}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Price</Text>
              <Text style={styles.summaryValue}>Rs {pricePerHour}/hr</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Slots</Text>
              <Text style={styles.summaryValue}>{totalSlots} slots</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Amenities</Text>
              <Text style={styles.summaryValue}>
                {selectedAmenities.length > 0 ? selectedAmenities.join(', ') : 'None'}
              </Text>
            </View>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
          activeOpacity={0.8}
        >
          {isSubmitting ? (
            <>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={[styles.submitButtonText, { marginLeft: 10 }]}>Creating...</Text>
            </>
          ) : (
            <>
              <Ionicons name="add-circle" size={22} color="#fff" />
              <Text style={styles.submitButtonText}>CREATE FACILITY</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 24 },

  // Fields
  fieldGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 14, height: 52 },
  inputError: { borderColor: '#DC2626', backgroundColor: '#FEF2F2' },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: '#111827' },
  rsPrefix: { fontSize: 15, fontWeight: '600', color: '#6B7280', marginRight: 8 },
  errorText: { color: '#DC2626', fontSize: 12, marginTop: 4, paddingLeft: 4 },
  row: { flexDirection: 'row' },

  // Slots per section
  slotOptions: { flexDirection: 'row', gap: 10 },
  slotOption: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center' },
  slotOptionActive: { backgroundColor: '#22C55E', borderColor: '#22C55E' },
  slotOptionText: { fontSize: 16, fontWeight: '600', color: '#6B7280' },
  slotOptionTextActive: { color: '#FFFFFF' },
  slotPreview: { fontSize: 13, color: '#22C55E', marginTop: 10, fontWeight: '500' },

  // Amenities
  amenitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  amenityChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', gap: 6 },
  amenityChipActive: { backgroundColor: '#22C55E', borderColor: '#22C55E' },
  amenityChipText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  amenityChipTextActive: { color: '#FFFFFF' },

  // Summary
  summaryCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 20 },
  summaryTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  summaryLabel: { fontSize: 13, color: '#6B7280' },
  summaryValue: { fontSize: 13, fontWeight: '600', color: '#111827', maxWidth: '60%', textAlign: 'right' },

  // Footer
  footer: { backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  submitButton: { flexDirection: 'row', backgroundColor: '#22C55E', height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center', gap: 8, shadowColor: '#22C55E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  submitButtonDisabled: { opacity: 0.7 },
  submitButtonText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.5 },
});