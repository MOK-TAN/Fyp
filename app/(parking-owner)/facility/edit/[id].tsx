import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { supabase } from '../../../../lib/supabase';

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

export default function EditFacility() {
  const params = useLocalSearchParams();
  const facilityId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [pricePerHour, setPricePerHour] = useState('');
  const [totalSlots, setTotalSlots] = useState('');
  const [originalTotalSlots, setOriginalTotalSlots] = useState(0);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const [nameError, setNameError] = useState('');
  const [addressError, setAddressError] = useState('');
  const [priceError, setPriceError] = useState('');
  const [slotsError, setSlotsError] = useState('');
  const [locationError, setLocationError] = useState('');

  const mapRef = useRef<any>(null);

  useEffect(() => {
    fetchFacility();
  }, [facilityId]);

  const fetchFacility = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('parking_facilities')
        .select('*')
        .eq('id', facilityId)
        .single();

      if (error || !data) {
        Alert.alert('Error', 'Facility not found');
        router.back();
        return;
      }

      setName(data.name || '');
      setAddress(data.address || '');
      setPricePerHour(String(data.price_per_hour || ''));
      setTotalSlots(String(data.total_slots || 0));
      setOriginalTotalSlots(data.total_slots || 0);
      setLatitude(data.latitude ? Number(data.latitude) : null);
      setLongitude(data.longitude ? Number(data.longitude) : null);
      setSelectedAmenities(Array.isArray(data.amenities) ? data.amenities : []);
      setIsActive(data.is_active !== false);
    } catch (e) {
      console.error('Fetch facility error:', e);
      Alert.alert('Error', 'Failed to load facility');
      router.back();
    } finally {
      setLoading(false);
    }
  };

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

  const useMyLocation = async () => {
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

  // Generate new slots continuing from existing pattern
  const generateNewSlots = (existingSlots: any[], countToAdd: number) => {
    const newSlots: any[] = [];
    const sections = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    // Group existing by section
    const bySection: Record<string, number[]> = {};
    existingSlots.forEach(s => {
      const sec = s.section || 'A';
      if (!bySection[sec]) bySection[sec] = [];
      // Extract number from slot_number (e.g., "A12" -> 12)
      const num = parseInt(String(s.slot_number).replace(/[^0-9]/g, '')) || 0;
      bySection[sec].push(num);
    });

    // Find last section used and its highest number
    const usedSections = Object.keys(bySection).sort();
    const lastSection = usedSections[usedSections.length - 1] || 'A';
    const slotsPerSection = 5; // default
    const maxInLast = bySection[lastSection] ? Math.max(...bySection[lastSection]) : 0;

    let currentSection = lastSection;
    let currentNum = maxInLast;
    let added = 0;

    while (added < countToAdd) {
      currentNum++;
      // If section is full, move to next
      if (currentNum > slotsPerSection) {
        const nextIdx = sections.indexOf(currentSection) + 1;
        if (nextIdx >= sections.length) break;
        currentSection = sections[nextIdx];
        currentNum = 1;
      }
      newSlots.push({
        facility_id: facilityId,
        slot_number: `${currentSection}${currentNum}`,
        section: currentSection,
        is_available: true,
        is_occupied: false,
      });
      added++;
    }

    return newSlots;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const newTotal = parseInt(totalSlots);
      const diff = newTotal - originalTotalSlots;

      // Handle slot count changes BEFORE updating facility
      if (diff !== 0) {
        // Fetch all current slots for this facility
        const { data: currentSlots, error: fetchSlotsError } = await supabase
          .from('parking_slots')
          .select('id, slot_number, section, is_occupied')
          .eq('facility_id', facilityId)
          .order('section', { ascending: true })
          .order('slot_number', { ascending: true });

        if (fetchSlotsError) throw fetchSlotsError;

        if (diff > 0) {
          // INCREASE — add new slots
          const newSlots = generateNewSlots(currentSlots || [], diff);
          if (newSlots.length > 0) {
            const { error: insertError } = await supabase
              .from('parking_slots')
              .insert(newSlots);
            if (insertError) throw insertError;
          }
        } else {
          // DECREASE — delete from the end, but block if occupied
          const toRemoveCount = Math.abs(diff);
          // Sort descending to pick the "last" slots
          const sorted = [...(currentSlots || [])].sort((a, b) => {
            // Sort by section desc, then slot_number desc
            if (a.section !== b.section) return b.section.localeCompare(a.section);
            const aNum = parseInt(String(a.slot_number).replace(/[^0-9]/g, '')) || 0;
            const bNum = parseInt(String(b.slot_number).replace(/[^0-9]/g, '')) || 0;
            return bNum - aNum;
          });

          const slotsToRemove = sorted.slice(0, toRemoveCount);
          const occupiedBlocking = slotsToRemove.filter(s => s.is_occupied);

          if (occupiedBlocking.length > 0) {
            const blockingNumbers = occupiedBlocking.map(s => s.slot_number).join(', ');
            Alert.alert(
              'Cannot Reduce Slots',
              `${occupiedBlocking.length} of the slots that would be removed are currently occupied:\n\n${blockingNumbers}\n\nRelease these bookings first, or pick a higher number.`
            );
            setIsSubmitting(false);
            return;
          }

          const idsToDelete = slotsToRemove.map(s => s.id);
          const { error: deleteError } = await supabase
            .from('parking_slots')
            .delete()
            .in('id', idsToDelete);
          if (deleteError) throw deleteError;
        }
      }

      // Update facility row
      const { error: updateError } = await supabase
        .from('parking_facilities')
        .update({
          name: name.trim(),
          address: address.trim(),
          latitude,
          longitude,
          total_slots: newTotal,
          price_per_hour: parseFloat(pricePerHour),
          amenities: selectedAmenities,
          is_active: isActive,
          updated_at: new Date().toISOString(),
        })
        .eq('id', facilityId);

      if (updateError) {
        Alert.alert('Error', 'Failed to update facility: ' + updateError.message);
        setIsSubmitting(false);
        return;
      }

      Alert.alert('Saved', `${name.trim()} has been updated.`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error('Update error:', error);
      Alert.alert('Error', error.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#22C55E" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Facility</Text>
        <View style={{ width: 24 }} />
      </View>

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

        {/* Active Toggle */}
        <View style={styles.fieldGroup}>
          <View style={styles.activeRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Facility Status</Text>
              <Text style={styles.activeHint}>
                {isActive ? 'Visible to users and accepting bookings' : 'Hidden from users'}
              </Text>
            </View>
            <Switch
              value={isActive}
              onValueChange={setIsActive}
              trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
              thumbColor={isActive ? '#22C55E' : '#F3F4F6'}
              disabled={isSubmitting}
            />
          </View>
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

        {/* Slot change hint */}
        {totalSlots && parseInt(totalSlots) !== originalTotalSlots && (
          <View style={styles.slotChangeHint}>
            <Ionicons
              name={parseInt(totalSlots) > originalTotalSlots ? 'add-circle' : 'remove-circle'}
              size={16}
              color={parseInt(totalSlots) > originalTotalSlots ? '#22C55E' : '#F59E0B'}
            />
            <Text style={styles.slotChangeText}>
              {parseInt(totalSlots) > originalTotalSlots
                ? `Will add ${parseInt(totalSlots) - originalTotalSlots} new slots`
                : `Will remove ${originalTotalSlots - parseInt(totalSlots)} slots (occupied slots will block this)`}
            </Text>
          </View>
        )}

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
          <Text style={styles.label}>Location *</Text>

          <View style={[styles.locationCard, locationError || addressError ? styles.locationCardError : null]}>

            {/* Map toggle row */}
            <TouchableOpacity
              style={styles.mapToggleRow}
              onPress={() => setIsMapExpanded(!isMapExpanded)}
            >
              <View style={styles.mapToggleLeft}>
                <View style={[styles.mapPinDot, latitude && longitude ? styles.mapPinDotActive : null]} />
                <Text style={styles.mapToggleText}>
                  {latitude && longitude ? 'Location pinned on map' : 'Tap to pick on map'}
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
                  showsUserLocation={true}
                  showsMyLocationButton={true}
                >
                  {latitude && longitude && (
                    <Marker
                      coordinate={{ latitude: latitude!, longitude: longitude! }}
                      draggable
                      onDragEnd={(e) => {
                        setLatitude(e.nativeEvent.coordinate.latitude);
                        setLongitude(e.nativeEvent.coordinate.longitude);
                      }}
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
              </View>
            )}

            {/* Divider */}
            <View style={styles.locationDivider} />

            {/* Address input */}
            <View style={styles.addressRow}>
              <Ionicons name="location-outline" size={18} color="#9CA3AF" style={{ marginTop: 1 }} />
              <TextInput
                style={styles.addressInput}
                placeholder="Address will fill from map, or type manually"
                placeholderTextColor="#9CA3AF"
                value={address}
                onChangeText={(t) => { setAddress(t); if (addressError) setAddressError(''); }}
                editable={!isSubmitting}
                multiline
              />
            </View>
          </View>

          {locationError ? <Text style={styles.errorText}>{locationError}</Text> : null}
          {addressError ? <Text style={styles.errorText}>{addressError}</Text> : null}
        </View>

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Summary</Text>
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
            <Text style={styles.summaryLabel}>Status</Text>
            <Text style={[styles.summaryValue, { color: isActive ? '#22C55E' : '#EF4444' }]}>
              {isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Amenities</Text>
            <Text style={styles.summaryValue}>{selectedAmenities.length > 0 ? selectedAmenities.join(', ') : 'None'}</Text>
          </View>
        </View>

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
              <Text style={[styles.submitButtonText, { marginLeft: 10 }]}>Saving...</Text>
            </>
          ) : (
            <>
              <Ionicons name="save" size={22} color="#fff" />
              <Text style={styles.submitButtonText}>SAVE CHANGES</Text>
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
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 24 },

  fieldGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
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

  activeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  activeHint: { fontSize: 12, color: '#6B7280', marginTop: 2 },

  slotChangeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 16,
    marginTop: -8,
  },
  slotChangeText: { fontSize: 12, color: '#92400E', flex: 1 },

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
  locationCardError: { borderColor: '#DC2626', backgroundColor: '#FEF2F2' },
  mapToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  mapToggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mapPinDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#D1D5DB' },
  mapPinDotActive: { backgroundColor: '#22C55E' },
  mapToggleText: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
  mapContainer: { height: 280, position: 'relative' },
  map: { height: '100%', width: '100%' },
  coordinatesChip: {
    position: 'absolute', top: 10, left: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
  },
  coordinatesText: { color: '#fff', fontSize: 11, fontWeight: '500' },
  mapActions: {
    position: 'absolute', bottom: 12, left: 12, right: 12,
    flexDirection: 'row', gap: 10,
  },
  mapButton: {
    flex: 1, backgroundColor: '#3B82F6',
    paddingVertical: 12, borderRadius: 10,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6,
  },
  mapButtonText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  locationDivider: { height: 1, backgroundColor: '#E5E7EB', marginHorizontal: 14 },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  addressInput: { flex: 1, fontSize: 14, color: '#111827', lineHeight: 20, minHeight: 40 },

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