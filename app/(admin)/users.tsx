import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { supabase } from '../../lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────
type Role = 'all' | 'user' | 'parking_owner' | 'land_owner';

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: string;
  is_verified: boolean;
  created_at: string;
  // joined counts
  facility_count?: number;
  land_count?: number;
  booking_count?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const roleLabel = (role: string) => {
  switch (role) {
    case 'parking_owner': return 'Parking Owner';
    case 'land_owner': return 'Land Owner';
    case 'admin': return 'Admin';
    default: return 'User';
  }
};

const roleColors = (role: string): { bg: string; text: string } => {
  switch (role) {
    case 'parking_owner': return { bg: '#FFF7ED', text: '#F97316' };
    case 'land_owner': return { bg: '#F0FDF4', text: '#22C55E' };
    case 'admin': return { bg: '#111827', text: '#FFFFFF' };
    default: return { bg: '#EFF6FF', text: '#3B82F6' };
  }
};

const avatarColor = (name: string) => {
  const colors = ['#F97316', '#22C55E', '#3B82F6', '#8B5CF6', '#EF4444', '#D97706'];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
};

const TABS: { key: Role; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'user', label: 'Users' },
  { key: 'parking_owner', label: 'Parking' },
  { key: 'land_owner', label: 'Land' },
];

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ name, size = 44 }: { name: string | null; size?: number }) {
  const safeName = name ?? '?';
  const initials = safeName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: avatarColor(safeName) }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.36 }]}>{initials}</Text>
    </View>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
function DeleteModal({
  visible,
  user,
  onCancel,
  onConfirm,
  isDeleting,
}: {
  visible: boolean;
  user: UserProfile | null;
  onCancel: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}) {
  const [confirmText, setConfirmText] = useState('');

  useEffect(() => {
    if (!visible) setConfirmText('');
  }, [visible]);

  if (!user) return null;

  const isOwner = user.role === 'parking_owner' || user.role === 'land_owner';
  const confirmText_lower = confirmText.trim().toLowerCase();
  const userName = user.full_name ?? 'Unknown User';
  const canConfirm = confirmText_lower === userName.toLowerCase();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>

          {/* Icon */}
          <View style={styles.deleteIconWrap}>
            <Ionicons name="trash" size={28} color="#EF4444" />
          </View>

          <Text style={styles.modalTitle}>Delete Account</Text>
          <Text style={styles.modalSubtitle}>
            You are about to permanently delete{'\n'}
            <Text style={{ fontWeight: '700', color: '#111827' }}>{userName}</Text>
          </Text>

          {/* What gets deleted */}
          <View style={styles.deletionList}>
            <Text style={styles.deletionListTitle}>This will permanently delete:</Text>
            <View style={styles.deletionItem}>
              <Ionicons name="person" size={14} color="#EF4444" />
              <Text style={styles.deletionItemText}>Their profile and account</Text>
            </View>
            {user.role === 'parking_owner' && (
              <>
                <View style={styles.deletionItem}>
                  <Ionicons name="business" size={14} color="#EF4444" />
                  <Text style={styles.deletionItemText}>
                    All parking facilities ({user.facility_count ?? 0})
                  </Text>
                </View>
                <View style={styles.deletionItem}>
                  <Ionicons name="grid" size={14} color="#EF4444" />
                  <Text style={styles.deletionItemText}>All parking slots + bookings</Text>
                </View>
              </>
            )}
            {user.role === 'land_owner' && (
              <>
                <View style={styles.deletionItem}>
                  <Ionicons name="leaf" size={14} color="#EF4444" />
                  <Text style={styles.deletionItemText}>
                    All land listings ({user.land_count ?? 0})
                  </Text>
                </View>
                <View style={styles.deletionItem}>
                  <Ionicons name="document-text" size={14} color="#EF4444" />
                  <Text style={styles.deletionItemText}>All rental requests + agreements</Text>
                </View>
              </>
            )}
            {user.role === 'user' && (
              <View style={styles.deletionItem}>
                <Ionicons name="car" size={14} color="#EF4444" />
                <Text style={styles.deletionItemText}>
                  All bookings ({user.booking_count ?? 0}) + vehicles
                </Text>
              </View>
            )}
            <View style={styles.deletionItem}>
              <Ionicons name="notifications" size={14} color="#EF4444" />
              <Text style={styles.deletionItemText}>All notifications + saved data</Text>
            </View>
          </View>

          {/* Type to confirm */}
          <Text style={styles.confirmLabel}>
            Type <Text style={{ fontWeight: '700' }}>{userName}</Text> to confirm
          </Text>
          <TextInput
            style={[styles.confirmInput, canConfirm && styles.confirmInputValid]}
            placeholder={userName}
            placeholderTextColor="#D1D5DB"
            value={confirmText}
            onChangeText={setConfirmText}
            autoCapitalize="words"
          />

          {/* Buttons */}
          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} disabled={isDeleting}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.deleteBtn, (!canConfirm || isDeleting) && styles.deleteBtnDisabled]}
              onPress={onConfirm}
              disabled={!canConfirm || isDeleting}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.deleteBtnText}>Delete Forever</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── User Card ────────────────────────────────────────────────────────────────
