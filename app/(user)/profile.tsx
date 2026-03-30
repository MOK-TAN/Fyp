import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import BottomTabs from '../../components/BottomTabs';
import { supabase } from '../../lib/supabase';

const Profile = () => {
  const [userName, setUserName] = useState('User');
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState('user');
  const [bookingCount, setBookingCount] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email, role')
        .eq('id', user.id)
        .single();

      if (profile) {
        setUserName(profile.full_name || user.email?.split('@')[0] || 'User');
        setUserEmail(profile.email || user.email || '');
        setUserRole(profile.role || 'user');
      }

      // Get booking count
      const { count: bCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      setBookingCount(bCount || 0);

      // Get review count
      const { count: rCount } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      setReviewCount(rCount || 0);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await supabase.auth.signOut();
              await AsyncStorage.removeItem('auth_token');
              router.replace('/(auth)/login');
            } catch (error) {
              Alert.alert('Error', 'Failed to logout');
            }
          },
        },
      ]
    );
  };

  const getInitial = () => {
    return userName ? userName.charAt(0).toUpperCase() : 'U';
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerSection}>
          <View style={styles.headerTop}>
            <Text style={styles.title}>Profile</Text>
            <TouchableOpacity>
              <Ionicons name="settings-outline" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitial()}</Text>
            </View>
          </View>
        </View>

        {/* Profile Info */}
        <View style={styles.profileInfo}>
          <Text style={styles.name}>{userName}</Text>
          <Text style={styles.email}>{userEmail}</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => router.push('/(user)/booking-history')}
          >
            <Text style={styles.statNumber}>{bookingCount}</Text>
            <Text style={styles.statLabel}>Bookings</Text>
          </TouchableOpacity>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{reviewCount}</Text>
            <Text style={styles.statLabel}>Reviews</Text>
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/(user)/edit-profile')}
          >
            <Ionicons name="person-outline" size={22} color="#111827" />
            <Text style={styles.menuText}>Edit Profile</Text>
            <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/(user)/change-password')}
          >
            <Ionicons name="lock-closed-outline" size={22} color="#111827" />
            <Text style={styles.menuText}>Change Password</Text>
            <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="notifications-outline" size={22} color="#111827" />
            <Text style={styles.menuText}>Notifications</Text>
            <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/(user)/saved')}
          >
            <Ionicons name="heart-outline" size={22} color="#111827" />
            <Text style={styles.menuText}>Saved Parking</Text>
            <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/(user)/booking-history')}
          >
            <Ionicons name="calendar-outline" size={22} color="#111827" />
            <Text style={styles.menuText}>Booking History</Text>
            <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
          </TouchableOpacity>
        </View>

        {/* More Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>More</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/(user)/reviews/review-history')}
          >
            <Ionicons name="star-outline" size={22} color="#111827" />
            <Text style={styles.menuText}>Rate & Review</Text>
            <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/(user)/help')}
          >
            <Ionicons name="help-circle-outline" size={22} color="#111827" />
            <Text style={styles.menuText}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/(user)/terms')}
          >
            <Ionicons name="document-text-outline" size={22} color="#111827" />
            <Text style={styles.menuText}>Terms & Conditions</Text>
            <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={22} color="#EF4444" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.versionText}>ParkEase v1.0.0</Text>

        <View style={{ height: 100 }} />
      </ScrollView>

      <BottomTabs />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { paddingBottom: 20 },

  // Header
  headerSection: { backgroundColor: '#DCFCE7', paddingTop: 50, paddingBottom: 60 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 },
  title: { fontSize: 24, fontWeight: '700', color: '#111827' },
  avatarContainer: { alignItems: 'center' },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#22C55E', justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: '#fff' },
  avatarText: { fontSize: 40, fontWeight: '700', color: '#fff' },

  // Profile Info
  profileInfo: { alignItems: 'center', paddingVertical: 20 },
  name: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 4 },
  email: { fontSize: 14, color: '#6B7280' },

  // Stats
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 8 },
  statCard: { flex: 1, backgroundColor: '#F9FAFB', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  statNumber: { fontSize: 24, fontWeight: '700', color: '#22C55E', marginBottom: 4 },
  statLabel: { fontSize: 13, color: '#6B7280', fontWeight: '500' },

  // Sections
  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },

  // Menu Items
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  menuText: { flex: 1, fontSize: 16, fontWeight: '500', color: '#111827', marginLeft: 14 },

  // Logout
  logoutButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16 },
  logoutText: { fontSize: 16, fontWeight: '600', color: '#EF4444', marginLeft: 14 },

  // Version
  versionText: { textAlign: 'center', fontSize: 12, color: '#D1D5DB', marginTop: 24 },
});

export default Profile;