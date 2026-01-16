import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import BottomTabs from '../../components/BottomTabs';

// Dummy saved parking data
const SAVED_PARKING = [
  {
    id: 1,
    name: 'New Road Parking',
    address: 'Juddha Sadak, Kathmandu',
  },
  {
    id: 2,
    name: 'Thamel Square',
    address: 'Thamel Marg, Kathmandu',
  },
  {
    id: 3,
    name: 'Durbar Marg Parking',
    address: 'Durbar Marg, Kathmandu',
  },
  {
    id: 4,
    name: 'Boudha Parking',
    address: 'Boudhanath, Kathmandu',
  },
];

const SavedParking = () => {
  const handleUnsave = (id: number) => {
    console.log('Unsave parking:', id);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Saved Parking's</Text>
        </View>

        {/* Saved List */}
        <View style={styles.listContainer}>
          {SAVED_PARKING.map((parking) => (
            <TouchableOpacity
              key={parking.id}
              style={styles.parkingCard}
              activeOpacity={0.7}
            >
              <View style={styles.parkingImageContainer}>
                <View style={styles.parkingImagePlaceholder}>
                  <Ionicons name="car" size={24} color="#22C55E" />
                </View>
              </View>

              <View style={styles.parkingInfo}>
                <Text style={styles.parkingName}>{parking.name}</Text>
                <Text style={styles.parkingAddress}>{parking.address}</Text>
              </View>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={() => handleUnsave(parking.id)}
              >
                <Ionicons name="bookmark" size={24} color="#22C55E" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Bottom Tabs */}
      <BottomTabs />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  parkingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  parkingImageContainer: {
    marginRight: 12,
  },
  parkingImagePlaceholder: {
    width: 60,
    height: 60,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  parkingInfo: {
    flex: 1,
  },
  parkingName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  parkingAddress: {
    fontSize: 13,
    color: '#999',
  },
  saveButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SavedParking;