import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

export default function SelectDateTime() {
  const params = useLocalSearchParams();
  const parkingId = params.parkingId as string;
  const parkingName = params.parkingName as string || 'Parking Spot';
  const pricePerHour = params.pricePerHour as string || '50';

  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [dateError, setDateError] = useState('');
  const [startTimeError, setStartTimeError] = useState('');
  const [endTimeError, setEndTimeError] = useState('');

  // Calculate duration
  const calculateDuration = () => {
    if (!startTime || !endTime) return 0;
    
    // Simple duration calc (you can enhance this)
    const [startHour] = startTime.split(':').map(Number);
    const [endHour] = endTime.split(':').map(Number);
    
    let hours = endHour - startHour;
    if (hours < 0) hours += 24;
    
    return hours;
  };

  // Calculate price
  const calculatePrice = () => {
    const duration = calculateDuration();
    const basePrice = parseFloat(pricePerHour) || 50;
    return duration * basePrice;
  };

  const duration = calculateDuration();
  const totalPrice = calculatePrice();

  // Validate inputs
  const validateInputs = () => {
    let isValid = true;

    setDateError('');
    setStartTimeError('');
    setEndTimeError('');

    if (!date.trim()) {
      setDateError('Please select a date');
      isValid = false;
    }

    if (!startTime.trim()) {
      setStartTimeError('Please select start time');
      isValid = false;
    }

    if (!endTime.trim()) {
      setEndTimeError('Please select end time');
      isValid = false;
    }

    if (startTime && endTime && calculateDuration() <= 0) {
      setEndTimeError('End time must be after start time');
      isValid = false;
    }

    return isValid;
  };

  // Handle continue
  const handleContinue = () => {
    if (!validateInputs()) return;

    // router.push({
    //   pathname: '/(user)/booking/select-vehicle',
    //   params: {
    //     parkingId,
    //     parkingName,
    //     pricePerHour,
    //     date,
    //     startTime,
    //     endTime,
    //     duration: duration.toString(),
    //     totalPrice: totalPrice.toString(),
    //   },
    // });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Date & Time</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Parking Info */}
        <View style={styles.infoCard}>
          <Text style={styles.parkingName}>{parkingName}</Text>
          <Text style={styles.priceText}>Rs {pricePerHour}/hour</Text>
        </View>

        {/* Date Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Select Date</Text>
          <View style={[
            styles.inputWrapper,
            dateError && styles.inputError
          ]}>
            <Ionicons name="calendar-outline" size={20} color="#999" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="DD/MM/YYYY"
              placeholderTextColor="#999"
              value={date}
              onChangeText={(text) => {
                setDate(text);
                if (dateError) setDateError('');
              }}
            />
          </View>
          {dateError ? (
            <Text style={styles.errorText}>{dateError}</Text>
          ) : null}
        </View>

        {/* Time Selection */}
        <View style={styles.timeRow}>
          {/* Start Time */}
          <View style={styles.timeInput}>
            <Text style={styles.label}>Start Time</Text>
            <View style={[
              styles.inputWrapper,
              startTimeError && styles.inputError
            ]}>
              <Ionicons name="time-outline" size={20} color="#999" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="10:00"
                placeholderTextColor="#999"
                value={startTime}
                onChangeText={(text) => {
                  setStartTime(text);
                  if (startTimeError) setStartTimeError('');
                }}
              />
            </View>
            {startTimeError ? (
              <Text style={styles.errorText}>{startTimeError}</Text>
            ) : null}
          </View>

          {/* End Time */}
          <View style={styles.timeInput}>
            <Text style={styles.label}>End Time</Text>
            <View style={[
              styles.inputWrapper,
              endTimeError && styles.inputError
            ]}>
              <Ionicons name="time-outline" size={20} color="#999" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="12:00"
                placeholderTextColor="#999"
                value={endTime}
                onChangeText={(text) => {
                  setEndTime(text);
                  if (endTimeError) setEndTimeError('');
                }}
              />
            </View>
            {endTimeError ? (
              <Text style={styles.errorText}>{endTimeError}</Text>
            ) : null}
          </View>
        </View>

        {/* Duration Display */}
        {duration > 0 && (
          <View style={styles.durationCard}>
            <Ionicons name="timer-outline" size={24} color="#22C55E" />
            <Text style={styles.durationText}>Duration: {duration} hours</Text>
          </View>
        )}

        {/* Price Breakdown */}
        {totalPrice > 0 && (
          <View style={styles.priceCard}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Base Price ({duration}h × Rs {pricePerHour})</Text>
              <Text style={styles.priceValue}>Rs {totalPrice}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.priceRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>Rs {totalPrice}</Text>
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
          activeOpacity={0.8}
        >
          <Text style={styles.continueText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  parkingName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  priceText: {
    fontSize: 14,
    color: '#22C55E',
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    height: 56,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 6,
    marginLeft: 4,
  },
  timeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  timeInput: {
    flex: 1,
  },
  durationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  durationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#22C55E',
    marginLeft: 12,
  },
  priceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#22C55E',
  },
  footer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  continueButton: {
    backgroundColor: '#22C55E',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  continueText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
});