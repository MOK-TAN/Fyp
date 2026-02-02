import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function SelectDateTime() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

//   const handleContinue = () => {
//     // Navigate to vehicle selection
//     router.push({
    //   pathname: '/(user)/(tabs)/booking/select-vehicle',
    //   params: {
    //     parkingId: params.parkingId,
    //     date,
    //     startTime,
    //     endTime,
    //   }
    // });
//   };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#212121" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Date & Time</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Date Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Select Date</Text>
          <TextInput
            style={styles.input}
            placeholder="DD/MM/YYYY"
            value={date}
            onChangeText={setDate}
            placeholderTextColor="#9E9E9E"
          />
        </View>

        {/* Time Inputs */}
        <View style={styles.timeRow}>
          <View style={styles.timeInput}>
            <Text style={styles.label}>Start Time</Text>
            <TextInput
              style={styles.input}
              placeholder="10:00 AM"
              value={startTime}
              onChangeText={setStartTime}
              placeholderTextColor="#9E9E9E"
            />
          </View>
          
          <View style={styles.timeInput}>
            <Text style={styles.label}>End Time</Text>
            <TextInput
              style={styles.input}
              placeholder="12:00 PM"
              value={endTime}
              onChangeText={setEndTime}
              placeholderTextColor="#9E9E9E"
            />
          </View>
        </View>

        {/* Duration Card */}
        <View style={styles.durationCard}>
          <Text style={styles.durationText}>Duration: 2 hours</Text>
        </View>

        {/* Price Card */}
        <View style={styles.priceCard}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Base Price</Text>
            <Text style={styles.priceValue}>Rs 40</Text>
          </View>
          <View style={[styles.priceRow, { marginTop: 8 }]}>
            <Text style={styles.priceTotal}>Total</Text>
            <Text style={styles.priceTotalValue}>Rs 40</Text>
          </View>
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.continueButton}
          onPress={handleContinue}
        >
          <Text style={styles.continueText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212121',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '400',
    color: '#212121',
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#212121',
  },
  timeRow: {
    flexDirection: 'row',
    gap: 13,
    marginBottom: 16,
  },
  timeInput: {
    flex: 1,
  },
  durationCard: {
    height: 60,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  durationText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212121',
  },
  priceCard: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priceLabel: {
    fontSize: 14,
    color: '#757575',
  },
  priceValue: {
    fontSize: 14,
    color: '#212121',
  },
  priceTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212121',
  },
  priceTotalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4CAF50',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  continueButton: {
    height: 48,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
});