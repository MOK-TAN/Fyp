import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { styles } from './styles';

const dummyLands = [
  { id: 1, name: 'Thamel Central Plot', location: 'Thamel, Kathmandu', size: '5.5 Ropani', status: 'Rented', rent: '45000' },
  { id: 2, name: 'Patan Durbar Square', location: 'Mangal Bazaar, Lalitpur', size: '3.2 Ropani', status: 'Available', rent: '0' },
  { id: 3, name: 'Bouddha Stupa Land', location: 'Bouddha, Kathmandu', size: '8.0 Ropani', status: 'Rented', rent: '72000' },
];

export default function MyLand() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Land Plots</Text>
      </View>

      <ScrollView style={styles.content}>
        {dummyLands.map((land) => (
          <View key={land.id} style={styles.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 17, fontWeight: '700' }}>{land.name}</Text>
              <View style={{
                paddingHorizontal: 12,
                paddingVertical: 4,
                borderRadius: 20,
                backgroundColor: land.status === 'Rented' ? '#DCFCE7' : '#FEF3C7',
              }}>
                <Text style={{ color: land.status === 'Rented' ? '#22C55E' : '#F59E0B', fontWeight: '600' }}>
                  {land.status}
                </Text>
              </View>
            </View>

            <Text style={{ color: '#6B7280', marginTop: 6 }}>{land.location}</Text>
            <Text style={{ marginTop: 10 }}>Size: <Text style={{ fontWeight: '600' }}>{land.size}</Text></Text>

            {land.status === 'Rented' && (
              <Text style={{ marginTop: 8, color: '#22C55E', fontWeight: '600' }}>
                Monthly Rent: Rs {land.rent}
              </Text>
            )}

            <TouchableOpacity style={{ marginTop: 16, backgroundColor: '#F3F4F6', padding: 12, borderRadius: 10, alignItems: 'center' }}>
              <Text style={{ fontWeight: '600' }}>View Details</Text>
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity style={styles.actionButton} onPress={() => alert('Add New Land Form will open here')}>
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.actionButtonText}>Add New Land Plot</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}