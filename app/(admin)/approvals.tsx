import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
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
type ApprovalStatus = 'pending' | 'approved' | 'rejected';
type TabType = 'facilities' | 'land';

interface OwnerGroup {
  owner_id: string;
  full_name: string;
  email: string;
  is_verified: boolean;
  items: (FacilityItem | LandItem)[];
}

interface FacilityItem {
  id: string;
  type: 'facility';
  name: string;
  address: string;
  price_per_hour: number;
  total_slots: number;
  approval_status: ApprovalStatus;
  is_active: boolean;
  is_approved: boolean;
  rejection_reason: string | null;
  created_at: string;
  approved_at: string | null;
  owner_id: string;
}

interface LandItem {
  id: string;
  type: 'land';
  title: string;
  address: string;
  area_sqft: number;
  expected_rent: number | null;
  approval_status: ApprovalStatus;
  is_available: boolean;
  rejection_reason: string | null;
  created_at: string;
  approved_at: string | null;
  owner_id: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-NP', { day: 'numeric', month: 'short', year: 'numeric' });

const sqftToAana = (s: number) => (s / 342.25).toFixed(2);

const avatarColor = (name: string) => {
  const colors = ['#F97316', '#22C55E', '#3B82F6', '#8B5CF6', '#EF4444', '#D97706'];
  return colors[(name ?? '?').charCodeAt(0) % colors.length];
};

const statusStyle = (status: ApprovalStatus) => {
  switch (status) {
    case 'approved': return { bg: '#F0FDF4', text: '#15803D', icon: 'checkmark-circle' as const };
    case 'rejected': return { bg: '#FEF2F2', text: '#DC2626', icon: 'close-circle' as const };
    default: return { bg: '#FFFBEB', text: '#D97706', icon: 'time' as const };
  }
};

const STATUS_FILTERS: { key: ApprovalStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

// ─── Reject Modal ─────────────────────────────────────────────────────────────
function RejectModal({ visible, itemName, onCancel, onConfirm, isSubmitting }: {
  visible: boolean; itemName: string;
  onCancel: () => void; onConfirm: (r: string) => void; isSubmitting: boolean;
}) {
  const [reason, setReason] = useState('');
  useEffect(() => { if (!visible) setReason(''); }, [visible]);

  const QUICK = [
    'Insufficient documentation', 'Location not permitted',
    'Incomplete information', 'Duplicate listing', 'Safety concerns',
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
        <View style={styles.rejectSheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.rejectHeader}>
            <View style={styles.rejectIconWrap}>
              <Ionicons name="close-circle" size={26} color="#EF4444" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rejectTitle}>Reject Listing</Text>
              <Text style={styles.rejectSubtitle} numberOfLines={1}>{itemName}</Text>
            </View>
            <TouchableOpacity onPress={onCancel}>
              <Ionicons name="close" size={22} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.quickReasonsLabel}>Quick reasons</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {QUICK.map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.quickChip, reason === r && styles.quickChipActive]}
                  onPress={() => setReason(r)}
                >
                  <Text style={[styles.quickChipText, reason === r && styles.quickChipTextActive]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          <Text style={styles.reasonLabel}>Rejection reason *</Text>
          <View style={styles.reasonInputWrap}>
            <TextInput
              style={styles.reasonInput}
              placeholder="Explain why this listing is being rejected..."
              placeholderTextColor="#9CA3AF"
              value={reason} onChangeText={setReason}
              multiline numberOfLines={4} textAlignVertical="top"
            />
            <Text style={styles.charCount}>{reason.length}/200</Text>
          </View>
          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} disabled={isSubmitting}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.rejectConfirmBtn, (!reason.trim() || isSubmitting) && styles.rejectConfirmBtnDisabled]}
              onPress={() => reason.trim() && onConfirm(reason.trim())}
              disabled={!reason.trim() || isSubmitting}
            >
              {isSubmitting
                ? <ActivityIndicator size="small" color="#fff" />
                : <><Ionicons name="close-circle" size={16} color="#fff" /><Text style={styles.rejectConfirmBtnText}>Reject</Text></>
              }
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Item Card ────────────────────────────────────────────────────────────────
function ItemCard({ item, onApprove, onReject, onSuspend, onDelete, isProcessing }: {
  item: FacilityItem | LandItem;
  onApprove: (id: string, type: TabType) => void;
  onReject: (id: string, name: string, type: TabType) => void;
  onSuspend: (id: string, type: TabType, current: boolean) => void;
  onDelete: (id: string, name: string, type: TabType) => void;
  isProcessing: string | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const isFacility = item.type === 'facility';
  const f = item as FacilityItem;
  const l = item as LandItem;
  const name = isFacility ? f.name : l.title;
  const st = statusStyle(item.approval_status);
  const processing = isProcessing === item.id;
  const isActive = isFacility ? f.is_active : l.is_available;
  const tabType: TabType = isFacility ? 'facilities' : 'land';

  return (
    <View style={styles.itemCard}>
      <TouchableOpacity style={styles.itemCardMain} onPress={() => setExpanded(!expanded)} activeOpacity={0.7}>
        <View style={[styles.itemTypeIcon, { backgroundColor: isFacility ? '#FFF7ED' : '#F0FDF4' }]}>
          <Ionicons name={isFacility ? 'business' : 'leaf'} size={18} color={isFacility ? '#F97316' : '#22C55E'} />
        </View>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={1}>{name}</Text>
          <Text style={styles.itemAddress} numberOfLines={1}>{item.address}</Text>
        </View>
        <View style={styles.itemRight}>
          <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
            <Ionicons name={st.icon} size={11} color={st.text} />
            <Text style={[styles.statusText, { color: st.text }]}>
              {item.approval_status.charAt(0).toUpperCase() + item.approval_status.slice(1)}
            </Text>
          </View>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={15} color="#9CA3AF" style={{ marginTop: 5 }} />
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.expandedSection}>
          <View style={styles.expandedDivider} />
          <View style={styles.detailsGrid}>
            {isFacility ? (
              <>
                <View style={styles.detailItem}>
                  <Ionicons name="cash-outline" size={13} color="#9CA3AF" />
                  <Text style={styles.detailText}>Rs {f.price_per_hour}/hr</Text>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="grid-outline" size={13} color="#9CA3AF" />
                  <Text style={styles.detailText}>{f.total_slots} slots</Text>
                </View>
              </>
            ) : (
              <>
                <View style={styles.detailItem}>
                  <Ionicons name="resize-outline" size={13} color="#9CA3AF" />
                  <Text style={styles.detailText}>{sqftToAana(l.area_sqft)} Aana</Text>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="cash-outline" size={13} color="#9CA3AF" />
                  <Text style={styles.detailText}>
                    {l.expected_rent ? `Rs ${l.expected_rent.toLocaleString()}/mo` : 'Negotiable'}
                  </Text>
                </View>
              </>
            )}
            <View style={styles.detailItem}>
              <Ionicons name="calendar-outline" size={13} color="#9CA3AF" />
              <Text style={styles.detailText}>{formatDate(item.created_at)}</Text>
            </View>
          </View>

          {item.approval_status === 'rejected' && item.rejection_reason && (
            <View style={styles.rejectionNote}>
              <Ionicons name="information-circle" size={13} color="#DC2626" />
              <Text style={styles.rejectionNoteText}>{item.rejection_reason}</Text>
            </View>
          )}
          {item.approval_status === 'approved' && item.approved_at && (
            <View style={styles.approvedNote}>
              <Ionicons name="checkmark-circle" size={13} color="#15803D" />
              <Text style={styles.approvedNoteText}>Approved {formatDate(item.approved_at)}</Text>
            </View>
          )}

          {processing ? (
            <View style={styles.processingRow}>
              <ActivityIndicator size="small" color="#22C55E" />
              <Text style={styles.processingText}>Processing...</Text>
            </View>
          ) : (
            <View style={styles.actionsRow}>
              {item.approval_status === 'pending' && (
                <>
                  <TouchableOpacity style={styles.approveBtn} onPress={() => onApprove(item.id, tabType)} activeOpacity={0.8}>
                    <Ionicons name="checkmark-circle" size={15} color="#fff" />
                    <Text style={styles.approveBtnText}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.rejectBtn} onPress={() => onReject(item.id, name, tabType)} activeOpacity={0.8}>
                    <Ionicons name="close-circle" size={15} color="#EF4444" />
                    <Text style={styles.rejectBtnText}>Reject</Text>
                  </TouchableOpacity>
                </>
              )}
              {item.approval_status === 'approved' && (
                <TouchableOpacity
                  style={[styles.suspendBtn, !isActive && styles.reactivateBtn]}
                  onPress={() => onSuspend(item.id, tabType, isActive)}
                  activeOpacity={0.8}
                >
                  <Ionicons name={isActive ? 'ban' : 'checkmark-circle'} size={15} color={isActive ? '#D97706' : '#22C55E'} />
                  <Text style={[styles.suspendBtnText, !isActive && { color: '#22C55E' }]}>
                    {isActive ? 'Suspend' : 'Reactivate'}
                  </Text>
                </TouchableOpacity>
              )}
              {item.approval_status === 'rejected' && (
                <TouchableOpacity style={styles.approveBtn} onPress={() => onApprove(item.id, tabType)} activeOpacity={0.8}>
                  <Ionicons name="refresh" size={15} color="#fff" />
                  <Text style={styles.approveBtnText}>Approve Anyway</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete(item.id, name, tabType)} activeOpacity={0.8}>
                <Ionicons name="trash-outline" size={15} color="#EF4444" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// ─── Owner Group Card ─────────────────────────────────────────────────────────
function OwnerGroupCard({ group, onApprove, onReject, onSuspend, onDelete, isProcessing }: {
  group: OwnerGroup;
  onApprove: (id: string, type: TabType) => void;
  onReject: (id: string, name: string, type: TabType) => void;
  onSuspend: (id: string, type: TabType, current: boolean) => void;
  onDelete: (id: string, name: string, type: TabType) => void;
  isProcessing: string | null;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const safeName = group.full_name ?? 'Unknown Owner';
  const initials = safeName.split(' ').map((w: string) => w[0] ?? '').join('').slice(0, 2).toUpperCase();
  const pendingCount = group.items.filter(i => i.approval_status === 'pending').length;

  return (
    <View style={styles.ownerGroup}>
      <TouchableOpacity style={styles.ownerHeader} onPress={() => setCollapsed(!collapsed)} activeOpacity={0.7}>
        <View style={[styles.ownerAvatar, { backgroundColor: avatarColor(safeName) }]}>
          <Text style={styles.ownerAvatarText}>{initials}</Text>
        </View>
        <View style={styles.ownerInfo}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.ownerName}>{safeName}</Text>
            {group.is_verified && <Ionicons name="checkmark-circle" size={14} color="#22C55E" />}
          </View>
          <Text style={styles.ownerEmail}>{group.email ?? '—'}</Text>
        </View>
        <View style={styles.ownerRight}>
          <View style={styles.ownerCountBadge}>
            <Text style={styles.ownerCountText}>{group.items.length} listing{group.items.length !== 1 ? 's' : ''}</Text>
          </View>
          {pendingCount > 0 && (
            <View style={styles.ownerPendingBadge}>
              <Text style={styles.ownerPendingText}>{pendingCount} pending</Text>
            </View>
          )}
          <Ionicons name={collapsed ? 'chevron-down' : 'chevron-up'} size={16} color="#9CA3AF" />
        </View>
      </TouchableOpacity>

      {!collapsed && (
        <View style={styles.ownerItems}>
          {group.items.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onApprove={onApprove}
              onReject={onReject}
              onSuspend={onSuspend}
              onDelete={onDelete}
              isProcessing={isProcessing}
            />
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminApprovals() {
  const [activeTab, setActiveTab] = useState<TabType>('facilities');
  const [statusFilter, setStatusFilter] = useState<ApprovalStatus | 'all'>('pending');
  const [facilities, setFacilities] = useState<FacilityItem[]>([]);
  const [lands, setLands] = useState<LandItem[]>([]);
  const [owners, setOwners] = useState<Map<string, { full_name: string; email: string; is_verified: boolean }>>(new Map());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{ id: string; name: string; type: TabType } | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);
  const [pendingCounts, setPendingCounts] = useState({ facilities: 0, land: 0 });

  const fetchAll = useCallback(async () => {
    try {
      const [{ data: fData }, { data: lData }] = await Promise.all([
        supabase.from('parking_facilities')
          .select('id, name, address, price_per_hour, total_slots, approval_status, is_active, is_approved, rejection_reason, created_at, approved_at, owner_id')
          .order('created_at', { ascending: false }),
        supabase.from('land_listings')
          .select('id, title, address, area_sqft, expected_rent, approval_status, is_available, rejection_reason, created_at, approved_at, owner_id')
          .order('created_at', { ascending: false }),
      ]);

      const allFacilities: FacilityItem[] = (fData ?? []).map((f: any) => ({ ...f, type: 'facility' as const }));
      const allLands: LandItem[] = (lData ?? []).map((l: any) => ({ ...l, type: 'land' as const }));

      const ownerIds = [...new Set([...allFacilities.map(f => f.owner_id), ...allLands.map(l => l.owner_id)])];

      if (ownerIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name, email, is_verified')
          .in('id', ownerIds);

        const ownersMap = new Map<string, { full_name: string; email: string; is_verified: boolean }>();
        (profilesData ?? []).forEach((p: any) => ownersMap.set(p.id, p));
        setOwners(ownersMap);
      }

      setFacilities(allFacilities);
      setLands(allLands);
      setPendingCounts({
        facilities: allFacilities.filter(f => f.approval_status === 'pending').length,
        land: allLands.filter(l => l.approval_status === 'pending').length,
      });
    } catch (e) {
      console.error('Approvals fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const buildGroups = (): OwnerGroup[] => {
    const items = activeTab === 'facilities'
      ? (statusFilter === 'all' ? facilities : facilities.filter(f => f.approval_status === statusFilter))
      : (statusFilter === 'all' ? lands : lands.filter(l => l.approval_status === statusFilter));

    const groupMap = new Map<string, OwnerGroup>();
    items.forEach((item) => {
      if (!groupMap.has(item.owner_id)) {
        const owner = owners.get(item.owner_id);
        groupMap.set(item.owner_id, {
          owner_id: item.owner_id,
          full_name: owner?.full_name ?? 'Unknown Owner',
          email: owner?.email ?? '—',
          is_verified: owner?.is_verified ?? false,
          items: [],
        });
      }
      groupMap.get(item.owner_id)!.items.push(item as any);
    });
    return Array.from(groupMap.values());
  };

  const handleApprove = async (id: string, type: TabType) => {
    setIsProcessing(id);
    const { data: { user } } = await supabase.auth.getUser();
    const isFacility = type === 'facilities';
    const table = isFacility ? 'parking_facilities' : 'land_listings';
    const update = isFacility
      ? { approval_status: 'approved', is_approved: true, is_active: true, approved_by: user?.id, approved_at: new Date().toISOString(), rejection_reason: null }
      : { approval_status: 'approved', is_available: true, approved_by: user?.id, approved_at: new Date().toISOString(), rejection_reason: null };

    const { error } = await supabase.from(table).update(update).eq('id', id);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      if (isFacility) {
        setFacilities(prev => prev.map(f => f.id === id ? { ...f, approval_status: 'approved', is_approved: true, is_active: true } : f));
        setPendingCounts(prev => ({ ...prev, facilities: Math.max(0, prev.facilities - 1) }));
      } else {
        setLands(prev => prev.map(l => l.id === id ? { ...l, approval_status: 'approved', is_available: true } : l));
        setPendingCounts(prev => ({ ...prev, land: Math.max(0, prev.land - 1) }));
      }
      await sendNotification(id, type, 'approved');
      Alert.alert('Approved ✓', 'Listing is now live.');
    }
    setIsProcessing(null);
  };

  const handleRejectConfirm = async (reason: string) => {
    if (!rejectModal) return;
    setIsRejecting(true);
    const isFacility = rejectModal.type === 'facilities';
    const table = isFacility ? 'parking_facilities' : 'land_listings';
    const update = isFacility
      ? { approval_status: 'rejected', is_approved: false, rejection_reason: reason }
      : { approval_status: 'rejected', is_available: false, rejection_reason: reason };

    const { error } = await supabase.from(table).update(update).eq('id', rejectModal.id);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      if (isFacility) {
        setFacilities(prev => prev.map(f => f.id === rejectModal.id ? { ...f, approval_status: 'rejected', is_approved: false, rejection_reason: reason } : f));
      } else {
        setLands(prev => prev.map(l => l.id === rejectModal.id ? { ...l, approval_status: 'rejected', is_available: false, rejection_reason: reason } : l));
      }
      await sendNotification(rejectModal.id, rejectModal.type, 'rejected');
      setRejectModal(null);
      Alert.alert('Rejected', 'Owner has been notified.');
    }
    setIsRejecting(false);
  };

  const handleSuspend = async (id: string, type: TabType, current: boolean) => {
    Alert.alert(
      current ? 'Suspend?' : 'Reactivate?',
      current ? 'This will hide it from users.' : 'This will make it visible again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: current ? 'Suspend' : 'Reactivate',
          style: current ? 'destructive' : 'default',
          onPress: async () => {
            setIsProcessing(id);
            const table = type === 'facilities' ? 'parking_facilities' : 'land_listings';
            const field = type === 'facilities' ? 'is_active' : 'is_available';
            const { error } = await supabase.from(table).update({ [field]: !current }).eq('id', id);
            if (!error) {
              if (type === 'facilities') setFacilities(prev => prev.map(f => f.id === id ? { ...f, is_active: !current } : f));
              else setLands(prev => prev.map(l => l.id === id ? { ...l, is_available: !current } : l));
            }
            setIsProcessing(null);
          },
        },
      ]
    );
  };

  const handleDelete = (id: string, name: string, type: TabType) => {
    const isFacility = type === 'facilities';
    Alert.alert(
      'Delete Permanently?',
      `"${name}" and all its ${isFacility ? 'slots + bookings' : 'rental requests + agreements'} will be deleted forever.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            setIsProcessing(id);
            const table = isFacility ? 'parking_facilities' : 'land_listings';
            const { error } = await supabase.from(table).delete().eq('id', id);
            if (error) {
              Alert.alert('Error', error.message);
            } else {
              if (isFacility) setFacilities(prev => prev.filter(f => f.id !== id));
              else setLands(prev => prev.filter(l => l.id !== id));
              Alert.alert('Deleted', `"${name}" permanently deleted.`);
            }
            setIsProcessing(null);
          },
        },
      ]
    );
  };

  const sendNotification = async (id: string, type: TabType, action: 'approved' | 'rejected') => {
    try {
      const table = type === 'facilities' ? 'parking_facilities' : 'land_listings';
      const { data } = await supabase.from(table).select('owner_id').eq('id', id).single();
      if (!data) return;
      const notifType = type === 'facilities'
        ? (action === 'approved' ? 'facility_approved' : 'facility_rejected')
        : (action === 'approved' ? 'land_listing_approved' : 'land_listing_rejected');
      await supabase.from('notifications').insert({
        user_id: data.owner_id, type: notifType,
        title: action === 'approved' ? '🎉 Listing Approved!' : 'Listing Rejected',
        message: action === 'approved' ? 'Your listing is now live on the platform.' : 'Your listing was rejected. Check the rejection reason.',
        data: { item_id: id },
        ...(type === 'facilities' ? { facility_id: id } : { land_listing_id: id }),
      });
    } catch (e) { console.error('Notification error:', e); }
  };

  const onRefresh = () => { setRefreshing(true); fetchAll(); };
  const countFor = (key: ApprovalStatus | 'all') => {
    const list = activeTab === 'facilities' ? facilities : lands;
    return key === 'all' ? list.length : list.filter(i => i.approval_status === key).length;
  };

  const groups = buildGroups();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#22C55E" />
        <Text style={styles.loadingText}>Loading approvals...</Text>
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
        <Text style={styles.headerTitle}>Approvals</Text>
        {(pendingCounts.facilities + pendingCounts.land) > 0 ? (
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{pendingCounts.facilities + pendingCounts.land} pending</Text>
          </View>
        ) : <View style={{ width: 60 }} />}
      </View>

      {/* Type tabs */}
      <View style={styles.typeTabs}>
        {(['facilities', 'land'] as TabType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.typeTab, activeTab === tab && styles.typeTabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Ionicons name={tab === 'facilities' ? 'business' : 'leaf'} size={16} color={activeTab === tab ? '#fff' : '#6B7280'} />
            <Text style={[styles.typeTabText, activeTab === tab && styles.typeTabTextActive]}>
              {tab === 'facilities' ? 'Parking Facilities' : 'Land Listings'}
            </Text>
            {(tab === 'facilities' ? pendingCounts.facilities : pendingCounts.land) > 0 && (
              <View style={[styles.typeTabBadge, activeTab === tab && styles.typeTabBadgeActive]}>
                <Text style={[styles.typeTabBadgeText, activeTab === tab && styles.typeTabBadgeTextActive]}>
                  {tab === 'facilities' ? pendingCounts.facilities : pendingCounts.land}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Status filter */}
      <View style={styles.filterWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {STATUS_FILTERS.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterChip, statusFilter === f.key && styles.filterChipActive]}
              onPress={() => setStatusFilter(f.key as any)}
            >
              <Text style={[styles.filterChipText, statusFilter === f.key && styles.filterChipTextActive]}>{f.label}</Text>
              <View style={[styles.filterCount, statusFilter === f.key && styles.filterCountActive]}>
                <Text style={[styles.filterCountText, statusFilter === f.key && styles.filterCountTextActive]}>{countFor(f.key)}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* List */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22C55E" />}
      >
        {groups.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name={statusFilter === 'pending' ? 'checkmark-done-circle-outline' : 'document-outline'} size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>{statusFilter === 'pending' ? 'All caught up!' : `No ${statusFilter} items`}</Text>
            <Text style={styles.emptySubText}>{statusFilter === 'pending' ? 'No pending submissions right now' : `No ${activeTab} with ${statusFilter} status`}</Text>
          </View>
        ) : (
          <>
            <Text style={styles.resultsCount}>
              {groups.length} owner{groups.length !== 1 ? 's' : ''} · {groups.reduce((a, g) => a + g.items.length, 0)} listings
            </Text>
            {groups.map((group) => (
              <OwnerGroupCard
                key={group.owner_id}
                group={group}
                onApprove={handleApprove}
                onReject={(id, name, type) => setRejectModal({ id, name, type })}
                onSuspend={handleSuspend}
                onDelete={handleDelete}
                isProcessing={isProcessing}
              />
            ))}
          </>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      <RejectModal
        visible={!!rejectModal}
        itemName={rejectModal?.name ?? ''}
        onCancel={() => setRejectModal(null)}
        onConfirm={handleRejectConfirm}
        isSubmitting={isRejecting}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
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
  headerBadge: { backgroundColor: '#FFFBEB', borderRadius: 10, borderWidth: 1, borderColor: '#FDE68A', paddingHorizontal: 10, paddingVertical: 4 },
  headerBadgeText: { fontSize: 12, fontWeight: '700', color: '#D97706' },

  typeTabs: {
    flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  typeTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' },
  typeTabActive: { backgroundColor: '#22C55E', borderColor: '#22C55E' },
  typeTabText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  typeTabTextActive: { color: '#fff' },
  typeTabBadge: { backgroundColor: '#F3F4F6', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1 },
  typeTabBadgeActive: { backgroundColor: 'rgba(255,255,255,0.3)' },
  typeTabBadgeText: { fontSize: 11, fontWeight: '700', color: '#6B7280' },
  typeTabBadgeTextActive: { color: '#fff' },

  filterWrap: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  filterScroll: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#fff' },
  filterChipActive: { backgroundColor: '#111827', borderColor: '#111827' },
  filterChipText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  filterChipTextActive: { color: '#fff' },
  filterCount: { backgroundColor: '#F3F4F6', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1 },
  filterCountActive: { backgroundColor: 'rgba(255,255,255,0.2)' },
  filterCountText: { fontSize: 11, fontWeight: '700', color: '#6B7280' },
  filterCountTextActive: { color: '#fff' },

  content: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
  resultsCount: { fontSize: 12, color: '#9CA3AF', marginBottom: 10, marginLeft: 4 },

  ownerGroup: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 12, overflow: 'hidden' },
  ownerHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, backgroundColor: '#FAFAFA' },
  ownerAvatar: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
  ownerAvatarText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  ownerInfo: { flex: 1, minWidth: 0 },
  ownerName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  ownerEmail: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  ownerRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ownerCountBadge: { backgroundColor: '#F3F4F6', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  ownerCountText: { fontSize: 11, fontWeight: '700', color: '#374151' },
  ownerPendingBadge: { backgroundColor: '#FFFBEB', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: '#FDE68A' },
  ownerPendingText: { fontSize: 11, fontWeight: '700', color: '#D97706' },
  ownerItems: { paddingHorizontal: 10, paddingBottom: 10, paddingTop: 6, gap: 8 },

  itemCard: { backgroundColor: '#F9FAFB', borderRadius: 10, borderWidth: 1, borderColor: '#F3F4F6', overflow: 'hidden' },
  itemCardMain: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
  itemTypeIcon: { width: 38, height: 38, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  itemInfo: { flex: 1, minWidth: 0 },
  itemName: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 2 },
  itemAddress: { fontSize: 12, color: '#9CA3AF' },
  itemRight: { alignItems: 'flex-end' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  statusText: { fontSize: 10, fontWeight: '700' },

  expandedSection: { paddingHorizontal: 12, paddingBottom: 12 },
  expandedDivider: { height: 1, backgroundColor: '#E5E7EB', marginBottom: 10 },
  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 5, width: '47%' },
  detailText: { fontSize: 12, color: '#374151', flex: 1 },

  rejectionNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, backgroundColor: '#FEF2F2', borderRadius: 8, padding: 8, marginBottom: 10 },
  rejectionNoteText: { fontSize: 12, color: '#DC2626', flex: 1, lineHeight: 17 },
  approvedNote: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F0FDF4', borderRadius: 8, padding: 8, marginBottom: 10 },
  approvedNoteText: { fontSize: 12, color: '#15803D' },

  processingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 8 },
  processingText: { fontSize: 13, color: '#6B7280' },

  actionsRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  approveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, backgroundColor: '#22C55E', borderRadius: 8, paddingVertical: 9 },
  approveBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  rejectBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, backgroundColor: '#FEF2F2', borderRadius: 8, paddingVertical: 9, borderWidth: 1, borderColor: '#FECACA' },
  rejectBtnText: { fontSize: 13, fontWeight: '700', color: '#EF4444' },
  suspendBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, backgroundColor: '#FFFBEB', borderRadius: 8, paddingVertical: 9, borderWidth: 1, borderColor: '#FDE68A' },
  reactivateBtn: { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
  suspendBtnText: { fontSize: 13, fontWeight: '700', color: '#D97706' },
  deleteBtn: { width: 38, height: 38, borderRadius: 8, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', justifyContent: 'center', alignItems: 'center' },

  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#6B7280', marginTop: 12 },
  emptySubText: { fontSize: 13, color: '#9CA3AF', marginTop: 4, textAlign: 'center' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  rejectSheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingBottom: 36, paddingTop: 12 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB', alignSelf: 'center', marginBottom: 16 },
  rejectHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  rejectIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center' },
  rejectTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  rejectSubtitle: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  quickReasonsLabel: { fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 8 },
  quickChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' },
  quickChipActive: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  quickChipText: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  quickChipTextActive: { color: '#EF4444', fontWeight: '600' },
  reasonLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
  reasonInputWrap: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 12, marginBottom: 16, minHeight: 100 },
  reasonInput: { fontSize: 14, color: '#111827', minHeight: 80 },
  charCount: { fontSize: 11, color: '#9CA3AF', textAlign: 'right', marginTop: 4 },
  modalButtons: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F4F6', borderRadius: 12, height: 48 },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  rejectConfirmBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#EF4444', borderRadius: 12, height: 48 },
  rejectConfirmBtnDisabled: { backgroundColor: '#FCA5A5' },
  rejectConfirmBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});