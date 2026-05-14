import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { supabase } from '../../../lib/supabase';
import { styles } from './[id].styles';

type Slot = {
  id: string;
  slot_number: string;
  section: string;
  is_available: boolean;
  is_occupied: boolean;
  current_booking_id: string | null;
  current_booking?: {
    booking_reference: string;
    vehicle_plate: string;
    customer_name: string;
    start_time: string;
    end_time: string;
    booking_date: string;
    total_amount: number;
  };
};

const DURATION_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function SlotManager() {
  const params = useLocalSearchParams();
  const facilityId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [facilityName, setFacilityName] = useState('');
  const [facilityOwnerId, setFacilityOwnerId] = useState<string>('');
  const [pricePerHour, setPricePerHour] = useState<number>(0);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [sections, setSections] = useState<string[]>([]);
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // Walk-in state
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [showSlotPickerModal, setShowSlotPickerModal] = useState(false);
  const [walkInSlot, setWalkInSlot] = useState<Slot | null>(null);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestPlate, setGuestPlate] = useState('');
  const [walkInDuration, setWalkInDuration] = useState<number>(1);
  const [walkInPaid, setWalkInPaid] = useState<boolean>(true);
  const [creatingWalkIn, setCreatingWalkIn] = useState(false);

  useEffect(() => {
    fetchFacilityData();
  }, [facilityId]);

  const fetchFacilityData = async () => {
    try {
      setLoading(true);

      // Get facility name + owner + price
      const { data: facility } = await supabase
        .from('parking_facilities')
        .select('name, owner_id, price_per_hour')
        .eq('id', facilityId)
        .single();

      if (facility) {
        setFacilityName(facility.name);
        setFacilityOwnerId((facility as any).owner_id);
        setPricePerHour(Number((facility as any).price_per_hour) || 0);
      }

      // Get all slots for this facility
      const { data: slotsData, error } = await supabase
        .from('parking_slots')
        .select('*')
        .eq('facility_id', facilityId)
        .order('slot_number', { ascending: true });

      if (error) throw error;

      if (slotsData) {
        setSlots(slotsData);

        // Extract unique sections
        const uniqueSections = [...new Set(slotsData.map(s => s.section || 'A'))].sort();
        setSections(uniqueSections);
        if (uniqueSections.length > 0 && !selectedSection) {
          setSelectedSection(uniqueSections[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching facility data:', error);
      Alert.alert('Error', 'Failed to load slots');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchFacilityData();
  };

  const handleSlotPress = async (slot: Slot) => {
    if (slot.is_occupied && slot.current_booking_id) {
      // Fetch real booking details for this slot
      try {
        const { data: booking } = await supabase
          .from('bookings')
          .select(`
            booking_reference,
            start_time,
            end_time,
            booking_date,
            total_amount,
            is_walkin,
            guest_name,
            guest_plate,
            vehicles (plate_number),
            profiles (full_name)
          `)
          .eq('id', slot.current_booking_id)
          .single();

        if (booking) {
          const b: any = booking;
          setSelectedSlot({
            ...slot,
            current_booking: {
              booking_reference: b.booking_reference,
              vehicle_plate: b.is_walkin ? (b.guest_plate || 'N/A') : (b.vehicles?.plate_number || 'N/A'),
              customer_name: b.is_walkin ? (b.guest_name || 'Walk-in Guest') : (b.profiles?.full_name || 'Guest'),
              start_time: b.start_time,
              end_time: b.end_time,
              booking_date: b.booking_date,
              total_amount: b.total_amount,
            },
          });
        } else {
          setSelectedSlot(slot);
        }
      } catch (error) {
        console.error('Error fetching booking:', error);
        setSelectedSlot(slot);
      }
    } else {
      setSelectedSlot(slot);
    }

    setShowSlotModal(true);
  };

  const handleReleaseSlot = async () => {
    if (!selectedSlot) return;

    Alert.alert(
      'Release Slot',
      `Are you sure you want to release slot ${selectedSlot.slot_number}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Release',
          style: 'destructive',
          onPress: async () => {
            try {
              // Update slot in DB
              const { error: slotError } = await supabase
                .from('parking_slots')
                .update({
                  is_available: true,
                  is_occupied: false,
                  current_booking_id: null,
                })
                .eq('id', selectedSlot.id);

              if (slotError) throw slotError;

              // If there was a booking, mark it as completed
              if (selectedSlot.current_booking_id) {
                await supabase
                  .from('bookings')
                  .update({
                    booking_status: 'completed',
                    is_timer_active: false,
                    actual_end_time: new Date().toISOString(),
                  })
                  .eq('id', selectedSlot.current_booking_id);
              }

              // Update local state
              setSlots(prev =>
                prev.map(s =>
                  s.id === selectedSlot.id
                    ? { ...s, is_available: true, is_occupied: false, current_booking_id: null }
                    : s
                )
              );

              setShowSlotModal(false);
              Alert.alert('Success', `Slot ${selectedSlot.slot_number} released`);
            } catch (error: any) {
              console.error('Release error:', error);
              Alert.alert('Error', 'Failed to release slot');
            }
          },
        },
      ]
    );
  };

  const handleToggleAvailability = async () => {
    if (!selectedSlot || selectedSlot.is_occupied) return;

    try {
      const newAvailability = !selectedSlot.is_available;

      const { error } = await supabase
        .from('parking_slots')
        .update({ is_available: newAvailability })
        .eq('id', selectedSlot.id);

      if (error) throw error;

      // Update local state
      setSlots(prev =>
        prev.map(s =>
          s.id === selectedSlot.id
            ? { ...s, is_available: newAvailability }
            : s
        )
      );

      setSelectedSlot(prev => prev ? { ...prev, is_available: newAvailability } : null);

      Alert.alert('Success', `Slot ${selectedSlot.slot_number} ${newAvailability ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Toggle error:', error);
      Alert.alert('Error', 'Failed to update slot');
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

  const calculateTimeLeft = (endTime: string, bookingDate: string) => {
    const end = new Date(`${bookingDate}T${endTime}`);
    const now = new Date();
    const diffMs = end.getTime() - now.getTime();

    if (diffMs <= 0) return 'Expired';

    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m left`;

    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m left`;
  };

  // ===== Walk-in handlers =====

  const resetWalkInForm = () => {
    setGuestName('');
    setGuestPhone('');
    setGuestPlate('');
    setWalkInDuration(1);
    setWalkInPaid(true);
  };

  const openWalkInFromTop = () => {
    // From top button: pick a slot first
    setShowSlotPickerModal(true);
  };

  const openWalkInFromModal = () => {
    // From slot modal: slot already chosen
    if (!selectedSlot) return;
    setWalkInSlot(selectedSlot);
    setShowSlotModal(false);
    resetWalkInForm();
    setShowWalkInModal(true);
  };

  const pickWalkInSlot = (slot: Slot) => {
    setWalkInSlot(slot);
    setShowSlotPickerModal(false);
    resetWalkInForm();
    setShowWalkInModal(true);
  };

  const handleCreateWalkIn = async () => {
    if (!walkInSlot) return;

    // Validate
    if (!guestName.trim()) {
      Alert.alert('Missing Info', 'Please enter guest name');
      return;
    }
    if (!guestPlate.trim()) {
      Alert.alert('Missing Info', 'Please enter vehicle plate');
      return;
    }
    if (!facilityOwnerId) {
      Alert.alert('Error', 'Facility owner not loaded, try refreshing');
      return;
    }

    try {
      setCreatingWalkIn(true);

      // Compute times
      const now = new Date();
      const end = new Date(now.getTime() + walkInDuration * 60 * 60 * 1000);

      const pad = (n: number) => n.toString().padStart(2, '0');
      const bookingDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
      const startTime = `${pad(now.getHours())}:${pad(now.getMinutes())}:00`;
      const endTime = `${pad(end.getHours())}:${pad(end.getMinutes())}:00`;

      const basePrice = walkInDuration * pricePerHour;
      const totalAmount = basePrice;

      const bookingRef = `WI-${Date.now().toString().slice(-8)}`;

      // 1. Insert booking
      const { data: newBooking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          user_id: facilityOwnerId, // owner books on behalf of guest
          facility_id: facilityId,
          slot_id: walkInSlot.id,
          vehicle_id: null, // walk-in has no vehicle row
          booking_reference: bookingRef,
          booking_date: bookingDate,
          start_time: startTime,
          end_time: endTime,
          actual_start_time: now.toISOString(),
          duration_hours: walkInDuration,
          base_price: basePrice,
          service_fee: 0,
          total_amount: totalAmount,
          payment_method: 'cash',
          payment_status: walkInPaid ? 'paid' : 'pending',
          booking_status: 'confirmed',
          is_timer_active: true,
          is_walkin: true,
          guest_name: guestName.trim(),
          guest_phone: guestPhone.trim() || null,
          guest_plate: guestPlate.trim().toUpperCase(),
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      // 2. Mark slot occupied
      const { error: slotError } = await supabase
        .from('parking_slots')
        .update({
          is_occupied: true,
          is_available: false,
          current_booking_id: newBooking.id,
        })
        .eq('id', walkInSlot.id);

      if (slotError) throw slotError;

      // 3. Update local state
      setSlots(prev =>
        prev.map(s =>
          s.id === walkInSlot.id
            ? { ...s, is_occupied: true, is_available: false, current_booking_id: newBooking.id }
            : s
        )
      );

      setShowWalkInModal(false);
      setWalkInSlot(null);
      Alert.alert(
        'Walk-in Booked',
        `Slot ${walkInSlot.slot_number} occupied for ${guestName}\nRef: ${bookingRef}\nPayment: ${walkInPaid ? 'PAID' : 'PENDING'}`
      );
    } catch (error: any) {
      console.error('Walk-in error:', error);
      Alert.alert('Error', error.message || 'Failed to create walk-in booking');
    } finally {
      setCreatingWalkIn(false);
    }
  };

  // Filter slots by selected section
  const filteredSlots = slots.filter(s => (s.section || 'A') === selectedSection);

  // Available slots for picker
  const availableSlotsForPicker = slots.filter(s => s.is_available && !s.is_occupied);

  // Calculate stats from real data
  const totalSlots = slots.length;
  const occupiedSlots = slots.filter(s => s.is_occupied).length;
  const availableSlots = slots.filter(s => s.is_available && !s.is_occupied).length;
  const occupancyPercentage = totalSlots > 0 ? Math.round((occupiedSlots / totalSlots) * 100) : 0;

  const getSlotStyle = (slot: Slot) => {
    if (!slot.is_available && !slot.is_occupied) return styles.slotInactive;
    if (slot.is_occupied) return styles.slotOccupied;
    if (selectedSlot?.id === slot.id) return styles.slotSelected;
    return styles.slotAvailable;
  };

  const getSlotBorderStyle = (slot: Slot) => {
    if (!slot.is_available && !slot.is_occupied) return styles.slotBorderInactive;
    if (slot.is_occupied) return styles.slotBorderOccupied;
    if (selectedSlot?.id === slot.id) return styles.slotBorderSelected;
    return styles.slotBorderAvailable;
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' }}>
        <ActivityIndicator size="large" color="#22C55E" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Slot Manager</Text>
          <Text style={styles.headerSubtitle}>{facilityName}</Text>
        </View>
        <TouchableOpacity onPress={onRefresh}>
          <Ionicons name="refresh-outline" size={24} color="#111827" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22C55E" />
        }
      >
        {/* Walk-in Booking Button */}
        <TouchableOpacity style={styles.walkInButton} onPress={openWalkInFromTop}>
          <Ionicons name="add-circle" size={24} color="#FFFFFF" />
          <Text style={styles.walkInButtonText}>WALK-IN BOOKING</Text>
        </TouchableOpacity>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>TOTAL</Text>
            <Text style={styles.statValue}>{totalSlots}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>OCCUPIED</Text>
            <Text style={[styles.statValue, { color: '#EF4444' }]}>{occupiedSlots}</Text>
            <Text style={styles.statPercentage}>{occupancyPercentage}%</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>AVAILABLE</Text>
            <Text style={[styles.statValue, { color: '#22C55E' }]}>{availableSlots}</Text>
          </View>
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, { backgroundColor: '#D1FAE5', borderColor: '#22C55E' }]} />
            <Text style={styles.legendText}>Available</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, { backgroundColor: '#FEE2E2', borderColor: '#EF4444' }]} />
            <Text style={styles.legendText}>Occupied</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, { backgroundColor: '#DBEAFE', borderColor: '#3B82F6' }]} />
            <Text style={styles.legendText}>Selected</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, { backgroundColor: '#F3F4F6', borderColor: '#9CA3AF' }]} />
            <Text style={styles.legendText}>Inactive</Text>
          </View>
        </View>

        {/* Section Selector (dynamic from DB) */}
        {sections.length > 1 && (
          <View style={styles.floorSelector}>
            <Text style={styles.floorLabel}>SECTION</Text>
            <View style={styles.floorTabs}>
              {sections.map((section) => (
                <TouchableOpacity
                  key={section}
                  style={[styles.floorTab, selectedSection === section && styles.floorTabActive]}
                  onPress={() => setSelectedSection(section)}
                >
                  <Text style={[styles.floorTabText, selectedSection === section && styles.floorTabTextActive]}>
                    Section {section}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Slot Grid */}
        <View style={styles.slotGrid}>
          {filteredSlots.map((slot) => (
            <TouchableOpacity
              key={slot.id}
              style={[styles.slotBox, getSlotStyle(slot), getSlotBorderStyle(slot)]}
              onPress={() => handleSlotPress(slot)}
            >
              <Text style={[
                styles.slotText,
                slot.is_occupied && styles.slotTextOccupied,
                selectedSlot?.id === slot.id && styles.slotTextSelected,
                !slot.is_available && !slot.is_occupied && { color: '#9CA3AF' },
              ]}>
                {slot.slot_number}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {filteredSlots.length === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Ionicons name="grid-outline" size={48} color="#D1D5DB" />
            <Text style={{ color: '#9CA3AF', marginTop: 12 }}>No slots in this section</Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Slot Details Modal */}
      <Modal
        visible={showSlotModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSlotModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalSlotInfo}>
                <View style={[
                  styles.modalSlotIcon,
                  selectedSlot?.is_occupied ? styles.slotOccupied : styles.slotAvailable,
                  selectedSlot?.is_occupied ? styles.slotBorderOccupied : styles.slotBorderAvailable,
                ]}>
                  <Text style={[
                    styles.modalSlotNumber,
                    selectedSlot?.is_occupied && styles.slotTextOccupied,
                  ]}>
                    {selectedSlot?.slot_number}
                  </Text>
                </View>
                <View>
                  <Text style={styles.modalSlotTitle}>Slot {selectedSlot?.slot_number}</Text>
                  <Text style={[
                    styles.modalSlotStatus,
                    selectedSlot?.is_occupied ? { color: '#EF4444' } : { color: '#22C55E' },
                  ]}>
                    {selectedSlot?.is_occupied ? 'OCCUPIED' : selectedSlot?.is_available ? 'AVAILABLE' : 'INACTIVE'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowSlotModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Modal Body — Occupied Slot */}
            {selectedSlot?.is_occupied && selectedSlot.current_booking ? (
              <>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>BOOKING REF</Text>
                  <Text style={styles.modalValue}>{selectedSlot.current_booking.booking_reference}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>CUSTOMER</Text>
                  <Text style={styles.modalValue}>{selectedSlot.current_booking.customer_name}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>VEHICLE</Text>
                  <Text style={styles.modalValue}>{selectedSlot.current_booking.vehicle_plate}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>TIME</Text>
                  <Text style={styles.modalValue}>
                    {formatTime(selectedSlot.current_booking.start_time)} - {formatTime(selectedSlot.current_booking.end_time)}
                  </Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>TIME LEFT</Text>
                  <Text style={[styles.modalValue, { color: '#22C55E', fontWeight: '700' }]}>
                    {calculateTimeLeft(selectedSlot.current_booking.end_time, selectedSlot.current_booking.booking_date)}
                  </Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>AMOUNT</Text>
                  <Text style={[styles.modalValue, { fontWeight: '700' }]}>
                    Rs {selectedSlot.current_booking.total_amount}
                  </Text>
                </View>

                {/* Action Buttons */}
                <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.releaseButton} onPress={handleReleaseSlot}>
                    <Text style={styles.releaseButtonText}>RELEASE SLOT</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.notifyButton} onPress={() => {
                    Alert.alert('Notification Sent', 'Customer has been notified');
                    setShowSlotModal(false);
                  }}>
                    <Text style={styles.notifyButtonText}>NOTIFY USER</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              /* Modal Body — Available/Inactive Slot */
              <View style={styles.emptySlot}>
                <Text style={styles.emptySlotText}>
                  {selectedSlot?.is_available ? 'This slot is available' : 'This slot is inactive'}
                </Text>

                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>MAINTENANCE MODE</Text>
                  <Switch
                    value={!selectedSlot?.is_available}
                    onValueChange={handleToggleAvailability}
                    trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
                    thumbColor={!selectedSlot?.is_available ? '#22C55E' : '#F3F4F6'}
                  />
                </View>

                {selectedSlot?.is_available && (
                  <TouchableOpacity style={styles.walkInSmallButton} onPress={openWalkInFromModal}>
                    <Text style={styles.walkInSmallButtonText}>Book for Walk-in</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Slot Picker Modal (top button flow) */}
      <Modal
        visible={showSlotPickerModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSlotPickerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalSlotTitle}>Pick a Slot</Text>
              <TouchableOpacity onPress={() => setShowSlotPickerModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {availableSlotsForPicker.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 30 }}>
                <Ionicons name="alert-circle-outline" size={48} color="#D1D5DB" />
                <Text style={{ color: '#9CA3AF', marginTop: 12 }}>No available slots</Text>
              </View>
            ) : (
              <ScrollView style={{ maxHeight: 400 }}>
                <View style={styles.slotGrid}>
                  {availableSlotsForPicker.map((slot) => (
                    <TouchableOpacity
                      key={slot.id}
                      style={[styles.slotBox, styles.slotAvailable, styles.slotBorderAvailable]}
                      onPress={() => pickWalkInSlot(slot)}
                    >
                      <Text style={styles.slotText}>{slot.slot_number}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Walk-in Form Modal */}
      <Modal
        visible={showWalkInModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowWalkInModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalSlotTitle}>Walk-in Booking</Text>
                <Text style={styles.modalSlotStatus}>Slot {walkInSlot?.slot_number}</Text>
              </View>
              <TouchableOpacity onPress={() => setShowWalkInModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 500 }}>
              {/* Guest Name */}
              <View style={{ marginTop: 12 }}>
                <Text style={styles.modalLabel}>GUEST NAME *</Text>
                <TextInput
                  value={guestName}
                  onChangeText={setGuestName}
                  placeholder="John Doe"
                  placeholderTextColor="#9CA3AF"
                  style={{
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                    borderRadius: 8,
                    padding: 12,
                    marginTop: 6,
                    fontSize: 15,
                    color: '#111827',
                  }}
                />
              </View>

              {/* Phone */}
              <View style={{ marginTop: 12 }}>
                <Text style={styles.modalLabel}>PHONE</Text>
                <TextInput
                  value={guestPhone}
                  onChangeText={setGuestPhone}
                  placeholder="98XXXXXXXX"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                  style={{
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                    borderRadius: 8,
                    padding: 12,
                    marginTop: 6,
                    fontSize: 15,
                    color: '#111827',
                  }}
                />
              </View>

              {/* Plate */}
              <View style={{ marginTop: 12 }}>
                <Text style={styles.modalLabel}>VEHICLE PLATE *</Text>
                <TextInput
                  value={guestPlate}
                  onChangeText={setGuestPlate}
                  placeholder="BA 1 PA 1234"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="characters"
                  style={{
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                    borderRadius: 8,
                    padding: 12,
                    marginTop: 6,
                    fontSize: 15,
                    color: '#111827',
                  }}
                />
              </View>

              {/* Duration picker */}
              <View style={{ marginTop: 16 }}>
                <Text style={styles.modalLabel}>DURATION</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                  {DURATION_OPTIONS.map((h) => {
                    const active = walkInDuration === h;
                    return (
                      <TouchableOpacity
                        key={h}
                        onPress={() => setWalkInDuration(h)}
                        style={{
                          paddingHorizontal: 16,
                          paddingVertical: 10,
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: active ? '#22C55E' : '#E5E7EB',
                          backgroundColor: active ? '#D1FAE5' : '#FFFFFF',
                        }}
                      >
                        <Text style={{
                          color: active ? '#15803D' : '#374151',
                          fontWeight: active ? '700' : '500',
                        }}>
                          {h}h
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Payment Status toggle */}
              <View style={{ marginTop: 16 }}>
                <Text style={styles.modalLabel}>PAYMENT STATUS</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                  <TouchableOpacity
                    onPress={() => setWalkInPaid(true)}
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: walkInPaid ? '#22C55E' : '#E5E7EB',
                      backgroundColor: walkInPaid ? '#D1FAE5' : '#FFFFFF',
                      alignItems: 'center',
                      flexDirection: 'row',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color={walkInPaid ? '#15803D' : '#9CA3AF'}
                    />
                    <Text style={{
                      color: walkInPaid ? '#15803D' : '#374151',
                      fontWeight: walkInPaid ? '700' : '500',
                    }}>
                      PAID
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setWalkInPaid(false)}
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: !walkInPaid ? '#F59E0B' : '#E5E7EB',
                      backgroundColor: !walkInPaid ? '#FEF3C7' : '#FFFFFF',
                      alignItems: 'center',
                      flexDirection: 'row',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    <Ionicons
                      name="time-outline"
                      size={18}
                      color={!walkInPaid ? '#B45309' : '#9CA3AF'}
                    />
                    <Text style={{
                      color: !walkInPaid ? '#B45309' : '#374151',
                      fontWeight: !walkInPaid ? '700' : '500',
                    }}>
                      UNPAID
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Total */}
              <View style={[styles.modalRow, { marginTop: 16 }]}>
                <Text style={styles.modalLabel}>TOTAL</Text>
                <Text style={[styles.modalValue, { fontWeight: '700', fontSize: 18 }]}>
                  Rs {walkInDuration * pricePerHour}
                </Text>
              </View>

              {/* Confirm */}
              <TouchableOpacity
                onPress={handleCreateWalkIn}
                disabled={creatingWalkIn}
                style={{
                  backgroundColor: creatingWalkIn ? '#9CA3AF' : '#22C55E',
                  padding: 16,
                  borderRadius: 10,
                  alignItems: 'center',
                  marginTop: 20,
                  marginBottom: 10,
                }}
              >
                {creatingWalkIn ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15 }}>
                    CONFIRM WALK-IN BOOKING
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

