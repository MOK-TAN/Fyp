import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

type Vehicle = {
  id: string;
  type: 'car' | 'bike' | 'bus' | 'truck';
  licensePlate: string;
  color: string;
  make: string;
  model: string;
  isDefault: boolean;
};

// Dummy vehicle data
const DUMMY_VEHICLES: Vehicle[] = [
  {
    id: '1',
    type: 'car',
    licensePlate: 'BA 12 PA 3456',
    color: 'White',
    make: 'Toyota',
    model: 'Corolla',
    isDefault: true,
  },
  {
    id: '2',
    type: 'bike',
    licensePlate: 'BA 3 KA 1234',
    color: 'Red',
    make: 'Honda',
    model: 'Shine',
    isDefault: false,
  },
  {
    id: '3',
    type: 'car',
    licensePlate: 'BA 1 JA 5678',
    color: 'Black',
    make: 'Hyundai',
    model: 'i20',
    isDefault: false,
  },
];

export default function SelectVehicle() {
  const params = useLocalSearchParams();
  
  const parkingId = params.parkingId as string;
  const parkingName = params.parkingName as string;
  const pricePerHour = params.pricePerHour as string;
  const date = params.date as string;
  const startTime = params.startTime as string;
  const endTime = params.endTime as string;
  const duration = params.duration as string;
  const totalPrice = params.totalPrice as string;

  const [vehicles] = useState(DUMMY_VEHICLES);
  const [selectedVehicleId, setSelectedVehicleId] = useState(
    vehicles.find(v => v.isDefault)?.id || ''
  );

  // Get vehicle icon
  const getVehicleIcon = (type: string) => {
    switch (type) {
      case 'car': return 'car-outline';
      case 'bike': return 'bicycle-outline';
      case 'bus': return 'bus-outline';
      case 'truck': return 'ios-git-compare-outline';
      default: return 'car-outline';
    }
  };

  // Handle continue
  const handleContinue = () => {
    if (!selectedVehicleId) {
      Alert.alert('Error', 'Please select a vehicle');
      return;
    }

    const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);

    // router.push({
    //   pathname: '/(user)/booking/review-booking',
    //   params: {
    //     parkingId,
    //     parkingName,
    //     pricePerHour,
    //     date,
    //     startTime,
    //     endTime,
    //     duration,
    //     totalPrice,
    //     vehicleId: selectedVehicleId,
    //     vehiclePlate: selectedVehicle?.licensePlate,
    //     vehicleType: selectedVehicle?.type,
    //     vehicleModel: `${selectedVehicle?.make} ${selectedVehicle?.model}`,
    //   },
    // });
  };

  // Handle add vehicle
  const handleAddVehicle = () => {
    Alert.alert('Add Vehicle', 'Vehicle management feature coming soon!');
  };

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
        <Text style={styles.headerTitle}>Select Vehicle</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Booking Summary */}
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

        {/* Vehicles List */}
        <Text style={styles.sectionTitle}>Your Vehicles</Text>

        {vehicles.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="car-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>No vehicles added yet</Text>
            <Text style={styles.emptySubtext}>Add a vehicle to continue booking</Text>
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
                {/* Radio Button */}
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

                {/* Vehicle Icon */}
                <View style={[
                  styles.vehicleIcon,
                  selectedVehicleId === vehicle.id && styles.vehicleIconSelected
                ]}>
                  <Ionicons
                    name={getVehicleIcon(vehicle.type) as any}
                    size={28}
                    color={selectedVehicleId === vehicle.id ? '#22C55E' : '#6B7280'}
                  />
                </View>

                {/* Vehicle Info */}
                <View style={styles.vehicleInfo}>
                  <View style={styles.vehicleHeader}>
                    <Text style={styles.vehiclePlate}>{vehicle.licensePlate}</Text>
                    {vehicle.isDefault && (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultText}>Default</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.vehicleModel}>{vehicle.make} {vehicle.model}</Text>
                  <Text style={styles.vehicleColor}>{vehicle.color} • {vehicle.type}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* Add Vehicle Button */}
        <TouchableOpacity
          style={styles.addVehicleButton}
          onPress={handleAddVehicle}
          activeOpacity={0.7}
        >
          <Ionicons name="add-circle-outline" size={24} color="#22C55E" />
          <Text style={styles.addVehicleText}>Add New Vehicle</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Continue Button */}
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
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  summaryPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#22C55E',
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  vehicleCardSelected: {
    borderColor: '#22C55E',
    backgroundColor: '#F0FDF4',
  },
  radioContainer: {
    marginRight: 12,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: '#22C55E',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22C55E',
  },
  vehicleIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  vehicleIconSelected: {
    backgroundColor: '#F0FDF4',
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  vehiclePlate: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginRight: 8,
  },
  defaultBadge: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  defaultText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  vehicleModel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 2,
  },
  vehicleColor: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  addVehicleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#22C55E',
    borderStyle: 'dashed',
    marginTop: 8,
  },
  addVehicleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#22C55E',
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  footer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  continueButton: {
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
  },
});