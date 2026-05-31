import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function LandOwnerChangePassword() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword) { Alert.alert('Error', 'Current password is required'); return; }
    if (newPassword.length < 8) { Alert.alert('Error', 'New password must be at least 8 characters'); return; }
    if (newPassword === currentPassword) { Alert.alert('Error', 'New password must be different from current'); return; }
    if (newPassword !== confirmPassword) { Alert.alert('Error', 'Passwords do not match'); return; }

    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) { Alert.alert('Error', 'Please login again'); return; }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
      if (signInError) { Alert.alert('Error', 'Current password is incorrect'); return; }

      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) { Alert.alert('Error', updateError.message); return; }

      Alert.alert('Success', 'Your password has been updated successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const field = (label: string, value: string, setter: (v: string) => void, placeholder: string) => (
    <View key={label}>
      <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 6, marginTop: 16 }}>{label}</Text>
      <TextInput
        style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 }}
        value={value}
        onChangeText={setter}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        secureTextEntry
      />
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12, paddingTop: 50 }}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827' }}>Change Password</Text>
      </View>

      <ScrollView style={{ flex: 1, paddingHorizontal: 16 }}>
        {field('Current Password', currentPassword, setCurrentPassword, 'Enter current password')}
        {field('New Password', newPassword, setNewPassword, 'Enter new password')}
        {field('Confirm New Password', confirmPassword, setConfirmPassword, 'Confirm new password')}

        <TouchableOpacity
          style={{ backgroundColor: '#22C55E', borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginTop: 28, opacity: saving ? 0.7 : 1 }}
          onPress={handleChangePassword}
          disabled={saving}
        >
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Update Password</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}