import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useRef, useState } from 'react';
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
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { supabase } from '../../../lib/supabase';

const AMENITY_OPTIONS = [
  { key: 'CCTV', icon: 'videocam', label: 'CCTV' },
  { key: 'Covered', icon: 'umbrella', label: 'Covered' },
  { key: '24/7', icon: 'time', label: '24/7' },
  { key: 'Security', icon: 'shield-checkmark', label: 'Security' },
  { key: 'EV Charging', icon: 'flash', label: 'EV Charging' },
  { key: 'Wheelchair Access', icon: 'accessibility', label: 'Wheelchair' },
];

const KATHMANDU_REGION = {
  latitude: 27.7172,
  longitude: 85.3240,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function AddFacility() {
  // ─── Read params from My Rented Lands → Build Facility ───
  const params = useLocalSearchParams<{
    agreementId?: string;
    prefillAddress?: string;
    prefillLat?: string;
    prefillLng?: string;
    prefillName?: string;
  }>();
  const agreementId = params.agreementId;
  const isFromAgreement = !!agreementId;

  const [name, setName] = useState(params.prefillName || '');
  const [address, setAddress] = useState(params.prefillAddress || '');
  const [pricePerHour, setPricePerHour] = useState('');
  const [totalSlots, setTotalSlots] = useState('');
  const [slotsPerSection, setSlotsPerSection] = useState('5');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [latitude, setLatitude] = useState<number | null>(
    params.prefillLat ? parseFloat(params.prefillLat) : null
  );
  const [longitude, setLongitude] = useState<number | null>(
    params.prefillLng ? parseFloat(params.prefillLng) : null
  );
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const [nameError, setNameError] = useState('');
  const [addressError, setAddressError] = useState('');
  const [priceError, setPriceError] = useState('');
  const [slotsError, setSlotsError] = useState('');
  const [locationError, setLocationError] = useState('');

  const mapRef = useRef<any>(null);

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  const validateForm = (): boolean => {
    let isValid = true;

    if (!name.trim()) { setNameError('Facility name is required'); isValid = false; }
    else setNameError('');

    if (!address.trim()) { setAddressError('Address is required'); isValid = false; }
    else setAddressError('');

    if (!pricePerHour.trim()) { setPriceError('Price is required'); isValid = false; }
    else if (parseFloat(pricePerHour) <= 0) { setPriceError('Price must be greater than 0'); isValid = false; }
    else setPriceError('');

    if (!totalSlots.trim()) { setSlotsError('Number of slots is required'); isValid = false; }
    else if (parseInt(totalSlots) <= 0 || parseInt(totalSlots) > 200) { setSlotsError('Slots must be between 1 and 200'); isValid = false; }
    else setSlotsError('');

    if (!latitude || !longitude) { setLocationError('Please select location on the map'); isValid = false; }
    else setLocationError('');

    return isValid;
  };

  const generateSlots = (facilityId: string, total: number, perSection: number) => {
    const slots: any[] = [];
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

  const useMyLocation = async () => {
    if (isFromAgreement) {
      Alert.alert(
        'Location Locked',
        'This facility is being built on rented land. Location is fixed by the rental agreement and cannot be changed.'
      );
      return;
    }
    setIsGettingLocation(true);
    setLocationError('');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to use your current location.');
        setIsGettingLocation(false);
        return;
      }
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude: lat, longitude: lng } = location.coords;
      const reverseGeocode = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      let formattedAddress = address;
      if (reverseGeocode[0]) {
        formattedAddress = [
          reverseGeocode[0].name,
          reverseGeocode[0].street,
          reverseGeocode[0].district,
          reverseGeocode[0].city,
        ].filter(Boolean).join(', ');
      }
      setLatitude(lat);
      setLongitude(lng);
      setAddress(formattedAddress || `${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      if (mapRef.current) {
        mapRef.current.animateToRegion({ latitude: lat, longitude: lng, latitudeDelta: 0.012, longitudeDelta: 0.012 });
      } else {
        setIsMapExpanded(true);
      }
      Alert.alert('Location Updated', 'Your current location has been set.');
    } catch (error: any) {
      Alert.alert('Error', 'Failed to get current location. Please pick manually on the map.');
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleMapPress = (event: any) => {
    // If from agreement, location is locked - don't allow changes
    if (isFromAgreement) return;

    const { latitude: lat, longitude: lng } = event.nativeEvent.coordinate;
    setLatitude(lat);
    setLongitude(lng);
    Location.reverseGeocodeAsync({ latitude: lat, longitude: lng })
      .then((result) => {
        if (result[0]) {
          const addr = [result[0].name, result[0].street, result[0].city].filter(Boolean).join(', ');
          if (addr) setAddress(addr);
        }
      })
      .catch(() => {});
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

      // If from agreement, double-check the agreement still exists & belongs to this user
      if (isFromAgreement) {
        const { data: ag, error: agErr } = await supabase
          .from('land_agreements')
          .select('id, status, parking_owner_id')
          .eq('id', agreementId)
          .single();

        if (agErr || !ag) {
          Alert.alert('Error', 'Could not find the rental agreement.');
          setIsSubmitting(false);
          return;
        }
        if (ag.parking_owner_id !== user.id) {
          Alert.alert('Error', 'This agreement does not belong to you.');
          setIsSubmitting(false);
          return;
        }
        if (ag.status !== 'active') {
          Alert.alert('Error', 'This agreement is no longer active.');
          setIsSubmitting(false);
          return;
        }
      }

      const { data: facility, error: facilityError } = await supabase
        .from('parking_facilities')
        .insert({
          owner_id: user.id,
          name: name.trim(),
          address: address.trim(),
          latitude,
          longitude,
          total_slots: parseInt(totalSlots),
          price_per_hour: parseFloat(pricePerHour),
          amenities: selectedAmenities,
          photos: [],

          // Admin approval flow
          approval_status: 'pending',
          is_active: false,

          // ✅ Link to land agreement when building on rented land
          ...(agreementId ? { land_agreement_id: agreementId } : {}),
        })
        .select()
        .single();

      if (facilityError) {
        // Surface unique-constraint error nicely
        if (facilityError.message?.includes('unique_land_agreement_per_facility')) {
          Alert.alert(
            'Already Built',
            'A facility has already been created on this rented land. Only one facility per agreement is allowed.'
          );
          setIsSubmitting(false);
          return;
        }
        Alert.alert('Error', 'Failed to create facility: ' + facilityError.message);
        setIsSubmitting(false);
        return;
      }

      const slotsData = generateSlots(
        facility.id,
        parseInt(totalSlots),
        parseInt(slotsPerSection) || 5
      );

      console.log(`Attempting to insert ${slotsData.length} slots...`);

      const { error: slotsError } = await supabase
        .from('parking_slots')
        .insert(slotsData);

      if (slotsError) {
        Alert.alert(
          'Submitted for Approval',
          `Facility "${name.trim()}" was submitted for admin approval.\n\nBut slots could not be generated automatically.\n\nError: ${slotsError.message}`,
          [{ text: 'OK', onPress: () => router.back() }]
        );
        setIsSubmitting(false);
        return;
      }

      Alert.alert(
        'Submitted for Approval',
        `${name.trim()} has been submitted and is waiting for admin approval.${
          isFromAgreement ? '\n\nLinked to your rental agreement.' : ''
        }`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
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
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isFromAgreement ? 'Build on Rented Land' : 'Add New Facility'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Rented Land Banner */}
      {isFromAgreement && (
        <View style={styles.rentedBanner}>
          <Ionicons name="leaf" size={16} color="#15803D" />
          <Text style={styles.rentedBannerText}>
            Building on rented land — address & location are locked from your agreement
          </Text>
        </View>
      )}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

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
            {['4', '5', '6', '8', '10'].map((n) => (
              <TouchableOpacity
                key={n}
                style={[styles.slotOption, slotsPerSection === n && styles.slotOptionActive]}
                onPress={() => setSlotsPerSection(n)}
              >
                <Text style={[styles.slotOptionText, slotsPerSection === n && styles.slotOptionTextActive]}>{n}</Text>
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
            {AMENITY_OPTIONS.map((amenity) => (
              <TouchableOpacity
                key={amenity.key}
                style={[styles.amenityChip, selectedAmenities.includes(amenity.key) && styles.amenityChipActive]}
                onPress={() => toggleAmenity(amenity.key)}
                disabled={isSubmitting}
              >
                <Ionicons
                  name={amenity.icon as any}
                  size={18}
                  color={selectedAmenities.includes(amenity.key) ? '#FFFFFF' : '#6B7280'}
                />
                <Text style={[styles.amenityChipText, selectedAmenities.includes(amenity.key) && styles.amenityChipTextActive]}>
                  {amenity.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── COMBINED LOCATION SECTION ── */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>
            Location *
            {isFromAgreement && (
              <Text style={styles.lockedLabel}>  🔒 Locked</Text>
            )}
          </Text>

          <View style={[styles.locationCard, locationError || addressError ? styles.locationCardError : null]}>

            {/* Map toggle row */}
            <TouchableOpacity
              style={styles.mapToggleRow}
              onPress={() => setIsMapExpanded(!isMapExpanded)}
            >
              <View style={styles.mapToggleLeft}>
                <View style={[styles.mapPinDot, latitude && longitude ? styles.mapPinDotActive : null]} />
                <Text style={styles.mapToggleText}>
                  {latitude && longitude
                    ? (isFromAgreement ? 'Location set by agreement' : 'Location pinned on map')
                    : 'Tap to pick on map'}
                </Text>
              </View>
              <Ionicons name={isMapExpanded ? 'chevron-up' : 'chevron-down'} size={18} color="#6B7280" />
            </TouchableOpacity>

            {/* Map */}
            {isMapExpanded && (
              <View style={styles.mapContainer}>
                <MapView
                  ref={mapRef}
                  provider={PROVIDER_GOOGLE}
                  style={styles.map}
                  initialRegion={
                    latitude && longitude
                      ? { latitude, longitude, latitudeDelta: 0.012, longitudeDelta: 0.012 }
                      : KATHMANDU_REGION
                  }
                  onPress={handleMapPress}
                  showsUserLocation={!isFromAgreement}
                  showsMyLocationButton={!isFromAgreement}
                >
                  {latitude && longitude && (
                    <Marker
                      coordinate={{ latitude: latitude!, longitude: longitude! }}
                      draggable={!isFromAgreement}
                      onDragEnd={(e) => {
                        if (isFromAgreement) return;
                        setLatitude(e.nativeEvent.coordinate.latitude);
                        setLongitude(e.nativeEvent.coordinate.longitude);
                      }}
                      pinColor={isFromAgreement ? '#22C55E' : 'red'}
                    />
                  )}
                </MapView>

                {latitude && longitude && (
                  <View style={styles.coordinatesChip}>
                    <Text style={styles.coordinatesText}>
                      {latitude.toFixed(5)}, {longitude.toFixed(5)}
                    </Text>
                  </View>
                )}

                {!isFromAgreement && (
                  <View style={styles.mapActions}>
                    <TouchableOpacity style={styles.mapButton} onPress={useMyLocation} disabled={isGettingLocation}>
                      {isGettingLocation ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <>
                          <Ionicons name="locate" size={16} color="#fff" />
                          <Text style={styles.mapButtonText}>Use My Location</Text>
                        </>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.mapButton, { backgroundColor: '#22C55E' }]} onPress={() => setIsMapExpanded(false)}>
                      <Ionicons name="checkmark" size={16} color="#fff" />
                      <Text style={styles.mapButtonText}>Done</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {isFromAgreement && (
                  <View style={[styles.mapActions, { justifyContent: 'center' }]}>
                    <TouchableOpacity style={[styles.mapButton, { backgroundColor: '#22C55E', flex: 0, paddingHorizontal: 24 }]} onPress={() => setIsMapExpanded(false)}>
                      <Ionicons name="checkmark" size={16} color="#fff" />
                      <Text style={styles.mapButtonText}>Done</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {/* Divider */}
            <View style={styles.locationDivider} />

            {/* Address input */}
            <View style={styles.addressRow}>
              <Ionicons name="location-outline" size={18} color="#9CA3AF" style={{ marginTop: 1 }} />
              <TextInput
                style={[
                  styles.addressInput,
                  isFromAgreement && { color: '#6B7280' },
                ]}
                placeholder="Address will fill from map, or type manually"
                placeholderTextColor="#9CA3AF"
                value={address}
                onChangeText={(t) => { setAddress(t); if (addressError) setAddressError(''); }}
                editable={!isSubmitting && !isFromAgreement}
                multiline
              />
              {isFromAgreement && (
                <Ionicons name="lock-closed" size={14} color="#9CA3AF" style={{ marginTop: 3 }} />
              )}
            </View>
          </View>

          {/* Errors */}
          {locationError ? <Text style={styles.errorText}>{locationError}</Text> : null}
          {addressError ? <Text style={styles.errorText}>{addressError}</Text> : null}
        </View>
        {/* ─────────────────────────────── */}

        {/* Summary Card */}
        {(name.trim() || address.trim() || pricePerHour || totalSlots) && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Summary</Text>
            {isFromAgreement && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Land</Text>
                <Text style={[styles.summaryValue, { color: '#22C55E' }]}>Rented (linked)</Text>
              </View>
            )}
            {name.trim() && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Name</Text>
                <Text style={styles.summaryValue}>{name.trim()}</Text>
              </View>
            )}
            {address.trim() && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Address</Text>
                <Text style={styles.summaryValue}>{address.trim()}</Text>
              </View>
            )}
            {pricePerHour && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Price</Text>
                <Text style={styles.summaryValue}>Rs {pricePerHour}/hr</Text>
              </View>
            )}
            {totalSlots && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Slots</Text>
                <Text style={styles.summaryValue}>{totalSlots} slots</Text>
              </View>
            )}
            {latitude && longitude && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Location</Text>
                <Text style={styles.summaryValue}>{latitude.toFixed(4)}, {longitude.toFixed(4)}</Text>
              </View>
            )}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Amenities</Text>
              <Text style={styles.summaryValue}>{selectedAmenities.length > 0 ? selectedAmenities.join(', ') : 'None'}</Text>
            </View>
          </View>
        )}

        <View style={{ height: 140 }} />
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
              <Text style={[styles.submitButtonText, { marginLeft: 10 }]}>Submitting...</Text>
            </>
          ) : (
            <>
              <Ionicons name="add-circle" size={22} color="#fff" />
              <Text style={styles.submitButtonText}>
                {isFromAgreement ? 'BUILD FACILITY' : 'CREATE FACILITY'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },

  // Rented land banner
  rentedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#BBF7D0',
  },
  rentedBannerText: {
    fontSize: 12,
    color: '#15803D',
    flex: 1,
    fontWeight: '600',
  },

  content: { flex: 1, paddingHorizontal: 20, paddingTop: 24 },

  fieldGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  lockedLabel: { fontSize: 12, fontWeight: '500', color: '#9CA3AF' },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
  },
  inputError: { borderColor: '#DC2626', backgroundColor: '#FEF2F2' },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: '#111827' },
  rsPrefix: { fontSize: 15, fontWeight: '600', color: '#6B7280', marginRight: 8 },
  errorText: { color: '#DC2626', fontSize: 12, marginTop: 4, paddingLeft: 4 },
  row: { flexDirection: 'row' },

  slotOptions: { flexDirection: 'row', gap: 10 },
  slotOption: {
    width: 48, height: 48, borderRadius: 12,
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB',
    justifyContent: 'center', alignItems: 'center',
  },
  slotOptionActive: { backgroundColor: '#22C55E', borderColor: '#22C55E' },
  slotOptionText: { fontSize: 16, fontWeight: '600', color: '#6B7280' },
  slotOptionTextActive: { color: '#FFFFFF' },
  slotPreview: { fontSize: 13, color: '#22C55E', marginTop: 10, fontWeight: '500' },

  amenitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  amenityChip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 10, backgroundColor: '#FFFFFF',
    borderWidth: 1, borderColor: '#E5E7EB', gap: 6,
  },
  amenityChipActive: { backgroundColor: '#22C55E', borderColor: '#22C55E' },
  amenityChipText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  amenityChipTextActive: { color: '#FFFFFF' },

  locationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  locationCardError: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  mapToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  mapToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mapPinDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#D1D5DB',
  },
  mapPinDotActive: {
    backgroundColor: '#22C55E',
  },
  mapToggleText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  mapContainer: {
    height: 280,
    position: 'relative',
  },
  map: {
    height: '100%',
    width: '100%',
  },
  coordinatesChip: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  coordinatesText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '500',
  },
  mapActions: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    gap: 10,
  },
  mapButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  mapButtonText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  locationDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 14,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  addressInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    lineHeight: 20,
    minHeight: 40,
  },

  summaryCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16,
    padding: 20, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 20,
  },
  summaryTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 16 },
  summaryRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  summaryLabel: { fontSize: 13, color: '#6B7280' },
  summaryValue: { fontSize: 13, fontWeight: '600', color: '#111827', maxWidth: '60%', textAlign: 'right' },

  footer: {
    backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingVertical: 16,
    borderTopWidth: 1, borderTopColor: '#E5E7EB',
  },
  submitButton: {
    flexDirection: 'row', backgroundColor: '#22C55E',
    height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center', gap: 8,
    shadowColor: '#22C55E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  submitButtonDisabled: { opacity: 0.7 },
  submitButtonText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.5 },
});

//before

// import { Ionicons } from '@expo/vector-icons';
// import { router, useLocalSearchParams } from 'expo-router';
// import React, { useEffect, useState } from 'react';
// import {
//   ActivityIndicator,
//   Alert,
//   Modal,
//   RefreshControl,
//   ScrollView,
//   Switch,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View
// } from 'react-native';
// import { supabase } from '../../../lib/supabase';
// import { styles } from './[id].styles';

// type Slot = {
//   id: string;
//   slot_number: string;
//   section: string;
//   is_available: boolean;
//   is_occupied: boolean;
//   current_booking_id: string | null;
//   current_booking?: {
//     booking_reference: string;
//     vehicle_plate: string;
//     customer_name: string;
//     start_time: string;
//     end_time: string;
//     booking_date: string;
//     total_amount: number;
//   };
// };

// const DURATION_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8];

// export default function SlotManager() {
//   const params = useLocalSearchParams();
//   const facilityId = params.id as string;

//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [facilityName, setFacilityName] = useState('');
//   const [facilityOwnerId, setFacilityOwnerId] = useState<string>('');
//   const [pricePerHour, setPricePerHour] = useState<number>(0);
//   const [slots, setSlots] = useState<Slot[]>([]);
//   const [sections, setSections] = useState<string[]>([]);
//   const [selectedSection, setSelectedSection] = useState('');
//   const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
//   const [showSlotModal, setShowSlotModal] = useState(false);
//   const [maintenanceMode, setMaintenanceMode] = useState(false);

//   // Walk-in state
//   const [showWalkInModal, setShowWalkInModal] = useState(false);
//   const [showSlotPickerModal, setShowSlotPickerModal] = useState(false);
//   const [walkInSlot, setWalkInSlot] = useState<Slot | null>(null);
//   const [guestName, setGuestName] = useState('');
//   const [guestPhone, setGuestPhone] = useState('');
//   const [guestPlate, setGuestPlate] = useState('');
//   const [walkInDuration, setWalkInDuration] = useState<number>(1);
//   const [walkInPaid, setWalkInPaid] = useState<boolean>(true);
//   const [creatingWalkIn, setCreatingWalkIn] = useState(false);

//   useEffect(() => {
//     fetchFacilityData();
//   }, [facilityId]);

//   const fetchFacilityData = async () => {
//     try {
//       setLoading(true);

//       // Get facility name + owner + price
//       const { data: facility } = await supabase
//         .from('parking_facilities')
//         .select('name, owner_id, price_per_hour')
//         .eq('id', facilityId)
//         .single();

//       if (facility) {
//         setFacilityName(facility.name);
//         setFacilityOwnerId((facility as any).owner_id);
//         setPricePerHour(Number((facility as any).price_per_hour) || 0);
//       }

//       // Get all slots for this facility
//       const { data: slotsData, error } = await supabase
//         .from('parking_slots')
//         .select('*')
//         .eq('facility_id', facilityId)
//         .order('slot_number', { ascending: true });

//       if (error) throw error;

//       if (slotsData) {
//         setSlots(slotsData);

//         // Extract unique sections
//         const uniqueSections = [...new Set(slotsData.map(s => s.section || 'A'))].sort();
//         setSections(uniqueSections);
//         if (uniqueSections.length > 0 && !selectedSection) {
//           setSelectedSection(uniqueSections[0]);
//         }
//       }
//     } catch (error) {
//       console.error('Error fetching facility data:', error);
//       Alert.alert('Error', 'Failed to load slots');
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   };

//   const onRefresh = () => {
//     setRefreshing(true);
//     fetchFacilityData();
//   };

//   const handleSlotPress = async (slot: Slot) => {
//     if (slot.is_occupied && slot.current_booking_id) {
//       // Fetch real booking details for this slot
//       try {
//         const { data: booking } = await supabase
//           .from('bookings')
//           .select(`
//             booking_reference,
//             start_time,
//             end_time,
//             booking_date,
//             total_amount,
//             is_walkin,
//             guest_name,
//             guest_plate,
//             vehicles (plate_number),
//             profiles (full_name)
//           `)
//           .eq('id', slot.current_booking_id)
//           .single();

//         if (booking) {
//           const b: any = booking;
//           setSelectedSlot({
//             ...slot,
//             current_booking: {
//               booking_reference: b.booking_reference,
//               vehicle_plate: b.is_walkin ? (b.guest_plate || 'N/A') : (b.vehicles?.plate_number || 'N/A'),
//               customer_name: b.is_walkin ? (b.guest_name || 'Walk-in Guest') : (b.profiles?.full_name || 'Guest'),
//               start_time: b.start_time,
//               end_time: b.end_time,
//               booking_date: b.booking_date,
//               total_amount: b.total_amount,
//             },
//           });
//         } else {
//           setSelectedSlot(slot);
//         }
//       } catch (error) {
//         console.error('Error fetching booking:', error);
//         setSelectedSlot(slot);
//       }
//     } else {
//       setSelectedSlot(slot);
//     }

//     setShowSlotModal(true);
//   };

//   const handleReleaseSlot = async () => {
//     if (!selectedSlot) return;

//     Alert.alert(
//       'Release Slot',
//       `Are you sure you want to release slot ${selectedSlot.slot_number}?`,
//       [
//         { text: 'Cancel', style: 'cancel' },
//         {
//           text: 'Release',
//           style: 'destructive',
//           onPress: async () => {
//             try {
//               // Update slot in DB
//               const { error: slotError } = await supabase
//                 .from('parking_slots')
//                 .update({
//                   is_available: true,
//                   is_occupied: false,
//                   current_booking_id: null,
//                 })
//                 .eq('id', selectedSlot.id);

//               if (slotError) throw slotError;

//               // If there was a booking, mark it as completed
//               if (selectedSlot.current_booking_id) {
//                 await supabase
//                   .from('bookings')
//                   .update({
//                     booking_status: 'completed',
//                     is_timer_active: false,
//                     actual_end_time: new Date().toISOString(),
//                   })
//                   .eq('id', selectedSlot.current_booking_id);
//               }

//               // Update local state
//               setSlots(prev =>
//                 prev.map(s =>
//                   s.id === selectedSlot.id
//                     ? { ...s, is_available: true, is_occupied: false, current_booking_id: null }
//                     : s
//                 )
//               );

//               setShowSlotModal(false);
//               Alert.alert('Success', `Slot ${selectedSlot.slot_number} released`);
//             } catch (error: any) {
//               console.error('Release error:', error);
//               Alert.alert('Error', 'Failed to release slot');
//             }
//           },
//         },
//       ]
//     );
//   };

//   const handleToggleAvailability = async () => {
//     if (!selectedSlot || selectedSlot.is_occupied) return;

//     try {
//       const newAvailability = !selectedSlot.is_available;

//       const { error } = await supabase
//         .from('parking_slots')
//         .update({ is_available: newAvailability })
//         .eq('id', selectedSlot.id);

//       if (error) throw error;

//       // Update local state
//       setSlots(prev =>
//         prev.map(s =>
//           s.id === selectedSlot.id
//             ? { ...s, is_available: newAvailability }
//             : s
//         )
//       );

//       setSelectedSlot(prev => prev ? { ...prev, is_available: newAvailability } : null);

//       Alert.alert('Success', `Slot ${selectedSlot.slot_number} ${newAvailability ? 'enabled' : 'disabled'}`);
//     } catch (error) {
//       console.error('Toggle error:', error);
//       Alert.alert('Error', 'Failed to update slot');
//     }
//   };

//   const formatTime = (time: string) => {
//     const parts = time.split(':');
//     const hours = parseInt(parts[0]);
//     const minutes = parts[1];
//     const ampm = hours >= 12 ? 'PM' : 'AM';
//     const displayHours = hours % 12 || 12;
//     return `${displayHours}:${minutes} ${ampm}`;
//   };

//   const calculateTimeLeft = (endTime: string, bookingDate: string) => {
//     const end = new Date(`${bookingDate}T${endTime}`);
//     const now = new Date();
//     const diffMs = end.getTime() - now.getTime();

//     if (diffMs <= 0) return 'Expired';

//     const diffMins = Math.floor(diffMs / 60000);
//     if (diffMins < 60) return `${diffMins}m left`;

//     const hours = Math.floor(diffMins / 60);
//     const mins = diffMins % 60;
//     return `${hours}h ${mins}m left`;
//   };

//   // ===== Walk-in handlers =====

//   const resetWalkInForm = () => {
//     setGuestName('');
//     setGuestPhone('');
//     setGuestPlate('');
//     setWalkInDuration(1);
//     setWalkInPaid(true);
//   };

//   const openWalkInFromTop = () => {
//     // From top button: pick a slot first
//     setShowSlotPickerModal(true);
//   };

//   const openWalkInFromModal = () => {
//     // From slot modal: slot already chosen
//     if (!selectedSlot) return;
//     setWalkInSlot(selectedSlot);
//     setShowSlotModal(false);
//     resetWalkInForm();
//     setShowWalkInModal(true);
//   };

//   const pickWalkInSlot = (slot: Slot) => {
//     setWalkInSlot(slot);
//     setShowSlotPickerModal(false);
//     resetWalkInForm();
//     setShowWalkInModal(true);
//   };

//   const handleCreateWalkIn = async () => {
//     if (!walkInSlot) return;

//     // Validate
//     if (!guestName.trim()) {
//       Alert.alert('Missing Info', 'Please enter guest name');
//       return;
//     }
//     if (!guestPlate.trim()) {
//       Alert.alert('Missing Info', 'Please enter vehicle plate');
//       return;
//     }
//     if (!facilityOwnerId) {
//       Alert.alert('Error', 'Facility owner not loaded, try refreshing');
//       return;
//     }

//     try {
//       setCreatingWalkIn(true);

//       // Compute times
//       const now = new Date();
//       const end = new Date(now.getTime() + walkInDuration * 60 * 60 * 1000);

//       const pad = (n: number) => n.toString().padStart(2, '0');
//       const bookingDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
//       const startTime = `${pad(now.getHours())}:${pad(now.getMinutes())}:00`;
//       const endTime = `${pad(end.getHours())}:${pad(end.getMinutes())}:00`;

//       const basePrice = walkInDuration * pricePerHour;
//       const totalAmount = basePrice;

//       const bookingRef = `WI-${Date.now().toString().slice(-8)}`;

//       // 1. Insert booking
//       const { data: newBooking, error: bookingError } = await supabase
//         .from('bookings')
//         .insert({
//           user_id: facilityOwnerId, // owner books on behalf of guest
//           facility_id: facilityId,
//           slot_id: walkInSlot.id,
//           vehicle_id: null, // walk-in has no vehicle row
//           booking_reference: bookingRef,
//           booking_date: bookingDate,
//           start_time: startTime,
//           end_time: endTime,
//           actual_start_time: now.toISOString(),
//           duration_hours: walkInDuration,
//           base_price: basePrice,
//           service_fee: 0,
//           total_amount: totalAmount,
//           payment_method: 'cash',
//           payment_status: walkInPaid ? 'paid' : 'pending',
//           booking_status: 'confirmed',
//           is_timer_active: true,
//           is_walkin: true,
//           guest_name: guestName.trim(),
//           guest_phone: guestPhone.trim() || null,
//           guest_plate: guestPlate.trim().toUpperCase(),
//         })
//         .select()
//         .single();

//       if (bookingError) throw bookingError;

//       // 2. Mark slot occupied
//       const { error: slotError } = await supabase
//         .from('parking_slots')
//         .update({
//           is_occupied: true,
//           is_available: false,
//           current_booking_id: newBooking.id,
//         })
//         .eq('id', walkInSlot.id);

//       if (slotError) throw slotError;

//       // 3. Update local state
//       setSlots(prev =>
//         prev.map(s =>
//           s.id === walkInSlot.id
//             ? { ...s, is_occupied: true, is_available: false, current_booking_id: newBooking.id }
//             : s
//         )
//       );

//       setShowWalkInModal(false);
//       setWalkInSlot(null);
//       Alert.alert(
//         'Walk-in Booked',
//         `Slot ${walkInSlot.slot_number} occupied for ${guestName}\nRef: ${bookingRef}\nPayment: ${walkInPaid ? 'PAID' : 'PENDING'}`
//       );
//     } catch (error: any) {
//       console.error('Walk-in error:', error);
//       Alert.alert('Error', error.message || 'Failed to create walk-in booking');
//     } finally {
//       setCreatingWalkIn(false);
//     }
//   };

//   // Filter slots by selected section
//   const filteredSlots = slots.filter(s => (s.section || 'A') === selectedSection);

//   // Available slots for picker
//   const availableSlotsForPicker = slots.filter(s => s.is_available && !s.is_occupied);

//   // Calculate stats from real data
//   const totalSlots = slots.length;
//   const occupiedSlots = slots.filter(s => s.is_occupied).length;
//   const availableSlots = slots.filter(s => s.is_available && !s.is_occupied).length;
//   const occupancyPercentage = totalSlots > 0 ? Math.round((occupiedSlots / totalSlots) * 100) : 0;

//   const getSlotStyle = (slot: Slot) => {
//     if (!slot.is_available && !slot.is_occupied) return styles.slotInactive;
//     if (slot.is_occupied) return styles.slotOccupied;
//     if (selectedSlot?.id === slot.id) return styles.slotSelected;
//     return styles.slotAvailable;
//   };

//   const getSlotBorderStyle = (slot: Slot) => {
//     if (!slot.is_available && !slot.is_occupied) return styles.slotBorderInactive;
//     if (slot.is_occupied) return styles.slotBorderOccupied;
//     if (selectedSlot?.id === slot.id) return styles.slotBorderSelected;
//     return styles.slotBorderAvailable;
//   };

//   if (loading) {
//     return (
//       <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' }}>
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
//         <View style={styles.headerCenter}>
//           <Text style={styles.headerTitle}>Slot Manager</Text>
//           <Text style={styles.headerSubtitle}>{facilityName}</Text>
//         </View>
//         <TouchableOpacity onPress={onRefresh}>
//           <Ionicons name="refresh-outline" size={24} color="#111827" />
//         </TouchableOpacity>
//       </View>

//       <ScrollView
//         style={styles.content}
//         showsVerticalScrollIndicator={false}
//         refreshControl={
//           <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22C55E" />
//         }
//       >
//         {/* Walk-in Booking Button */}
//         <TouchableOpacity style={styles.walkInButton} onPress={openWalkInFromTop}>
//           <Ionicons name="add-circle" size={24} color="#FFFFFF" />
//           <Text style={styles.walkInButtonText}>WALK-IN BOOKING</Text>
//         </TouchableOpacity>

//         {/* Stats Row */}
//         <View style={styles.statsRow}>
//           <View style={styles.statBox}>
//             <Text style={styles.statLabel}>TOTAL</Text>
//             <Text style={styles.statValue}>{totalSlots}</Text>
//           </View>
//           <View style={styles.statBox}>
//             <Text style={styles.statLabel}>OCCUPIED</Text>
//             <Text style={[styles.statValue, { color: '#EF4444' }]}>{occupiedSlots}</Text>
//             <Text style={styles.statPercentage}>{occupancyPercentage}%</Text>
//           </View>
//           <View style={styles.statBox}>
//             <Text style={styles.statLabel}>AVAILABLE</Text>
//             <Text style={[styles.statValue, { color: '#22C55E' }]}>{availableSlots}</Text>
//           </View>
//         </View>

//         {/* Legend */}
//         <View style={styles.legend}>
//           <View style={styles.legendItem}>
//             <View style={[styles.legendBox, { backgroundColor: '#D1FAE5', borderColor: '#22C55E' }]} />
//             <Text style={styles.legendText}>Available</Text>
//           </View>
//           <View style={styles.legendItem}>
//             <View style={[styles.legendBox, { backgroundColor: '#FEE2E2', borderColor: '#EF4444' }]} />
//             <Text style={styles.legendText}>Occupied</Text>
//           </View>
//           <View style={styles.legendItem}>
//             <View style={[styles.legendBox, { backgroundColor: '#DBEAFE', borderColor: '#3B82F6' }]} />
//             <Text style={styles.legendText}>Selected</Text>
//           </View>
//           <View style={styles.legendItem}>
//             <View style={[styles.legendBox, { backgroundColor: '#F3F4F6', borderColor: '#9CA3AF' }]} />
//             <Text style={styles.legendText}>Inactive</Text>
//           </View>
//         </View>

//         {/* Section Selector (dynamic from DB) */}
//         {sections.length > 1 && (
//           <View style={styles.floorSelector}>
//             <Text style={styles.floorLabel}>SECTION</Text>
//             <View style={styles.floorTabs}>
//               {sections.map((section) => (
//                 <TouchableOpacity
//                   key={section}
//                   style={[styles.floorTab, selectedSection === section && styles.floorTabActive]}
//                   onPress={() => setSelectedSection(section)}
//                 >
//                   <Text style={[styles.floorTabText, selectedSection === section && styles.floorTabTextActive]}>
//                     Section {section}
//                   </Text>
//                 </TouchableOpacity>
//               ))}
//             </View>
//           </View>
//         )}

//         {/* Slot Grid */}
//         <View style={styles.slotGrid}>
//           {filteredSlots.map((slot) => (
//             <TouchableOpacity
//               key={slot.id}
//               style={[styles.slotBox, getSlotStyle(slot), getSlotBorderStyle(slot)]}
//               onPress={() => handleSlotPress(slot)}
//             >
//               <Text style={[
//                 styles.slotText,
//                 slot.is_occupied && styles.slotTextOccupied,
//                 selectedSlot?.id === slot.id && styles.slotTextSelected,
//                 !slot.is_available && !slot.is_occupied && { color: '#9CA3AF' },
//               ]}>
//                 {slot.slot_number}
//               </Text>
//             </TouchableOpacity>
//           ))}
//         </View>

//         {filteredSlots.length === 0 && (
//           <View style={{ alignItems: 'center', paddingVertical: 40 }}>
//             <Ionicons name="grid-outline" size={48} color="#D1D5DB" />
//             <Text style={{ color: '#9CA3AF', marginTop: 12 }}>No slots in this section</Text>
//           </View>
//         )}

//         <View style={{ height: 100 }} />
//       </ScrollView>

//       {/* Slot Details Modal */}
//       <Modal
//         visible={showSlotModal}
//         transparent
//         animationType="slide"
//         onRequestClose={() => setShowSlotModal(false)}
//       >
//         <View style={styles.modalOverlay}>
//           <View style={styles.modalContent}>
//             {/* Modal Header */}
//             <View style={styles.modalHeader}>
//               <View style={styles.modalSlotInfo}>
//                 <View style={[
//                   styles.modalSlotIcon,
//                   selectedSlot?.is_occupied ? styles.slotOccupied : styles.slotAvailable,
//                   selectedSlot?.is_occupied ? styles.slotBorderOccupied : styles.slotBorderAvailable,
//                 ]}>
//                   <Text style={[
//                     styles.modalSlotNumber,
//                     selectedSlot?.is_occupied && styles.slotTextOccupied,
//                   ]}>
//                     {selectedSlot?.slot_number}
//                   </Text>
//                 </View>
//                 <View>
//                   <Text style={styles.modalSlotTitle}>Slot {selectedSlot?.slot_number}</Text>
//                   <Text style={[
//                     styles.modalSlotStatus,
//                     selectedSlot?.is_occupied ? { color: '#EF4444' } : { color: '#22C55E' },
//                   ]}>
//                     {selectedSlot?.is_occupied ? 'OCCUPIED' : selectedSlot?.is_available ? 'AVAILABLE' : 'INACTIVE'}
//                   </Text>
//                 </View>
//               </View>
//               <TouchableOpacity onPress={() => setShowSlotModal(false)}>
//                 <Ionicons name="close" size={24} color="#6B7280" />
//               </TouchableOpacity>
//             </View>

//             {/* Modal Body — Occupied Slot */}
//             {selectedSlot?.is_occupied && selectedSlot.current_booking ? (
//               <>
//                 <View style={styles.modalRow}>
//                   <Text style={styles.modalLabel}>BOOKING REF</Text>
//                   <Text style={styles.modalValue}>{selectedSlot.current_booking.booking_reference}</Text>
//                 </View>
//                 <View style={styles.modalRow}>
//                   <Text style={styles.modalLabel}>CUSTOMER</Text>
//                   <Text style={styles.modalValue}>{selectedSlot.current_booking.customer_name}</Text>
//                 </View>
//                 <View style={styles.modalRow}>
//                   <Text style={styles.modalLabel}>VEHICLE</Text>
//                   <Text style={styles.modalValue}>{selectedSlot.current_booking.vehicle_plate}</Text>
//                 </View>
//                 <View style={styles.modalRow}>
//                   <Text style={styles.modalLabel}>TIME</Text>
//                   <Text style={styles.modalValue}>
//                     {formatTime(selectedSlot.current_booking.start_time)} - {formatTime(selectedSlot.current_booking.end_time)}
//                   </Text>
//                 </View>
//                 <View style={styles.modalRow}>
//                   <Text style={styles.modalLabel}>TIME LEFT</Text>
//                   <Text style={[styles.modalValue, { color: '#22C55E', fontWeight: '700' }]}>
//                     {calculateTimeLeft(selectedSlot.current_booking.end_time, selectedSlot.current_booking.booking_date)}
//                   </Text>
//                 </View>
//                 <View style={styles.modalRow}>
//                   <Text style={styles.modalLabel}>AMOUNT</Text>
//                   <Text style={[styles.modalValue, { fontWeight: '700' }]}>
//                     Rs {selectedSlot.current_booking.total_amount}
//                   </Text>
//                 </View>

//                 {/* Action Buttons */}
//                 <View style={styles.modalActions}>
//                   <TouchableOpacity style={styles.releaseButton} onPress={handleReleaseSlot}>
//                     <Text style={styles.releaseButtonText}>RELEASE SLOT</Text>
//                   </TouchableOpacity>
//                   <TouchableOpacity style={styles.notifyButton} onPress={() => {
//                     Alert.alert('Notification Sent', 'Customer has been notified');
//                     setShowSlotModal(false);
//                   }}>
//                     <Text style={styles.notifyButtonText}>NOTIFY USER</Text>
//                   </TouchableOpacity>
//                 </View>
//               </>
//             ) : (
//               /* Modal Body — Available/Inactive Slot */
//               <View style={styles.emptySlot}>
//                 <Text style={styles.emptySlotText}>
//                   {selectedSlot?.is_available ? 'This slot is available' : 'This slot is inactive'}
//                 </Text>

//                 <View style={styles.modalRow}>
//                   <Text style={styles.modalLabel}>MAINTENANCE MODE</Text>
//                   <Switch
//                     value={!selectedSlot?.is_available}
//                     onValueChange={handleToggleAvailability}
//                     trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
//                     thumbColor={!selectedSlot?.is_available ? '#22C55E' : '#F3F4F6'}
//                   />
//                 </View>

//                 {selectedSlot?.is_available && (
//                   <TouchableOpacity style={styles.walkInSmallButton} onPress={openWalkInFromModal}>
//                     <Text style={styles.walkInSmallButtonText}>Book for Walk-in</Text>
//                   </TouchableOpacity>
//                 )}
//               </View>
//             )}
//           </View>
//         </View>
//       </Modal>

//       {/* Slot Picker Modal (top button flow) */}
//       <Modal
//         visible={showSlotPickerModal}
//         transparent
//         animationType="slide"
//         onRequestClose={() => setShowSlotPickerModal(false)}
//       >
//         <View style={styles.modalOverlay}>
//           <View style={styles.modalContent}>
//             <View style={styles.modalHeader}>
//               <Text style={styles.modalSlotTitle}>Pick a Slot</Text>
//               <TouchableOpacity onPress={() => setShowSlotPickerModal(false)}>
//                 <Ionicons name="close" size={24} color="#6B7280" />
//               </TouchableOpacity>
//             </View>

//             {availableSlotsForPicker.length === 0 ? (
//               <View style={{ alignItems: 'center', paddingVertical: 30 }}>
//                 <Ionicons name="alert-circle-outline" size={48} color="#D1D5DB" />
//                 <Text style={{ color: '#9CA3AF', marginTop: 12 }}>No available slots</Text>
//               </View>
//             ) : (
//               <ScrollView style={{ maxHeight: 400 }}>
//                 <View style={styles.slotGrid}>
//                   {availableSlotsForPicker.map((slot) => (
//                     <TouchableOpacity
//                       key={slot.id}
//                       style={[styles.slotBox, styles.slotAvailable, styles.slotBorderAvailable]}
//                       onPress={() => pickWalkInSlot(slot)}
//                     >
//                       <Text style={styles.slotText}>{slot.slot_number}</Text>
//                     </TouchableOpacity>
//                   ))}
//                 </View>
//               </ScrollView>
//             )}
//           </View>
//         </View>
//       </Modal>

//       {/* Walk-in Form Modal */}
//       <Modal
//         visible={showWalkInModal}
//         transparent
//         animationType="slide"
//         onRequestClose={() => setShowWalkInModal(false)}
//       >
//         <View style={styles.modalOverlay}>
//           <View style={styles.modalContent}>
//             <View style={styles.modalHeader}>
//               <View>
//                 <Text style={styles.modalSlotTitle}>Walk-in Booking</Text>
//                 <Text style={styles.modalSlotStatus}>Slot {walkInSlot?.slot_number}</Text>
//               </View>
//               <TouchableOpacity onPress={() => setShowWalkInModal(false)}>
//                 <Ionicons name="close" size={24} color="#6B7280" />
//               </TouchableOpacity>
//             </View>

//             <ScrollView style={{ maxHeight: 500 }}>
//               {/* Guest Name */}
//               <View style={{ marginTop: 12 }}>
//                 <Text style={styles.modalLabel}>GUEST NAME *</Text>
//                 <TextInput
//                   value={guestName}
//                   onChangeText={setGuestName}
//                   placeholder="John Doe"
//                   placeholderTextColor="#9CA3AF"
//                   style={{
//                     borderWidth: 1,
//                     borderColor: '#E5E7EB',
//                     borderRadius: 8,
//                     padding: 12,
//                     marginTop: 6,
//                     fontSize: 15,
//                     color: '#111827',
//                   }}
//                 />
//               </View>

//               {/* Phone */}
//               <View style={{ marginTop: 12 }}>
//                 <Text style={styles.modalLabel}>PHONE</Text>
//                 <TextInput
//                   value={guestPhone}
//                   onChangeText={setGuestPhone}
//                   placeholder="98XXXXXXXX"
//                   placeholderTextColor="#9CA3AF"
//                   keyboardType="phone-pad"
//                   style={{
//                     borderWidth: 1,
//                     borderColor: '#E5E7EB',
//                     borderRadius: 8,
//                     padding: 12,
//                     marginTop: 6,
//                     fontSize: 15,
//                     color: '#111827',
//                   }}
//                 />
//               </View>

//               {/* Plate */}
//               <View style={{ marginTop: 12 }}>
//                 <Text style={styles.modalLabel}>VEHICLE PLATE *</Text>
//                 <TextInput
//                   value={guestPlate}
//                   onChangeText={setGuestPlate}
//                   placeholder="BA 1 PA 1234"
//                   placeholderTextColor="#9CA3AF"
//                   autoCapitalize="characters"
//                   style={{
//                     borderWidth: 1,
//                     borderColor: '#E5E7EB',
//                     borderRadius: 8,
//                     padding: 12,
//                     marginTop: 6,
//                     fontSize: 15,
//                     color: '#111827',
//                   }}
//                 />
//               </View>

//               {/* Duration picker */}
//               <View style={{ marginTop: 16 }}>
//                 <Text style={styles.modalLabel}>DURATION</Text>
//                 <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
//                   {DURATION_OPTIONS.map((h) => {
//                     const active = walkInDuration === h;
//                     return (
//                       <TouchableOpacity
//                         key={h}
//                         onPress={() => setWalkInDuration(h)}
//                         style={{
//                           paddingHorizontal: 16,
//                           paddingVertical: 10,
//                           borderRadius: 8,
//                           borderWidth: 1,
//                           borderColor: active ? '#22C55E' : '#E5E7EB',
//                           backgroundColor: active ? '#D1FAE5' : '#FFFFFF',
//                         }}
//                       >
//                         <Text style={{
//                           color: active ? '#15803D' : '#374151',
//                           fontWeight: active ? '700' : '500',
//                         }}>
//                           {h}h
//                         </Text>
//                       </TouchableOpacity>
//                     );
//                   })}
//                 </View>
//               </View>

//               {/* Payment Status toggle */}
//               <View style={{ marginTop: 16 }}>
//                 <Text style={styles.modalLabel}>PAYMENT STATUS</Text>
//                 <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
//                   <TouchableOpacity
//                     onPress={() => setWalkInPaid(true)}
//                     style={{
//                       flex: 1,
//                       paddingVertical: 12,
//                       borderRadius: 8,
//                       borderWidth: 1,
//                       borderColor: walkInPaid ? '#22C55E' : '#E5E7EB',
//                       backgroundColor: walkInPaid ? '#D1FAE5' : '#FFFFFF',
//                       alignItems: 'center',
//                       flexDirection: 'row',
//                       justifyContent: 'center',
//                       gap: 6,
//                     }}
//                   >
//                     <Ionicons
//                       name="checkmark-circle"
//                       size={18}
//                       color={walkInPaid ? '#15803D' : '#9CA3AF'}
//                     />
//                     <Text style={{
//                       color: walkInPaid ? '#15803D' : '#374151',
//                       fontWeight: walkInPaid ? '700' : '500',
//                     }}>
//                       PAID
//                     </Text>
//                   </TouchableOpacity>

//                   <TouchableOpacity
//                     onPress={() => setWalkInPaid(false)}
//                     style={{
//                       flex: 1,
//                       paddingVertical: 12,
//                       borderRadius: 8,
//                       borderWidth: 1,
//                       borderColor: !walkInPaid ? '#F59E0B' : '#E5E7EB',
//                       backgroundColor: !walkInPaid ? '#FEF3C7' : '#FFFFFF',
//                       alignItems: 'center',
//                       flexDirection: 'row',
//                       justifyContent: 'center',
//                       gap: 6,
//                     }}
//                   >
//                     <Ionicons
//                       name="time-outline"
//                       size={18}
//                       color={!walkInPaid ? '#B45309' : '#9CA3AF'}
//                     />
//                     <Text style={{
//                       color: !walkInPaid ? '#B45309' : '#374151',
//                       fontWeight: !walkInPaid ? '700' : '500',
//                     }}>
//                       UNPAID
//                     </Text>
//                   </TouchableOpacity>
//                 </View>
//               </View>

//               {/* Total */}
//               <View style={[styles.modalRow, { marginTop: 16 }]}>
//                 <Text style={styles.modalLabel}>TOTAL</Text>
//                 <Text style={[styles.modalValue, { fontWeight: '700', fontSize: 18 }]}>
//                   Rs {walkInDuration * pricePerHour}
//                 </Text>
//               </View>

//               {/* Confirm */}
//               <TouchableOpacity
//                 onPress={handleCreateWalkIn}
//                 disabled={creatingWalkIn}
//                 style={{
//                   backgroundColor: creatingWalkIn ? '#9CA3AF' : '#22C55E',
//                   padding: 16,
//                   borderRadius: 10,
//                   alignItems: 'center',
//                   marginTop: 20,
//                   marginBottom: 10,
//                 }}
//               >
//                 {creatingWalkIn ? (
//                   <ActivityIndicator color="#FFFFFF" />
//                 ) : (
//                   <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15 }}>
//                     CONFIRM WALK-IN BOOKING
//                   </Text>
//                 )}
//               </TouchableOpacity>
//             </ScrollView>
//           </View>
//         </View>
//       </Modal>
//     </View>
//   );
// }

