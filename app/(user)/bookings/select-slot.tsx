import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../../../lib/supabase';
import { styles } from './select-slots.styles';

type SlotStatus = 'available' | 'occupied' | 'selected';

type Slot = {
  id: string;
  slot_number: string;
  status: SlotStatus;
  section: string;
  is_available: boolean;
};

export default function SelectSlot() {
  const params = useLocalSearchParams();
  
  const parkingId = params.parkingId as string;
  const parkingName = params.parkingName as string || 'Parking Spot';
  const pricePerHour = params.pricePerHour as string || '50';

  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSlots();
  }, [parkingId]);

  const fetchSlots = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('parking_slots')
        .select('*')
        .eq('facility_id', parkingId)
        .order('slot_number', { ascending: true });

      if (error) throw error;

      if (data) {
        const formattedSlots: Slot[] = data.map(slot => ({
          id: slot.id,
          slot_number: slot.slot_number,
          status: slot.is_available ? 'available' : 'occupied',
          section: slot.section,
          is_available: slot.is_available,
        }));

        setSlots(formattedSlots);
      }
    } catch (error: any) {
      console.error('Error fetching slots:', error);
      Alert.alert('Error', 'Failed to load parking slots');
    } finally {
      setLoading(false);
    }
  };

  const handleSlotSelect = (slotId: string, status: SlotStatus) => {
    if (status === 'occupied') return;

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

  const handleContinue = () => {
    if (!selectedSlot) {
      Alert.alert('Error', 'Please select a parking slot');
      return;
    }

    // router.push({
    //   pathname: '/(user)/bookings/select-datetime',
    //   params: {
    //     parkingId,
    //     parkingName,
    //     pricePerHour,
    //     slotId: selectedSlot,
    //   }
    // });

    const selected = slots.find(s => s.id === selectedSlot);

    router.push({
      pathname: '/(user)/bookings/select-datetime',
      params: {
        parkingId,
        parkingName,
        pricePerHour,
        slotId: selectedSlot,
        slotNumber: selected
          ? (/[A-Za-z]/.test(String(selected.slot_number))
              ? selected.slot_number
              : `${(selected.section || 'A').toUpperCase()}${selected.slot_number}`)
          : '',
      }
    });
  };

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

  const groupedSlots = slots.reduce((acc, slot) => {
    if (!acc[slot.section]) {
      acc[slot.section] = [];
    }
    acc[slot.section].push(slot);
    return acc;
  }, {} as Record<string, Slot[]>);

  const availableCount = slots.filter(s => s.status === 'available').length;
  const occupiedCount = slots.filter(s => s.status === 'occupied').length;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#22C55E" />
        <Text style={styles.loadingText}>Loading parking slots...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
        <View style={styles.infoCard}>
          <Text style={styles.parkingName}>{parkingName}</Text>
          <Text style={styles.priceText}>Rs {pricePerHour}/hour</Text>
        </View>

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

        {selectedSlot && (
          <View style={styles.selectedCard}>
            <Ionicons name="checkmark-circle" size={24} color="#22C55E" />
            <Text style={styles.selectedText}>
              Selected Slot: {slots.find(s => s.id === selectedSlot)?.slot_number}
            </Text>
          </View>
        )}

        <View style={styles.layoutCard}>
          <View style={styles.layoutHeader}>
            <Ionicons name="car-outline" size={24} color="#333" />
            <Text style={styles.layoutTitle}>Parking Layout</Text>
          </View>

          <View style={styles.entranceIndicator}>
            <Ionicons name="arrow-down" size={20} color="#22C55E" />
            <Text style={styles.entranceText}>ENTRANCE</Text>
            <Ionicons name="arrow-down" size={20} color="#22C55E" />
          </View>

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
                      slot.status === 'occupied' && styles.slotTextOccupied,
                      slot.status === 'selected' && styles.slotTextSelected
                    ]}>
                      {slot.slot_number}
                    </Text>
                    {slot.status === 'selected' && (
                      <Ionicons name="checkmark" size={16} color="#fff" style={styles.checkIcon} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}

          <View style={styles.exitIndicator}>
            <Ionicons name="arrow-up" size={20} color="#EF4444" />
            <Text style={styles.exitText}>EXIT</Text>
            <Ionicons name="arrow-up" size={20} color="#EF4444" />
          </View>
        </View>

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