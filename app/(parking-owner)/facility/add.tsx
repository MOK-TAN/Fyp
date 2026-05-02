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
// import * as Location from 'expo-location';
// import { router } from 'expo-router';
// import React, { useRef, useState } from 'react';
// import {
//   ActivityIndicator,
//   Alert,
//   KeyboardAvoidingView,
//   Platform,
//   ScrollView,
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
// } from 'react-native';
// import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
// import { supabase } from '../../../lib/supabase';

// const AMENITY_OPTIONS = [
//   { key: 'CCTV', icon: 'videocam', label: 'CCTV' },
//   { key: 'Covered', icon: 'umbrella', label: 'Covered' },
//   { key: '24/7', icon: 'time', label: '24/7' },
//   { key: 'Security', icon: 'shield-checkmark', label: 'Security' },
//   { key: 'EV Charging', icon: 'flash', label: 'EV Charging' },
//   { key: 'Wheelchair Access', icon: 'accessibility', label: 'Wheelchair' },
// ];

// const KATHMANDU_REGION = {
//   latitude: 27.7172,
//   longitude: 85.3240,
//   latitudeDelta: 0.05,
//   longitudeDelta: 0.05,
// };

// export default function AddFacility() {
//   const [name, setName] = useState('');
//   const [address, setAddress] = useState('');
//   const [pricePerHour, setPricePerHour] = useState('');
//   const [totalSlots, setTotalSlots] = useState('');
//   const [slotsPerSection, setSlotsPerSection] = useState('5');
//   const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   const [latitude, setLatitude] = useState<number | null>(null);
//   const [longitude, setLongitude] = useState<number | null>(null);
//   const [isMapExpanded, setIsMapExpanded] = useState(false);
//   const [isGettingLocation, setIsGettingLocation] = useState(false);

//   const [nameError, setNameError] = useState('');
//   const [addressError, setAddressError] = useState('');
//   const [priceError, setPriceError] = useState('');
//   const [slotsError, setSlotsError] = useState('');
//   const [locationError, setLocationError] = useState('');

//   const mapRef = useRef<any>(null);

//   const toggleAmenity = (amenity: string) => {
//     setSelectedAmenities((prev) =>
//       prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
//     );
//   };

//   const validateForm = (): boolean => {
//     let isValid = true;

//     if (!name.trim()) { setNameError('Facility name is required'); isValid = false; }
//     else setNameError('');

//     if (!address.trim()) { setAddressError('Address is required'); isValid = false; }
//     else setAddressError('');

//     if (!pricePerHour.trim()) { setPriceError('Price is required'); isValid = false; }
//     else if (parseFloat(pricePerHour) <= 0) { setPriceError('Price must be greater than 0'); isValid = false; }
//     else setPriceError('');

//     if (!totalSlots.trim()) { setSlotsError('Number of slots is required'); isValid = false; }
//     else if (parseInt(totalSlots) <= 0 || parseInt(totalSlots) > 200) { setSlotsError('Slots must be between 1 and 200'); isValid = false; }
//     else setSlotsError('');

//     if (!latitude || !longitude) { setLocationError('Please select location on the map'); isValid = false; }
//     else setLocationError('');

//     return isValid;
//   };

//   const generateSlots = (facilityId: string, total: number, perSection: number) => {
//     const slots: any[] = [];
//     const sections = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
//     let slotCount = 0;
//     for (let s = 0; s < sections.length && slotCount < total; s++) {
//       const section = sections[s];
//       for (let n = 1; n <= perSection && slotCount < total; n++) {
//         slots.push({
//           facility_id: facilityId,
//           slot_number: `${section}${n}`,
//           section: section,
//           is_available: true,
//           is_occupied: false,
//         });
//         slotCount++;
//       }
//     }
//     return slots;
//   };

