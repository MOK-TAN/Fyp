import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

type SlotStatus = 'available' | 'occupied' | 'selected';

type Slot = {
  id: string;
  status: SlotStatus;
  section: string;
};

// Dummy slot data - in real app, fetch from API
const PARKING_SLOTS: Slot[] = [
  // Section A
  { id: 'A1', status: 'available', section: 'A' },
  { id: 'A2', status: 'occupied', section: 'A' },
  { id: 'A3', status: 'available', section: 'A' },
  { id: 'A4', status: 'available', section: 'A' },
  { id: 'A5', status: 'occupied', section: 'A' },
  // Section B
  { id: 'B1', status: 'available', section: 'B' },
  { id: 'B2', status: 'available', section: 'B' },
  { id: 'B3', status: 'occupied', section: 'B' },
  { id: 'B4', status: 'available', section: 'B' },
  { id: 'B5', status: 'available', section: 'B' },
  // Section C
  { id: 'C1', status: 'available', section: 'C' },
  { id: 'C2', status: 'available', section: 'C' },
  { id: 'C3', status: 'available', section: 'C' },
  { id: 'C4', status: 'occupied', section: 'C' },
  { id: 'C5', status: 'available', section: 'C' },
  // Section D
  { id: 'D1', status: 'occupied', section: 'D' },
  { id: 'D2', status: 'available', section: 'D' },
  { id: 'D3', status: 'available', section: 'D' },
  { id: 'D4', status: 'available', section: 'D' },
  { id: 'D5', status: 'occupied', section: 'D' },
];