function UserCard({
  user,
  onVerify,
  onDelete,
}: {
  user: UserProfile;
  onVerify: (user: UserProfile) => void;
  onDelete: (user: UserProfile) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const roleStyle = roleColors(user.role);

  return (
    <View style={styles.userCard}>
      {/* Main row */}
      <TouchableOpacity
        style={styles.userCardMain}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <Avatar name={user.full_name} />
        <View style={styles.userInfo}>
          <View style={styles.userNameRow}>
            <Text style={styles.userName} numberOfLines={1}>{user.full_name ?? 'Unknown User'}</Text>
            {user.is_verified && (
              <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
            )}
          </View>
          <Text style={styles.userEmail} numberOfLines={1}>{user.email ?? '—'}</Text>
          {user.phone && <Text style={styles.userPhone}>{user.phone}</Text>}
        </View>
        <View style={styles.userCardRight}>
          <View style={[styles.roleBadge, { backgroundColor: roleStyle.bg }]}>
            <Text style={[styles.roleBadgeText, { color: roleStyle.text }]}>
              {roleLabel(user.role)}
            </Text>
          </View>
          <View style={{ alignItems: 'center', marginTop: 6 }}>
            <Ionicons
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={16}
              color="#9CA3AF"
            />
          </View>
        </View>
      </TouchableOpacity>

      {/* Expanded details */}
      {expanded && (
        <View style={styles.expandedSection}>
          <View style={styles.expandedDivider} />

          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNum}>
                {user.role === 'parking_owner'
                  ? user.facility_count ?? 0
                  : user.role === 'land_owner'
                  ? user.land_count ?? 0
                  : user.booking_count ?? 0}
              </Text>
              <Text style={styles.statItemLabel}>
                {user.role === 'parking_owner'
                  ? 'Facilities'
                  : user.role === 'land_owner'
                  ? 'Listings'
                  : 'Bookings'}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{timeAgo(user.created_at)}</Text>
              <Text style={styles.statItemLabel}>Joined</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statNum, { color: user.is_verified ? '#22C55E' : '#9CA3AF' }]}>
                {user.is_verified ? 'Yes' : 'No'}
              </Text>
              <Text style={styles.statItemLabel}>Verified</Text>
            </View>
          </View>

          {/* Action buttons */}
          <View style={styles.actionRow}>
            {!user.is_verified && (
              <TouchableOpacity
                style={styles.verifyBtn}
                onPress={() => onVerify(user)}
                activeOpacity={0.8}
              >
                <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
                <Text style={styles.verifyBtnText}>Verify User</Text>
              </TouchableOpacity>
            )}
            {user.is_verified && (
              <View style={styles.verifiedTag}>
                <Ionicons name="shield-checkmark" size={14} color="#22C55E" />
                <Text style={styles.verifiedTagText}>Verified Account</Text>
              </View>
            )}
            {user.role !== 'admin' && (
              <TouchableOpacity
                style={styles.deleteUserBtn}
                onPress={() => onDelete(user)}
                activeOpacity={0.8}
              >
                <Ionicons name="trash-outline" size={16} color="#EF4444" />
                <Text style={styles.deleteUserBtnText}>Delete</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminUsers() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filtered, setFiltered] = useState<UserProfile[]>([]);
  const [activeTab, setActiveTab] = useState<Role>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserProfile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Counts for tab badges
  const [counts, setCounts] = useState({ all: 0, user: 0, parking_owner: 0, land_owner: 0 });

  const fetchUsers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data) return;

      // Fetch linked counts per user
      const enriched: UserProfile[] = await Promise.all(
        data.map(async (u:any) => {
          if (u.role === 'parking_owner') {
            const { count } = await supabase
              .from('parking_facilities')
              .select('*', { count: 'exact', head: true })
              .eq('owner_id', u.id);
            return { ...u, facility_count: count ?? 0 };
          }
          if (u.role === 'land_owner') {
            const { count } = await supabase
              .from('land_listings')
              .select('*', { count: 'exact', head: true })
              .eq('owner_id', u.id);
            return { ...u, land_count: count ?? 0 };
          }
          if (u.role === 'user') {
            const { count } = await supabase
              .from('bookings')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', u.id);
            return { ...u, booking_count: count ?? 0 };
          }
          return u;
        })
      );

      setUsers(enriched);
      setCounts({
        all: enriched.length,
        user: enriched.filter(u => u.role === 'user').length,
        parking_owner: enriched.filter(u => u.role === 'parking_owner').length,
        land_owner: enriched.filter(u => u.role === 'land_owner').length,
      });
    } catch (e) {
      console.error('Fetch users error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // Filter whenever tab or search changes
  useEffect(() => {
    let result = users;
    if (activeTab !== 'all') result = result.filter(u => u.role === activeTab);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(u =>
        u.full_name.toLowerCase().includes(q) ||
        (u.email ?? '').toLowerCase().includes(q) ||
        (u.phone ?? '').includes(q)
      );
    }
    setFiltered(result);
  }, [users, activeTab, search]);

  const handleVerify = async (user: UserProfile) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_verified: true })
      .eq('id', user.id);

    if (error) {
      Alert.alert('Error', 'Failed to verify user.');
      return;
    }
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_verified: true } : u));
    Alert.alert('Verified ✓', `${user.full_name} has been verified.`);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      // Delete from Supabase Auth first (admin action)
      const { error: authError } = await supabase.auth.admin.deleteUser(deleteTarget.id);
      if (authError) {
        // Fallback: just delete profile row (cascade handles the rest)
        const { error: profileError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', deleteTarget.id);
        if (profileError) {
          Alert.alert('Error', 'Failed to delete user: ' + profileError.message);
          setIsDeleting(false);
          return;
        }
      }
      setUsers(prev => prev.filter(u => u.id !== deleteTarget.id));
      setDeleteTarget(null);
      Alert.alert('Deleted', `${deleteTarget.full_name}'s account has been permanently deleted.`);
    } catch (e: any) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const onRefresh = () => { setRefreshing(true); fetchUsers(); };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#22C55E" />
        <Text style={styles.loadingText}>Loading users...</Text>
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
        <Text style={styles.headerTitle}>Manage Users</Text>
        <View style={styles.headerCount}>
          <Text style={styles.headerCountText}>{counts.all}</Text>
        </View>
      </View>

      {/* Search bar */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search name, email, phone..."
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Role tabs */}
      <View style={styles.tabsWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
              <View style={[styles.tabBadge, activeTab === tab.key && styles.tabBadgeActive]}>
                <Text style={[styles.tabBadgeText, activeTab === tab.key && styles.tabBadgeTextActive]}>
                  {counts[tab.key]}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* User list */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22C55E" />}
      >
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>No users found</Text>
            <Text style={styles.emptySubText}>
              {search ? 'Try a different search term' : 'No users in this category yet'}
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.resultsCount}>
              {filtered.length} {filtered.length === 1 ? 'user' : 'users'} found
            </Text>
            {filtered.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                onVerify={handleVerify}
                onDelete={(u) => setDeleteTarget(u)}
              />
            ))}
          </>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Delete modal */}
      <DeleteModal
        visible={!!deleteTarget}
        user={deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
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
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  headerCount: {
    backgroundColor: '#F3F4F6', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  headerCountText: { fontSize: 13, fontWeight: '700', color: '#374151' },

  // Search
  searchWrap: { backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#F9FAFB', borderRadius: 12,
    borderWidth: 1, borderColor: '#E5E7EB',
    paddingHorizontal: 14, height: 44,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#111827' },

  // Tabs
  tabsWrap: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  tabs: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  tabActive: { backgroundColor: '#22C55E', borderColor: '#22C55E' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  tabTextActive: { color: '#fff' },
  tabBadge: {
    backgroundColor: '#F3F4F6', borderRadius: 8,
    paddingHorizontal: 6, paddingVertical: 1,
  },
  tabBadgeActive: { backgroundColor: 'rgba(255,255,255,0.3)' },
  tabBadgeText: { fontSize: 11, fontWeight: '700', color: '#6B7280' },
  tabBadgeTextActive: { color: '#fff' },

  // Content
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
  resultsCount: { fontSize: 12, color: '#9CA3AF', marginBottom: 10, marginLeft: 4 },

  // User card
  userCard: {
    backgroundColor: '#fff', borderRadius: 14,
    borderWidth: 1, borderColor: '#E5E7EB',
    marginBottom: 10, overflow: 'hidden',
  },
  userCardMain: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, gap: 12,
  },
  avatar: { justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontWeight: '700' },
  userInfo: { flex: 1, minWidth: 0 },
  userNameRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 3 },
  userName: { fontSize: 15, fontWeight: '700', color: '#111827', flexShrink: 1 },
  userEmail: { fontSize: 12, color: '#6B7280', marginBottom: 2 },
  userPhone: { fontSize: 12, color: '#9CA3AF' },
  userCardRight: { alignItems: 'flex-end' },
  roleBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  roleBadgeText: { fontSize: 11, fontWeight: '700' },

  // Expanded
  expandedSection: { paddingHorizontal: 14, paddingBottom: 14 },
  expandedDivider: { height: 1, backgroundColor: '#F3F4F6', marginBottom: 12 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 14 },
  statItem: { alignItems: 'center', flex: 1 },
  statNum: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 2 },
  statItemLabel: { fontSize: 11, color: '#9CA3AF' },
  statDivider: { width: 1, backgroundColor: '#F3F4F6' },
  actionRow: { flexDirection: 'row', gap: 10 },
  verifyBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: '#F0FDF4', borderRadius: 10, borderWidth: 1,
    borderColor: '#BBF7D0', paddingVertical: 10,
  },
  verifyBtnText: { fontSize: 13, fontWeight: '600', color: '#15803D' },
  verifiedTag: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: '#F0FDF4', borderRadius: 10, paddingVertical: 10,
  },
  verifiedTagText: { fontSize: 13, color: '#15803D', fontWeight: '600' },
  deleteUserBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: '#FEF2F2', borderRadius: 10, borderWidth: 1,
    borderColor: '#FECACA', paddingVertical: 10, paddingHorizontal: 16,
  },
  deleteUserBtnText: { fontSize: 13, fontWeight: '600', color: '#EF4444' },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#6B7280', marginTop: 12 },
  emptySubText: { fontSize: 13, color: '#9CA3AF', marginTop: 4 },

  // Delete Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    backgroundColor: '#fff', borderRadius: 20,
    padding: 24, width: '100%',
  },
  deleteIconWrap: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#FEF2F2', justifyContent: 'center',
    alignItems: 'center', alignSelf: 'center', marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18, fontWeight: '700', color: '#111827',
    textAlign: 'center', marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 14, color: '#6B7280', textAlign: 'center',
    lineHeight: 22, marginBottom: 16,
  },
  deletionList: {
    backgroundColor: '#FEF2F2', borderRadius: 12,
    padding: 14, marginBottom: 16, gap: 8,
  },
  deletionListTitle: {
    fontSize: 12, fontWeight: '700', color: '#EF4444',
    marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  deletionItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  deletionItemText: { fontSize: 13, color: '#374151' },
  confirmLabel: {
    fontSize: 13, color: '#374151', marginBottom: 8, fontWeight: '500',
  },
  confirmInput: {
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10,
    paddingHorizontal: 14, height: 46, fontSize: 14,
    color: '#111827', marginBottom: 16,
  },
  confirmInputValid: { borderColor: '#22C55E', backgroundColor: '#F0FDF4' },
  modalButtons: { flexDirection: 'row', gap: 10 },
  cancelBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F3F4F6', borderRadius: 12, height: 48,
  },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  deleteBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#EF4444', borderRadius: 12, height: 48,
  },
  deleteBtnDisabled: { backgroundColor: '#FCA5A5' },
  deleteBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});