import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FilterOptions) => void;
}

interface FilterOptions {
  vehicleType: string;
  sortBy: string;
  rating: string;
}

const FilterModal: React.FC<FilterModalProps> = ({ visible, onClose, onApply }) => {
  const [selectedVehicle, setSelectedVehicle] = useState('car');
  const [selectedSort, setSelectedSort] = useState('distance');
  const [selectedRating, setSelectedRating] = useState('all');

  const handleApply = () => {
    onApply({
      vehicleType: selectedVehicle,
      sortBy: selectedSort,
      rating: selectedRating,
    });
    onClose();
  };

  const handleReset = () => {
    setSelectedVehicle('car');
    setSelectedSort('distance');
    setSelectedRating('all');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Filter</Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Vehicle Type */}
            <View style={styles.section}>
              <View style={styles.vehicleGrid}>
                <TouchableOpacity
                  style={[
                    styles.vehicleButton,
                    selectedVehicle === 'car' && styles.vehicleButtonActive,
                  ]}
                  onPress={() => setSelectedVehicle('car')}
                >
                  <Ionicons
                    name="car-outline"
                    size={24}
                    color={selectedVehicle === 'car' ? '#fff' : '#666'}
                  />
                  <Text
                    style={[
                      styles.vehicleText,
                      selectedVehicle === 'car' && styles.vehicleTextActive,
                    ]}
                  >
                    Car
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.vehicleButton,
                    selectedVehicle === 'bus' && styles.vehicleButtonActive,
                  ]}
                  onPress={() => setSelectedVehicle('bus')}
                >
                  <Ionicons
                    name="bus-outline"
                    size={24}
                    color={selectedVehicle === 'bus' ? '#fff' : '#666'}
                  />
                  <Text
                    style={[
                      styles.vehicleText,
                      selectedVehicle === 'bus' && styles.vehicleTextActive,
                    ]}
                  >
                    Bus
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.vehicleButton,
                    selectedVehicle === 'bicycle' && styles.vehicleButtonActive,
                  ]}
                  onPress={() => setSelectedVehicle('bicycle')}
                >
                  <Ionicons
                    name="bicycle-outline"
                    size={24}
                    color={selectedVehicle === 'bicycle' ? '#fff' : '#666'}
                  />
                  <Text
                    style={[
                      styles.vehicleText,
                      selectedVehicle === 'bicycle' && styles.vehicleTextActive,
                    ]}
                  >
                    Bicycle
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.vehicleButton,
                    selectedVehicle === 'more' && styles.vehicleButtonActive,
                  ]}
                  onPress={() => setSelectedVehicle('more')}
                >
                  <Ionicons
                    name="grid-outline"
                    size={24}
                    color={selectedVehicle === 'more' ? '#fff' : '#666'}
                  />
                  <Text
                    style={[
                      styles.vehicleText,
                      selectedVehicle === 'more' && styles.vehicleTextActive,
                    ]}
                  >
                    More
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Sort By */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Sort by</Text>
                <TouchableOpacity>
                  <Text style={styles.seeAll}>See All</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.chipContainer}>
                <TouchableOpacity
                  style={[
                    styles.chip,
                    selectedSort === 'distance' && styles.chipActive,
                  ]}
                  onPress={() => setSelectedSort('distance')}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedSort === 'distance' && styles.chipTextActive,
                    ]}
                  >
                    Distance
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.chip,
                    selectedSort === 'slots' && styles.chipActive,
                  ]}
                  onPress={() => setSelectedSort('slots')}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedSort === 'slots' && styles.chipTextActive,
                    ]}
                  >
                    Slots Available
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.chip,
                    selectedSort === 'price' && styles.chipActive,
                  ]}
                  onPress={() => setSelectedSort('price')}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedSort === 'price' && styles.chipTextActive,
                    ]}
                  >
                    Lower Price
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Rating */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Rating</Text>
                <TouchableOpacity>
                  <Text style={styles.seeAll}>See All</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.chipContainer}>
                <TouchableOpacity
                  style={[
                    styles.chip,
                    selectedRating === 'all' && styles.chipActive,
                  ]}
                  onPress={() => setSelectedRating('all')}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedRating === 'all' && styles.chipTextActive,
                    ]}
                  >
                    All star
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.chip,
                    selectedRating === '5' && styles.chipActive,
                  ]}
                  onPress={() => setSelectedRating('5')}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedRating === '5' && styles.chipTextActive,
                    ]}
                  >
                    5 star
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.chip,
                    selectedRating === '4' && styles.chipActive,
                  ]}
                  onPress={() => setSelectedRating('4')}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedRating === '4' && styles.chipTextActive,
                    ]}
                  >
                    4 star
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.chip,
                    selectedRating === '3' && styles.chipActive,
                  ]}
                  onPress={() => setSelectedRating('3')}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedRating === '3' && styles.chipTextActive,
                    ]}
                  >
                    3 star
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
              <Text style={styles.resetText}>Reset</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
              <Text style={styles.applyText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 30,
    maxHeight: '80%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  section: {
    marginBottom: 25,
  },
  vehicleGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  vehicleButton: {
    width: '23%',
    aspectRatio: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  vehicleButtonActive: {
    backgroundColor: '#22C55E',
  },
  vehicleText: {
    fontSize: 12,
    color: '#666',
    marginTop: 6,
    fontWeight: '500',
  },
  vehicleTextActive: {
    color: '#fff',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  seeAll: {
    fontSize: 14,
    color: '#22C55E',
    fontWeight: '500',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipActive: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
  },
  chipText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#fff',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  resetButton: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  applyButton: {
    flex: 2,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});

export default FilterModal;