//   const useMyLocation = async () => {
//     setIsGettingLocation(true);
//     setLocationError('');
//     try {
//       const { status } = await Location.requestForegroundPermissionsAsync();
//       if (status !== 'granted') {
//         Alert.alert('Permission Denied', 'Location permission is required to use your current location.');
//         setIsGettingLocation(false);
//         return;
//       }
//       const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
//       const { latitude: lat, longitude: lng } = location.coords;
//       const reverseGeocode = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
//       let formattedAddress = address;
//       if (reverseGeocode[0]) {
//         formattedAddress = [
//           reverseGeocode[0].name,
//           reverseGeocode[0].street,
//           reverseGeocode[0].district,
//           reverseGeocode[0].city,
//         ].filter(Boolean).join(', ');
//       }
//       setLatitude(lat);
//       setLongitude(lng);
//       setAddress(formattedAddress || `${lat.toFixed(6)}, ${lng.toFixed(6)}`);
//       if (mapRef.current) {
//         mapRef.current.animateToRegion({ latitude: lat, longitude: lng, latitudeDelta: 0.012, longitudeDelta: 0.012 });
//       } else {
//         setIsMapExpanded(true);
//       }
//       Alert.alert('Location Updated', 'Your current location has been set.');
//     } catch (error: any) {
//       Alert.alert('Error', 'Failed to get current location. Please pick manually on the map.');
//     } finally {
//       setIsGettingLocation(false);
//     }
//   };

//   const handleMapPress = (event: any) => {
//     const { latitude: lat, longitude: lng } = event.nativeEvent.coordinate;
//     setLatitude(lat);
//     setLongitude(lng);
//     Location.reverseGeocodeAsync({ latitude: lat, longitude: lng })
//       .then((result) => {
//         if (result[0]) {
//           const addr = [result[0].name, result[0].street, result[0].city].filter(Boolean).join(', ');
//           if (addr) setAddress(addr);
//         }
//       })
//       .catch(() => {});
//   };

//     // const handleSubmit = async () => {
//     //   if (!validateForm()) return;
//     //   setIsSubmitting(true);
//     //   try {
//     //     const { data: { user } } = await supabase.auth.getUser();
//     //     if (!user) {
//     //       Alert.alert('Error', 'Please login to continue');
//     //       setIsSubmitting(false);
//     //       return;
//     //     }
//     //     const { data: facility, error: facilityError } = await supabase
//     //       .from('parking_facilities')
//     //       .insert({
//     //         owner_id: user.id,
//     //         name: name.trim(),
//     //         address: address.trim(),
//     //         latitude,
//     //         longitude,
//     //         total_slots: parseInt(totalSlots),
//     //         price_per_hour: parseFloat(pricePerHour),
//     //         amenities: selectedAmenities,
//     //         photos: [],
//     //         is_active: true,
//     //         is_approved: true,
//     //       })
//     //       .select()
//     //       .single();

//     //     if (facilityError) {
//     //       Alert.alert('Error', 'Failed to create facility: ' + facilityError.message);
//     //       setIsSubmitting(false);
//     //       return;
//     //     }

//     //     const slotsData = generateSlots(facility.id, parseInt(totalSlots), parseInt(slotsPerSection) || 5);
//     //     console.log(`Attempting to insert ${slotsData.length} slots...`);

//     //     const { error: slotsError } = await supabase.from('parking_slots').insert(slotsData);

//     //     if (slotsError) {
//     //       Alert.alert(
//     //         'Facility Created - Slots Issue',
//     //         `Facility "${name.trim()}" was created successfully.\n\nBut slots could not be generated automatically.\n\nError: ${slotsError.message}\n\nYou can add slots manually later.`,
//     //         [{ text: 'OK', onPress: () => router.back() }]
//     //       );
//     //       setIsSubmitting(false);
//     //       return;
//     //     }

//     //     Alert.alert('Success!', `${name.trim()} has been created with ${totalSlots} slots.`, [
//     //       { text: 'OK', onPress: () => router.back() },
//     //     ]);
//     //   } catch (error: any) {
//     //     Alert.alert('Error', 'Something went wrong. Please try again.');
//     //   } finally {
//     //     setIsSubmitting(false);
//     //   }
//     // };

//     const handleSubmit = async () => {
//   if (!validateForm()) return;
//   setIsSubmitting(true);

//   try {
//     const { data: { user } } = await supabase.auth.getUser();

//     if (!user) {
//       Alert.alert('Error', 'Please login to continue');
//       setIsSubmitting(false);
//       return;
//     }

//     const { data: facility, error: facilityError } = await supabase
//       .from('parking_facilities')
//       .insert({
//         owner_id: user.id,
//         name: name.trim(),
//         address: address.trim(),
//         latitude,
//         longitude,
//         total_slots: parseInt(totalSlots),
//         price_per_hour: parseFloat(pricePerHour),
//         amenities: selectedAmenities,
//         photos: [],

//         // ✅ NEW (admin approval flow)
//         approval_status: 'pending',
//         is_active: false,
//       })
//       .select()
//       .single();