export default function SelectSlot() {
  const params = useLocalSearchParams();
  
  const parkingId = params.parkingId as string;
  const parkingName = params.parkingName as string || 'Parking Spot';
  const pricePerHour = params.pricePerHour as string || '50';

  const [slots, setSlots] = useState(PARKING_SLOTS);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  // Handle slot selection
  const handleSlotSelect = (slotId: string, status: SlotStatus) => {
    if (status === 'occupied') return;

    // Update slots - mark previous as available, new as selected
    setSlots(prevSlots =>
      prevSlots.map(slot => {
        if (slot.id === slotId) {
          return { ...slot, status: 'selected' };
        }
        if (slot.status === 'selected') {
          return { ...slot, status: 'available' };
        }
        return slot;
      })
    );

    setSelectedSlot(slotId);
  };

  // Handle continue
  const handleContinue = () => {
    if (!selectedSlot) {
      alert('Please select a parking slot');
      return;
    }

    router.push({
      pathname: '/(user)/bookings/select-datetime',
      params: {
        parkingId,
        parkingName,
        pricePerHour,
        slotId: selectedSlot,
      }
    });
  };

  // Get slot color
  const getSlotStyle = (status: SlotStatus) => {
    switch (status) {
      case 'available':
        return styles.slotAvailable;
      case 'occupied':
        return styles.slotOccupied;
      case 'selected':
        return styles.slotSelected;
      default:
        return styles.slotAvailable;
    }
  };

  // Group slots by section
  const groupedSlots = slots.reduce((acc, slot) => {
    if (!acc[slot.section]) {
      acc[slot.section] = [];
    }
    acc[slot.section].push(slot);
    return acc;
  }, {} as Record<string, Slot[]>);

  const availableCount = slots.filter(s => s.status === 'available').length;
  const occupiedCount = slots.filter(s => s.status === 'occupied').length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Parking Slot</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Parking Info */}
        <View style={styles.infoCard}>
          <Text style={styles.parkingName}>{parkingName}</Text>
          <Text style={styles.priceText}>Rs {pricePerHour}/hour</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <View style={[styles.statDot, { backgroundColor: '#22C55E' }]} />
            <Text style={styles.statText}>Available ({availableCount})</Text>
          </View>
          <View style={styles.statItem}>
            <View style={[styles.statDot, { backgroundColor: '#9CA3AF' }]} />
            <Text style={styles.statText}>Occupied ({occupiedCount})</Text>
          </View>
          <View style={styles.statItem}>
            <View style={[styles.statDot, { backgroundColor: '#3B82F6' }]} />
            <Text style={styles.statText}>Selected</Text>
          </View>
        </View>

        {/* Selected Slot Display */}
        {selectedSlot && (
          <View style={styles.selectedCard}>
            <Ionicons name="checkmark-circle" size={24} color="#22C55E" />
            <Text style={styles.selectedText}>Selected Slot: {selectedSlot}</Text>
          </View>
        )}

        {/* Parking Layout */}
        <View style={styles.layoutCard}>
          <View style={styles.layoutHeader}>
            <Ionicons name="car-outline" size={24} color="#333" />
            <Text style={styles.layoutTitle}>Parking Layout</Text>
          </View>

          {/* Entrance Indicator */}
          <View style={styles.entranceIndicator}>
            <Ionicons name="arrow-down" size={20} color="#22C55E" />
            <Text style={styles.entranceText}>ENTRANCE</Text>
            <Ionicons name="arrow-down" size={20} color="#22C55E" />
          </View>

          {/* Slots by Section */}
          {Object.keys(groupedSlots).sort().map((section) => (
            <View key={section} style={styles.sectionContainer}>
              <Text style={styles.sectionLabel}>Section {section}</Text>
              <View style={styles.slotGrid}>
                {groupedSlots[section].map((slot) => (
                  <TouchableOpacity
                    key={slot.id}
                    style={[styles.slot, getSlotStyle(slot.status)]}
                    onPress={() => handleSlotSelect(slot.id, slot.status)}
                    disabled={slot.status === 'occupied'}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.slotText,
                      slot.status === 'occupied' && styles.slotTextOccupied
                    ]}>
                      {slot.id}
                    </Text>
                    {slot.status === 'selected' && (
                      <Ionicons name="checkmark" size={16} color="#fff" style={styles.checkIcon} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}

          {/* Exit Indicator */}
          <View style={styles.exitIndicator}>
            <Ionicons name="arrow-up" size={20} color="#EF4444" />
            <Text style={styles.exitText}>EXIT</Text>
            <Ionicons name="arrow-up" size={20} color="#EF4444" />
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>Instructions</Text>
          <View style={styles.instructionItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.instructionText}>
              Tap on an available (green) slot to select
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.instructionText}>
              Gray slots are currently occupied
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.instructionText}>
              Your selected slot will be reserved for 5 minutes
            </Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            !selectedSlot && styles.continueButtonDisabled
          ]}
          onPress={handleContinue}
          disabled={!selectedSlot}
          activeOpacity={0.8}
        >
          <Text style={styles.continueText}>Continue</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  parkingName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  priceText: {
    fontSize: 14,
    color: '#22C55E',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  statText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  selectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#22C55E',
  },
  selectedText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#22C55E',
    marginLeft: 12,
  },
  layoutCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  layoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  layoutTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginLeft: 8,
  },
  entranceIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginBottom: 16,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
  },
  entranceText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#22C55E',
    marginHorizontal: 12,
    letterSpacing: 1,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  slot: {
    width: 60,
    height: 60,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    position: 'relative',
  },
  slotAvailable: {
    backgroundColor: '#F0FDF4',
    borderColor: '#22C55E',
  },
  slotOccupied: {
    backgroundColor: '#F3F4F6',
    borderColor: '#9CA3AF',
  },
  slotSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#2563EB',
  },
  slotText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#22C55E',
  },
  slotTextOccupied: {
    color: '#9CA3AF',
  },
  checkIcon: {
    position: 'absolute',
    top: 2,
    right: 2,
  },
  exitIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
  },
  exitText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
    marginHorizontal: 12,
    letterSpacing: 1,
  },
  instructionsCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  instructionItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  bullet: {
    fontSize: 16,
    color: '#6B7280',
    marginRight: 8,
    fontWeight: '700',
  },
  instructionText: {
    fontSize: 13,
    color: '#6B7280',
    flex: 1,
    lineHeight: 18,
  },
  footer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  continueButton: {
    flexDirection: 'row',
    backgroundColor: '#22C55E',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonDisabled: {
    backgroundColor: '#D1D5DB',
    shadowOpacity: 0,
    elevation: 0,
  },
  continueText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
    marginRight: 8,
  },
});