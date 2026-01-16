import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
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

const VerifyOTP = () => {
  const [otp, setOtp] = useState(['', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Refs for input fields
  const inputRefs = [
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
  ];

  // Valid OTP for testing
  const VALID_OTP = '1234';

  // Simulate API call delay
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Handle OTP input change
  const handleOtpChange = (value: string, index: number) => {
    // Only allow numbers
    if (value && !/^\d+$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setOtpError(''); // Clear error when user types

    // Auto-focus next input
    if (value && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  // Handle backspace
  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  // Handle verify OTP
  const handleVerifyOTP = async () => {
    // Reset error
    setOtpError('');

    // Check if all fields are filled
    const otpValue = otp.join('');
    
    if (otpValue.length < 4) {
      setOtpError('Your OTP is incorrect');
      return;
    }

    // Validate OTP
    if (otpValue !== VALID_OTP) {
      setOtpError('Your OTP is incorrect');
      return;
    }

    setIsLoading(true);

    try {
      // Simulate network delay
      await delay(800);

      // OTP verified successfully
      Alert.alert(
        'Success',
        'OTP verified successfully! 🎉',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate to reset password screen or login
              router.replace('/(auth)/login');
            },
          },
        ]
      );
    } catch (error) {
      console.error('OTP verification error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle resend OTP
  const handleResendOTP = async () => {
    setIsLoading(true);
    try {
      await delay(1000);
      Alert.alert('Code Sent', 'A new OTP has been sent to your email/phone');
      // Clear existing OTP
      setOtp(['', '', '', '']);
      setOtpError('');
      inputRefs[0].current?.focus();
    } catch (error) {
      Alert.alert('Error', 'Failed to resend code');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerText}>
            <Text style={styles.otpText}>OTP</Text>
            <Text style={styles.verificationText}> verification</Text>
          </Text>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsText}>Enter the OTP to verify</Text>
        </View>

        {/* OTP Input Boxes */}
        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={inputRefs[index]}
              style={[
                styles.otpInput,
                otpError && styles.otpInputError,
                digit && styles.otpInputFilled,
              ]}
              value={digit}
              onChangeText={(value) => handleOtpChange(value, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              editable={!isLoading}
            />
          ))}
        </View>

        {/* Error Message */}
        {otpError ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{otpError}</Text>
          </View>
        ) : null}

        {/* Verify Button */}
        <TouchableOpacity
          style={[styles.verifyButton, isLoading && styles.verifyButtonDisabled]}
          onPress={handleVerifyOTP}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.verifyButtonText}>VERIFY CODE</Text>
          )}
        </TouchableOpacity>

        {/* Resend Code */}
        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>Didn't receive code? </Text>
          <TouchableOpacity onPress={handleResendOTP} disabled={isLoading}>
            <Text style={styles.resendLink}>Resend</Text>
          </TouchableOpacity>
        </View>

        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          disabled={isLoading}
        >
          <Ionicons name="arrow-back" size={20} color="#22C55E" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        {/* Test Info - Remove in production */}
        <View style={styles.testInfoContainer}>
          <Text style={styles.testInfoText}>Test OTP: 1234</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  header: {
    marginBottom: 40,
  },
  headerText: {
    fontSize: 32,
    fontWeight: '600',
  },
  otpText: {
    color: '#22C55E',
  },
  verificationText: {
    color: '#333',
  },
  instructionsContainer: {
    marginBottom: 30,
  },
  instructionsText: {
    fontSize: 14,
    color: '#999',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  otpInput: {
    width: 60,
    height: 60,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    color: '#333',
    backgroundColor: '#fff',
  },
  otpInputError: {
    borderColor: '#EF4444',
  },
  otpInputFilled: {
    borderColor: '#22C55E',
  },
  errorContainer: {
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
  },
  verifyButton: {
    backgroundColor: '#22C55E',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#22C55E',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  verifyButtonDisabled: {
    opacity: 0.7,
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  resendText: {
    color: '#999',
    fontSize: 14,
  },
  resendLink: {
    color: '#22C55E',
    fontSize: 14,
    fontWeight: '600',
  },
  backButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  backText: {
    color: '#22C55E',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  testInfoContainer: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  testInfoText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
    textAlign: 'center',
  },
});

export default VerifyOTP;