//     if (facilityError) {
//       Alert.alert('Error', 'Failed to create facility: ' + facilityError.message);
//       setIsSubmitting(false);
//       return;
//     }

//     const slotsData = generateSlots(
//       facility.id,
//       parseInt(totalSlots),
//       parseInt(slotsPerSection) || 5
//     );

//     console.log(`Attempting to insert ${slotsData.length} slots...`);

//     const { error: slotsError } = await supabase
//       .from('parking_slots')
//       .insert(slotsData);

//     if (slotsError) {
//       Alert.alert(
//         'Submitted for Approval',
//         `Facility "${name.trim()}" was submitted for admin approval.\n\nBut slots could not be generated automatically.\n\nError: ${slotsError.message}`,
//         [{ text: 'OK', onPress: () => router.back() }]
//       );
//       setIsSubmitting(false);
//       return;
//     }

//     Alert.alert(
//       'Submitted for Approval',
//       `${name.trim()} has been submitted and is waiting for admin approval.`,
//       [{ text: 'OK', onPress: () => router.back() }]
//     );

//   } catch (error: any) {
//     Alert.alert('Error', 'Something went wrong. Please try again.');
//   } finally {
//     setIsSubmitting(false);
//   }
// };

//   const slotPreview = () => {
//     const total = parseInt(totalSlots) || 0;
//     const perSec = parseInt(slotsPerSection) || 5;
//     if (total <= 0) return '';
//     const numSections = Math.ceil(total / perSec);
//     const sections = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.slice(0, numSections);
//     return `Sections ${sections.split('').join(', ')} (${perSec} slots each)`;
//   };

//   return (
//     <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
//       {/* Header */}
//       <View style={styles.header}>
//         <TouchableOpacity onPress={() => router.back()}>
//           <Ionicons name="arrow-back" size={24} color="#111827" />
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>Add New Facility</Text>
//         <View style={{ width: 24 }} />
//       </View>

//       <ScrollView style={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

//         {/* Facility Name */}
//         <View style={styles.fieldGroup}>
//           <Text style={styles.label}>Facility Name *</Text>
//           <View style={[styles.inputWrapper, nameError && styles.inputError]}>
//             <Ionicons name="business-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
//             <TextInput
//               style={styles.input}
//               placeholder="e.g. Thamel Central Parking"
//               placeholderTextColor="#D1D5DB"
//               value={name}
//               onChangeText={(t) => { setName(t); if (nameError) setNameError(''); }}
//               editable={!isSubmitting}
//             />
//           </View>
//           {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
//         </View>

//         {/* Price and Slots Row */}
//         <View style={styles.row}>
//           <View style={[styles.fieldGroup, { flex: 1 }]}>
//             <Text style={styles.label}>Price/Hour (Rs) *</Text>
//             <View style={[styles.inputWrapper, priceError && styles.inputError]}>
//               <Text style={styles.rsPrefix}>Rs</Text>
//               <TextInput
//                 style={styles.input}
//                 placeholder="80"
//                 placeholderTextColor="#D1D5DB"
//                 value={pricePerHour}
//                 onChangeText={(t) => { setPricePerHour(t); if (priceError) setPriceError(''); }}
//                 keyboardType="numeric"
//                 editable={!isSubmitting}
//               />
//             </View>
//             {priceError ? <Text style={styles.errorText}>{priceError}</Text> : null}
//           </View>

//           <View style={{ width: 12 }} />

//           <View style={[styles.fieldGroup, { flex: 1 }]}>
//             <Text style={styles.label}>Total Slots *</Text>
//             <View style={[styles.inputWrapper, slotsError && styles.inputError]}>
//               <Ionicons name="grid-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
//               <TextInput
//                 style={styles.input}
//                 placeholder="20"
//                 placeholderTextColor="#D1D5DB"
//                 value={totalSlots}
//                 onChangeText={(t) => { setTotalSlots(t); if (slotsError) setSlotsError(''); }}
//                 keyboardType="numeric"
//                 editable={!isSubmitting}
//               />
//             </View>
//             {slotsError ? <Text style={styles.errorText}>{slotsError}</Text> : null}
//           </View>
//         </View>

