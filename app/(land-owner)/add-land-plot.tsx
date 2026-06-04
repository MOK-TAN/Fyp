import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
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
import { supabase } from '../../lib/supabase';

// ── Amenities removed (not in schema) ──
// ── Area unit helpers ──
const AANA_TO_SQFT = 342.25;

const KATHMANDU_REGION = {
  latitude: 27.7172,
  longitude: 85.324,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function AddLandPlot() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');

  // Area — user picks unit, we store sqft
  const [areaValue, setAreaValue] = useState('');
  const [areaUnit, setAreaUnit] = useState<'sqft' | 'aana'>('aana');

  // Rent
  const [expectedRent, setExpectedRent] = useState('');
  const [isNegotiable, setIsNegotiable] = useState(false);

  // Location
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // UI
  const [isSubmitting, setIsSubmitting] = useState(false);
  const mapRef = useRef<any>(null);

  // Errors
  const [titleError, setTitleError] = useState('');
  const [areaError, setAreaError] = useState('');
  const [rentError, setRentError] = useState('');
  const [locationError, setLocationError] = useState('');
  const [addressError, setAddressError] = useState('');

  // ── Area conversion ──
  const getAreaInSqft = (): number => {
    const val = parseFloat(areaValue);
    if (isNaN(val)) return 0;
    return areaUnit === 'aana' ? Math.round(val * AANA_TO_SQFT) : Math.round(val);
  };

  const validateForm = (): boolean => {
    let isValid = true;

    if (!title.trim()) { setTitleError('Plot title is required'); isValid = false; }
    else setTitleError('');

    if (!areaValue.trim()) { setAreaError('Area is required'); isValid = false; }
    else if (getAreaInSqft() <= 0) { setAreaError('Area must be greater than 0'); isValid = false; }
    else setAreaError('');

    if (!isNegotiable) {
      if (!expectedRent.trim()) { setRentError('Enter expected rent or mark as negotiable'); isValid = false; }
      else if (parseFloat(expectedRent) <= 0) { setRentError('Rent must be greater than 0'); isValid = false; }
      else setRentError('');
    } else {
      setRentError('');
    }

    if (!address.trim()) { setAddressError('Address is required'); isValid = false; }
    else setAddressError('');

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
        Alert.alert('Permission Denied', 'Location permission is required.');
        return;
      }
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude: lat, longitude: lng } = location.coords;
      const reverseGeocode = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (reverseGeocode[0]) {
        const addr = [
          reverseGeocode[0].name,
          reverseGeocode[0].street,
          reverseGeocode[0].district,
          reverseGeocode[0].city,
        ].filter(Boolean).join(', ');
        setAddress(addr || `${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      }
      setLatitude(lat);
      setLongitude(lng);
      if (mapRef.current) {
        mapRef.current.animateToRegion({ latitude: lat, longitude: lng, latitudeDelta: 0.012, longitudeDelta: 0.012 });
      } else {
        setIsMapExpanded(true);
      }
      Alert.alert('Location Updated', 'Your current location has been set.');
    } catch {
      Alert.alert('Error', 'Failed to get location. Please pick manually on the map.');
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

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'Please login to continue');
        return;
      }

      const { error } = await supabase.from('land_listings').insert({
        owner_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        address: address.trim(),
        latitude,
        longitude,
        area_sqft: getAreaInSqft(),
        expected_rent: isNegotiable ? null : parseFloat(expectedRent),
        photos: [],
        is_available: false,        // admin must approve first
        approval_status: 'pending', // default from schema
      });

      if (error) {
        Alert.alert('Error', 'Failed to submit listing: ' + error.message);
        return;
      }

      Alert.alert(
        'Submitted for Approval! 🎉',
        `"${title.trim()}" has been submitted.\n\nOur admin team will review and approve your listing shortly. You'll be notified once it's live.`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const sqftPreview = getAreaInSqft();

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New Land Plot</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Approval notice banner */}
      <View style={styles.noticeBanner}>
        <Ionicons name="information-circle" size={16} color="#D97706" />
        <Text style={styles.noticeText}>Listings require admin approval before going live</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Title */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Plot Title *</Text>
          <View style={[styles.inputWrapper, titleError ? styles.inputError : null]}>
            <Ionicons name="leaf-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="e.g. Thamel Corner Land Plot"
              placeholderTextColor="#D1D5DB"
              value={title}
              onChangeText={(t) => { setTitle(t); if (titleError) setTitleError(''); }}
              editable={!isSubmitting}
            />
          </View>
          {titleError ? <Text style={styles.errorText}>{titleError}</Text> : null}
        </View>

        {/* Description */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Description <Text style={styles.optional}>(optional)</Text></Text>
          <View style={[styles.inputWrapper, { alignItems: 'flex-start', paddingTop: 10, minHeight: 80 }]}>
            <Ionicons name="document-text-outline" size={20} color="#9CA3AF" style={[styles.inputIcon, { marginTop: 2 }]} />
            <TextInput
              style={[styles.input, { height: 70, textAlignVertical: 'top' }]}
              placeholder="Describe your land — road access, shape, current use..."
              placeholderTextColor="#D1D5DB"
              value={description}
              onChangeText={setDescription}
              multiline
              editable={!isSubmitting}
            />
          </View>
        </View>

        {/* Area */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Land Area *</Text>
          <View style={styles.row}>
            <View style={[styles.inputWrapper, { flex: 1 }, areaError ? styles.inputError : null]}>
              <Ionicons name="resize-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={areaUnit === 'aana' ? '4.5' : '1540'}
                placeholderTextColor="#D1D5DB"
                value={areaValue}
                onChangeText={(t) => { setAreaValue(t); if (areaError) setAreaError(''); }}
                keyboardType="numeric"
                editable={!isSubmitting}
              />
            </View>
            <View style={{ width: 10 }} />
            {/* Unit toggle */}
            <View style={styles.unitToggle}>
              {(['aana', 'sqft'] as const).map((u) => (
                <TouchableOpacity
                  key={u}
                  style={[styles.unitBtn, areaUnit === u && styles.unitBtnActive]}
                  onPress={() => setAreaUnit(u)}
                >
                  <Text style={[styles.unitBtnText, areaUnit === u && styles.unitBtnTextActive]}>
                    {u === 'aana' ? 'Aana' : 'Sq.ft'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          {areaError ? <Text style={styles.errorText}>{areaError}</Text> : null}
          {/* Conversion hint */}
          {areaValue && sqftPreview > 0 && (
            <Text style={styles.conversionHint}>
              {areaUnit === 'aana'
                ? `≈ ${sqftPreview.toLocaleString()} sq.ft`
                : `≈ ${(sqftPreview / AANA_TO_SQFT).toFixed(2)} Aana`}
            </Text>
          )}
        </View>

        {/* Expected Rent */}
        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Expected Monthly Rent *</Text>
            <View style={styles.negotiableToggle}>
              <Text style={styles.negotiableLabel}>Negotiable</Text>
              <Switch
                value={isNegotiable}
                onValueChange={(v) => { setIsNegotiable(v); if (v) setRentError(''); }}
                trackColor={{ false: '#E5E7EB', true: '#86EFAC' }}
                thumbColor={isNegotiable ? '#22C55E' : '#9CA3AF'}
                ios_backgroundColor="#E5E7EB"
              />
            </View>
          </View>
          {!isNegotiable ? (
            <>
              <View style={[styles.inputWrapper, rentError ? styles.inputError : null]}>
                <Text style={styles.rsPrefix}>Rs</Text>
                <TextInput
                  style={styles.input}
                  placeholder="45,000"
                  placeholderTextColor="#D1D5DB"
                  value={expectedRent}
                  onChangeText={(t) => { setExpectedRent(t); if (rentError) setRentError(''); }}
                  keyboardType="numeric"
                  editable={!isSubmitting}
                />
                <Text style={styles.perMonth}>/month</Text>
              </View>
              {rentError ? <Text style={styles.errorText}>{rentError}</Text> : null}
            </>
          ) : (
            <View style={styles.negotiablePill}>
              <Ionicons name="chatbubble-ellipses-outline" size={16} color="#15803D" />
              <Text style={styles.negotiablePillText}>Parking owners will propose their rent</Text>
            </View>
          )}
        </View>

        {/* Location — same pattern as AddFacility */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Location *</Text>
          <View style={[styles.locationCard, (locationError || addressError) ? styles.locationCardError : null]}>

            <TouchableOpacity style={styles.mapToggleRow} onPress={() => setIsMapExpanded(!isMapExpanded)}>
              <View style={styles.mapToggleLeft}>
                <View style={[styles.mapPinDot, latitude && longitude ? styles.mapPinDotActive : null]} />
                <Text style={styles.mapToggleText}>
                  {latitude && longitude ? 'Location pinned on map' : 'Tap to pick on map'}
                </Text>
              </View>
              <Ionicons name={isMapExpanded ? 'chevron-up' : 'chevron-down'} size={18} color="#6B7280" />
            </TouchableOpacity>

            {isMapExpanded && (
              <View style={styles.mapContainer}>
                <MapView
                  ref={mapRef}
                  provider={PROVIDER_GOOGLE}
                  style={styles.map}
                  initialRegion={KATHMANDU_REGION}
                  onPress={handleMapPress}
                  showsUserLocation={true}
                  showsMyLocationButton={true}
                >
                  {latitude && longitude && (
                    <Marker
                      coordinate={{ latitude, longitude }}
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

            <View style={styles.locationDivider} />

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
        {(title.trim() || areaValue || expectedRent || address.trim()) && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Summary</Text>
            {title.trim() && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Title</Text>
                <Text style={styles.summaryValue}>{title.trim()}</Text>
              </View>
            )}
            {areaValue && sqftPreview > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Area</Text>
                <Text style={styles.summaryValue}>
                  {areaValue} {areaUnit === 'aana' ? 'Aana' : 'sq.ft'} ({sqftPreview.toLocaleString()} sq.ft stored)
                </Text>
              </View>
            )}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Rent</Text>
              <Text style={styles.summaryValue}>
                {isNegotiable ? 'Negotiable' : expectedRent ? `Rs ${expectedRent}/month` : '—'}
              </Text>
            </View>
            {address.trim() && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Address</Text>
                <Text style={styles.summaryValue}>{address.trim()}</Text>
              </View>
            )}
            {latitude && longitude && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Coordinates</Text>
                <Text style={styles.summaryValue}>{latitude.toFixed(4)}, {longitude.toFixed(4)}</Text>
              </View>
            )}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Status</Text>
              <Text style={[styles.summaryValue, { color: '#D97706' }]}>⏳ Pending Admin Approval</Text>
            </View>
          </View>
        )}

        <View style={{ height: 140 }} />
      </ScrollView>

      {/* Footer Submit */}
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
              <Ionicons name="cloud-upload" size={22} color="#fff" />
              <Text style={styles.submitButtonText}>SUBMIT FOR APPROVAL</Text>
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  noticeBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FFFBEB', borderBottomWidth: 1, borderBottomColor: '#FDE68A',
    paddingHorizontal: 16, paddingVertical: 10,
  },
  noticeText: { fontSize: 12, color: '#92400E', flex: 1 },
  content: { flex: 1, paddingHorizontal: 20 },
  fieldGroup: { marginTop: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
  optional: { fontWeight: '400', color: '#9CA3AF' },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB',
    paddingHorizontal: 12, height: 48,
  },
  inputError: { borderColor: '#EF4444' },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, fontSize: 15, color: '#111827' },
  rsPrefix: { fontSize: 14, fontWeight: '600', color: '#6B7280', marginRight: 6 },
  perMonth: { fontSize: 13, color: '#9CA3AF', marginLeft: 4 },
  errorText: { fontSize: 12, color: '#EF4444', marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center' },

  // Area unit toggle
  unitToggle: {
    flexDirection: 'row', backgroundColor: '#F3F4F6',
    borderRadius: 10, padding: 3,
  },
  unitBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  unitBtnActive: { backgroundColor: '#22C55E' },
  unitBtnText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  unitBtnTextActive: { color: '#fff' },
  conversionHint: { fontSize: 12, color: '#22C55E', marginTop: 5, marginLeft: 2 },

  // Negotiable
  negotiableToggle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  negotiableLabel: { fontSize: 13, color: '#6B7280' },
  negotiablePill: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#F0FDF4', borderRadius: 10, borderWidth: 1,
    borderColor: '#BBF7D0', paddingHorizontal: 14, paddingVertical: 12,
  },
  negotiablePillText: { fontSize: 13, color: '#15803D' },

  // Location card (mirrors AddFacility)
  locationCard: {
    backgroundColor: '#fff', borderRadius: 12,
    borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden',
  },
  locationCardError: { borderColor: '#EF4444' },
  mapToggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 14,
  },
  mapToggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mapPinDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#D1D5DB' },
  mapPinDotActive: { backgroundColor: '#22C55E' },
  mapToggleText: { fontSize: 14, color: '#374151' },
  mapContainer: { height: 260 },
  map: { flex: 1 },
  coordinatesChip: {
    position: 'absolute', bottom: 60, alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.65)', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  coordinatesText: { color: '#fff', fontSize: 11 },
  mapActions: {
    position: 'absolute', bottom: 10, left: 10, right: 10,
    flexDirection: 'row', gap: 8,
  },
  mapButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, backgroundColor: '#3B82F6', borderRadius: 8, paddingVertical: 8,
  },
  mapButtonText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  locationDivider: { height: 1, backgroundColor: '#F3F4F6' },
  addressRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: 14, paddingVertical: 12, gap: 8,
  },
  addressInput: { flex: 1, fontSize: 14, color: '#111827', minHeight: 40 },

  // Summary
  summaryCard: {
    marginTop: 24, backgroundColor: '#F0FDF4',
    borderRadius: 12, borderWidth: 1, borderColor: '#BBF7D0', padding: 16,
  },
  summaryTitle: { fontSize: 13, fontWeight: '700', color: '#15803D', marginBottom: 10 },
  summaryRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: '#DCFCE7',
  },
  summaryLabel: { fontSize: 13, color: '#6B7280' },
  summaryValue: { fontSize: 13, fontWeight: '600', color: '#111827', maxWidth: '60%', textAlign: 'right' },

  // Footer
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 16,
    paddingBottom: 32, borderTopWidth: 1, borderTopColor: '#F3F4F6',
  },
  submitButton: {
    backgroundColor: '#22C55E', borderRadius: 14, height: 54,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  submitButtonDisabled: { backgroundColor: '#86EFAC' },
  submitButtonText: { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 0.5 },
});