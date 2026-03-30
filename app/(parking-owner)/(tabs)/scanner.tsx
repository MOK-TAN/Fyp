import { Ionicons } from '@expo/vector-icons';
import { Camera, CameraView } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../../../lib/supabase';

type VerifiedBooking = {
  id: string;
  booking_reference: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  total_amount: number;
  payment_status: string;
  booking_status: string;
  slot_number: string;
  facility_name: string;
  customer_name: string;
  vehicle_plate: string;
  vehicle_model: string;
};

export default function Scanner() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [verifiedBooking, setVerifiedBooking] = useState<VerifiedBooking | null>(null);
  const [activating, setActivating] = useState(false);

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };
    getCameraPermissions();
  }, []);

  const verifyBooking = async (bookingRef: string) => {
    setVerifying(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'Please login to continue');
        setVerifying(false);
        setScanned(false);
        return;
      }

      // Get owner's facility IDs
      const { data: facilities } = await supabase
        .from('parking_facilities')
        .select('id')
        .eq('owner_id', user.id);

      if (!facilities || facilities.length === 0) {
        Alert.alert('Error', 'No facilities found for your account');
        setVerifying(false);
        setScanned(false);
        return;
      }

      const facilityIds = facilities.map(f => f.id);

      // Look up booking by reference
      const { data: booking, error } = await supabase
        .from('bookings')
        .select(`
          id,
          booking_reference,
          booking_date,
          start_time,
          end_time,
          total_amount,
          payment_status,
          booking_status,
          parking_facilities (name),
          parking_slots (slot_number),
          profiles (full_name),
          vehicles (plate_number, model)
        `)
        .eq('booking_reference', bookingRef.trim())
        .in('facility_id', facilityIds)
        .single();

      if (error || !booking) {
        Alert.alert(
          'Booking Not Found',
          `No booking found with reference "${bookingRef}" at your facilities.`,
          [{ text: 'Scan Again', onPress: () => setScanned(false) }]
        );
        setVerifying(false);
        return;
      }

      const b = booking as any;

      // Check booking status
      if (b.booking_status === 'cancelled') {
        Alert.alert(
          'Booking Cancelled',
          `This booking (${bookingRef}) has been cancelled.`,
          [{ text: 'OK', onPress: () => setScanned(false) }]
        );
        setVerifying(false);
        return;
      }

      if (b.booking_status === 'completed') {
        Alert.alert(
          'Booking Completed',
          `This booking (${bookingRef}) is already completed.`,
          [{ text: 'OK', onPress: () => setScanned(false) }]
        );
        setVerifying(false);
        return;
      }

      // Valid booking — show details
      setVerifiedBooking({
        id: b.id,
        booking_reference: b.booking_reference,
        booking_date: b.booking_date,
        start_time: b.start_time,
        end_time: b.end_time,
        total_amount: b.total_amount,
        payment_status: b.payment_status,
        booking_status: b.booking_status,
        slot_number: b.parking_slots?.slot_number || '-',
        facility_name: b.parking_facilities?.name || 'Unknown',
        customer_name: b.profiles?.full_name || 'Guest',
        vehicle_plate: b.vehicles?.plate_number || 'N/A',
        vehicle_model: b.vehicles?.model || '',
      });

      setShowBookingModal(true);
    } catch (error) {
      console.error('Verify error:', error);
      Alert.alert('Error', 'Failed to verify booking', [
        { text: 'Retry', onPress: () => setScanned(false) },
      ]);
    } finally {
      setVerifying(false);
    }
  };

  const handleBarCodeScanned = ({ data }: any) => {
    setScanned(true);
    verifyBooking(data);
  };

  const handleManualVerify = () => {
    if (!manualCode.trim()) {
      Alert.alert('Error', 'Please enter a booking reference');
      return;
    }
    setShowManualEntry(false);
    setScanned(true);
    verifyBooking(manualCode.trim());
  };

  const handleScanFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
      });

      if (result.canceled || !result.assets || !result.assets[0]?.uri) {
        return;
      }

      setScanned(true);
      setVerifying(true);

      // Scan QR code from the selected image
      const scannedResults = await Camera.scanFromURLAsync(result.assets[0].uri, ['qr']);

      if (scannedResults && scannedResults.length > 0) {
        const qrData = scannedResults[0].data;
        setVerifying(false);
        verifyBooking(qrData);
      } else {
        setVerifying(false);
        Alert.alert(
          'No QR Code Found',
          'Could not detect a QR code in the selected image. Please try another image.',
          [{ text: 'OK', onPress: () => setScanned(false) }]
        );
      }
    } catch (error) {
      console.error('Gallery scan error:', error);
      setVerifying(false);
      Alert.alert(
        'Scan Failed',
        'Could not read QR code from this image. Try scanning with camera instead.',
        [{ text: 'OK', onPress: () => setScanned(false) }]
      );
    }
  };

  const handleActivateParking = async () => {
    if (!verifiedBooking) return;

    setActivating(true);

    try {
      // Update booking to active with timer
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({
          booking_status: 'active',
          is_timer_active: true,
          actual_start_time: new Date().toISOString(),
        })
        .eq('id', verifiedBooking.id);

      if (bookingError) throw bookingError;

      setShowBookingModal(false);
      Alert.alert(
        'Parking Activated!',
        `Slot ${verifiedBooking.slot_number} is now active for ${verifiedBooking.customer_name}.\n\nVehicle: ${verifiedBooking.vehicle_plate}`,
        [{ text: 'OK', onPress: () => setScanned(false) }]
      );
    } catch (error: any) {
      console.error('Activate error:', error);
      Alert.alert('Error', 'Failed to activate parking');
    } finally {
      setActivating(false);
    }
  };

  const formatTime = (time: string) => {
    const parts = time.split(':');
    const hours = parseInt(parts[0]);
    const minutes = parts[1];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes} ${ampm}`;
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Ionicons name="videocam-off-outline" size={64} color="#D1D5DB" />
        <Text style={styles.message}>No access to camera</Text>
        <Text style={styles.submessage}>Please enable camera permissions in settings</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Scan QR Code</Text>
        <Text style={styles.headerSubtitle}>Scan customer's booking QR code to verify</Text>
      </View>

      {/* Camera View */}
      <View style={styles.cameraContainer}>
        <CameraView
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Scan Frame Overlay */}
        <View style={styles.overlay}>
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
        </View>

        {/* Loading / Instructions */}
        <View style={styles.instructions}>
          {verifying ? (
            <View style={styles.verifyingContainer}>
              <ActivityIndicator size="small" color="#22C55E" />
              <Text style={styles.instructionText}>Verifying booking...</Text>
            </View>
          ) : (
            <Text style={styles.instructionText}>
              {scanned ? 'Processing...' : 'Position QR code within frame'}
            </Text>
          )}
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerButtons}>
          <TouchableOpacity
            style={styles.galleryButton}
            onPress={handleScanFromGallery}
          >
            <Ionicons name="images-outline" size={20} color="#22C55E" />
            <Text style={styles.galleryButtonText}>From Gallery</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.manualButton}
            onPress={() => setShowManualEntry(true)}
          >
            <Ionicons name="keypad-outline" size={20} color="#22C55E" />
            <Text style={styles.manualButtonText}>Enter Code</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Manual Entry Modal */}
      <Modal
        visible={showManualEntry}
        transparent
        animationType="slide"
        onRequestClose={() => setShowManualEntry(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Enter Booking Reference</Text>
              <TouchableOpacity onPress={() => setShowManualEntry(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Enter the booking reference code (e.g. PK20260329001)
            </Text>

            <View style={styles.codeInputContainer}>
              <Ionicons name="document-text-outline" size={20} color="#9CA3AF" />
              <TextInput
                style={styles.codeInput}
                placeholder="PK20260329001"
                placeholderTextColor="#D1D5DB"
                value={manualCode}
                onChangeText={setManualCode}
                autoCapitalize="characters"
                autoCorrect={false}
              />
            </View>

            <TouchableOpacity
              style={[styles.verifyButton, !manualCode.trim() && styles.verifyButtonDisabled]}
              onPress={handleManualVerify}
              disabled={!manualCode.trim()}
            >
              <Text style={styles.verifyButtonText}>VERIFY BOOKING</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Verified Booking Modal */}
      <Modal
        visible={showBookingModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowBookingModal(false);
          setScanned(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Success Header */}
            <View style={styles.verifiedHeader}>
              <View style={styles.verifiedIcon}>
                <Ionicons name="checkmark-circle" size={48} color="#22C55E" />
              </View>
              <Text style={styles.verifiedTitle}>Booking Verified</Text>
              <Text style={styles.verifiedRef}>{verifiedBooking?.booking_reference}</Text>
            </View>

            {/* Booking Details */}
            {verifiedBooking && (
              <>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>FACILITY</Text>
                  <Text style={styles.detailValue}>{verifiedBooking.facility_name}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>CUSTOMER</Text>
                  <Text style={styles.detailValue}>{verifiedBooking.customer_name}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>VEHICLE</Text>
                  <Text style={styles.detailValue}>
                    {verifiedBooking.vehicle_plate} {verifiedBooking.vehicle_model ? `• ${verifiedBooking.vehicle_model}` : ''}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>SLOT</Text>
                  <Text style={[styles.detailValue, { color: '#22C55E', fontWeight: '700' }]}>
                    {verifiedBooking.slot_number}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>DATE</Text>
                  <Text style={styles.detailValue}>{verifiedBooking.booking_date}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>TIME</Text>
                  <Text style={styles.detailValue}>
                    {formatTime(verifiedBooking.start_time)} - {formatTime(verifiedBooking.end_time)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>AMOUNT</Text>
                  <Text style={[styles.detailValue, { fontWeight: '700' }]}>
                    Rs {verifiedBooking.total_amount}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>PAYMENT</Text>
                  <View style={[
                    styles.paymentBadge,
                    verifiedBooking.payment_status === 'paid' ? styles.paymentPaid : styles.paymentPending
                  ]}>
                    <Text style={[
                      styles.paymentBadgeText,
                      verifiedBooking.payment_status === 'paid' ? { color: '#065F46' } : { color: '#92400E' }
                    ]}>
                      {verifiedBooking.payment_status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.dismissButton}
                    onPress={() => {
                      setShowBookingModal(false);
                      setScanned(false);
                    }}
                  >
                    <Text style={styles.dismissButtonText}>CLOSE</Text>
                  </TouchableOpacity>

                  {verifiedBooking.booking_status === 'confirmed' && (
                    <TouchableOpacity
                      style={[styles.activateButton, activating && { opacity: 0.7 }]}
                      onPress={handleActivateParking}
                      disabled={activating}
                    >
                      {activating ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={styles.activateButtonText}>ACTIVATE PARKING</Text>
                      )}
                    </TouchableOpacity>
                  )}

                  {verifiedBooking.booking_status === 'active' && (
                    <View style={styles.alreadyActiveTag}>
                      <Ionicons name="time" size={16} color="#1E40AF" />
                      <Text style={styles.alreadyActiveText}>ALREADY ACTIVE</Text>
                    </View>
                  )}
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, backgroundColor: 'rgba(0, 0, 0, 0.8)' },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  headerSubtitle: { fontSize: 14, color: '#D1D5DB' },
  cameraContainer: { flex: 1, position: 'relative', width: '100%' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
  scanFrame: { width: 280, height: 280, position: 'relative' },
  corner: { position: 'absolute', width: 40, height: 40, borderColor: '#22C55E' },
  topLeft: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 8 },
  topRight: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 8 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 8 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 8 },
  instructions: { position: 'absolute', bottom: 60, left: 0, right: 0, alignItems: 'center' },
  verifyingContainer: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(0, 0, 0, 0.7)', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  instructionText: { fontSize: 16, color: '#FFFFFF', fontWeight: '600', backgroundColor: 'rgba(0, 0, 0, 0.7)', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  footer: { paddingHorizontal: 20, paddingVertical: 20, backgroundColor: 'rgba(0, 0, 0, 0.8)' },
  footerButtons: { flexDirection: 'row', gap: 12 },
  galleryButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 12, paddingVertical: 16, borderWidth: 1, borderColor: '#22C55E', gap: 8 },
  galleryButtonText: { fontSize: 14, fontWeight: '600', color: '#22C55E' },
  manualButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 12, paddingVertical: 16, borderWidth: 1, borderColor: '#22C55E', gap: 8 },
  manualButtonText: { fontSize: 14, fontWeight: '600', color: '#22C55E' },
  message: { fontSize: 18, fontWeight: '600', color: '#FFFFFF', textAlign: 'center', marginTop: 20 },
  submessage: { fontSize: 14, color: '#D1D5DB', textAlign: 'center', marginTop: 8 },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  modalSubtitle: { fontSize: 14, color: '#6B7280', marginBottom: 20 },
  codeInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 16, height: 56, marginBottom: 20, gap: 10 },
  codeInput: { flex: 1, fontSize: 18, fontWeight: '600', color: '#111827', letterSpacing: 1 },
  verifyButton: { backgroundColor: '#22C55E', borderRadius: 12, height: 56, justifyContent: 'center', alignItems: 'center' },
  verifyButtonDisabled: { backgroundColor: '#D1D5DB' },
  verifyButtonText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.5 },

  // Verified booking modal
  verifiedHeader: { alignItems: 'center', marginBottom: 24, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  verifiedIcon: { marginBottom: 12 },
  verifiedTitle: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 4 },
  verifiedRef: { fontSize: 16, fontWeight: '600', color: '#22C55E' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  detailLabel: { fontSize: 12, fontWeight: '600', color: '#6B7280', letterSpacing: 0.5 },
  detailValue: { fontSize: 14, fontWeight: '500', color: '#111827' },
  paymentBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  paymentPaid: { backgroundColor: '#D1FAE5' },
  paymentPending: { backgroundColor: '#FEF3C7' },
  paymentBadgeText: { fontSize: 11, fontWeight: '700' },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 24 },
  dismissButton: { flex: 1, backgroundColor: '#E5E7EB', borderRadius: 12, height: 52, justifyContent: 'center', alignItems: 'center' },
  dismissButtonText: { fontSize: 14, fontWeight: '700', color: '#374151', letterSpacing: 0.5 },
  activateButton: { flex: 2, backgroundColor: '#22C55E', borderRadius: 12, height: 52, justifyContent: 'center', alignItems: 'center' },
  activateButtonText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.5 },
  alreadyActiveTag: { flex: 2, flexDirection: 'row', backgroundColor: '#DBEAFE', borderRadius: 12, height: 52, justifyContent: 'center', alignItems: 'center', gap: 8 },
  alreadyActiveText: { fontSize: 14, fontWeight: '700', color: '#1E40AF', letterSpacing: 0.5 },
});