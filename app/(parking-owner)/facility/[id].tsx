import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
    Modal,
    ScrollView,
    Switch,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { styles } from './[id].styles';

type Slot = {
  id: string;
  slot_number: string;
  section: string;
  is_available: boolean;
  is_occupied: boolean;
  current_booking?: {
    vehicle_plate: string;
    time_left: string;
  };
};

export default function SlotManager() {
  const params = useLocalSearchParams();
  const facilityId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [facilityName, setFacilityName] = useState('Thamel Central Parking');
  const [totalSlots, setTotalSlots] = useState(120);
  const [occupiedSlots, setOccupiedSlots] = useState(84);
  const [selectedFloor, setSelectedFloor] = useState('A');
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // Dummy slots data - will be replaced with Supabase later
  const [slots, setSlots] = useState<Slot[]>([
    { id: '1', slot_number: 'A1', section: 'A', is_available: false, is_occupied: true },
    { id: '2', slot_number: 'A2', section: 'A', is_available: false, is_occupied: true },
    { id: '3', slot_number: 'A3', section: 'A', is_available: true, is_occupied: false },
    { id: '4', slot_number: 'A4', section: 'A', is_available: false, is_occupied: false },
    { id: '5', slot_number: 'B1', section: 'A', is_available: false, is_occupied: true },
    { id: '6', slot_number: 'B2', section: 'A', is_available: false, is_occupied: true },
    { id: '7', slot_number: 'B3', section: 'A', is_available: false, is_occupied: false },
    { id: '8', slot_number: 'B4', section: 'A', is_available: true, is_occupied: false },
    { id: '9', slot_number: 'C1', section: 'A', is_available: true, is_occupied: false },
    { id: '10', slot_number: 'C2', section: 'A', is_available: false, is_occupied: true },
    { id: '11', slot_number: 'C3', section: 'A', is_available: true, is_occupied: false },
    { id: '12', slot_number: 'C4', section: 'A', is_available: true, is_occupied: false },
    { id: '13', slot_number: 'D1', section: 'A', is_available: false, is_occupied: true },
    { id: '14', slot_number: 'D2', section: 'A', is_available: false, is_occupied: true },
    { id: '15', slot_number: 'D3', section: 'A', is_available: true, is_occupied: false },
    { id: '16', slot_number: 'D4', section: 'A', is_available: true, is_occupied: false },
  ]);

  const availableSlots = totalSlots - occupiedSlots;
  const occupancyPercentage = Math.round((occupiedSlots / totalSlots) * 100);

  const handleSlotPress = (slot: Slot) => {
    setSelectedSlot({
      ...slot,
      current_booking: slot.is_occupied ? {
        vehicle_plate: 'BA-1-PA-1234',
        time_left: '45m',
      } : undefined,
    });
    setShowSlotModal(true);
  };

  const handleWalkInBooking = () => {
    // Navigate to walk-in booking form
    // router.push('/parking-owner/walk-in');
  };

  const handleReleaseSlot = () => {
    if (selectedSlot) {
      // TODO: Release slot in database
      const updatedSlots = slots.map(s =>
        s.id === selectedSlot.id
          ? { ...s, is_available: true, is_occupied: false }
          : s
      );
      setSlots(updatedSlots);
      setOccupiedSlots(prev => prev - 1);
      setShowSlotModal(false);
    }
  };

  const handleNotifyUser = () => {
    // TODO: Send notification to user
    alert('Notification sent to user');
    setShowSlotModal(false);
  };

  const getSlotStyle = (slot: Slot) => {
    if (!slot.is_available && !slot.is_occupied) {
      return styles.slotInactive; // Gray - Inactive
    }
    if (slot.is_occupied) {
      return styles.slotOccupied; // Red - Occupied
    }
    if (selectedSlot?.id === slot.id) {
      return styles.slotSelected; // Blue - Selected
    }
    return styles.slotAvailable; // Green - Available
  };

  const getSlotBorderStyle = (slot: Slot) => {
    if (!slot.is_available && !slot.is_occupied) {
      return styles.slotBorderInactive;
    }
    if (slot.is_occupied) {
      return styles.slotBorderOccupied;
    }
    if (selectedSlot?.id === slot.id) {
      return styles.slotBorderSelected;
    }
    return styles.slotBorderAvailable;
  };

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
        <TouchableOpacity>
          <Ionicons name="notifications-outline" size={24} color="#111827" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Walk-in Booking Button */}
        <TouchableOpacity style={styles.walkInButton} onPress={handleWalkInBooking}>
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
            <Text style={[styles.statValue, { color: '#EF4444' }]}>
              {occupiedSlots}
            </Text>
            <Text style={styles.statPercentage}>{occupancyPercentage}%</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>AVAILABLE</Text>
            <Text style={[styles.statValue, { color: '#22C55E' }]}>
              {availableSlots}
            </Text>
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

        {/* Floor Selector */}
        <View style={styles.floorSelector}>
          <Text style={styles.floorLabel}>FLOOR A</Text>
          <View style={styles.floorTabs}>
            <TouchableOpacity
              style={[styles.floorTab, selectedFloor === 'A' && styles.floorTabActive]}
              onPress={() => setSelectedFloor('A')}
            >
              <Text style={[styles.floorTabText, selectedFloor === 'A' && styles.floorTabTextActive]}>
                Floor A
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.floorTab, selectedFloor === 'B' && styles.floorTabActive]}
              onPress={() => setSelectedFloor('B')}
            >
              <Text style={[styles.floorTabText, selectedFloor === 'B' && styles.floorTabTextActive]}>
                Floor B
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Slot Grid */}
        <View style={styles.slotGrid}>
          {slots.map((slot) => (
            <TouchableOpacity
              key={slot.id}
              style={[styles.slotBox, getSlotStyle(slot), getSlotBorderStyle(slot)]}
              onPress={() => handleSlotPress(slot)}
            >
              <Text style={[
                styles.slotText,
                slot.is_occupied && styles.slotTextOccupied,
                selectedSlot?.id === slot.id && styles.slotTextSelected,
              ]}>
                {slot.slot_number}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Save Layout Button */}
        <TouchableOpacity style={styles.saveButton}>
          <Ionicons name="save-outline" size={20} color="#6B7280" />
          <Text style={styles.saveButtonText}>SAVE LAYOUT CHANGES</Text>
        </TouchableOpacity>

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
                    {selectedSlot?.is_occupied ? 'OCCUPIED' : 'AVAILABLE'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowSlotModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Modal Body */}
            {selectedSlot?.is_occupied && selectedSlot.current_booking ? (
              <>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>VEHICLE</Text>
                  <Text style={styles.modalValue}>{selectedSlot.current_booking.vehicle_plate}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>TIME LEFT</Text>
                  <Text style={[styles.modalValue, { color: '#22C55E', fontWeight: '700' }]}>
                    {selectedSlot.current_booking.time_left}
                  </Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>MAINTENANCE MODE</Text>
                  <Switch
                    value={maintenanceMode}
                    onValueChange={setMaintenanceMode}
                    trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
                    thumbColor={maintenanceMode ? '#22C55E' : '#F3F4F6'}
                  />
                </View>

                {/* Action Buttons */}
                <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.releaseButton} onPress={handleReleaseSlot}>
                    <Text style={styles.releaseButtonText}>RELEASE SLOT</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.notifyButton} onPress={handleNotifyUser}>
                    <Text style={styles.notifyButtonText}>NOTIFY USER</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View style={styles.emptySlot}>
                <Text style={styles.emptySlotText}>This slot is available</Text>
                <TouchableOpacity style={styles.walkInSmallButton} onPress={handleWalkInBooking}>
                  <Text style={styles.walkInSmallButtonText}>Book for Walk-in</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}