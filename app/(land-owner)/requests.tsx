import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { styles } from './styles';

const dummyRequests = [
  {
    id: 1,
    owner: 'ParkEasy Pvt Ltd',
    facility: 'Thamel Smart Parking',
    offeredRent: '48000',
    duration: '2 years',
    status: 'pending',
  },
  {
    id: 2,
    owner: 'CityPark Nepal',
    facility: 'Bouddha Premium Parking',
    offeredRent: '65000',
    duration: '3 years',
    status: 'pending',
  },
];

export default function Requests() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Parking Requests</Text>
      </View>

      <ScrollView style={styles.content}>
        {dummyRequests.map((req) => (
          <View key={req.id} style={styles.card}>
            <Text style={{ fontSize: 17, fontWeight: '700' }}>{req.facility}</Text>
            <Text style={{ color: '#6B7280' }}>by {req.owner}</Text>

            <View style={{ marginTop: 12 }}>
              <Text>Offered Rent: <Text style={{ fontWeight: '600', color: '#22C55E' }}>Rs {req.offeredRent}/month</Text></Text>
              <Text>Duration: {req.duration}</Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
              <TouchableOpacity style={{ flex: 1, backgroundColor: '#22C55E', padding: 14, borderRadius: 12, alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 1, backgroundColor: '#EF4444', padding: 14, borderRadius: 12, alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}