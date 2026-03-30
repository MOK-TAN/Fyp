import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
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

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [currentError, setCurrentError] = useState('');
  const [newError, setNewError] = useState('');
  const [confirmError, setConfirmError] = useState('');

  const validatePassword = (text: string): string | null => {
    if (text.length < 6) return 'Must be at least 6 characters';
    if (!/[A-Z]/.test(text)) return 'Must include an uppercase letter';
    if (!/[0-9]/.test(text)) return 'Must include a number';
    return null;
  };

  const validate = (): boolean => {
    let isValid = true;

    if (!currentPassword) {
      setCurrentError('Current password is required');
      isValid = false;
    } else {
      setCurrentError('');
    }

    if (!newPassword) {
      setNewError('New password is required');
      isValid = false;
    } else {
      const pwError = validatePassword(newPassword);
      if (pwError) {
        setNewError(pwError);
        isValid = false;
      } else if (newPassword === currentPassword) {
        setNewError('New password must be different from current');
        isValid = false;
      } else {
        setNewError('');
      }
    }

    if (!confirmPassword) {
      setConfirmError('Please confirm your new password');
      isValid = false;
    } else if (confirmPassword !== newPassword) {
      setConfirmError('Passwords do not match');
      isValid = false;
    } else {
      setConfirmError('');
    }

    return isValid;
  };

  const handleChangePassword = async () => {
    if (!validate()) return;

    setSaving(true);

    try {
      // 1. Verify current password by re-authenticating
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !user.email) {
        Alert.alert('Error', 'Please login again');
        setSaving(false);
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        setCurrentError('Current password is incorrect');
        setSaving(false);
        return;
      }

      // 2. Update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        if (updateError.message.includes('same')) {
          setNewError('New password must be different from current');
        } else {
          Alert.alert('Error', updateError.message);
        }
        setSaving(false);
        return;
      }

      Alert.alert(
        'Password Changed',
        'Your password has been updated successfully.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Change password error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const renderPasswordField = (
    label: string,
    value: string,
    setValue: (t: string) => void,
    error: string,
    setError: (t: string) => void,
    show: boolean,
    setShow: (v: boolean) => void,
    placeholder: string,
  ) => (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrapper, error && styles.inputError]}>
        <Ionicons
          name="lock-closed-outline"
          size={20}
          color={error ? '#DC2626' : '#9CA3AF'}
          style={styles.inputIcon}
        />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#D1D5DB"
          value={value}
          onChangeText={(t) => { setValue(t); if (error) setError(''); }}
          secureTextEntry={!show}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!saving}
        />
        <TouchableOpacity
          onPress={() => setShow(!show)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name={show ? 'eye-outline' : 'eye-off-outline'}
            size={20}
            color="#9CA3AF"
          />
        </TouchableOpacity>
      </View>
      {error ? (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle" size={14} color="#DC2626" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );

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
        <Text style={styles.headerTitle}>Change Password</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="shield-checkmark" size={24} color="#22C55E" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Password Requirements</Text>
            <Text style={styles.infoText}>At least 6 characters, one uppercase letter, and one number</Text>
          </View>
        </View>

        {renderPasswordField(
          'Current Password',
          currentPassword, setCurrentPassword,
          currentError, setCurrentError,
          showCurrent, setShowCurrent,
          'Enter current password'
        )}

        {renderPasswordField(
          'New Password',
          newPassword, setNewPassword,
          newError, setNewError,
          showNew, setShowNew,
          'Enter new password'
        )}

        {renderPasswordField(
          'Confirm New Password',
          confirmPassword, setConfirmPassword,
          confirmError, setConfirmError,
          showConfirm, setShowConfirm,
          'Confirm new password'
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleChangePassword}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>CHANGE PASSWORD</Text>
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

  // Info
  infoCard: { flexDirection: 'row', backgroundColor: '#F0FDF4', borderRadius: 12, padding: 16, marginBottom: 28, borderWidth: 1, borderColor: '#BBF7D0', gap: 12 },
  infoContent: { flex: 1 },
  infoTitle: { fontSize: 14, fontWeight: '600', color: '#166534', marginBottom: 4 },
  infoText: { fontSize: 13, color: '#15803D', lineHeight: 18 },

  // Fields
  fieldGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 14, height: 52 },
  inputError: { borderColor: '#DC2626', backgroundColor: '#FEF2F2' },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: '#111827' },
  errorRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, paddingLeft: 4, gap: 5 },
  errorText: { color: '#DC2626', fontSize: 12 },

  // Footer
  footer: { backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  saveButton: { backgroundColor: '#22C55E', height: 52, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  saveButtonDisabled: { opacity: 0.7 },
  saveButtonText: { fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },
});