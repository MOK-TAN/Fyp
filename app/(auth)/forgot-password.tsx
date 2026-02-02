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

const ForgotPassword = () => {
  const [phoneEmail, setPhoneEmail] = useState('');
  const [phoneEmailError, setPhoneEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Validate email or phone
  const validateInput = (text: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{10}$/;
    return emailRegex.test(text) || phoneRegex.test(text);
  };

  // Simulate API call delay
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Handle send code
  const handleSendCode = async () => {
    // Reset errors
    setPhoneEmailError('');

    // Validation
    if (!phoneEmail.trim()) {
      setPhoneEmailError('Phone or email is required');
      return;
    }

    if (!validateInput(phoneEmail)) {
      setPhoneEmailError('Please enter a valid phone number or email');
      return;
    }

    setIsLoading(true);

    try {
      // Simulate network delay
      await delay(1000);

      // Success - Navigate to OTP verification
      Alert.alert(
        'Code Sent! 📧',
        `A password reset code has been sent to ${phoneEmail}`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate to OTP verification screen
              router.push({
                pathname: '/(auth)/verify-otp',
                params: { phoneEmail }
              });
            },
          },
        ]
      );
    } catch (error) {
      console.error('Send code error:', error);
      Alert.alert('Error', 'Failed to send code. Please try again.');
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
            <Text style={styles.forgotText}>Forgot </Text>
            <Text style={styles.passwordText}>password</Text>
          </Text>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>Reset Password</Text>
          <Text style={styles.instructionsText}>
            Enter your phone number or email to receive password reset instructions
          </Text>
        </View>

        {/* Phone/Email Input */}
        <View style={styles.inputContainer}>
          <View style={[
            styles.inputWrapper,
            phoneEmailError && styles.inputError
          ]}>
            <Ionicons
              name="mail-outline"
              size={20}
              color={phoneEmailError ? '#EF4444' : '#9CA3AF'}
              style={styles.icon}
            />
            <TextInput
              style={styles.input}
              placeholder="Phone/Email"
              placeholderTextColor="#9CA3AF"
              value={phoneEmail}
              onChangeText={(text) => {
                setPhoneEmail(text);
                if (phoneEmailError) setPhoneEmailError('');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
              returnKeyType="done"
              onSubmitEditing={handleSendCode}
            />
          </View>
          {phoneEmailError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorDot}>•</Text>
              <Text style={styles.errorText}>{phoneEmailError}</Text>
            </View>
          ) : null}
        </View>

        {/* Send Code Button */}
        <TouchableOpacity
          style={[
            styles.sendButton,
            isLoading && styles.sendButtonDisabled
          ]}
          onPress={handleSendCode}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.sendButtonText}>SEND CODE</Text>
          )}
        </TouchableOpacity>

        {/* Back to Login */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          disabled={isLoading}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={20} color="#22C55E" />
          <Text style={styles.backText}>Back to Login</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    marginBottom: 32,
  },
  headerText: {
    fontSize: 32,
    fontWeight: '600',
    lineHeight: 40,
  },
  forgotText: {
    color: '#22C55E',
  },
  passwordText: {
    color: '#1F2937',
  },
  instructionsContainer: {
    marginBottom: 32,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 32,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: '#FFFFFF',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  icon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '400',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
    marginLeft: 16,
  },
  errorDot: {
    color: '#EF4444',
    fontSize: 20,
    lineHeight: 20,
    marginRight: 4,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
    fontWeight: '400',
  },
  sendButton: {
    backgroundColor: '#22C55E',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#22C55E',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  backButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  backText: {
    color: '#22C55E',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default ForgotPassword;