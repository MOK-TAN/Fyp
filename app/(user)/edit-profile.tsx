import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { supabase } from '../../lib/supabase';

export default function EditProfile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [nameError, setNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setEmail(user.email || '');

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, phone, email')
        .eq('id', user.id)
        .single();

      if (profile) {
        setFullName(profile.full_name || '');
        setPhone(profile.phone || '');
        if (profile.email) setEmail(profile.email);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const validate = (): boolean => {
    let isValid = true;

    if (!fullName.trim()) {
      setNameError('Full name is required');
      isValid = false;
    } else if (fullName.trim().length < 2) {
      setNameError('Name must be at least 2 characters');
      isValid = false;
    } else {
      setNameError('');
    }

    if (phone.trim() && !/^\d{10}$/.test(phone.trim())) {
      setPhoneError('Enter a valid 10-digit phone number');
      isValid = false;
    } else {
      setPhoneError('');
    }

    return isValid;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'Please login to continue');
        setSaving(false);
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          phone: phone.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        if (error.message.includes('duplicate') && error.message.includes('phone')) {
          setPhoneError('This phone number is already in use');
        } else {
          Alert.alert('Error', 'Failed to update profile: ' + error.message);
        }
        setSaving(false);
        return;
      }

      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#22C55E" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {fullName ? fullName.charAt(0).toUpperCase() : 'U'}
            </Text>
          </View>
          <TouchableOpacity style={styles.changePhotoButton}>
            <Ionicons name="camera-outline" size={16} color="#22C55E" />
            <Text style={styles.changePhotoText}>Change Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Full Name */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Full Name *</Text>
          <View style={[styles.inputWrapper, nameError && styles.inputError]}>
            <Ionicons name="person-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              placeholderTextColor="#D1D5DB"
              value={fullName}
              onChangeText={(t) => { setFullName(t); if (nameError) setNameError(''); }}
              editable={!saving}
              autoCapitalize="words"
            />
          </View>
          {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
        </View>

        {/* Phone */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Phone Number</Text>
          <View style={[styles.inputWrapper, phoneError && styles.inputError]}>
            <Text style={styles.phonePrefix}>+977</Text>
            <TextInput
              style={styles.input}
              placeholder="98XXXXXXXX"
              placeholderTextColor="#D1D5DB"
              value={phone}
              onChangeText={(t) => { setPhone(t); if (phoneError) setPhoneError(''); }}
              keyboardType="phone-pad"
              maxLength={10}
              editable={!saving}
            />
          </View>
          {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}
        </View>

        {/* Email (read-only) */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Email</Text>
          <View style={[styles.inputWrapper, styles.inputDisabled]}>
            <Ionicons name="mail-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: '#9CA3AF' }]}
              value={email}
              editable={false}
            />
            <Ionicons name="lock-closed" size={16} color="#D1D5DB" />
          </View>
          <Text style={styles.helperText}>Email cannot be changed</Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>SAVE CHANGES</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 24 },

  // Avatar
  avatarSection: { alignItems: 'center', marginBottom: 32 },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#22C55E', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { fontSize: 40, fontWeight: '700', color: '#fff' },
  changePhotoButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  changePhotoText: { fontSize: 14, fontWeight: '600', color: '#22C55E' },

  // Fields
  fieldGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 14, height: 52 },
  inputError: { borderColor: '#DC2626', backgroundColor: '#FEF2F2' },
  inputDisabled: { backgroundColor: '#F3F4F6' },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: '#111827' },
  phonePrefix: { fontSize: 15, fontWeight: '600', color: '#6B7280', marginRight: 8, paddingRight: 8, borderRightWidth: 1, borderRightColor: '#E5E7EB' },
  errorText: { color: '#DC2626', fontSize: 12, marginTop: 4, paddingLeft: 4 },
  helperText: { color: '#9CA3AF', fontSize: 12, marginTop: 4, paddingLeft: 4 },

  // Footer
  footer: { backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  saveButton: { backgroundColor: '#22C55E', height: 52, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  saveButtonDisabled: { opacity: 0.7 },
  saveButtonText: { fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },
});