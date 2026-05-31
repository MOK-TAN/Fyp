import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
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

// ─── Types ───────────────────────────────────────────────────────────────────
type Period = 'today' | 'week' | 'month' | 'all';

interface ReportData {
  // Revenue
  totalRevenue: number;
  bookingCount: number;
  completedCount: number;
  cancelledCount: number;
  avgBookingValue: number;

  // Users
  newUsers: number;
  newParkingOwners: number;
  newLandOwners: number;

  // Land rental
  newAgreements: number;
  totalAgreementValue: number;

  // Payment methods
  esewa: { count: number; revenue: number };
  khalti: { count: number; revenue: number };
  cash: { count: number; revenue: number };

  // Booking types
  appBookings: number;
  walkInBookings: number;
}

interface TopFacility {
  id: string;
  name: string;
  booking_count: number;
  total_revenue: number;
}

interface TopOwner {
  id: string;
  full_name: string;
  total_revenue: number;
  booking_count: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatCurrency = (amount: number) => {
  if (amount >= 100000) return `Rs ${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `Rs ${(amount / 1000).toFixed(1)}K`;
  return `Rs ${amount.toFixed(0)}`;
};

const getPeriodStart = (period: Period): Date | null => {
  const now = new Date();
  if (period === 'today') {
    now.setHours(0, 0, 0, 0);
    return now;
  }
  if (period === 'week') {
    now.setDate(now.getDate() - 7);
    return now;
  }
  if (period === 'month') {
    now.setMonth(now.getMonth() - 1);
    return now;
  }
  return null; // all time
};

const PERIODS: { key: Period; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'Last 7 Days' },
  { key: 'month', label: 'Last 30 Days' },
  { key: 'all', label: 'All Time' },
];

// ─── Section Header ──────────────────────────────────────────────────────────
function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

// ─── Big Stat ────────────────────────────────────────────────────────────────
function BigStat({
  label,
  value,
  icon,
  iconBg,
  iconColor,
  sub,
}: {
  label: string;
  value: string;
  icon: any;
  iconBg: string;
  iconColor: string;
  sub?: string;
}) {
  return (
    <View style={styles.bigStatCard}>
      <View style={[styles.bigStatIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={24} color={iconColor} />
      </View>
      <Text style={styles.bigStatValue}>{value}</Text>
      <Text style={styles.bigStatLabel}>{label}</Text>
      {sub && <Text style={styles.bigStatSub}>{sub}</Text>}
    </View>
  );
}

// ─── Comparison Bar Row ──────────────────────────────────────────────────────
function CompareBarRow({
  label,
  value,
  total,
  color,
  rightLabel,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
  rightLabel: string;
}) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <View style={styles.compareBarContainer}>
      <View style={styles.compareBarHeader}>
        <Text style={styles.compareBarLabel}>{label}</Text>
        <Text style={[styles.compareBarValue, { color }]}>{rightLabel}</Text>
      </View>
      <View style={styles.compareBarTrack}>
        <View style={[styles.compareBarFill, { width: `${percentage}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.compareBarPct}>{percentage}%</Text>
    </View>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function AdminReports() {
  const [period, setPeriod] = useState<Period>('month');
  const [data, setData] = useState<ReportData | null>(null);
  const [topFacilities, setTopFacilities] = useState<TopFacility[]>([]);
  const [topOwners, setTopOwners] = useState<TopOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReports = useCallback(async () => {
    try {
      const periodStart = getPeriodStart(period);
      const dateFilter = periodStart ? periodStart.toISOString() : null;

      // ── Bookings query ──
      let bookingsQuery = supabase.from('bookings').select('id, total_amount, status, payment_method, booking_type, facility_id, created_at');
      if (dateFilter) bookingsQuery = bookingsQuery.gte('created_at', dateFilter);
      const { data: bookingsData } = await bookingsQuery;

      const totalRevenue = (bookingsData ?? []).reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0);
      const bookingCount = bookingsData?.length ?? 0;
      const completedCount = (bookingsData ?? []).filter(b => b.status === 'completed').length;
      const cancelledCount = (bookingsData ?? []).filter(b => b.status === 'cancelled').length;

      // Payment method split
      const esewa = { count: 0, revenue: 0 };
      const khalti = { count: 0, revenue: 0 };
      const cash = { count: 0, revenue: 0 };
      (bookingsData ?? []).forEach(b => {
        const amt = Number(b.total_amount) || 0;
        if (b.payment_method === 'esewa') { esewa.count++; esewa.revenue += amt; }
        else if (b.payment_method === 'khalti') { khalti.count++; khalti.revenue += amt; }
        else if (b.payment_method === 'cash') { cash.count++; cash.revenue += amt; }
      });

      // Booking type split
      const walkInBookings = (bookingsData ?? []).filter(b => b.booking_type === 'walk_in').length;
      const appBookings = bookingCount - walkInBookings;

      // ── Users ──
      let usersQuery = supabase.from('profiles').select('id, role, created_at');
      if (dateFilter) usersQuery = usersQuery.gte('created_at', dateFilter);
      const { data: usersData } = await usersQuery;

      const newUsers = (usersData ?? []).filter(u => u.role === 'user').length;
      const newParkingOwners = (usersData ?? []).filter(u => u.role === 'parking_owner').length;
      const newLandOwners = (usersData ?? []).filter(u => u.role === 'land_owner').length;

      // ── Land agreements ──
      let agreementsQuery = supabase.from('land_agreements').select('id, monthly_rent, start_date, end_date, created_at');
      if (dateFilter) agreementsQuery = agreementsQuery.gte('created_at', dateFilter);
      const { data: agreementsData } = await agreementsQuery;

      const newAgreements = agreementsData?.length ?? 0;
      const totalAgreementValue = (agreementsData ?? []).reduce((sum, a) => {
        const months = Math.max(1,
          (new Date(a.end_date).getFullYear() - new Date(a.start_date).getFullYear()) * 12 +
          (new Date(a.end_date).getMonth() - new Date(a.start_date).getMonth())
        );
        return sum + (Number(a.monthly_rent) || 0) * months;
      }, 0);

      setData({
        totalRevenue,
        bookingCount,
        completedCount,
        cancelledCount,
        avgBookingValue: bookingCount > 0 ? totalRevenue / bookingCount : 0,
        newUsers,
        newParkingOwners,
        newLandOwners,
        newAgreements,
        totalAgreementValue,
        esewa, khalti, cash,
        appBookings,
        walkInBookings,
      });

      // ── Top facilities ──
      const facilityMap = new Map<string, { count: number; revenue: number }>();
      (bookingsData ?? []).forEach(b => {
        if (!b.facility_id) return;
        const prev = facilityMap.get(b.facility_id) ?? { count: 0, revenue: 0 };
        facilityMap.set(b.facility_id, {
          count: prev.count + 1,
          revenue: prev.revenue + (Number(b.total_amount) || 0),
        });
      });

      const topFacilityIds = Array.from(facilityMap.entries())
        .sort((a, b) => b[1].revenue - a[1].revenue)
        .slice(0, 5)
        .map(([id]) => id);

      if (topFacilityIds.length > 0) {
        const { data: facilitiesData } = await supabase
          .from('parking_facilities')
          .select('id, name')
          .in('id', topFacilityIds);

        const tops: TopFacility[] = (facilitiesData ?? []).map(f => ({
          id: f.id,
          name: f.name,
          booking_count: facilityMap.get(f.id)?.count ?? 0,
          total_revenue: facilityMap.get(f.id)?.revenue ?? 0,
        })).sort((a, b) => b.total_revenue - a.total_revenue);

        setTopFacilities(tops);
      } else {
        setTopFacilities([]);
      }

      // ── Top parking owners ──
      if (topFacilityIds.length > 0) {
        const { data: ownersData } = await supabase
          .from('parking_facilities')
          .select('owner_id, profiles(full_name)')
          .in('id', Array.from(facilityMap.keys()));

        const ownerMap = new Map<string, { full_name: string; count: number; revenue: number }>();
        (ownersData ?? []).forEach((row: any) => {
          const fId = row.id;
          // skip — we need to get owner via facility_id mapping
        });

        // Better approach: get owner_id for each facility, then aggregate
        const { data: allFacilitiesData } = await supabase
          .from('parking_facilities')
          .select('id, owner_id, profiles!parking_facilities_owner_id_fkey(full_name)')
          .in('id', Array.from(facilityMap.keys()));

        (allFacilitiesData ?? []).forEach((row: any) => {
          const ownerId = row.owner_id;
          const ownerName = (row.profiles as any)?.full_name ?? 'Unknown';
          const stats = facilityMap.get(row.id) ?? { count: 0, revenue: 0 };
          const prev = ownerMap.get(ownerId) ?? { full_name: ownerName, count: 0, revenue: 0 };
          ownerMap.set(ownerId, {
            full_name: ownerName,
            count: prev.count + stats.count,
            revenue: prev.revenue + stats.revenue,
          });
        });

        const tops: TopOwner[] = Array.from(ownerMap.entries())
          .map(([id, v]) => ({ id, full_name: v.full_name, booking_count: v.count, total_revenue: v.revenue }))
          .sort((a, b) => b.total_revenue - a.total_revenue)
          .slice(0, 5);

        setTopOwners(tops);
      } else {
        setTopOwners([]);
      }
    } catch (e) {
      console.error('Reports fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period]);

  useEffect(() => {
    setLoading(true);
    fetchReports();
  }, [fetchReports]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReports();
  };

  const periodLabel = PERIODS.find(p => p.key === period)?.label ?? '';

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#22C55E" />
        <Text style={styles.loadingText}>Generating report...</Text>
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
        <Text style={styles.headerTitle}>Reports</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Period selector */}
      <View style={styles.periodWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.periodScroll}>
          {PERIODS.map((p) => (
            <TouchableOpacity
              key={p.key}
              style={[styles.periodChip, period === p.key && styles.periodChipActive]}
              onPress={() => setPeriod(p.key)}
            >
              <Text style={[styles.periodChipText, period === p.key && styles.periodChipTextActive]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22C55E" />}
      >
        <Text style={styles.contextLabel}>Showing data for: {periodLabel}</Text>

        {/* Revenue Section */}
        <SectionHeader title="Revenue" />
        <View style={styles.bigStatsRow}>
          <BigStat
            label="Total Revenue"
            value={formatCurrency(data?.totalRevenue ?? 0)}
            icon="cash"
            iconBg="#F0FDF4"
            iconColor="#22C55E"
          />
          <BigStat
            label="Avg per Booking"
            value={formatCurrency(data?.avgBookingValue ?? 0)}
            icon="trending-up"
            iconBg="#EFF6FF"
            iconColor="#3B82F6"
          />
        </View>

        {/* Bookings Section */}
        <SectionHeader title="Bookings" />
        <View style={styles.bookingStatsCard}>
          <View style={styles.bookingStatsRow}>
            <View style={styles.bookingStatsItem}>
              <Text style={styles.bookingStatsNum}>{data?.bookingCount ?? 0}</Text>
              <Text style={styles.bookingStatsLabel}>Total</Text>
            </View>
            <View style={styles.bookingDivider} />
            <View style={styles.bookingStatsItem}>
              <Text style={[styles.bookingStatsNum, { color: '#22C55E' }]}>{data?.completedCount ?? 0}</Text>
              <Text style={styles.bookingStatsLabel}>Completed</Text>
            </View>
            <View style={styles.bookingDivider} />
            <View style={styles.bookingStatsItem}>
              <Text style={[styles.bookingStatsNum, { color: '#EF4444' }]}>{data?.cancelledCount ?? 0}</Text>
              <Text style={styles.bookingStatsLabel}>Cancelled</Text>
            </View>
          </View>
        </View>

        {/* App vs Walk-in */}
        <SectionHeader title="App vs Walk-in" />
        <View style={styles.compareCard}>
          <CompareBarRow
            label="App Bookings"
            value={data?.appBookings ?? 0}
            total={data?.bookingCount ?? 0}
            color="#3B82F6"
            rightLabel={`${data?.appBookings ?? 0}`}
          />
          <View style={{ height: 12 }} />
          <CompareBarRow
            label="Walk-in Bookings"
            value={data?.walkInBookings ?? 0}
            total={data?.bookingCount ?? 0}
            color="#F97316"
            rightLabel={`${data?.walkInBookings ?? 0}`}
          />
        </View>

        {/* Payment Methods */}
        <SectionHeader title="Payment Methods" />
        <View style={styles.compareCard}>
          
          
          <CompareBarRow
            label="Khalti"
            value={data?.khalti.count ?? 0}
            total={data?.bookingCount ?? 0}
            color="#8B5CF6"
            rightLabel={`${data?.khalti.count ?? 0} · ${formatCurrency(data?.khalti.revenue ?? 0)}`}
          />
          <View style={{ height: 12 }} />
          <CompareBarRow
            label="Cash"
            value={data?.cash.count ?? 0}
            total={data?.bookingCount ?? 0}
            color="#6B7280"
            rightLabel={`${data?.cash.count ?? 0} · ${formatCurrency(data?.cash.revenue ?? 0)}`}
          />
        </View>

        {/* User Growth */}
        <SectionHeader title="User Growth" />
        <View style={styles.compareCard}>
          <CompareBarRow
            label="Regular Users"
            value={data?.newUsers ?? 0}
            total={Math.max(1, (data?.newUsers ?? 0) + (data?.newParkingOwners ?? 0) + (data?.newLandOwners ?? 0))}
            color="#3B82F6"
            rightLabel={`${data?.newUsers ?? 0} new`}
          />
          <View style={{ height: 12 }} />
          <CompareBarRow
            label="Parking Owners"
            value={data?.newParkingOwners ?? 0}
            total={Math.max(1, (data?.newUsers ?? 0) + (data?.newParkingOwners ?? 0) + (data?.newLandOwners ?? 0))}
            color="#F97316"
            rightLabel={`${data?.newParkingOwners ?? 0} new`}
          />
          <View style={{ height: 12 }} />
          <CompareBarRow
            label="Land Owners"
            value={data?.newLandOwners ?? 0}
            total={Math.max(1, (data?.newUsers ?? 0) + (data?.newParkingOwners ?? 0) + (data?.newLandOwners ?? 0))}
            color="#22C55E"
            rightLabel={`${data?.newLandOwners ?? 0} new`}
          />
        </View>

        {/* Land Rental Stats */}
        <SectionHeader title="Land Rental" />
        <View style={styles.bigStatsRow}>
          <BigStat
            label="New Agreements"
            value={String(data?.newAgreements ?? 0)}
            icon="document-text"
            iconBg="#F5F3FF"
            iconColor="#8B5CF6"
          />
          <BigStat
            label="Contract Value"
            value={formatCurrency(data?.totalAgreementValue ?? 0)}
            icon="briefcase"
            iconBg="#ECFDF5"
            iconColor="#10B981"
            sub="lifetime of contracts"
          />
        </View>

        {/* Top Facilities */}
        {topFacilities.length > 0 && (
          <>
            <SectionHeader title="Top Facilities by Revenue" />
            <View style={styles.listCard}>
              {topFacilities.map((f, index) => (
                <View key={f.id}>
                  <View style={styles.topRow}>
                    <View style={styles.rankBadge}>
                      <Text style={styles.rankText}>{index + 1}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.topName} numberOfLines={1}>{f.name}</Text>
                      <Text style={styles.topMeta}>{f.booking_count} bookings</Text>
                    </View>
                    <Text style={styles.topRevenue}>{formatCurrency(f.total_revenue)}</Text>
                  </View>
                  {index < topFacilities.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </View>
          </>
        )}

        {/* Top Owners */}
        {topOwners.length > 0 && (
          <>
            <SectionHeader title="Top Parking Owners" />
            <View style={styles.listCard}>
              {topOwners.map((o, index) => (
                <View key={o.id}>
                  <View style={styles.topRow}>
                    <View style={[styles.rankBadge, { backgroundColor: '#FFF7ED' }]}>
                      <Text style={[styles.rankText, { color: '#F97316' }]}>{index + 1}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.topName} numberOfLines={1}>{o.full_name}</Text>
                      <Text style={styles.topMeta}>{o.booking_count} bookings</Text>
                    </View>
                    <Text style={styles.topRevenue}>{formatCurrency(o.total_revenue)}</Text>
                  </View>
                  {index < topOwners.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </View>
          </>
        )}

        {/* Empty state */}
        {data && data.bookingCount === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="bar-chart-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>No data for this period</Text>
            <Text style={styles.emptySubText}>Try a different time range</Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#6B7280' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },

  periodWrap: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  periodScroll: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  periodChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#fff',
  },
  periodChipActive: { backgroundColor: '#111827', borderColor: '#111827' },
  periodChipText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  periodChipTextActive: { color: '#fff' },

  content: { flex: 1, paddingHorizontal: 20 },
  contextLabel: { fontSize: 12, color: '#9CA3AF', marginTop: 14, fontStyle: 'italic' },

  sectionHeader: { marginTop: 22, marginBottom: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },

  bigStatsRow: { flexDirection: 'row', gap: 12 },
  bigStatCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 12,
    borderWidth: 1, borderColor: '#E5E7EB', padding: 14,
  },
  bigStatIcon: {
    width: 40, height: 40, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center', marginBottom: 10,
  },
  bigStatValue: { fontSize: 22, fontWeight: '700', color: '#111827' },
  bigStatLabel: { fontSize: 12, color: '#6B7280', fontWeight: '600', marginTop: 2 },
  bigStatSub: { fontSize: 11, color: '#9CA3AF', marginTop: 4 },

  bookingStatsCard: {
    backgroundColor: '#fff', borderRadius: 12,
    borderWidth: 1, borderColor: '#E5E7EB', padding: 16,
  },
  bookingStatsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  bookingStatsItem: { alignItems: 'center', flex: 1 },
  bookingStatsNum: { fontSize: 22, fontWeight: '700', color: '#111827' },
  bookingStatsLabel: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  bookingDivider: { width: 1, backgroundColor: '#F3F4F6' },

  compareCard: {
    backgroundColor: '#fff', borderRadius: 12,
    borderWidth: 1, borderColor: '#E5E7EB', padding: 16,
  },
  compareBarContainer: {},
  compareBarHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 6,
  },
  compareBarLabel: { fontSize: 13, fontWeight: '600', color: '#374151' },
  compareBarValue: { fontSize: 13, fontWeight: '700' },
  compareBarTrack: {
    height: 8, backgroundColor: '#F3F4F6',
    borderRadius: 4, overflow: 'hidden',
  },
  compareBarFill: { height: '100%', borderRadius: 4 },
  compareBarPct: { fontSize: 11, color: '#9CA3AF', marginTop: 4, textAlign: 'right' },

  listCard: {
    backgroundColor: '#fff', borderRadius: 12,
    borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden',
  },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginHorizontal: 16 },

  topRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  rankBadge: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center', alignItems: 'center',
  },
  rankText: { fontSize: 13, fontWeight: '700', color: '#22C55E' },
  topName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  topMeta: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  topRevenue: { fontSize: 14, fontWeight: '700', color: '#22C55E' },

  emptyState: { alignItems: 'center', paddingVertical: 50 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#6B7280', marginTop: 12 },
  emptySubText: { fontSize: 13, color: '#9CA3AF', marginTop: 4 },
});