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
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Validate email/phone
  const validateEmail = (text: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?[\d\s\-()]+$/;
    return emailRegex.test(text) || phoneRegex.test(text);
  };

  // Simulate API call delay
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Handle send code
  const handleSendCode = async () => {
    // Reset errors
    setEmailError('');

    // Validation
    if (!email.trim()) {
      setEmailError('Phone or email is required');
      return;
    }

    if (!validateEmail(email)) {
      setEmailError('Please enter a valid phone or email');
      return;
    }

    setIsLoading(true);

    try {
      // Simulate network delay
      await delay(1000);

      // Success - Navigate to OTP verification
      Alert.alert(
        'Code Sent! 📧',
        `Password reset code has been sent to ${email}`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate to OTP verification screen
              router.push('/(auth)/verify-otp');
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
            <Text style={styles.forgotText}>Forgot</Text>
            <Text style={styles.passwordText}> password</Text>
          </Text>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>Reset Password</Text>
          <Text style={styles.instructionsText}>
            Enter your email/Number to receive password reset instructions
          </Text>
        </View>

        {/* Phone/Email Input */}
        <View style={styles.inputContainer}>
          <View style={[styles.inputWrapper, emailError && styles.inputError]}>
            <Ionicons
              name="phone-portrait-outline"
              size={20}
              color="#999"
              style={styles.icon}
            />
            <TextInput
              style={styles.input}
              placeholder="Phone/Email"
              placeholderTextColor="#999"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (emailError) setEmailError('');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>
          {emailError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorDot}>•</Text>
              <Text style={styles.errorText}>{emailError}</Text>
            </View>
          ) : null}
        </View>

        {/* Send Code Button */}
        <TouchableOpacity
          style={[styles.sendButton, isLoading && styles.sendButtonDisabled]}
          onPress={handleSendCode}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.sendButtonText}>SEND CODE</Text>
          )}
        </TouchableOpacity>

        {/* Back to Login */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          disabled={isLoading}
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
  forgotText: {
    color: '#22C55E',
  },
  passwordText: {
    color: '#333',
  },
  instructionsContainer: {
    marginBottom: 30,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: '#999',
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 30,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 56,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
    marginLeft: 15,
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
  },
  sendButton: {
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
  sendButtonDisabled: {
    opacity: 0.7,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
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
});

export default ForgotPassword;