import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { styles } from './select-datetime.styles';

export default function SelectDateTime() {
  const params = useLocalSearchParams();
  const parkingId = params.parkingId as string;
  const parkingName = params.parkingName as string || 'Parking Spot';
  const pricePerHour = params.pricePerHour as string || '50';
  const slotId = params.slotId as string || 'A1';

  const [date, setDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  // Format date as DD/MM/YYYY
  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Format time as HH:MM
  const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Calculate duration in hours
  const calculateDuration = () => {
    const diff = endTime.getTime() - startTime.getTime();
    const hours = diff / (1000 * 60 * 60);
    return Math.max(0, Math.round(hours * 10) / 10);
  };

  // Calculate price
  const calculatePrice = () => {
    const duration = calculateDuration();
    const basePrice = parseFloat(pricePerHour) || 50;
    return Math.round(duration * basePrice);
  };

  const duration = calculateDuration();
  const totalPrice = calculatePrice();

  // Date picker handlers
  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const onStartTimeChange = (event: any, selectedTime?: Date) => {
    setShowStartTimePicker(false);
    if (selectedTime) {
      setStartTime(selectedTime);
      
      // Auto-set end time to 2 hours after start time
      const newEndTime = new Date(selectedTime);
      newEndTime.setHours(newEndTime.getHours() + 2);
      setEndTime(newEndTime);
    }
  };

  const onEndTimeChange = (event: any, selectedTime?: Date) => {
    setShowEndTimePicker(false);
    if (selectedTime) {
      setEndTime(selectedTime);
    }
  };

  // Validate and continue
  const handleContinue = () => {
    if (duration <= 0) {
      Alert.alert('Invalid Time', 'End time must be after start time');
      return;
    }

    router.push({
      pathname: '/(user)/bookings/select-vehicle',
      params: {
        parkingId,
        parkingName,
        pricePerHour,
        slotId,
        date: formatDate(date),
        startTime: formatTime(startTime),
        endTime: formatTime(endTime),
        duration: duration.toString(),
        totalPrice: totalPrice.toString(),
      },
    });
  };

  return (
    <View style={styles.container}>
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
      >
        {/* Selected Slot Display */}
        <View style={styles.slotCard}>
          <View style={styles.slotIconContainer}>
            <Ionicons name="checkmark-circle" size={24} color="#22C55E" />
          </View>
          <View style={styles.slotInfo}>
            <Text style={styles.slotLabel}>Selected Slot</Text>
            <Text style={styles.slotValue}>{slotId}</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.changeButton}
          >
            <Text style={styles.changeText}>Change</Text>
          </TouchableOpacity>
        </View>

        {/* Parking Info */}
        <View style={styles.infoCard}>
          <Text style={styles.parkingName}>{parkingName}</Text>
          <Text style={styles.priceText}>Rs {pricePerHour}/hour</Text>
        </View>

        {/* Date Selection */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Select Date</Text>
          <TouchableOpacity
            style={styles.inputWrapper}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color="#22C55E" style={styles.inputIcon} />
            <Text style={styles.inputText}>{formatDate(date)}</Text>
            <Ionicons name="chevron-down" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        {/* Time Selection */}
        <View style={styles.timeRow}>
          {/* Start Time */}
          <View style={styles.timeInput}>
            <Text style={styles.label}>Start Time</Text>
            <TouchableOpacity
              style={styles.inputWrapper}
              onPress={() => setShowStartTimePicker(true)}
            >
              <Ionicons name="time-outline" size={20} color="#22C55E" style={styles.inputIcon} />
              <Text style={styles.inputText}>{formatTime(startTime)}</Text>
              <Ionicons name="chevron-down" size={20} color="#999" />
            </TouchableOpacity>
          </View>

          {/* End Time */}
          <View style={styles.timeInput}>
            <Text style={styles.label}>End Time</Text>
            <TouchableOpacity
              style={styles.inputWrapper}
              onPress={() => setShowEndTimePicker(true)}
            >
              <Ionicons name="time-outline" size={20} color="#22C55E" style={styles.inputIcon} />
              <Text style={styles.inputText}>{formatTime(endTime)}</Text>
              <Ionicons name="chevron-down" size={20} color="#999" />
            </TouchableOpacity>
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
            <View style={styles.priceRowTotal}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>Rs {totalPrice}</Text>
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Date/Time Pickers */}
      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateChange}
          minimumDate={new Date()}
        />
      )}

      {showStartTimePicker && (
        <DateTimePicker
          value={startTime}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onStartTimeChange}
        />
      )}

      {showEndTimePicker && (
        <DateTimePicker
          value={endTime}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onEndTimeChange}
          minimumDate={startTime}
        />
      )}

      {/* Continue Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            duration <= 0 && styles.continueButtonDisabled
          ]}
          onPress={handleContinue}
          disabled={duration <= 0}
          activeOpacity={0.8}
        >
          <Text style={styles.continueText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}