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
interface MonitorStats {
  activeBookings: number;
  occupiedSlots: number;
  totalSlots: number;
  pendingFacilities: number;
  pendingLand: number;
  pendingRequests: number;
  activeAgreements: number;
  liveFacilities: number;
  todaySignups: number;
}

interface FacilityOccupancy {
  id: string;
  name: string;
  total_slots: number;
  occupied: number;
  available: number;
  percentage: number;
}

interface ActivityItem {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  time: string;
  icon: any;
  iconColor: string;
  iconBg: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const occupancyColor = (pct: number) => {
  if (pct >= 80) return '#EF4444';
  if (pct >= 50) return '#F97316';
  if (pct >= 25) return '#22C55E';
  return '#3B82F6';
};

// ─── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  icon,
  iconBg,
  iconColor,
  onPress,
  sub,
}: {
  label: string;
  value: string | number;
  icon: any;
  iconBg: string;
  iconColor: string;
  onPress?: () => void;
  sub?: string;
}) {
  return (
    <TouchableOpacity
      style={styles.statCard}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[styles.statIconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {sub && <Text style={styles.statSub}>{sub}</Text>}
    </TouchableOpacity>
  );
}

// ─── Section Header ──────────────────────────────────────────────────────────
function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
    </View>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function AdminMonitors() {
  const [stats, setStats] = useState<MonitorStats | null>(null);
  const [occupancy, setOccupancy] = useState<FacilityOccupancy[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchData = useCallback(async () => {
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      // ── Stats ──
      const [
        { count: activeBookings },
        { count: occupiedSlots },
        { count: totalSlots },
        { count: pendingFacilities },
        { count: pendingLand },
        { count: pendingRequests },
        { count: activeAgreements },
        { count: liveFacilities },
        { count: todaySignups },
      ] = await Promise.all([
        supabase.from('bookings').select('*', { count: 'exact', head: true })
          .eq('status', 'active'),
        supabase.from('parking_slots').select('*', { count: 'exact', head: true })
          .eq('is_occupied', true),
        supabase.from('parking_slots').select('*', { count: 'exact', head: true }),
        supabase.from('parking_facilities').select('*', { count: 'exact', head: true })
          .eq('approval_status', 'pending'),
        supabase.from('land_listings').select('*', { count: 'exact', head: true })
          .eq('approval_status', 'pending'),
        supabase.from('land_rental_requests').select('*', { count: 'exact', head: true })
          .eq('status', 'pending'),
        supabase.from('land_agreements').select('*', { count: 'exact', head: true })
          .eq('status', 'active'),
        supabase.from('parking_facilities').select('*', { count: 'exact', head: true })
          .eq('is_active', true).eq('approval_status', 'approved'),
        supabase.from('profiles').select('*', { count: 'exact', head: true })
          .gte('created_at', todayStart.toISOString()),
      ]);

      setStats({
        activeBookings: activeBookings ?? 0,
        occupiedSlots: occupiedSlots ?? 0,
        totalSlots: totalSlots ?? 0,
        pendingFacilities: pendingFacilities ?? 0,
        pendingLand: pendingLand ?? 0,
        pendingRequests: pendingRequests ?? 0,
        activeAgreements: activeAgreements ?? 0,
        liveFacilities: liveFacilities ?? 0,
        todaySignups: todaySignups ?? 0,
      });

      // ── Slot occupancy per facility ──
      const { data: facilitiesData } = await supabase
        .from('parking_facilities')
        .select('id, name, total_slots')
        .eq('is_active', true)
        .eq('approval_status', 'approved')
        .order('total_slots', { ascending: false })
        .limit(10);

      const occupancyData: FacilityOccupancy[] = await Promise.all(
        (facilitiesData ?? []).map(async (f) => {
          const { count: occupiedCount } = await supabase
            .from('parking_slots')
            .select('*', { count: 'exact', head: true })
            .eq('facility_id', f.id)
            .eq('is_occupied', true);

          const occupied = occupiedCount ?? 0;
          const total = f.total_slots ?? 0;
          return {
            id: f.id,
            name: f.name,
            total_slots: total,
            occupied,
            available: total - occupied,
            percentage: total > 0 ? Math.round((occupied / total) * 100) : 0,
          };
        })
      );

      setOccupancy(occupancyData);

      // ── Recent activity (last 15 events from multiple sources) ──
      const [
        { data: recentBookings },
        { data: recentSignups },
        { data: recentSubmissions },
        { data: recentRequests },
        { data: recentAgreements },
      ] = await Promise.all([
        supabase.from('bookings')
          .select('id, created_at, total_amount, profiles(full_name), parking_facilities(name)')
          .order('created_at', { ascending: false })
          .limit(5),
        supabase.from('profiles')
          .select('id, full_name, role, created_at')
          .order('created_at', { ascending: false })
          .limit(5),
        supabase.from('parking_facilities')
          .select('id, name, created_at, approval_status')
          .order('created_at', { ascending: false })
          .limit(3),
        supabase.from('land_rental_requests')
          .select('id, created_at, status, land_listings(title)')
          .order('created_at', { ascending: false })
          .limit(3),
        supabase.from('land_agreements')
          .select('id, created_at, monthly_rent, land_listings(title)')
          .order('created_at', { ascending: false })
          .limit(3),
      ]);

      const allActivity: ActivityItem[] = [
        ...(recentBookings ?? []).map((b: any) => ({
          id: `b-${b.id}`,
          type: 'booking',
          title: 'New booking',
          subtitle: `${(b.profiles as any)?.full_name ?? 'User'} → ${(b.parking_facilities as any)?.name ?? 'facility'} · Rs ${b.total_amount?.toFixed(0)}`,
          time: b.created_at,
          icon: 'car' as const,
          iconColor: '#22C55E',
          iconBg: '#F0FDF4',
        })),
        ...(recentSignups ?? []).map((s: any) => ({
          id: `s-${s.id}`,
          type: 'signup',
          title: 'New signup',
          subtitle: `${s.full_name} joined as ${s.role.replace('_', ' ')}`,
          time: s.created_at,
          icon: 'person-add' as const,
          iconColor: '#3B82F6',
          iconBg: '#EFF6FF',
        })),
        ...(recentSubmissions ?? []).map((f: any) => ({
          id: `f-${f.id}`,
          type: 'submission',
          title: 'Facility submitted',
          subtitle: `"${f.name}" — status: ${f.approval_status}`,
          time: f.created_at,
          icon: 'business' as const,
          iconColor: '#F97316',
          iconBg: '#FFF7ED',
        })),
        ...(recentRequests ?? []).map((r: any) => ({
          id: `r-${r.id}`,
          type: 'rental_request',
          title: 'Rental request',
          subtitle: `On "${(r.land_listings as any)?.title ?? 'land'}" — ${r.status}`,
          time: r.created_at,
          icon: 'mail' as const,
          iconColor: '#8B5CF6',
          iconBg: '#F5F3FF',
        })),
        ...(recentAgreements ?? []).map((a: any) => ({
          id: `a-${a.id}`,
          type: 'agreement',
          title: 'Agreement created',
          subtitle: `"${(a.land_listings as any)?.title ?? 'land'}" — Rs ${Number(a.monthly_rent).toLocaleString()}/mo`,
          time: a.created_at,
          icon: 'document-text' as const,
          iconColor: '#10B981',
          iconBg: '#ECFDF5',
        })),
      ]
        .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
        .slice(0, 15);

      setActivity(allActivity);
      setLastRefresh(new Date());
    } catch (e) {
      console.error('Monitor fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // auto-refresh every 30s
    return () => clearInterval(interval);
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const totalPending = (stats?.pendingFacilities ?? 0) + (stats?.pendingLand ?? 0) + (stats?.pendingRequests ?? 0);
  const overallOccupancy = stats && stats.totalSlots > 0
    ? Math.round((stats.occupiedSlots / stats.totalSlots) * 100)
    : 0;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#22C55E" />
        <Text style={styles.loadingText}>Loading live data...</Text>
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
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>Live Monitor</Text>
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>
              Live · refreshed {timeAgo(lastRefresh.toISOString())}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22C55E" />}
      >
        {/* Pending banner */}
        {totalPending > 0 && (
          <TouchableOpacity
            style={styles.pendingBanner}
            onPress={() => router.push('/(admin)/approvals')}
            activeOpacity={0.85}
          >
            <View style={styles.pendingBannerLeft}>
              <Ionicons name="time" size={20} color="#D97706" />
              <View>
                <Text style={styles.pendingBannerTitle}>{totalPending} Awaiting Review</Text>
                <Text style={styles.pendingBannerSub}>
                  {stats?.pendingFacilities ?? 0} facilities · {stats?.pendingLand ?? 0} lands · {stats?.pendingRequests ?? 0} rental requests
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#D97706" />
          </TouchableOpacity>
        )}

        {/* Top stats */}
        <SectionHeader title="Right Now" subtitle="Real-time platform state" />
        <View style={styles.statsGrid}>
          <StatCard
            label="Active Bookings"
            value={stats?.activeBookings ?? 0}
            icon="car-sport"
            iconBg="#F0FDF4"
            iconColor="#22C55E"
            sub="currently parked"
          />
          <StatCard
            label="Live Facilities"
            value={stats?.liveFacilities ?? 0}
            icon="business"
            iconBg="#FFF7ED"
            iconColor="#F97316"
            sub="approved & active"
          />
          <StatCard
            label="Active Agreements"
            value={stats?.activeAgreements ?? 0}
            icon="document-text"
            iconBg="#F5F3FF"
            iconColor="#8B5CF6"
            sub="land rented out"
            onPress={() => {}}
          />
          <StatCard
            label="Today's Signups"
            value={stats?.todaySignups ?? 0}
            icon="person-add"
            iconBg="#EFF6FF"
            iconColor="#3B82F6"
            sub="new users today"
          />
        </View>

        {/* Overall slot occupancy */}
        <SectionHeader title="Slot Occupancy" subtitle={`${stats?.occupiedSlots ?? 0} of ${stats?.totalSlots ?? 0} slots in use`} />
        <View style={styles.overallCard}>
          <View style={styles.overallHeader}>
            <Text style={styles.overallLabel}>Platform-wide</Text>
            <Text style={[styles.overallPct, { color: occupancyColor(overallOccupancy) }]}>
              {overallOccupancy}%
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${overallOccupancy}%`, backgroundColor: occupancyColor(overallOccupancy) },
              ]}
            />
          </View>
          <View style={styles.overallStats}>
            <Text style={styles.overallStatText}>
              <Text style={{ fontWeight: '700', color: '#EF4444' }}>{stats?.occupiedSlots ?? 0}</Text> occupied
            </Text>
            <Text style={styles.overallStatText}>
              <Text style={{ fontWeight: '700', color: '#22C55E' }}>{(stats?.totalSlots ?? 0) - (stats?.occupiedSlots ?? 0)}</Text> available
            </Text>
          </View>
        </View>

        {/* Per-facility occupancy */}
        {occupancy.length > 0 && (
          <>
            <SectionHeader title="Facility Breakdown" subtitle="Top 10 facilities by capacity" />
            <View style={styles.listCard}>
              {occupancy.map((f, index) => (
                <View key={f.id}>
                  <View style={styles.facilityRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.facilityName} numberOfLines={1}>{f.name}</Text>
                      <Text style={styles.facilityMeta}>
                        {f.occupied}/{f.total_slots} occupied · {f.available} free
                      </Text>
                      <View style={styles.facilityProgressBar}>
                        <View
                          style={[
                            styles.facilityProgressFill,
                            { width: `${f.percentage}%`, backgroundColor: occupancyColor(f.percentage) },
                          ]}
                        />
                      </View>
                    </View>
                    <Text style={[styles.facilityPct, { color: occupancyColor(f.percentage) }]}>
                      {f.percentage}%
                    </Text>
                  </View>
                  {index < occupancy.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </View>
          </>
        )}

        {/* Recent activity */}
        <SectionHeader title="Recent Activity" subtitle="Last 15 events across the platform" />
        {activity.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="time-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>No activity yet</Text>
          </View>
        ) : (
          <View style={styles.listCard}>
            {activity.map((item, index) => (
              <View key={item.id}>
                <View style={styles.activityRow}>
                  <View style={[styles.activityIcon, { backgroundColor: item.iconBg }]}>
                    <Ionicons name={item.icon} size={16} color={item.iconColor} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.activityTitle}>{item.title}</Text>
                    <Text style={styles.activitySubtitle} numberOfLines={1}>
                      {item.subtitle}
                    </Text>
                  </View>
                  <Text style={styles.activityTime}>{timeAgo(item.time)}</Text>
                </View>
                {index < activity.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
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
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#22C55E' },
  liveText: { fontSize: 11, color: '#6B7280' },

  content: { flex: 1, paddingHorizontal: 20 },

  pendingBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FFFBEB', borderRadius: 12, borderWidth: 1,
    borderColor: '#FDE68A', padding: 14, marginTop: 16,
  },
  pendingBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pendingBannerTitle: { fontSize: 14, fontWeight: '700', color: '#92400E' },
  pendingBannerSub: { fontSize: 12, color: '#B45309', marginTop: 2 },

  sectionHeader: { marginTop: 24, marginBottom: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  sectionSubtitle: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    width: '48%', backgroundColor: '#fff', borderRadius: 12,
    borderWidth: 1, borderColor: '#E5E7EB',
    padding: 14, alignItems: 'flex-start',
  },
  statIconWrap: {
    width: 36, height: 36, borderRadius: 9,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 8,
  },
  statValue: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 2 },
  statLabel: { fontSize: 12, color: '#374151', fontWeight: '600' },
  statSub: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },

  overallCard: {
    backgroundColor: '#fff', borderRadius: 12,
    borderWidth: 1, borderColor: '#E5E7EB', padding: 16,
  },
  overallHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 10,
  },
  overallLabel: { fontSize: 14, fontWeight: '600', color: '#374151' },
  overallPct: { fontSize: 22, fontWeight: '800' },
  progressBar: {
    height: 10, backgroundColor: '#F3F4F6', borderRadius: 5, overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 5 },
  overallStats: {
    flexDirection: 'row', justifyContent: 'space-between', marginTop: 10,
  },
  overallStatText: { fontSize: 13, color: '#6B7280' },

  listCard: {
    backgroundColor: '#fff', borderRadius: 12,
    borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden',
  },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginHorizontal: 16 },

  facilityRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  facilityName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  facilityMeta: { fontSize: 11, color: '#9CA3AF', marginTop: 2, marginBottom: 6 },
  facilityProgressBar: {
    height: 5, backgroundColor: '#F3F4F6', borderRadius: 2.5, overflow: 'hidden',
  },
  facilityProgressFill: { height: '100%', borderRadius: 2.5 },
  facilityPct: { fontSize: 16, fontWeight: '700', minWidth: 50, textAlign: 'right' },

  activityRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
  },
  activityIcon: {
    width: 34, height: 34, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center',
  },
  activityTitle: { fontSize: 13, fontWeight: '600', color: '#111827' },
  activitySubtitle: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  activityTime: { fontSize: 11, color: '#9CA3AF' },

  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, color: '#6B7280', marginTop: 10 },
});