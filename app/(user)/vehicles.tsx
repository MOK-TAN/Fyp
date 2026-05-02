// (user)/vehicles.tsx
//
// My Vehicles — list, add, edit, delete, set default
// Plate number + model + vehicle type + color + default toggle

import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
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

type Vehicle = {
  id: string;
  user_id: string;
  plate_number: string;
  model: string;
  vehicle_type: string;
  color: string;
  is_default: boolean;
};

const VEHICLE_TYPES = [
  { key: 'car', label: 'Car', icon: 'car' as const },
  { key: 'bike', label: 'Bike', icon: 'bicycle' as const },
  { key: 'scooter', label: 'Scooter', icon: 'speedometer' as const },
  { key: 'suv', label: 'SUV', icon: 'car-sport' as const },
];

const getIcon = (type: string) => {
  const t = (type || '').toLowerCase();
  return VEHICLE_TYPES.find(v => v.key === t)?.icon || 'car-outline';
};

export default function MyVehicles() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [plate, setPlate] = useState('');
  const [model, setModel] = useState('');
  const [vehicleType, setVehicleType] = useState('car');
  const [color, setColor] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [errors, setErrors] = useState<{ [k: string]: string }>({});

  const fetchVehicles = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVehicles(data || []);
    } catch (err) {
      console.error('Fetch vehicles error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchVehicles();
    }, [fetchVehicles])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchVehicles();
  };

  const resetForm = () => {
    setPlate('');
    setModel('');
    setVehicleType('car');
    setColor('');
    setIsDefault(false);
    setErrors({});
    setEditingId(null);
  };

  const openAddModal = () => {
    resetForm();
    // First vehicle becomes default automatically
    if (vehicles.length === 0) setIsDefault(true);
    setModalOpen(true);
  };

  const openEditModal = (v: Vehicle) => {
    setEditingId(v.id);
    setPlate(v.plate_number);
    setModel(v.model);
    setVehicleType(v.vehicle_type || 'car');
    setColor(v.color || '');
    setIsDefault(v.is_default);
    setErrors({});
    setModalOpen(true);
  };

  const validate = (): boolean => {
    const e: { [k: string]: string } = {};
    if (!plate.trim()) e.plate = 'Plate number is required';
    else if (plate.trim().length < 4) e.plate = 'Plate too short';
    if (!model.trim()) e.model = 'Model is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'Please log in');
        return;
      }

      // If this vehicle is being set as default, clear all other defaults first
      if (isDefault) {
        await supabase
          .from('vehicles')
          .update({ is_default: false })
          .eq('user_id', user.id)
          .neq('id', editingId || '00000000-0000-0000-0000-000000000000');
      }

      const payload = {
        plate_number: plate.trim().toUpperCase(),
        model: model.trim(),
        vehicle_type: vehicleType,
        color: color.trim() || 'Not specified',
        is_default: isDefault,
      };

      if (editingId) {
        const { error } = await supabase
          .from('vehicles')
          .update(payload)
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('vehicles')
          .insert({ ...payload, user_id: user.id });
        if (error) throw error;
      }

      setModalOpen(false);
      resetForm();
      fetchVehicles();
      Alert.alert('Saved', editingId ? 'Vehicle updated.' : 'Vehicle added.');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to save vehicle.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (v: Vehicle) => {
    Alert.alert(
      'Delete Vehicle?',
      `${v.plate_number} (${v.model}) will be removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.from('vehicles').delete().eq('id', v.id);
            if (error) {
              Alert.alert('Error', error.message);
              return;
            }
            // If we deleted the default and there are others, promote the first one
            if (v.is_default) {
              const remaining = vehicles.filter(x => x.id !== v.id);
              if (remaining.length > 0) {
                await supabase
                  .from('vehicles')
                  .update({ is_default: true })
                  .eq('id', remaining[0].id);
              }
            }
            fetchVehicles();
          },
        },
      ]
    );
  };

  const handleSetDefault = async (v: Vehicle) => {
    if (v.is_default) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Clear all others
    await supabase
      .from('vehicles')
      .update({ is_default: false })
      .eq('user_id', user.id);

    // Set this one
    const { error } = await supabase
      .from('vehicles')
      .update({ is_default: true })
      .eq('id', v.id);

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }
    fetchVehicles();
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
        <Text style={s.headerTitle}>My Vehicles</Text>
        <TouchableOpacity onPress={openAddModal}>
          <Ionicons name="add-circle" size={26} color="#22C55E" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22C55E" />
        }
      >
        {vehicles.length === 0 ? (
          <View style={s.emptyState}>
            <Ionicons name="car-outline" size={64} color="#D1D5DB" />
            <Text style={s.emptyTitle}>No vehicles yet</Text>
            <Text style={s.emptySubtitle}>
              Add your vehicles to make booking faster
            </Text>
            <TouchableOpacity style={s.addEmptyBtn} onPress={openAddModal}>
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={s.addEmptyBtnText}>Add First Vehicle</Text>
            </TouchableOpacity>
          </View>
        ) : (
          vehicles.map((v) => (
            <View key={v.id} style={s.card}>
              <View style={s.cardLeft}>
                <View
                  style={[
                    s.iconCircle,
                    { backgroundColor: v.is_default ? '#22C55E' : '#F3F4F6' },
                  ]}
                >
                  <Ionicons
                    name={getIcon(v.vehicle_type)}
                    size={24}
                    color={v.is_default ? '#fff' : '#6B7280'}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={s.plate}>{v.plate_number}</Text>
                    {v.is_default && (
                      <View style={s.defaultBadge}>
                        <Text style={s.defaultBadgeText}>DEFAULT</Text>
                      </View>
                    )}
                  </View>
                  <Text style={s.modelText} numberOfLines={1}>
                    {v.model}
                  </Text>
                  <Text style={s.metaText}>
                    {v.vehicle_type?.charAt(0).toUpperCase() + v.vehicle_type?.slice(1) || 'Car'}
                    {v.color && v.color !== 'Not specified' ? ` · ${v.color}` : ''}
                  </Text>
                </View>
              </View>

              <View style={s.actions}>
                {!v.is_default && (
                  <TouchableOpacity
                    style={s.actionBtn}
                    onPress={() => handleSetDefault(v)}
                  >
                    <Ionicons name="star-outline" size={16} color="#22C55E" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={s.actionBtn} onPress={() => openEditModal(v)}>
                  <Ionicons name="create-outline" size={16} color="#3B82F6" />
                </TouchableOpacity>
                <TouchableOpacity style={s.actionBtn} onPress={() => handleDelete(v)}>
                  <Ionicons name="trash-outline" size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add / Edit Modal */}
      <Modal
        visible={modalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setModalOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={s.modalOverlay}
        >
          <View style={s.modalCard}>
            <View style={s.modalHandle} />
            <Text style={s.modalTitle}>
              {editingId ? 'Edit Vehicle' : 'Add Vehicle'}
            </Text>

            <ScrollView style={{ maxHeight: 460 }} showsVerticalScrollIndicator={false}>
              {/* Plate */}
              <View style={s.field}>
                <Text style={s.label}>Plate Number *</Text>
                <View style={[s.input, errors.plate && s.inputError]}>
                  <Ionicons name="car-outline" size={16} color="#9CA3AF" />
                  <TextInput
                    style={s.inputField}
                    placeholder="e.g., BA 12 PA 3456"
                    placeholderTextColor="#9CA3AF"
                    value={plate}
                    autoCapitalize="characters"
                    onChangeText={(t) => {
                      setPlate(t);
                      if (errors.plate) setErrors({ ...errors, plate: '' });
                    }}
                  />
                </View>
                {errors.plate && <Text style={s.errorText}>{errors.plate}</Text>}
              </View>

              {/* Model */}
              <View style={s.field}>
                <Text style={s.label}>Model *</Text>
                <View style={[s.input, errors.model && s.inputError]}>
                  <Ionicons name="construct-outline" size={16} color="#9CA3AF" />
                  <TextInput
                    style={s.inputField}
                    placeholder="e.g., Honda City, Yamaha FZ"
                    placeholderTextColor="#9CA3AF"
                    value={model}
                    onChangeText={(t) => {
                      setModel(t);
                      if (errors.model) setErrors({ ...errors, model: '' });
                    }}
                  />
                </View>
                {errors.model && <Text style={s.errorText}>{errors.model}</Text>}
              </View>

              {/* Type */}
              <View style={s.field}>
                <Text style={s.label}>Vehicle Type</Text>
                <View style={s.typeRow}>
                  {VEHICLE_TYPES.map((t) => (
                    <TouchableOpacity
                      key={t.key}
                      style={[
                        s.typeChip,
                        vehicleType === t.key && s.typeChipActive,
                      ]}
                      onPress={() => setVehicleType(t.key)}
                    >
                      <Ionicons
                        name={t.icon}
                        size={18}
                        color={vehicleType === t.key ? '#fff' : '#6B7280'}
                      />
                      <Text
                        style={[
                          s.typeChipText,
                          vehicleType === t.key && s.typeChipTextActive,
                        ]}
                      >
                        {t.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Color */}
              <View style={s.field}>
                <Text style={s.label}>Color <Text style={s.optional}>(optional)</Text></Text>
                <View style={s.input}>
                  <Ionicons name="color-palette-outline" size={16} color="#9CA3AF" />
                  <TextInput
                    style={s.inputField}
                    placeholder="e.g., Red, Black, Silver"
                    placeholderTextColor="#9CA3AF"
                    value={color}
                    onChangeText={setColor}
                  />
                </View>
              </View>

              {/* Default toggle */}
              <TouchableOpacity
                style={s.defaultToggle}
                onPress={() => setIsDefault(!isDefault)}
                activeOpacity={0.7}
              >
                <View style={[s.checkbox, isDefault && s.checkboxActive]}>
                  {isDefault && <Ionicons name="checkmark" size={14} color="#fff" />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.defaultLabel}>Set as default vehicle</Text>
                  <Text style={s.defaultHint}>
                    Auto-selected when booking parking
                  </Text>
                </View>
              </TouchableOpacity>
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <TouchableOpacity
                style={s.cancelBtn}
                onPress={() => {
                  setModalOpen(false);
                  resetForm();
                }}
                disabled={submitting}
              >
                <Text style={s.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.submitBtn, submitting && { opacity: 0.7 }]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons
                      name={editingId ? 'checkmark' : 'add'}
                      size={16}
                      color="#fff"
                    />
                    <Text style={s.submitBtnText}>
                      {editingId ? 'Save Changes' : 'Add Vehicle'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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

  emptyState: { alignItems: 'center', paddingVertical: 70 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#374151', marginTop: 16 },
  emptySubtitle: {
    fontSize: 13, color: '#6B7280', marginTop: 6,
    textAlign: 'center', paddingHorizontal: 40,
  },
  addEmptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#22C55E', paddingHorizontal: 18, paddingVertical: 11,
    borderRadius: 12, marginTop: 20,
  },
  addEmptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  card: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 12,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconCircle: {
    width: 46, height: 46, borderRadius: 23,
    justifyContent: 'center', alignItems: 'center',
  },
  plate: { fontSize: 15, fontWeight: '800', color: '#111827', letterSpacing: 0.5 },
  defaultBadge: {
    backgroundColor: '#DCFCE7', paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 4,
  },
  defaultBadgeText: { fontSize: 9, fontWeight: '800', color: '#15803D', letterSpacing: 0.5 },
  modelText: { fontSize: 13, color: '#374151', marginTop: 2 },
  metaText: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },

  actions: { flexDirection: 'row', gap: 6 },
  actionBtn: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#F9FAFB',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#E5E7EB',
  },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 32,
  },
  modalHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: '#D1D5DB', alignSelf: 'center', marginBottom: 12,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 16 },

  field: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  optional: { fontWeight: '400', color: '#9CA3AF' },
  input: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB',
    borderRadius: 10, paddingHorizontal: 12, height: 46,
  },
  inputError: { borderColor: '#EF4444' },
  inputField: { flex: 1, fontSize: 14, color: '#111827' },
  errorText: { fontSize: 12, color: '#EF4444', marginTop: 4 },

  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10,
    backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB',
  },
  typeChipActive: { backgroundColor: '#22C55E', borderColor: '#22C55E' },
  typeChipText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  typeChipTextActive: { color: '#fff' },

  defaultToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#F9FAFB', borderRadius: 10, padding: 12, marginTop: 4,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  checkbox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 2, borderColor: '#D1D5DB',
    justifyContent: 'center', alignItems: 'center',
  },
  checkboxActive: { backgroundColor: '#22C55E', borderColor: '#22C55E' },
  defaultLabel: { fontSize: 14, fontWeight: '600', color: '#111827' },
  defaultHint: { fontSize: 11, color: '#6B7280', marginTop: 2 },

  cancelBtn: {
    flex: 1, backgroundColor: '#F3F4F6', borderRadius: 12,
    height: 50, justifyContent: 'center', alignItems: 'center',
  },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  submitBtn: {
    flex: 1, backgroundColor: '#22C55E', borderRadius: 12,
    height: 50, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6,
  },
  submitBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
