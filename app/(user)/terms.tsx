import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    content: 'By downloading, installing, or using ParkEase, you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use the application.',
  },
  {
    title: '2. Service Description',
    content: 'ParkEase is a mobile parking management application that connects drivers with parking facility owners in Kathmandu, Nepal. The app allows users to search, book, and pay for parking spaces. ParkEase acts as an intermediary platform and does not own or operate any parking facilities.',
  },
  {
    title: '3. User Accounts',
    content: 'You must create an account to use ParkEase services. You are responsible for maintaining the confidentiality of your account credentials. You must provide accurate and complete information during registration. ParkEase reserves the right to suspend or terminate accounts that violate these terms.',
  },
  {
    title: '4. Bookings and Payments',
    content: 'All bookings are subject to availability. Prices are set by parking facility owners and displayed in Nepali Rupees (Rs). A 5% service fee is applied to each booking. Payment can be made via  Khalti, or cash at the facility. Confirmed bookings generate a unique QR code for facility access.',
  },
  {
    title: '5. Cancellation Policy',
    content: 'Users may cancel confirmed bookings before the parking session is activated. Once a parking session is activated (QR code scanned by facility owner), cancellation is not available. Refund policies are determined by individual parking facility owners.',
  },
  {
    title: '6. Parking Timer and Overtime',
    content: 'The parking timer starts when the facility owner activates your booking. Users are responsible for ending their session or extending time before the booked duration expires. Overtime charges may apply as determined by the facility owner. ParkEase is not responsible for overtime fees.',
  },
  {
    title: '7. Parking Facility Owners',
    content: 'Facility owners are responsible for the accuracy of their listings including pricing, availability, and amenities. Owners must maintain safe and accessible parking facilities. A 10% platform commission is deducted from each completed booking. Owners are responsible for resolving disputes with users regarding their facilities.',
  },
  {
    title: '8. Reviews and Ratings',
    content: 'Users may leave reviews and ratings for parking facilities after completing a booking. Reviews must be honest, relevant, and not contain offensive content. Facility owners may respond to reviews. ParkEase reserves the right to remove reviews that violate community guidelines.',
  },
  {
    title: '9. Privacy and Data',
    content: 'ParkEase collects and processes personal data in accordance with our Privacy Policy. We collect information necessary to provide our services including name, email, phone number, and location data. We do not sell personal data to third parties. Data is stored securely using industry-standard encryption.',
  },
  {
    title: '10. Limitation of Liability',
    content: 'ParkEase is not responsible for any damage, theft, or loss of vehicles while parked at any facility listed on our platform. We are not liable for any disputes between users and facility owners. Our liability is limited to the amount paid for the specific booking in question.',
  },
  {
    title: '11. Changes to Terms',
    content: 'ParkEase reserves the right to modify these Terms and Conditions at any time. Users will be notified of significant changes through the app or email. Continued use of the app after changes constitutes acceptance of the updated terms.',
  },
  {
    title: '12. Contact',
    content: 'For questions about these Terms and Conditions, contact us at support@parkease.com.np or call +977-1234567890.',
  },
];

export default function TermsConditions() {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms & Conditions</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Last Updated */}
        <View style={styles.updatedCard}>
          <Ionicons name="document-text" size={20} color="#22C55E" />
          <Text style={styles.updatedText}>Last updated: March 2026</Text>
        </View>

        {/* Intro */}
        <Text style={styles.introText}>
          Welcome to ParkEase. These Terms and Conditions govern your use of the ParkEase mobile application and related services operated in Kathmandu, Nepal.
        </Text>

        {/* Sections */}
        {SECTIONS.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionContent}>{section.content}</Text>
          </View>
        ))}

        {/* Footer */}
        <View style={styles.footerCard}>
          <Text style={styles.footerText}>
            By using ParkEase, you acknowledge that you have read, understood, and agree to these Terms and Conditions.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 24 },

  // Updated
  updatedCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDF4', borderRadius: 10, padding: 12, marginBottom: 20, gap: 8, borderWidth: 1, borderColor: '#BBF7D0' },
  updatedText: { fontSize: 13, color: '#166534', fontWeight: '500' },

  // Intro
  introText: { fontSize: 15, color: '#374151', lineHeight: 24, marginBottom: 24 },

  // Sections
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 8 },
  sectionContent: { fontSize: 14, color: '#6B7280', lineHeight: 22 },

  // Footer
  footerCard: { backgroundColor: '#FEF3C7', borderRadius: 12, padding: 16, marginTop: 8 },
  footerText: { fontSize: 13, color: '#92400E', lineHeight: 20, fontWeight: '500' },
});