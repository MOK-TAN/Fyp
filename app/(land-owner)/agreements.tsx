// (land-owner)/agreements.tsx
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
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

type Agreement = {
  id: string;
  monthly_rent: number;
  start_date: string;
  end_date: string;
  status: 'active' | 'expired' | 'terminated';
  terminated_reason: string | null;
  created_at: string;
  land_listings: { title: string; address: string } | null;
  profiles: { full_name: string; email: string } | null;
};

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-NP', { day: 'numeric', month: 'short', year: 'numeric' });

const monthsBetween = (start: string, end: string) => {
  const s = new Date(start);
  const e = new Date(end);
  return Math.max(0, (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth()));
};

const monthsElapsed = (start: string) => {
  const s = new Date(start);
  const now = new Date();
  return Math.max(0, (now.getFullYear() - s.getFullYear()) * 12 + (now.getMonth() - s.getMonth()));
};

export default function Agreements() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [filter, setFilter] = useState<'active' | 'all'>('active');

  const fetchAgreements = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('land_agreements')
        .select(`
          *,
          land_listings ( title, address ),
          profiles!land_agreements_parking_owner_id_fkey ( full_name, email )
        `)
        .eq('land_owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAgreements((data as any) || []);
    } catch (err) {
      console.error('Fetch agreements error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchAgreements();
    }, [fetchAgreements])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchAgreements();
  };

  const handleTerminate = (ag: Agreement) => {
    Alert.alert(
      'Terminate Agreement?',
      `This permanently ends the agreement with ${ag.profiles?.full_name}. The land will become available again.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Terminate',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase
              .from('land_agreements')
              .update({
                status: 'terminated',
                terminated_reason: 'Terminated by land owner',
              })
              .eq('id', ag.id);
            if (error) {
              Alert.alert('Error', error.message);
              return;
            }
            // Free up the land listing
            await supabase
              .from('land_listings')
              .update({ is_available: true })
              .eq('id', (ag as any).land_id);
            fetchAgreements();
            Alert.alert('Terminated', 'Agreement has been ended.');
          },
        },
      ]
    );
  };

  const visible = agreements.filter(a =>
    filter === 'active' ? a.status === 'active' : true
  );

  const totalMonthlyIncome = agreements
    .filter(a => a.status === 'active')
    .reduce((sum, a) => sum + Number(a.monthly_rent || 0), 0);

  const lifetimeEarned = agreements.reduce((sum, a) => {
    const months = monthsElapsed(a.start_date);
    const cap = monthsBetween(a.start_date, a.end_date);
    return sum + Math.min(months, cap) * Number(a.monthly_rent || 0);
  }, 0);

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
        <Text style={styles.headerTitle}>Agreements</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22C55E" />
        }
      >
        {/* Summary */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
          <View style={[styles.statCard, { width: undefined, flex: 1 }]}>
            <Ionicons name="cash" size={24} color="#22C55E" />
            <Text style={[styles.statValue, { fontSize: 16 }]}>
              Rs {totalMonthlyIncome.toLocaleString()}
            </Text>
            <Text style={styles.statLabel}>Monthly Income</Text>
          </View>
          <View style={[styles.statCard, { width: undefined, flex: 1 }]}>
            <Ionicons name="trending-up" size={24} color="#3B82F6" />
            <Text style={[styles.statValue, { fontSize: 16 }]}>
              Rs {lifetimeEarned.toLocaleString()}
            </Text>
            <Text style={styles.statLabel}>Earned to Date</Text>
          </View>
        </View>

        {/* Filter chips */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
          {(['active', 'all'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={{
                paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16,
                backgroundColor: filter === f ? '#22C55E' : '#F3F4F6',
              }}
              onPress={() => setFilter(f)}
            >
              <Text style={{
                fontSize: 12, fontWeight: '600',
                color: filter === f ? '#fff' : '#6B7280',
                textTransform: 'capitalize',
              }}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {visible.length === 0 ? (
          <View style={[styles.card, { alignItems: 'center', paddingVertical: 50 }]}>
            <Ionicons name="document-text-outline" size={56} color="#D1D5DB" />
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#6B7280', marginTop: 16 }}>
              No agreements yet
            </Text>
            <Text style={{ fontSize: 13, color: '#9CA3AF', marginTop: 6, textAlign: 'center' }}>
              Accepted rental requests will become agreements here
            </Text>
          </View>
        ) : (
          visible.map((ag) => {
            const totalMonths = monthsBetween(ag.start_date, ag.end_date);
            const elapsed = ag.status === 'active' ? monthsElapsed(ag.start_date) : totalMonths;
            const earnedSoFar = Math.min(elapsed, totalMonths) * Number(ag.monthly_rent);

            const badge =
              ag.status === 'active'
                ? { label: 'Active', bg: '#DCFCE7', text: '#15803D' }
                : ag.status === 'expired'
                ? { label: 'Expired', bg: '#F3F4F6', text: '#6B7280' }
                : { label: 'Terminated', bg: '#FEE2E2', text: '#DC2626' };

            return (
              <View key={ag.id} style={styles.card}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={{ fontSize: 16, fontWeight: '700' }} numberOfLines={1}>
                      {ag.land_listings?.title || 'Untitled Plot'}
                    </Text>
                    <Text style={{ color: '#6B7280', fontSize: 13, marginTop: 3 }}>
                      with {ag.profiles?.full_name || 'Parking Owner'}
                    </Text>
                  </View>
                  <View style={{
                    paddingHorizontal: 10, paddingVertical: 4,
                    borderRadius: 20, backgroundColor: badge.bg,
                  }}>
                    <Text style={{ color: badge.text, fontWeight: '600', fontSize: 11 }}>
                      {badge.label}
                    </Text>
                  </View>
                </View>

                <View style={{ marginTop: 14, gap: 8 }}>
                  <Text style={{ fontSize: 13 }}>
                    💰 Monthly Rent:{' '}
                    <Text style={{ fontWeight: '700', color: '#22C55E' }}>
                      Rs {Number(ag.monthly_rent).toLocaleString()}
                    </Text>
                  </Text>
                  <Text style={{ fontSize: 13, color: '#374151' }}>
                    📅 {formatDate(ag.start_date)} → {formatDate(ag.end_date)}
                  </Text>
                  <Text style={{ fontSize: 13, color: '#374151' }}>
                    📊 Earned so far:{' '}
                    <Text style={{ fontWeight: '700' }}>Rs {earnedSoFar.toLocaleString()}</Text>
                  </Text>
                </View>

                {ag.status === 'active' && totalMonths > 0 && (
                  <View style={{ marginTop: 12 }}>
                    <View style={{
                      height: 6, backgroundColor: '#E5E7EB', borderRadius: 3, overflow: 'hidden',
                    }}>
                      <View style={{
                        height: '100%',
                        width: `${Math.min(100, (elapsed / totalMonths) * 100)}%`,
                        backgroundColor: '#22C55E',
                      }} />
                    </View>
                    <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 6 }}>
                      {elapsed} of {totalMonths} months elapsed
                    </Text>
                  </View>
                )}

                {ag.status === 'terminated' && ag.terminated_reason && (
                  <View style={{
                    marginTop: 12, backgroundColor: '#FEF2F2', borderRadius: 8, padding: 10,
                    borderWidth: 1, borderColor: '#FECACA',
                  }}>
                    <Text style={{ fontSize: 12, color: '#991B1B' }}>
                      Reason: {ag.terminated_reason}
                    </Text>
                  </View>
                )}

                {ag.status === 'active' && (
                  <TouchableOpacity
                    style={{
                      marginTop: 14, backgroundColor: '#FEE2E2',
                      padding: 11, borderRadius: 10,
                      flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6,
                    }}
                    onPress={() => handleTerminate(ag)}
                  >
                    <Ionicons name="close-circle-outline" size={15} color="#EF4444" />
                    <Text style={{ color: '#EF4444', fontWeight: '600', fontSize: 13 }}>
                      Terminate Agreement
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}
