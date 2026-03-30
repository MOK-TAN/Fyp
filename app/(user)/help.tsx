import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

type FAQ = {
  question: string;
  answer: string;
};

const FAQS: FAQ[] = [
  {
    question: 'How do I book a parking spot?',
    answer: 'Search for available parking near your location, select a slot, choose your date and time, select your vehicle, and complete payment. You\'ll receive a QR code for entry.',
  },
  {
    question: 'How does the parking timer work?',
    answer: 'After the parking owner scans your QR code, your timer starts counting. You can view it in the Active Timer screen. You can extend your time or end parking anytime.',
  },
  {
    question: 'What payment methods are accepted?',
    answer: 'We accept eSewa, Khalti digital wallets, and cash payment at the parking location.',
  },
  {
    question: 'Can I cancel my booking?',
    answer: 'Yes, you can cancel a confirmed booking from your Booking History. Go to My Bookings, find the booking, and tap Cancel. Note that active parking sessions cannot be cancelled.',
  },
  {
    question: 'How do I extend my parking time?',
    answer: 'While your parking is active, go to the Active Timer screen and tap "Extend Time". Each extension adds 1 hour at the facility\'s hourly rate.',
  },
  {
    question: 'What happens if I exceed my booked time?',
    answer: 'The timer will show overtime in red. Additional charges may apply based on the facility\'s overtime policy. We recommend extending your time before it expires.',
  },
  {
    question: 'How do I save a parking facility?',
    answer: 'On the Parking Details screen, tap the heart icon to save a facility to your favourites for quick access later.',
  },
];

export default function HelpSupport() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const handleEmail = () => {
    Linking.openURL('mailto:support@parkease.com.np?subject=ParkEase Support Request');
  };

  const handleCall = () => {
    Linking.openURL('tel:+9771234567890');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Contact Card */}
        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>Need Help?</Text>
          <Text style={styles.contactSubtext}>Our support team is here to assist you</Text>

          <View style={styles.contactButtons}>
            <TouchableOpacity style={styles.contactButton} onPress={handleEmail}>
              <View style={[styles.contactIcon, { backgroundColor: '#DBEAFE' }]}>
                <Ionicons name="mail" size={22} color="#3B82F6" />
              </View>
              <Text style={styles.contactButtonText}>Email Us</Text>
              <Text style={styles.contactDetail}>support@parkease.com.np</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.contactButton} onPress={handleCall}>
              <View style={[styles.contactIcon, { backgroundColor: '#D1FAE5' }]}>
                <Ionicons name="call" size={22} color="#22C55E" />
              </View>
              <Text style={styles.contactButtonText}>Call Us</Text>
              <Text style={styles.contactDetail}>+977-1234567890</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* FAQ Section */}
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>

        {FAQS.map((faq, index) => (
          <TouchableOpacity
            key={index}
            style={styles.faqCard}
            onPress={() => toggleFAQ(index)}
            activeOpacity={0.7}
          >
            <View style={styles.faqHeader}>
              <Text style={styles.faqQuestion}>{faq.question}</Text>
              <Ionicons
                name={expandedIndex === index ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#9CA3AF"
              />
            </View>
            {expandedIndex === index && (
              <Text style={styles.faqAnswer}>{faq.answer}</Text>
            )}
          </TouchableOpacity>
        ))}

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoTitle}>ParkEase</Text>
          <Text style={styles.appInfoText}>Smart Parking for Kathmandu</Text>
          <Text style={styles.appInfoVersion}>Version 1.0.0</Text>
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

  // Contact
  contactCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 28, borderWidth: 1, borderColor: '#E5E7EB' },
  contactTitle: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 4 },
  contactSubtext: { fontSize: 14, color: '#6B7280', marginBottom: 20 },
  contactButtons: { gap: 12 },
  contactButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E5E7EB' },
  contactIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  contactButtonText: { fontSize: 15, fontWeight: '600', color: '#111827', flex: 1 },
  contactDetail: { fontSize: 12, color: '#9CA3AF' },

  // FAQ
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 16 },
  faqCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  faqQuestion: { fontSize: 15, fontWeight: '600', color: '#111827', flex: 1, marginRight: 12 },
  faqAnswer: { fontSize: 14, color: '#6B7280', lineHeight: 22, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' },

  // App Info
  appInfo: { alignItems: 'center', marginTop: 24, paddingVertical: 20 },
  appInfoTitle: { fontSize: 18, fontWeight: '700', color: '#22C55E', marginBottom: 4 },
  appInfoText: { fontSize: 13, color: '#6B7280', marginBottom: 2 },
  appInfoVersion: { fontSize: 12, color: '#D1D5DB' },
});