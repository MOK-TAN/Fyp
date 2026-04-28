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
interface DashboardStats {
  totalUsers: number;
  totalParkingOwners: number;
  totalLandOwners: number;
  pendingFacilities: number;
  pendingLandListings: number;
  totalActiveFacilities: number;
  totalActiveAgreements: number;
  todayBookings: number;
  todayRevenue: number;
}

interface RecentBooking {
  id: string;
  booking_reference: string;
  total_amount: number;
  booking_status: string;
  created_at: string;
  profiles: { full_name: string } | null;
  parking_facilities: { name: string } | null;
}

interface RecentSubmission {
  id: string;
  name?: string;
  title?: string;
  created_at: string;
  type: 'facility' | 'land';
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatCurrency = (amount: number) => {
  if (amount >= 100000) return `Rs ${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `Rs ${(amount / 1000).toFixed(1)}K`;
  return `Rs ${amount.toFixed(0)}`;
};

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const statusColor = (status: string) => {
  switch (status) {
    case 'confirmed': return '#22C55E';
    case 'cancelled': return '#EF4444';
    case 'completed': return '#3B82F6';
    default: return '#9CA3AF';
  }
};

// ─── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  icon,
  iconBg,
  iconColor,
  badge,
  onPress,
}: {
  label: string;
  value: string | number;
  icon: any;
  iconBg: string;
  iconColor: string;
  badge?: number;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.statCard}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[styles.statIconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={22} color={iconColor} />
        {badge !== undefined && badge > 0 && (
          <View style={styles.statBadge}>
            <Text style={styles.statBadgeText}>{badge > 99 ? '99+' : badge}</Text>
          </View>
        )}
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ title, onSeeAll }: { title: string; onSeeAll?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {onSeeAll && (
        <TouchableOpacity onPress={onSeeAll}>
          <Text style={styles.seeAll}>See all</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [recentSubmissions, setRecentSubmissions] = useState<RecentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [adminName, setAdminName] = useState('Admin');

  const fetchDashboard = useCallback(async () => {
    try {
      // ── Admin name ──
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();
        if (profile) setAdminName(profile.full_name.split(' ')[0]);
      }

      // ── User counts ──
      const [
        { count: totalUsers },
        { count: totalParkingOwners },
        { count: totalLandOwners },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'user'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'parking_owner'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'land_owner'),
      ]);

      // ── Pending approvals ──
      const [
        { count: pendingFacilities },
        { count: pendingLandListings },
      ] = await Promise.all([
        supabase.from('parking_facilities').select('*', { count: 'exact', head: true }).eq('approval_status', 'pending'),
        supabase.from('land_listings').select('*', { count: 'exact', head: true }).eq('approval_status', 'pending'),
      ]);

      // ── Active counts ──
      const [
        { count: totalActiveFacilities },
        { count: totalActiveAgreements },
      ] = await Promise.all([
        supabase.from('parking_facilities').select('*', { count: 'exact', head: true }).eq('is_active', true).eq('approval_status', 'approved'),
        supabase.from('land_agreements').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      ]);

      // ── Today's bookings + revenue ──
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { data: todayBookingsData } = await supabase
        .from('bookings')
        .select('total_amount')
        .gte('created_at', todayStart.toISOString());

      const todayBookings = todayBookingsData?.length ?? 0;
      const todayRevenue = todayBookingsData?.reduce((sum, b) => sum + (b.total_amount ?? 0), 0) ?? 0;

      setStats({
        totalUsers: totalUsers ?? 0,
        totalParkingOwners: totalParkingOwners ?? 0,
        totalLandOwners: totalLandOwners ?? 0,
        pendingFacilities: pendingFacilities ?? 0,
        pendingLandListings: pendingLandListings ?? 0,
        totalActiveFacilities: totalActiveFacilities ?? 0,
        totalActiveAgreements: totalActiveAgreements ?? 0,
        todayBookings,
        todayRevenue,
      });

      // ── Recent bookings (last 5) ──
      const { data: bookings } = await supabase
        .from('bookings')
        .select('id, booking_reference, total_amount, booking_status, created_at, profiles(full_name), parking_facilities(name)')
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentBookings((bookings as any[]) ?? []);

      // ── Recent submissions (last 3 of each) ──
      const [{ data: facilities }, { data: lands }] = await Promise.all([
        supabase.from('parking_facilities').select('id, name, created_at').eq('approval_status', 'pending').order('created_at', { ascending: false }).limit(3),
        supabase.from('land_listings').select('id, title, created_at').eq('approval_status', 'pending').order('created_at', { ascending: false }).limit(3),
      ]);

      const combined: RecentSubmission[] = [
        ...(facilities ?? []).map((f: any) => ({ ...f, type: 'facility' as const })),
        ...(lands ?? []).map((l: any) => ({ ...l, type: 'land' as const })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);

      setRecentSubmissions(combined);
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  const totalPending = (stats?.pendingFacilities ?? 0) + (stats?.pendingLandListings ?? 0);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#22C55E" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.headerTitle}>{adminName} 👋</Text>
        </View>
        <View style={styles.headerRight}>
          {totalPending > 0 && (
            <TouchableOpacity
              style={styles.alertBell}
              onPress={() => router.push('/(admin)/approvals')}
            >
              <Ionicons name="notifications" size={22} color="#D97706" />
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>{totalPending}</Text>
              </View>
            </TouchableOpacity>
          )}
          <View style={styles.adminBadge}>
            <Text style={styles.adminBadgeText}>ADMIN</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22C55E" />}
      >

        {/* ── Pending Approval Banner ── */}
        {totalPending > 0 && (
          <TouchableOpacity
            style={styles.pendingBanner}
            onPress={() => router.push('/(admin)/approvals')}
            activeOpacity={0.8}
          >
            <View style={styles.pendingBannerLeft}>
              <Ionicons name="time" size={20} color="#D97706" />
              <View>
                <Text style={styles.pendingBannerTitle}>
                  {totalPending} Pending Approval{totalPending > 1 ? 's' : ''}
                </Text>
                <Text style={styles.pendingBannerSub}>
                  {stats?.pendingFacilities ?? 0} facilities · {stats?.pendingLandListings ?? 0} land listings
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#D97706" />
          </TouchableOpacity>
        )}

        {/* ── Today's Stats Row ── */}
        <View style={styles.todayRow}>
          <View style={styles.todayCard}>
            <Text style={styles.todayLabel}>Today's Bookings</Text>
            <Text style={styles.todayValue}>{stats?.todayBookings ?? 0}</Text>
          </View>
          <View style={[styles.todayCard, styles.todayCardGreen]}>
            <Text style={[styles.todayLabel, { color: '#15803D' }]}>Today's Revenue</Text>
            <Text style={[styles.todayValue, { color: '#15803D' }]}>
              {formatCurrency(stats?.todayRevenue ?? 0)}
            </Text>
          </View>
        </View>

        {/* ── Platform Stats Grid ── */}
        <SectionHeader title="Platform Overview" />
        <View style={styles.statsGrid}>
          <StatCard
            label="Regular Users"
            value={stats?.totalUsers ?? 0}
            icon="people"
            iconBg="#EFF6FF"
            iconColor="#3B82F6"
            onPress={() => router.push('/(admin)/users')}
          />
          <StatCard
            label="Parking Owners"
            value={stats?.totalParkingOwners ?? 0}
            icon="business"
            iconBg="#F0FDF4"
            iconColor="#22C55E"
            onPress={() => router.push('/(admin)/users')}
          />
          <StatCard
            label="Land Owners"
            value={stats?.totalLandOwners ?? 0}
            icon="leaf"
            iconBg="#ECFDF5"
            iconColor="#10B981"
            onPress={() => router.push('/(admin)/users')}
          />
          <StatCard
            label="Active Facilities"
            value={stats?.totalActiveFacilities ?? 0}
            icon="car"
            iconBg="#FFF7ED"
            iconColor="#F97316"
            onPress={() => router.push('/(admin)/approvals')}
          />
          <StatCard
            label="Active Agreements"
            value={stats?.totalActiveAgreements ?? 0}
            icon="document-text"
            iconBg="#F5F3FF"
            iconColor="#8B5CF6"
            onPress={() => router.push('/(admin)/monitors')}
          />
          <StatCard
            label="Pending Approvals"
            value={totalPending}
            icon="hourglass"
            iconBg="#FFFBEB"
            iconColor="#D97706"
            badge={totalPending}
            onPress={() => router.push('/(admin)/approvals')}
          />
        </View>

        {/* ── Quick Actions ── */}
        <SectionHeader title="Quick Actions" />
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={() => router.push('/(admin)/approvals')}
            activeOpacity={0.8}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#FFFBEB' }]}>
              <Ionicons name="checkmark-circle" size={24} color="#D97706" />
            </View>
            <Text style={styles.quickActionText}>Review Approvals</Text>
            {totalPending > 0 && (
              <View style={styles.quickActionBadge}>
                <Text style={styles.quickActionBadgeText}>{totalPending}</Text>
              </View>
            )}
            <Ionicons name="chevron-forward" size={16} color="#9CA3AF" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={() => router.push('/(admin)/users')}
            activeOpacity={0.8}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="people" size={24} color="#3B82F6" />
            </View>
            <Text style={styles.quickActionText}>Manage Users</Text>
            <Ionicons name="chevron-forward" size={16} color="#9CA3AF" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={() => router.push('/(admin)/monitors')}
            activeOpacity={0.8}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#F0FDF4' }]}>
              <Ionicons name="stats-chart" size={24} color="#22C55E" />
            </View>
            <Text style={styles.quickActionText}>Monitor Activity</Text>
            <Ionicons name="chevron-forward" size={16} color="#9CA3AF" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={() => router.push('/(admin)/reports')}
            activeOpacity={0.8}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#F5F3FF' }]}>
              <Ionicons name="document-text" size={24} color="#8B5CF6" />
            </View>
            <Text style={styles.quickActionText}>View Reports</Text>
            <Ionicons name="chevron-forward" size={16} color="#9CA3AF" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
        </View>

        {/* ── Recent Submissions (pending) ── */}
        {recentSubmissions.length > 0 && (
          <>
            <SectionHeader
              title="Pending Submissions"
              onSeeAll={() => router.push('/(admin)/approvals')}
            />
            <View style={styles.listCard}>
              {recentSubmissions.map((item, index) => (
                <View key={item.id}>
                  <View style={styles.submissionRow}>
                    <View style={[
                      styles.submissionTypeTag,
                      { backgroundColor: item.type === 'facility' ? '#FFF7ED' : '#F0FDF4' }
                    ]}>
                      <Ionicons
                        name={item.type === 'facility' ? 'car' : 'leaf'}
                        size={14}
                        color={item.type === 'facility' ? '#F97316' : '#22C55E'}
                      />
                    </View>
                    <View style={styles.submissionInfo}>
                      <Text style={styles.submissionName} numberOfLines={1}>
                        {item.name ?? item.title}
                      </Text>
                      <Text style={styles.submissionMeta}>
                        {item.type === 'facility' ? 'Parking Facility' : 'Land Listing'} · {timeAgo(item.created_at)}
                      </Text>
                    </View>
                    <View style={styles.pendingTag}>
                      <Text style={styles.pendingTagText}>Pending</Text>
                    </View>
                  </View>
                  {index < recentSubmissions.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </View>
          </>
        )}

        {/* ── Recent Bookings ── */}
        {recentBookings.length > 0 && (
          <>
            <SectionHeader
              title="Recent Bookings"
              onSeeAll={() => router.push('/(admin)/monitors')}
            />
            <View style={styles.listCard}>
              {recentBookings.map((booking, index) => (
                <View key={booking.id}>
                  <View style={styles.bookingRow}>
                    <View style={styles.bookingLeft}>
                      <Text style={styles.bookingRef}>{booking.booking_reference}</Text>
                      <Text style={styles.bookingFacility} numberOfLines={1}>
                        {(booking.parking_facilities as any)?.name ?? '—'}
                      </Text>
                      <Text style={styles.bookingUser}>
                        {(booking.profiles as any)?.full_name ?? 'Unknown'}
                      </Text>
                    </View>
                    <View style={styles.bookingRight}>
                      <Text style={styles.bookingAmount}>
                        Rs {booking.total_amount?.toFixed(0)}
                      </Text>
                      <View style={[styles.bookingStatusTag, { backgroundColor: `${statusColor(booking.booking_status)}18` }]}>
                        <Text style={[styles.bookingStatusText, { color: statusColor(booking.booking_status) }]}>
                          {booking.booking_status}
                        </Text>
                      </View>
                      <Text style={styles.bookingTime}>{timeAgo(booking.created_at)}</Text>
                    </View>
                  </View>
                  {index < recentBookings.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </View>
          </>
        )}

        {/* Empty state if no data */}
        {recentBookings.length === 0 && recentSubmissions.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="analytics-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>No recent activity yet</Text>
            <Text style={styles.emptySubText}>Data will appear here as the platform grows</Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#6B7280' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  welcomeText: { fontSize: 13, color: '#6B7280', marginBottom: 2 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  alertBell: { position: 'relative', padding: 4 },
  bellBadge: {
    position: 'absolute', top: 0, right: 0,
    backgroundColor: '#EF4444', borderRadius: 8,
    minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 3,
  },
  bellBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  adminBadge: {
    backgroundColor: '#111827', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  adminBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 1 },

  content: { flex: 1, paddingHorizontal: 20 },

  // Pending banner
  pendingBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FFFBEB', borderRadius: 12, borderWidth: 1,
    borderColor: '#FDE68A', padding: 14, marginTop: 16,
  },
  pendingBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pendingBannerTitle: { fontSize: 14, fontWeight: '700', color: '#92400E' },
  pendingBannerSub: { fontSize: 12, color: '#B45309', marginTop: 2 },

  // Today row
  todayRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  todayCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 12,
    borderWidth: 1, borderColor: '#E5E7EB', padding: 14,
  },
  todayCardGreen: { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
  todayLabel: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
  todayValue: { fontSize: 22, fontWeight: '700', color: '#111827' },

  // Section header
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 24, marginBottom: 10,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  seeAll: { fontSize: 13, color: '#22C55E', fontWeight: '600' },

  // Stats grid — 3 columns
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
  },
  statCard: {
    width: '31%', backgroundColor: '#fff', borderRadius: 12,
    borderWidth: 1, borderColor: '#E5E7EB',
    padding: 12, alignItems: 'flex-start',
  },
  statIconWrap: {
    width: 40, height: 40, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 8, position: 'relative',
  },
  statBadge: {
    position: 'absolute', top: -4, right: -4,
    backgroundColor: '#EF4444', borderRadius: 8,
    minWidth: 16, height: 16,
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3,
  },
  statBadgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  statValue: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 2 },
  statLabel: { fontSize: 11, color: '#6B7280', lineHeight: 15 },

  // Quick actions
  quickActions: {
    backgroundColor: '#fff', borderRadius: 12,
    borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden',
  },
  quickActionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  quickActionIcon: {
    width: 40, height: 40, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  quickActionText: { fontSize: 14, fontWeight: '600', color: '#111827' },
  quickActionBadge: {
    backgroundColor: '#FEF3C7', borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  quickActionBadgeText: { fontSize: 12, fontWeight: '700', color: '#D97706' },

  // List card (shared)
  listCard: {
    backgroundColor: '#fff', borderRadius: 12,
    borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden',
  },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginHorizontal: 16 },

  // Submission rows
  submissionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
  },
  submissionTypeTag: {
    width: 36, height: 36, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center',
  },
  submissionInfo: { flex: 1 },
  submissionName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  submissionMeta: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  pendingTag: {
    backgroundColor: '#FFFBEB', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  pendingTagText: { fontSize: 11, fontWeight: '600', color: '#D97706' },

  // Booking rows
  bookingRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  bookingLeft: { flex: 1, marginRight: 10 },
  bookingRef: { fontSize: 13, fontWeight: '700', color: '#111827', marginBottom: 2 },
  bookingFacility: { fontSize: 12, color: '#6B7280', marginBottom: 2 },
  bookingUser: { fontSize: 12, color: '#9CA3AF' },
  bookingRight: { alignItems: 'flex-end', gap: 4 },
  bookingAmount: { fontSize: 14, fontWeight: '700', color: '#111827' },
  bookingStatusTag: {
    borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2,
  },
  bookingStatusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  bookingTime: { fontSize: 11, color: '#9CA3AF' },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#6B7280', marginTop: 12 },
  emptySubText: { fontSize: 13, color: '#9CA3AF', marginTop: 4, textAlign: 'center' },
});