//         {/* Slots Per Section */}
//         <View style={styles.fieldGroup}>
//           <Text style={styles.label}>Slots Per Section</Text>
//           <View style={styles.slotOptions}>
//             {['4', '5', '6', '8', '10'].map((n) => (
//               <TouchableOpacity
//                 key={n}
//                 style={[styles.slotOption, slotsPerSection === n && styles.slotOptionActive]}
//                 onPress={() => setSlotsPerSection(n)}
//               >
//                 <Text style={[styles.slotOptionText, slotsPerSection === n && styles.slotOptionTextActive]}>{n}</Text>
//               </TouchableOpacity>
//             ))}
//           </View>
//           {totalSlots && parseInt(totalSlots) > 0 && (
//             <Text style={styles.slotPreview}>{slotPreview()}</Text>
//           )}
//         </View>

//         {/* Amenities */}
//         <View style={styles.fieldGroup}>
//           <Text style={styles.label}>Amenities</Text>
//           <View style={styles.amenitiesGrid}>
//             {AMENITY_OPTIONS.map((amenity) => (
//               <TouchableOpacity
//                 key={amenity.key}
//                 style={[styles.amenityChip, selectedAmenities.includes(amenity.key) && styles.amenityChipActive]}
//                 onPress={() => toggleAmenity(amenity.key)}
//                 disabled={isSubmitting}
//               >
//                 <Ionicons
//                   name={amenity.icon as any}
//                   size={18}
//                   color={selectedAmenities.includes(amenity.key) ? '#FFFFFF' : '#6B7280'}
//                 />
//                 <Text style={[styles.amenityChipText, selectedAmenities.includes(amenity.key) && styles.amenityChipTextActive]}>
//                   {amenity.label}
//                 </Text>
//               </TouchableOpacity>
//             ))}
//           </View>
//         </View>

//         {/* ── COMBINED LOCATION SECTION ── */}
//         <View style={styles.fieldGroup}>
//           <Text style={styles.label}>Location *</Text>

//           <View style={[styles.locationCard, locationError || addressError ? styles.locationCardError : null]}>

//             {/* Map toggle row */}
//             <TouchableOpacity
//               style={styles.mapToggleRow}
//               onPress={() => setIsMapExpanded(!isMapExpanded)}
//             >
//               <View style={styles.mapToggleLeft}>
//                 <View style={[styles.mapPinDot, latitude && longitude ? styles.mapPinDotActive : null]} />
//                 <Text style={styles.mapToggleText}>
//                   {latitude && longitude ? 'Location pinned on map' : 'Tap to pick on map'}
//                 </Text>
//               </View>
//               <Ionicons name={isMapExpanded ? 'chevron-up' : 'chevron-down'} size={18} color="#6B7280" />
//             </TouchableOpacity>

//             {/* Map */}
//             {isMapExpanded && (
//               <View style={styles.mapContainer}>
//                 <MapView
//                   ref={mapRef}
//                   provider={PROVIDER_GOOGLE}
//                   style={styles.map}
//                   initialRegion={KATHMANDU_REGION}
//                   onPress={handleMapPress}
//                   showsUserLocation={true}
//                   showsMyLocationButton={true}
//                 >
//                   {latitude && longitude && (
//                     <Marker
//                       coordinate={{ latitude: latitude!, longitude: longitude! }}
//                       draggable
//                       onDragEnd={(e) => {
//                         setLatitude(e.nativeEvent.coordinate.latitude);
//                         setLongitude(e.nativeEvent.coordinate.longitude);
//                       }}
//                     />
//                   )}
//                 </MapView>

//                 {latitude && longitude && (
//                   <View style={styles.coordinatesChip}>
//                     <Text style={styles.coordinatesText}>
//                       {latitude.toFixed(5)}, {longitude.toFixed(5)}
//                     </Text>
//                   </View>
//                 )}

//                 <View style={styles.mapActions}>
//                   <TouchableOpacity style={styles.mapButton} onPress={useMyLocation} disabled={isGettingLocation}>
//                     {isGettingLocation ? (
//                       <ActivityIndicator color="#fff" size="small" />
//                     ) : (
//                       <>
//                         <Ionicons name="locate" size={16} color="#fff" />
//                         <Text style={styles.mapButtonText}>Use My Location</Text>
//                       </>
//                     )}
//                   </TouchableOpacity>
//                   <TouchableOpacity style={[styles.mapButton, { backgroundColor: '#22C55E' }]} onPress={() => setIsMapExpanded(false)}>
//                     <Ionicons name="checkmark" size={16} color="#fff" />
//                     <Text style={styles.mapButtonText}>Done</Text>
//                   </TouchableOpacity>
//                 </View>
//               </View>
//             )}

//             {/* Divider */}
//             <View style={styles.locationDivider} />

