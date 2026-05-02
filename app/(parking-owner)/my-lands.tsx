// (parking-owner)/my-lands.tsx
//
// Shows active land rental agreements where parking owner is the renter.
// For each: either build a facility on the land, or view the existing one.

import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { supabase } from '../../lib/supabase';

const AANA_TO_SQFT = 342.25;
const sqftToAana = (s: number) => Math.round((s / AANA_TO_SQFT) * 100) / 100;

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

type Agreement = {
  id: string;
  monthly_rent: number;
  start_date: string;
  end_date: string;
  status: 'active' | 'expired' | 'terminated';
  land_id: string;
  land_listings: {
    title: string;
    address: string;
    area_sqft: number;
    latitude: number | null;
    longitude: number | null;
  } | null;
  profiles: { full_name: string | null } | null;
};

type FacilityForAgreement = {
  id: string;
  name: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  is_active: boolean;
  land_agreement_id: string;
};

export default function MyLands() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [facilitiesByAgreement, setFacilitiesByAgreement] = useState<
    Record<string, FacilityForAgreement>
  >({});

  const fetchData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: ags, error } = await supabase
        .from('land_agreements')
        .select(`
          id, monthly_rent, start_date, end_date, status, land_id,
          land_listings ( title, address, area_sqft, latitude, longitude ),
          profiles!land_agreements_land_owner_id_fkey ( full_name )
        `)
        .eq('parking_owner_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAgreements((ags as any) || []);

      const ids = (ags || []).map(a => a.id);
      if (ids.length > 0) {
        const { data: facs } = await supabase
          .from('parking_facilities')
          .select('id, name, approval_status, is_active, land_agreement_id')
          .in('land_agreement_id', ids);

        const map: Record<string, FacilityForAgreement> = {};
        (facs || []).forEach(f => {
          if (f.land_agreement_id) map[f.land_agreement_id] = f;
        });
        setFacilitiesByAgreement(map);
      } else {
        setFacilitiesByAgreement({});
      }
    } catch (err) {
      console.error('My lands fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading) {
    return (
      <View style={[s.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#22C55E" />
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>My Rented Lands</Text>
        <TouchableOpacity onPress={() => router.push('/(parking-owner)/browse-lands' as any)}>
          <Ionicons name="add-circle-outline" size={24} color="#22C55E" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22C55E" />
        }
      >
        {agreements.length === 0 ? (
          <View style={s.emptyState}>
            <Ionicons name="leaf-outline" size={64} color="#D1D5DB" />
            <Text style={s.emptyTitle}>No rented lands yet</Text>
            <Text style={s.emptySubtitle}>
              Browse approved land listings and send rent requests to landowners
            </Text>
            <TouchableOpacity
              style={s.browseBtn}
              onPress={() => router.push('/(parking-owner)/browse-lands' as any)}
            >
              <Ionicons name="search" size={16} color="#fff" />
              <Text style={s.browseBtnText}>Browse Lands</Text>
            </TouchableOpacity>
          </View>
        ) : (
          agreements.map((ag) => {
            const facility = facilitiesByAgreement[ag.id];
            const totalMonths = monthsBetween(ag.start_date, ag.end_date);
            const elapsed = monthsElapsed(ag.start_date);
            const land = ag.land_listings;

            return (
              <View key={ag.id} style={s.card}>
                <View style={s.cardHeader}>
                  <View style={s.landIcon}>
                    <Ionicons name="leaf" size={22} color="#22C55E" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.cardTitle} numberOfLines={1}>
                      {land?.title || 'Untitled Plot'}
                    </Text>
                    <Text style={s.cardOwner}>
                      from {ag.profiles?.full_name || 'Landowner'}
                    </Text>
                  </View>
                </View>

                <Text style={s.cardAddress} numberOfLines={2}>
                  📍 {land?.address || '—'}
                </Text>

                <View style={s.metaRow}>
                  <View style={s.metaItem}>
                    <Text style={s.metaLabel}>Area</Text>
                    <Text style={s.metaValue}>
                      {land ? `${sqftToAana(land.area_sqft)} Aana` : '—'}
                    </Text>
                  </View>
                  <View style={s.metaDivider} />
                  <View style={s.metaItem}>
                    <Text style={s.metaLabel}>Monthly Rent</Text>
                    <Text style={[s.metaValue, { color: '#22C55E' }]}>
                      Rs {Number(ag.monthly_rent).toLocaleString()}
                    </Text>
                  </View>
                  <View style={s.metaDivider} />
                  <View style={s.metaItem}>
                    <Text style={s.metaLabel}>Period</Text>
                    <Text style={s.metaValue}>{totalMonths} mo</Text>
                  </View>
                </View>

                <Text style={s.dateText}>
                  {formatDate(ag.start_date)} → {formatDate(ag.end_date)}
                </Text>
                {totalMonths > 0 && (
                  <View style={s.progressBar}>
                    <View
                      style={[
                        s.progressFill,
                        { width: `${Math.min(100, (elapsed / totalMonths) * 100)}%` },
                      ]}
                    />
                  </View>
                )}

                <View style={s.facilitySection}>
                  {!facility ? (
                    <>
                      <View style={s.noticeBox}>
                        <Ionicons name="information-circle" size={14} color="#D97706" />
                        <Text style={s.noticeText}>
                          No facility built yet. You can build one on this land.
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={s.buildBtn}
                        onPress={() =>
                          router.push({
                            pathname: '/(parking-owner)/facility/add' as any,
                            params: {
                              agreementId: ag.id,
                              prefillAddress: land?.address || '',
                              prefillLat: land?.latitude?.toString() || '',
                              prefillLng: land?.longitude?.toString() || '',
                              prefillName: `Parking @ ${land?.title || 'Plot'}`,
                            },
                          })
                        }
                        activeOpacity={0.85}
                      >
                        <Ionicons name="business" size={16} color="#fff" />
                        <Text style={s.buildBtnText}>Build Facility on This Land</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <View style={s.facilityCard}>
                      <View style={{ flex: 1 }}>
                        <Text style={s.facilityLabel}>FACILITY BUILT</Text>
                        <Text style={s.facilityName} numberOfLines={1}>
                          {facility.name}
                        </Text>
                        <View style={s.statusRow}>
                          <View
                            style={[
                              s.statusBadge,
                              facility.approval_status === 'approved'
                                ? { backgroundColor: '#DCFCE7' }
                                : facility.approval_status === 'rejected'
                                ? { backgroundColor: '#FEE2E2' }
                                : { backgroundColor: '#FEF3C7' },
                            ]}
                          >
                            <Ionicons
                              name={
                                facility.approval_status === 'approved'
                                  ? 'checkmark-circle'
                                  : facility.approval_status === 'rejected'
                                  ? 'close-circle'
                                  : 'time'
                              }
                              size={11}
                              color={
                                facility.approval_status === 'approved'
                                  ? '#15803D'
                                  : facility.approval_status === 'rejected'
                                  ? '#DC2626'
                                  : '#D97706'
                              }
                            />
                            <Text
                              style={[
                                s.statusText,
                                {
                                  color:
                                    facility.approval_status === 'approved'
                                      ? '#15803D'
                                      : facility.approval_status === 'rejected'
                                      ? '#DC2626'
                                      : '#D97706',
                                },
                              ]}
                            >
                              {facility.approval_status.toUpperCase()}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={s.viewBtn}
                        onPress={() =>
                          router.push(`/(parking-owner)/facility/${facility.id}` as any)
                        }
                      >
                        <Text style={s.viewBtnText}>View</Text>
                        <Ionicons name="chevron-forward" size={14} color="#22C55E" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 14,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },

  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#374151', marginTop: 16 },
  emptySubtitle: {
    fontSize: 13, color: '#6B7280', marginTop: 6,
    textAlign: 'center', paddingHorizontal: 40,
  },
  browseBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#22C55E', paddingHorizontal: 18, paddingVertical: 11,
    borderRadius: 12, marginTop: 20,
  },
  browseBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 14,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  landIcon: {
    width: 40, height: 40, borderRadius: 10, backgroundColor: '#F0FDF4',
    justifyContent: 'center', alignItems: 'center',
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  cardOwner: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  cardAddress: { fontSize: 13, color: '#6B7280', marginTop: 10 },

  metaRow: {
    flexDirection: 'row', backgroundColor: '#F9FAFB',
    borderRadius: 10, padding: 12, marginTop: 12, alignItems: 'center',
  },
  metaItem: { flex: 1, alignItems: 'center' },
  metaDivider: { width: 1, height: 28, backgroundColor: '#E5E7EB' },
  metaLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase' },
  metaValue: { fontSize: 14, fontWeight: '700', color: '#111827', marginTop: 4 },

  dateText: { fontSize: 12, color: '#6B7280', marginTop: 12, textAlign: 'center' },
  progressBar: {
    height: 4, backgroundColor: '#E5E7EB', borderRadius: 2,
    marginTop: 8, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#22C55E' },

  facilitySection: {
    marginTop: 16, paddingTop: 16,
    borderTopWidth: 1, borderTopColor: '#F3F4F6',
  },
  noticeBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FFFBEB', borderRadius: 8, padding: 10,
    borderWidth: 1, borderColor: '#FDE68A',
  },
  noticeText: { fontSize: 12, color: '#92400E', flex: 1 },
  buildBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#22C55E', borderRadius: 12, height: 46, marginTop: 10,
  },
  buildBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  facilityCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F0FDF4', borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: '#BBF7D0',
  },
  facilityLabel: { fontSize: 10, fontWeight: '700', color: '#15803D', letterSpacing: 0.5 },
  facilityName: { fontSize: 14, fontWeight: '700', color: '#111827', marginTop: 4 },
  statusRow: { flexDirection: 'row', marginTop: 6 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12,
  },
  statusText: { fontSize: 10, fontWeight: '700' },
  viewBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  viewBtnText: { color: '#22C55E', fontWeight: '700', fontSize: 13 },
});