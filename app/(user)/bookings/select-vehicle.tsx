import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../../../lib/supabase';
import { styles } from './select-vehicle.styles';

type Vehicle = {
  id: string;
  plate_number: string;
  model: string;
  vehicle_type: string;
  color: string;
  is_default: boolean;
};

export default function SelectVehicle() {
  const params = useLocalSearchParams();

  const parkingId = params.parkingId as string;
  const parkingName = params.parkingName as string;
  const pricePerHour = params.pricePerHour as string;
  const slotId = params.slotId as string;
  const date = params.date as string;
  const startTime = params.startTime as string;
  const endTime = params.endTime as string;
  const duration = params.duration as string;
  const totalPrice = params.totalPrice as string;

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Manual entry states
  const [manualPlate, setManualPlate] = useState('BA 12 PA 3456');
  const [manualModel, setManualModel] = useState('Honda City');

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        setVehicles(data);
        const defaultVehicle = data.find(v => v.is_default);
        setSelectedVehicleId(defaultVehicle?.id || data[0].id);
      } else {
        setVehicles([]);
      }
    } catch (error: any) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const getVehicleIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'car': return 'car-outline';
      case 'bike': return 'bicycle-outline';
      case 'suv': return 'car-sport-outline';
      default: return 'car-outline';
    }
  };

  const handleManualAdd = () => {
    if (!manualPlate.trim() || !manualModel.trim()) {
      Alert.alert('Error', 'Please enter plate number and model');
      return;
    }

    const tempVehicle: Vehicle = {
      id: 'manual-' + Date.now(),
      plate_number: manualPlate.trim().toUpperCase(),
      model: manualModel.trim(),
      vehicle_type: 'car',
      color: 'Not specified',
      is_default: true,
    };
    
    setVehicles([tempVehicle]);
    setSelectedVehicleId(tempVehicle.id);
  };

  const handleContinue = () => {
    if (!selectedVehicleId) {
      Alert.alert('Error', 'Please select a vehicle');
      return;
    }

    const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);

    if (!selectedVehicle) {
      Alert.alert('Error', 'Selected vehicle not found');
      return;
    }

    router.push({
      pathname: '/(user)/bookings/review-booking',
      params: {
        parkingId,
        parkingName,
        pricePerHour,
        slotId,
        date,
        startTime,
        endTime,
        duration,
        totalPrice,
        vehicleId: selectedVehicle.id,
        vehiclePlate: selectedVehicle.plate_number,
        vehicleType: selectedVehicle.vehicle_type,
        vehicleModel: selectedVehicle.model,
      },
    });
  };

  const handleAddVehicle = () => {
    Alert.alert(
      'Add Vehicle',
      'You can add vehicles from your Profile. For now, use the quick entry form below.',
      [{ text: 'OK' }]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#22C55E" />
        <Text style={styles.loadingText}>Loading vehicles...</Text>
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
        <Text style={styles.headerTitle}>Select Vehicle</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>{parkingName}</Text>
          <View style={styles.summaryRow}>
            <Ionicons name="calendar-outline" size={16} color="#6B7280" />
            <Text style={styles.summaryText}>{date}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Ionicons name="time-outline" size={16} color="#6B7280" />
            <Text style={styles.summaryText}>{startTime} - {endTime} ({duration}h)</Text>
          </View>
          <View style={styles.summaryRow}>
            <Ionicons name="cash-outline" size={16} color="#22C55E" />
            <Text style={styles.summaryPrice}>Rs {totalPrice}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Your Vehicles</Text>

        {vehicles.length === 0 ? (
          <View style={styles.manualEntryCard}>
            <View style={styles.manualHeader}>
              <Ionicons name="car-sport" size={32} color="#22C55E" />
            </View>
            <Text style={styles.manualTitle}>Quick Vehicle Entry</Text>
            <Text style={styles.manualSubtitle}>Enter your vehicle details to continue booking</Text>
            
            <View style={styles.manualInputGroup}>
              <Text style={styles.manualLabel}>Plate Number</Text>
              <TextInput
                style={styles.manualInput}
                placeholder="BA 12 PA 3456"
                value={manualPlate}
                onChangeText={setManualPlate}
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.manualInputGroup}>
              <Text style={styles.manualLabel}>Model</Text>
              <TextInput
                style={styles.manualInput}
                placeholder="Honda City"
                value={manualModel}
                onChangeText={setManualModel}
              />
            </View>
            
            <TouchableOpacity
              style={styles.manualAddButton}
              onPress={handleManualAdd}
            >
              <Text style={styles.manualAddButtonText}>Continue with this vehicle</Text>
            </TouchableOpacity>

            <Text style={styles.manualNote}>
              💡 This vehicle will be saved when you complete the booking
            </Text>
          </View>
        ) : (
          <>
            {vehicles.map((vehicle) => (
              <TouchableOpacity
                key={vehicle.id}
                style={[
                  styles.vehicleCard,
                  selectedVehicleId === vehicle.id && styles.vehicleCardSelected
                ]}
                onPress={() => setSelectedVehicleId(vehicle.id)}
                activeOpacity={0.7}
              >
                <View style={styles.radioContainer}>
                  <View style={[
                    styles.radioOuter,
                    selectedVehicleId === vehicle.id && styles.radioOuterSelected
                  ]}>
                    {selectedVehicleId === vehicle.id && (
                      <View style={styles.radioInner} />
                    )}
                  </View>
                </View>

                <View style={[
                  styles.vehicleIcon,
                  selectedVehicleId === vehicle.id && styles.vehicleIconSelected
                ]}>
                  <Ionicons
                    name={getVehicleIcon(vehicle.vehicle_type) as any}
                    size={28}
                    color={selectedVehicleId === vehicle.id ? '#22C55E' : '#6B7280'}
                  />
                </View>

                <View style={styles.vehicleInfo}>
                  <View style={styles.vehicleHeader}>
                    <Text style={styles.vehiclePlate}>{vehicle.plate_number}</Text>
                    {vehicle.is_default && (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultText}>Default</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.vehicleModel}>{vehicle.model}</Text>
                  <Text style={styles.vehicleColor}>
                    {vehicle.color} • {vehicle.vehicle_type}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.addVehicleButton}
              onPress={handleAddVehicle}
              activeOpacity={0.7}
            >
              <Ionicons name="add-circle-outline" size={24} color="#22C55E" />
              <Text style={styles.addVehicleText}>Add New Vehicle</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            !selectedVehicleId && styles.continueButtonDisabled
          ]}
          onPress={handleContinue}
          disabled={!selectedVehicleId}
          activeOpacity={0.8}
        >
          <Text style={styles.continueText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}