//             {/* Address input — linked visually below map */}
//             <View style={styles.addressRow}>
//               <Ionicons name="location-outline" size={18} color="#9CA3AF" style={{ marginTop: 1 }} />
//               <TextInput
//                 style={styles.addressInput}
//                 placeholder="Address will fill from map, or type manually"
//                 placeholderTextColor="#9CA3AF"
//                 value={address}
//                 onChangeText={(t) => { setAddress(t); if (addressError) setAddressError(''); }}
//                 editable={!isSubmitting}
//                 multiline
//               />
//             </View>
//           </View>

//           {/* Errors */}
//           {locationError ? <Text style={styles.errorText}>{locationError}</Text> : null}
//           {addressError ? <Text style={styles.errorText}>{addressError}</Text> : null}
//         </View>
//         {/* ─────────────────────────────── */}

//         {/* Summary Card */}
//         {(name.trim() || address.trim() || pricePerHour || totalSlots) && (
//           <View style={styles.summaryCard}>
//             <Text style={styles.summaryTitle}>Summary</Text>
//             {name.trim() && (
//               <View style={styles.summaryRow}>
//                 <Text style={styles.summaryLabel}>Name</Text>
//                 <Text style={styles.summaryValue}>{name.trim()}</Text>
//               </View>
//             )}
//             {address.trim() && (
//               <View style={styles.summaryRow}>
//                 <Text style={styles.summaryLabel}>Address</Text>
//                 <Text style={styles.summaryValue}>{address.trim()}</Text>
//               </View>
//             )}
//             {pricePerHour && (
//               <View style={styles.summaryRow}>
//                 <Text style={styles.summaryLabel}>Price</Text>
//                 <Text style={styles.summaryValue}>Rs {pricePerHour}/hr</Text>
//               </View>
//             )}
//             {totalSlots && (
//               <View style={styles.summaryRow}>
//                 <Text style={styles.summaryLabel}>Slots</Text>
//                 <Text style={styles.summaryValue}>{totalSlots} slots</Text>
//               </View>
//             )}
//             {latitude && longitude && (
//               <View style={styles.summaryRow}>
//                 <Text style={styles.summaryLabel}>Location</Text>
//                 <Text style={styles.summaryValue}>{latitude.toFixed(4)}, {longitude.toFixed(4)}</Text>
//               </View>
//             )}
//             <View style={styles.summaryRow}>
//               <Text style={styles.summaryLabel}>Amenities</Text>
//               <Text style={styles.summaryValue}>{selectedAmenities.length > 0 ? selectedAmenities.join(', ') : 'None'}</Text>
//             </View>
//           </View>
//         )}

//         <View style={{ height: 140 }} />
//       </ScrollView>

//       {/* Submit Button */}
//       <View style={styles.footer}>
//         <TouchableOpacity
//           style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
//           onPress={handleSubmit}
//           disabled={isSubmitting}
//           activeOpacity={0.8}
//         >
//           {isSubmitting ? (
//             <>
//               <ActivityIndicator size="small" color="#fff" />
//               <Text style={[styles.submitButtonText, { marginLeft: 10 }]}>Creating...</Text>
//             </>
//           ) : (
//             <>
//               <Ionicons name="add-circle" size={22} color="#fff" />
//               <Text style={styles.submitButtonText}>CREATE FACILITY</Text>
//             </>
//           )}
//         </TouchableOpacity>
//       </View>
//     </KeyboardAvoidingView>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: '#F9FAFB' },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: 20,
//     paddingTop: 50,
//     paddingBottom: 16,
//     backgroundColor: '#FFFFFF',
//     borderBottomWidth: 1,
//     borderBottomColor: '#E5E7EB',
//   },
//   headerTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
//   content: { flex: 1, paddingHorizontal: 20, paddingTop: 24 },

//   fieldGroup: { marginBottom: 20 },
//   label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
//   inputWrapper: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#FFFFFF',
//     borderWidth: 1,
//     borderColor: '#E5E7EB',
//     borderRadius: 12,
//     paddingHorizontal: 14,
//     height: 52,
//   },
//   inputError: { borderColor: '#DC2626', backgroundColor: '#FEF2F2' },
//   inputIcon: { marginRight: 10 },
//   input: { flex: 1, fontSize: 15, color: '#111827' },
//   rsPrefix: { fontSize: 15, fontWeight: '600', color: '#6B7280', marginRight: 8 },
//   errorText: { color: '#DC2626', fontSize: 12, marginTop: 4, paddingLeft: 4 },
//   row: { flexDirection: 'row' },

