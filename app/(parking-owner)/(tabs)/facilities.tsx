import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../../../lib/supabase';
import { styles } from './facilities.styles';

type Facility = {
  id: string;
  name: string;
  address: string;
  total_slots: number;
  price_per_hour: number;
  is_active: boolean;
  is_approved: boolean;
};

export default function Facilities() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchFacilities();
  }, []);

  const fetchFacilities = async () => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('parking_facilities')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setFacilities(data || []);
    } catch (error) {
      console.error('Error fetching facilities:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchFacilities();
  };

  const handleAddFacility = () => {
    router.push('/(parking-owner)/facility/add');
  };

  const handleManageFacility = (facilityId: string) => {
    router.push({
      pathname: '/(parking-owner)/facility/[id]',
      params: { id: facilityId },
    });
  };

  const handleEditFacility = (facilityId: string) => {
    // TODO: Navigate to edit facility
    // router.push(`/parking-owner/facility/edit/${facilityId}`);
  };

  const filteredFacilities = facilities.filter(facility =>
    facility.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    facility.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeFacilities = filteredFacilities.filter(f => f.is_active);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#22C55E" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Facilities</Text>
        <TouchableOpacity>
          <Ionicons name="notifications-outline" size={24} color="#111827" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22C55E" />
        }
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search facilities..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Add New Facility Button */}
        <TouchableOpacity style={styles.addButton} onPress={handleAddFacility}>
          <Ionicons name="add-circle" size={24} color="#FFFFFF" />
          <Text style={styles.addButtonText}>ADD NEW FACILITY</Text>
        </TouchableOpacity>

        {/* Active Listings */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active Listings</Text>
          <Text style={styles.totalCount}>{activeFacilities.length} TOTAL</Text>
        </View>

        {/* Facilities List */}
        {filteredFacilities.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="business-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>No facilities found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? 'Try a different search' : 'Add your first parking facility'}
            </Text>
          </View>
        ) : (
          filteredFacilities.map((facility) => (
            <View key={facility.id} style={styles.facilityCard}>
              {/* Facility Header */}
              <View style={styles.facilityHeader}>
                <View style={styles.facilityTitleRow}>
                  <Text style={styles.facilityName}>{facility.name}</Text>
                  <View style={[
                    styles.statusBadge,
                    facility.is_active ? styles.statusActive : styles.statusInactive
                  ]}>
                    <Text style={[
                      styles.statusText,
                      facility.is_active ? styles.statusTextActive : styles.statusTextInactive
                    ]}>
                      {facility.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </Text>
                  </View>
                </View>
                <View style={styles.locationRow}>
                  <Ionicons name="location-outline" size={14} color="#6B7280" />
                  <Text style={styles.locationText}>{facility.address}</Text>
                </View>
              </View>

              {/* Facility Stats */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>TOTAL SLOTS</Text>
                  <Text style={styles.statValue}>{facility.total_slots} Slots</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>PRICE / HOUR</Text>
                  <Text style={styles.statValue}>Rs {facility.price_per_hour}</Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.manageButton}
                  onPress={() => handleManageFacility(facility.id)}
                >
                  <Text style={styles.manageButtonText}>MANAGE</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => handleEditFacility(facility.id)}
                >
                  <Ionicons name="pencil" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>

              {/* Awaiting Review */}
              {!facility.is_approved && (
                <View style={styles.reviewBanner}>
                  <Text style={styles.reviewText}>AWAITING REVIEW</Text>
                </View>
              )}
            </View>
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}