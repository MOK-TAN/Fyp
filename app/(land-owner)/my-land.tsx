// (land-owner)/my-land.tsx
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { styles } from './styles';

const AANA_TO_SQFT = 342.25;

type LandListing = {
  id: string;
  title: string;
  address: string;
  area_sqft: number;
  expected_rent: number | null;
  approval_status: 'pending' | 'approved' | 'rejected';
  is_available: boolean;
  rejection_reason: string | null;
  created_at: string;
};

type AgreementInfo = { land_id: string; monthly_rent: number };

const sqftToAana = (s: number) => Math.round((s / AANA_TO_SQFT) * 100) / 100;

const statusBadge = (s: LandListing, hasActiveAgreement: boolean) => {
  if (hasActiveAgreement) return { label: 'Rented', bg: '#DCFCE7', text: '#15803D', icon: 'checkmark-circle' as const };
  if (s.approval_status === 'pending') return { label: 'Pending Approval', bg: '#FEF3C7', text: '#D97706', icon: 'time' as const };
  if (s.approval_status === 'rejected') return { label: 'Rejected', bg: '#FEE2E2', text: '#DC2626', icon: 'close-circle' as const };
  if (s.is_available) return { label: 'Available', bg: '#DBEAFE', text: '#2563EB', icon: 'leaf' as const };
  return { label: 'Unavailable', bg: '#F3F4F6', text: '#6B7280', icon: 'pause-circle' as const };
};

export default function MyLand() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lands, setLands] = useState<LandListing[]>([]);
  const [agreements, setAgreements] = useState<AgreementInfo[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchLands = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('land_listings')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLands(data || []);

      const { data: agData } = await supabase
        .from('land_agreements')
        .select('land_id, monthly_rent')
        .eq('land_owner_id', user.id)
        .eq('status', 'active');
      setAgreements(agData || []);
    } catch (err) {
      console.error('Fetch lands error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchLands();
    }, [fetchLands])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchLands();
  };

  const getAgreementForLand = (landId: string) =>
    agreements.find(a => a.land_id === landId);

  const handleDelete = (land: LandListing) => {
    const hasAgreement = !!getAgreementForLand(land.id);
    if (hasAgreement) {
      Alert.alert(
        'Cannot Delete',
        'This land has an active rental agreement. Terminate the agreement first.',
      );
      return;
    }
    Alert.alert(
      'Delete Land?',
      `"${land.title}" and all related rental requests will be permanently removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(land.id);
            const { error } = await supabase
              .from('land_listings')
              .delete()
              .eq('id', land.id);
            setDeletingId(null);
            if (error) {
              if (error.code === '23503') {
                Alert.alert(
                  'Cannot Delete',
                  'This land has a rental agreement linked to it, so it can\'t be deleted.'
                );
              } else {
                Alert.alert('Error', error.message);
              }
            } else {
              setLands(prev => prev.filter(l => l.id !== land.id));
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#22C55E" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Land Plots</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22C55E" />
        }
      >
        {lands.length === 0 ? (
          <View style={[styles.card, { alignItems: 'center', paddingVertical: 50 }]}>
            <Ionicons name="leaf-outline" size={56} color="#D1D5DB" />
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#6B7280', marginTop: 16 }}>
              No land plots yet
            </Text>
            <Text style={{ fontSize: 13, color: '#9CA3AF', marginTop: 6, textAlign: 'center' }}>
              Add your first land plot to start receiving rental requests
            </Text>
          </View>
        ) : (
          lands.map((land) => {
            const ag = getAgreementForLand(land.id);
            const badge = statusBadge(land, !!ag);
            const isDeleting = deletingId === land.id;
            return (
              <View key={land.id} style={styles.card}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Text style={{ fontSize: 17, fontWeight: '700', flex: 1, marginRight: 8 }} numberOfLines={2}>
                    {land.title}
                  </Text>
                  <View style={{
                    flexDirection: 'row', alignItems: 'center', gap: 4,
                    paddingHorizontal: 10, paddingVertical: 4,
                    borderRadius: 20, backgroundColor: badge.bg,
                  }}>
                    <Ionicons name={badge.icon} size={11} color={badge.text} />
                    <Text style={{ color: badge.text, fontWeight: '600', fontSize: 11 }}>
                      {badge.label}
                    </Text>
                  </View>
                </View>

                <Text style={{ color: '#6B7280', marginTop: 6, fontSize: 13 }} numberOfLines={2}>
                  📍 {land.address}
                </Text>

                <View style={{ flexDirection: 'row', marginTop: 12, gap: 16, flexWrap: 'wrap' }}>
                  <Text style={{ fontSize: 13 }}>
                    📐 <Text style={{ fontWeight: '600' }}>{sqftToAana(land.area_sqft)} Aana</Text>
                  </Text>
                  <Text style={{ fontSize: 13 }}>
                    💰 <Text style={{ fontWeight: '600' }}>
                      {land.expected_rent ? `Rs ${land.expected_rent.toLocaleString()}/mo` : 'Negotiable'}
                    </Text>
                  </Text>
                </View>

                {ag && (
                  <View style={{
                    marginTop: 12, backgroundColor: '#F0FDF4', borderRadius: 10,
                    padding: 10, borderWidth: 1, borderColor: '#BBF7D0',
                  }}>
                    <Text style={{ fontSize: 12, color: '#15803D', fontWeight: '600' }}>
                      Currently rented · Rs {Number(ag.monthly_rent).toLocaleString()}/mo
                    </Text>
                  </View>
                )}

                {land.approval_status === 'rejected' && land.rejection_reason && (
                  <View style={{
                    marginTop: 12, backgroundColor: '#FEF2F2', borderRadius: 10,
                    padding: 10, borderWidth: 1, borderColor: '#FECACA',
                  }}>
                    <Text style={{ fontSize: 12, color: '#DC2626', fontWeight: '600' }}>
                      Rejection reason:
                    </Text>
                    <Text style={{ fontSize: 12, color: '#991B1B', marginTop: 4 }}>
                      {land.rejection_reason}
                    </Text>
                  </View>
                )}

                <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                  <TouchableOpacity
                    style={{
                      flex: 1, backgroundColor: '#FEE2E2',
                      padding: 11, borderRadius: 10, alignItems: 'center',
                      flexDirection: 'row', justifyContent: 'center', gap: 6,
                    }}
                    onPress={() => handleDelete(land)}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <ActivityIndicator size="small" color="#EF4444" />
                    ) : (
                      <>
                        <Ionicons name="trash-outline" size={15} color="#EF4444" />
                        <Text style={{ fontWeight: '600', color: '#EF4444', fontSize: 13 }}>Delete</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}

        <TouchableOpacity
          style={[styles.actionButton, { marginTop: 8 }]}
          onPress={() => router.push('/(land-owner)/add-land-plot' as any)}
        >
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.actionButtonText}>Add New Land Plot</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}
