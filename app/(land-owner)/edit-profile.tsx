import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function LandOwnerEditProfile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [phoneError, setPhoneError] = useState('');

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
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
      setLoading(false);
    })();
  }, []);

  const handleSave = async () => {
    if (!fullName.trim()) { Alert.alert('Error', 'Name is required'); return; }
    if (phone.trim() && !/^\d{10}$/.test(phone.trim())) {
      setPhoneError('Enter a valid 10-digit phone number');
      return;
    }
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { Alert.alert('Error', 'Please login to continue'); return; }
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName.trim(), phone: phone.trim() || null, updated_at: new Date().toISOString() })
        .eq('id', user.id);
      if (error) {
        if (error.message.includes('duplicate') && error.message.includes('phone')) {
          setPhoneError('This phone number is already in use');
        } else {
          Alert.alert('Error', 'Failed to update profile: ' + error.message);
        }
        return;
      }
      Alert.alert('Success', 'Profile updated successfully', [{ text: 'OK', onPress: () => router.back() }]);
    } catch {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#22C55E" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12, paddingTop: 50 }}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827' }}>Edit Profile</Text>
      </View>

      <ScrollView style={{ flex: 1, paddingHorizontal: 16 }}>
        <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 6, marginTop: 12 }}>Full Name</Text>
        <TextInput
          style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 }}
          value={fullName}
          onChangeText={setFullName}
          placeholder="Your name"
          placeholderTextColor="#9CA3AF"
        />

        <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 6, marginTop: 16 }}>Phone</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: phoneError ? '#EF4444' : '#E5E7EB', borderRadius: 12, paddingHorizontal: 14 }}>
          <Text style={{ color: '#6B7280', marginRight: 6 }}>+977</Text>
          <TextInput
            style={{ flex: 1, paddingVertical: 12, fontSize: 15 }}
            value={phone}
            onChangeText={(t) => { setPhone(t); if (phoneError) setPhoneError(''); }}
            keyboardType="phone-pad"
            placeholder="10-digit number"
            placeholderTextColor="#9CA3AF"
          />
        </View>
        {phoneError ? <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>{phoneError}</Text> : null}

        <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 6, marginTop: 16 }}>Email</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 14, backgroundColor: '#F9FAFB' }}>
          <TextInput style={{ flex: 1, paddingVertical: 12, fontSize: 15, color: '#9CA3AF' }} value={email} editable={false} />
          <Ionicons name="lock-closed" size={16} color="#D1D5DB" />
        </View>
        <Text style={{ color: '#9CA3AF', fontSize: 12, marginTop: 4 }}>Email cannot be changed</Text>

        <TouchableOpacity
          style={{ backgroundColor: '#22C55E', borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginTop: 28, opacity: saving ? 0.7 : 1 }}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Save Changes</Text>}
        </TouchableOpacity>
        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}