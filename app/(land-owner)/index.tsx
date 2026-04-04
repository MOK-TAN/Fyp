import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { styles } from './styles';

const stats = [
  { label: 'Total Land', value: '18.5 Ropani', icon: 'leaf' as const },
  { label: 'Active Facilities', value: '7', icon: 'business' as const },
  { label: 'This Month', value: 'Rs 2,45,000', icon: 'cash' as const },
  { label: 'Pending Requests', value: '4', icon: 'time' as const },
];

export default function LandownerDashboard() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Namaste,</Text>
        <Text style={styles.headerTitle}>Ram Bahadur Shrestha</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statsGrid}>
          {stats.map((stat, i) => (
            <View key={i} style={styles.statCard}>
              <Ionicons name={stat.icon} size={32} color="#22C55E" />
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="add-circle" size={24} color="#fff" />
            <Text style={styles.actionButtonText}>Add New Land Plot</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.card}>
            <Text style={{ fontWeight: '600' }}>Thamel Plot - New Request Received</Text>
            <Text style={{ color: '#6B7280', marginTop: 4 }}>Proposed rent: Rs 45,000/month</Text>
            <Text style={{ color: '#22C55E', marginTop: 8, fontSize: 13 }}>2 hours ago</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}