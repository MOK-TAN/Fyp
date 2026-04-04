import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { styles } from './styles';

const dummyAgreements = [
  { facility: 'Thamel Central Parking', owner: 'ParkEasy Pvt Ltd', rent: '45000', start: '2025-01-01', end: '2027-12-31', totalEarned: '540000' },
  { facility: 'Bouddha Premium Parking', owner: 'CityPark Nepal', rent: '72000', start: '2025-03-01', end: '2026-02-28', totalEarned: '216000' },
];

export default function Agreements() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Active Agreements</Text>
      </View>

      <ScrollView style={styles.content}>
        {dummyAgreements.map((agreement, index) => (
          <View key={index} style={styles.card}>
            <Text style={{ fontSize: 17, fontWeight: '700' }}>{agreement.facility}</Text>
            <Text style={{ color: '#6B7280' }}>with {agreement.owner}</Text>

            <View style={{ marginTop: 16, gap: 8 }}>
              <Text>Monthly Rent: <Text style={{ fontWeight: '600', color: '#22C55E' }}>Rs {agreement.rent}</Text></Text>
              <Text>Contract Period: {agreement.start} to {agreement.end}</Text>
              <Text>Total Earned: <Text style={{ fontWeight: '600' }}>Rs {agreement.totalEarned}</Text></Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}