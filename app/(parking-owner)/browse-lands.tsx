// (parking-owner)/browse-lands.tsx
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { supabase } from '../../lib/supabase';

const AANA_TO_SQFT = 342.25;
const sqftToAana = (s: number) => Math.round((s / AANA_TO_SQFT) * 100) / 100;

type Land = {
  id: string;
  title: string;
  description: string | null;
  address: string;
  area_sqft: number;
  expected_rent: number | null;
  photos: string[] | null;
  created_at: string;
  owner_id: string;
};

type SortKey = 'newest' | 'cheapest' | 'biggest';

export default function BrowseLands() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lands, setLands] = useState<Land[]>([]);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('newest');
  const [myPendingRequests, setMyPendingRequests] = useState<Set<string>>(new Set());

  const fetchLands = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Approved + available lands (not owned by current user)
      const { data, error } = await supabase
        .from('land_listings')
        .select('*')
        .eq('approval_status', 'approved')
        .eq('is_available', true)
        .neq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLands(data || []);

      // Track which lands the parking owner already has a pending request on
      const { data: myReqs } = await supabase
        .from('land_rental_requests')
        .select('land_id')
        .eq('parking_owner_id', user.id)
        .eq('status', 'pending');

      setMyPendingRequests(new Set((myReqs || []).map(r => r.land_id)));
    } catch (err) {
      console.error('Browse lands error:', err);
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

  const filtered = lands
    .filter((l) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        l.title.toLowerCase().includes(q) ||
        l.address.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sortKey === 'cheapest') {
        const ar = a.expected_rent ?? Infinity;
        const br = b.expected_rent ?? Infinity;
        return ar - br;
      }
      if (sortKey === 'biggest') return b.area_sqft - a.area_sqft;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

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
        <Text style={s.headerTitle}>Find Land to Rent</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Search */}
      <View style={s.searchWrap}>
        <Ionicons name="search" size={18} color="#9CA3AF" />
        <TextInput
          style={s.searchInput}
          placeholder="Search by title or address..."
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={setSearch}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Sort chips */}
      <View style={s.chipsRow}>
        {([
          { key: 'newest', label: 'Newest', icon: 'time-outline' },
          { key: 'cheapest', label: 'Cheapest', icon: 'cash-outline' },
          { key: 'biggest', label: 'Biggest', icon: 'resize-outline' },
        ] as { key: SortKey; label: string; icon: any }[]).map((c) => (
          <TouchableOpacity
            key={c.key}
            style={[s.chip, sortKey === c.key && s.chipActive]}
            onPress={() => setSortKey(c.key)}
          >
            <Ionicons name={c.icon} size={13} color={sortKey === c.key ? '#fff' : '#6B7280'} />
            <Text style={[s.chipText, sortKey === c.key && s.chipTextActive]}>{c.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22C55E" />
        }
      >
        {filtered.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 80 }}>
            <Ionicons name="leaf-outline" size={64} color="#D1D5DB" />
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#6B7280', marginTop: 16 }}>
              {search ? 'No matches found' : 'No land available right now'}
            </Text>
            <Text style={{ fontSize: 13, color: '#9CA3AF', marginTop: 6, textAlign: 'center', paddingHorizontal: 40 }}>
              {search
                ? 'Try a different search'
                : "Check back soon - new land listings will appear here"}
            </Text>
          </View>
        ) : (
          filtered.map((land) => {
            const hasPending = myPendingRequests.has(land.id);
            return (
              <TouchableOpacity
                key={land.id}
                style={s.card}
                onPress={() => router.push(`/(parking-owner)/land-details/${land.id}` as any)}
                activeOpacity={0.85}
              >
                {/* Image / placeholder */}
                <View style={s.thumb}>
                  {land.photos && land.photos.length > 0 ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <View style={[s.thumbInner, { backgroundColor: '#E5E7EB' }]}>
                      <Ionicons name="image" size={32} color="#9CA3AF" />
                    </View>
                  ) : (
                    <View style={s.thumbInner}>
                      <Ionicons name="leaf" size={36} color="#22C55E" />
                    </View>
                  )}
                  {hasPending && (
                    <View style={s.pendingBadge}>
                      <Ionicons name="time" size={11} color="#fff" />
                      <Text style={s.pendingBadgeText}>Request Sent</Text>
                    </View>
                  )}
                </View>

                <View style={s.cardBody}>
                  <Text style={s.cardTitle} numberOfLines={1}>{land.title}</Text>
                  <Text style={s.cardAddress} numberOfLines={1}>
                    📍 {land.address}
                  </Text>

                  <View style={s.cardMeta}>
                    <View style={s.metaItem}>
                      <Ionicons name="resize-outline" size={13} color="#6B7280" />
                      <Text style={s.metaText}>{sqftToAana(land.area_sqft)} Aana</Text>
                    </View>
                    <View style={s.metaItem}>
                      <Ionicons name="cash-outline" size={13} color="#22C55E" />
                      <Text style={[s.metaText, { color: '#22C55E', fontWeight: '700' }]}>
                        {land.expected_rent
                          ? `Rs ${land.expected_rent.toLocaleString()}/mo`
                          : 'Negotiable'}
                      </Text>
                    </View>
                  </View>

                  <View style={s.cardCTA}>
                    <Text style={s.cardCTAText}>View details & send request</Text>
                    <Ionicons name="chevron-forward" size={16} color="#22C55E" />
                  </View>
                </View>
              </TouchableOpacity>
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

  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fff', marginHorizontal: 16, marginTop: 12,
    borderRadius: 12, paddingHorizontal: 12, height: 44,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  searchInput: { flex: 1, fontSize: 14, color: '#111827' },

  chipsRow: {
    flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginTop: 12,
  },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  chipActive: { backgroundColor: '#22C55E' },
  chipText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  chipTextActive: { color: '#fff' },

  card: {
    backgroundColor: '#fff', borderRadius: 14, marginBottom: 14,
    borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden',
  },
  thumb: { height: 130, backgroundColor: '#F0FDF4', position: 'relative' },
  thumbInner: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  pendingBadge: {
    position: 'absolute', top: 10, right: 10,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#D97706', paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 12,
  },
  pendingBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  cardBody: { padding: 14 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  cardAddress: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  cardMeta: {
    flexDirection: 'row', gap: 14, marginTop: 12,
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 13, color: '#374151' },
  cardCTA: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6',
  },
  cardCTAText: { fontSize: 13, color: '#22C55E', fontWeight: '600' },
});