//   slotOptions: { flexDirection: 'row', gap: 10 },
//   slotOption: {
//     width: 48, height: 48, borderRadius: 12,
//     backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB',
//     justifyContent: 'center', alignItems: 'center',
//   },
//   slotOptionActive: { backgroundColor: '#22C55E', borderColor: '#22C55E' },
//   slotOptionText: { fontSize: 16, fontWeight: '600', color: '#6B7280' },
//   slotOptionTextActive: { color: '#FFFFFF' },
//   slotPreview: { fontSize: 13, color: '#22C55E', marginTop: 10, fontWeight: '500' },

//   amenitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
//   amenityChip: {
//     flexDirection: 'row', alignItems: 'center',
//     paddingHorizontal: 14, paddingVertical: 10,
//     borderRadius: 10, backgroundColor: '#FFFFFF',
//     borderWidth: 1, borderColor: '#E5E7EB', gap: 6,
//   },
//   amenityChipActive: { backgroundColor: '#22C55E', borderColor: '#22C55E' },
//   amenityChipText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
//   amenityChipTextActive: { color: '#FFFFFF' },

//   // ── Combined Location Card ──
//   locationCard: {
//     backgroundColor: '#FFFFFF',
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: '#E5E7EB',
//     overflow: 'hidden',
//   },
//   locationCardError: {
//     borderColor: '#DC2626',
//     backgroundColor: '#FEF2F2',
//   },
//   mapToggleRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: 14,
//     paddingVertical: 14,
//   },
//   mapToggleLeft: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 10,
//   },
//   mapPinDot: {
//     width: 10,
//     height: 10,
//     borderRadius: 5,
//     backgroundColor: '#D1D5DB',
//   },
//   mapPinDotActive: {
//     backgroundColor: '#22C55E',
//   },
//   mapToggleText: {
//     fontSize: 14,
//     color: '#6B7280',
//     fontWeight: '500',
//   },
//   mapContainer: {
//     height: 280,
//     position: 'relative',
//   },
//   map: {
//     height: '100%',
//     width: '100%',
//   },
//   coordinatesChip: {
//     position: 'absolute',
//     top: 10,
//     left: 10,
//     backgroundColor: 'rgba(0,0,0,0.7)',
//     borderRadius: 8,
//     paddingHorizontal: 10,
//     paddingVertical: 4,
//   },
//   coordinatesText: {
//     color: '#fff',
//     fontSize: 11,
//     fontWeight: '500',
//   },
//   mapActions: {
//     position: 'absolute',
//     bottom: 12,
//     left: 12,
//     right: 12,
//     flexDirection: 'row',
//     gap: 10,
//   },
//   mapButton: {
//     flex: 1,
//     backgroundColor: '#3B82F6',
//     paddingVertical: 12,
//     borderRadius: 10,
//     flexDirection: 'row',
//     justifyContent: 'center',
//     alignItems: 'center',
//     gap: 6,
//   },
//   mapButtonText: { color: '#fff', fontWeight: '600', fontSize: 13 },
//   locationDivider: {
//     height: 1,
//     backgroundColor: '#E5E7EB',
//     marginHorizontal: 14,
//   },
//   addressRow: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     paddingHorizontal: 14,
//     paddingVertical: 12,
//     gap: 10,
//   },
//   addressInput: {
//     flex: 1,
//     fontSize: 14,
//     color: '#111827',
//     lineHeight: 20,
//     minHeight: 40,
//   },

//   // Summary
//   summaryCard: {
//     backgroundColor: '#FFFFFF', borderRadius: 16,
//     padding: 20, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 20,
//   },
//   summaryTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 16 },
//   summaryRow: {
//     flexDirection: 'row', justifyContent: 'space-between',
//     paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
//   },
//   summaryLabel: { fontSize: 13, color: '#6B7280' },
//   summaryValue: { fontSize: 13, fontWeight: '600', color: '#111827', maxWidth: '60%', textAlign: 'right' },

//   // Footer
//   footer: {
//     backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingVertical: 16,
//     borderTopWidth: 1, borderTopColor: '#E5E7EB',
//   },
//   submitButton: {
//     flexDirection: 'row', backgroundColor: '#22C55E',
//     height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center', gap: 8,
//     shadowColor: '#22C55E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
//   },
//   submitButtonDisabled: { opacity: 0.7 },
//   submitButtonText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.5 },
// });

