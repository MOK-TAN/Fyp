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

const SignUp = () => {
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<'user' | 'parking-owner' | 'land-owner'>('user');
  
  const [phoneError, setPhoneError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Simulate API delay
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Validation
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phone);
  };

  const validateForm = (): boolean => {
    let isValid = true;

    // Reset errors
    setPhoneError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');

    // Validate phone
    if (!phone.trim()) {
      setPhoneError('Phone number is required');
      isValid = false;
    } else if (!validatePhone(phone)) {
      setPhoneError('Please enter a valid 10-digit phone number');
      isValid = false;
    }

    // Validate email
    if (!email.trim()) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    }

    // Validate password
    if (!password.trim()) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    }

    // Validate confirm password
    if (!confirmPassword.trim()) {
      setConfirmPasswordError('Please confirm your password');
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      isValid = false;
    }

    return isValid;
  };

  // Handle sign up
  const handleSignUp = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // Simulate network delay
      await delay(1000);

      // Success
      Alert.alert(
        'Success! 🎉',
        'Your account has been created successfully. Please login.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(auth)/login'),
          },
        ]
      );
    } catch (error) {
      console.error('Sign up error:', error);
      Alert.alert('Error', 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle login navigation
  const handleLoginNavigation = () => {
    router.push('/(auth)/login');
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
            <Text style={styles.createText}>Create </Text>
            <Text style={styles.accountText}>your account</Text>
          </Text>
        </View>

        {/* Phone Input */}
        <View style={styles.inputContainer}>
          <View style={[
            styles.inputWrapper,
            phoneError && styles.inputError
          ]}>
            <Ionicons
              name="call-outline"
              size={20}
              color={phoneError ? '#EF4444' : '#9CA3AF'}
              style={styles.icon}
            />
            <TextInput
              style={styles.input}
              placeholder="Phone/Email"
              placeholderTextColor="#9CA3AF"
              value={phone}
              onChangeText={(text) => {
                setPhone(text);
                if (phoneError) setPhoneError('');
              }}
              keyboardType="phone-pad"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
              maxLength={10}
              returnKeyType="next"
            />
          </View>
          {phoneError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorDot}>•</Text>
              <Text style={styles.errorText}>{phoneError}</Text>
            </View>
          ) : null}
        </View>

        {/* Email Input */}
        <View style={styles.inputContainer}>
          <View style={[
            styles.inputWrapper,
            emailError && styles.inputError
          ]}>
            <Ionicons
              name="mail-outline"
              size={20}
              color={emailError ? '#EF4444' : '#9CA3AF'}
              style={styles.icon}
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (emailError) setEmailError('');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
              returnKeyType="next"
            />
          </View>
          {emailError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorDot}>•</Text>
              <Text style={styles.errorText}>{emailError}</Text>
            </View>
          ) : null}
        </View>

        {/* Password Input */}
        <View style={styles.inputContainer}>
          <View style={[
            styles.inputWrapper,
            passwordError && styles.inputError
          ]}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color={passwordError ? '#EF4444' : '#9CA3AF'}
              style={styles.icon}
            />
            <TextInput
              style={styles.input}
              placeholder="password"
              placeholderTextColor="#9CA3AF"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (passwordError) setPasswordError('');
              }}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
              returnKeyType="next"
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
              disabled={isLoading}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                size={20}
                color="#9CA3AF"
              />
            </TouchableOpacity>
          </View>
          {passwordError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorDot}>•</Text>
              <Text style={styles.errorText}>{passwordError}</Text>
            </View>
          ) : null}
        </View>

        {/* Confirm Password Input */}
        <View style={styles.inputContainer}>
          <View style={[
            styles.inputWrapper,
            confirmPasswordError && styles.inputError
          ]}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color={confirmPasswordError ? '#EF4444' : '#9CA3AF'}
              style={styles.icon}
            />
            <TextInput
              style={styles.input}
              placeholder="confirm password"
              placeholderTextColor="#9CA3AF"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (confirmPasswordError) setConfirmPasswordError('');
              }}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
              returnKeyType="done"
              onSubmitEditing={handleSignUp}
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              style={styles.eyeIcon}
              disabled={isLoading}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                size={20}
                color="#9CA3AF"
              />
            </TouchableOpacity>
          </View>
          {confirmPasswordError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorDot}>•</Text>
              <Text style={styles.errorText}>{confirmPasswordError}</Text>
            </View>
          ) : null}
        </View>

        {/* Role Selection */}
        <View style={styles.roleContainer}>
          <Text style={styles.roleLabel}>I am a:</Text>
          <View style={styles.roleButtons}>
            <TouchableOpacity
              style={[
                styles.roleButton,
                selectedRole === 'user' && styles.roleButtonActive
              ]}
              onPress={() => setSelectedRole('user')}
              disabled={isLoading}
              activeOpacity={0.7}
            >
              <View style={[
                styles.roleRadio,
                selectedRole === 'user' && styles.roleRadioActive
              ]}>
                {selectedRole === 'user' && (
                  <View style={styles.roleRadioInner} />
                )}
              </View>
              <Text style={[
                styles.roleButtonText,
                selectedRole === 'user' && styles.roleButtonTextActive
              ]}>
                User
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.roleButton,
                selectedRole === 'parking-owner' && styles.roleButtonActive
              ]}
              onPress={() => setSelectedRole('parking-owner')}
              disabled={isLoading}
              activeOpacity={0.7}
            >
              <View style={[
                styles.roleRadio,
                selectedRole === 'parking-owner' && styles.roleRadioActive
              ]}>
                {selectedRole === 'parking-owner' && (
                  <View style={styles.roleRadioInner} />
                )}
              </View>
              <Text style={[
                styles.roleButtonText,
                selectedRole === 'parking-owner' && styles.roleButtonTextActive
              ]}>
                Parking owner
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.roleButton,
                selectedRole === 'land-owner' && styles.roleButtonActive
              ]}
              onPress={() => setSelectedRole('land-owner')}
              disabled={isLoading}
              activeOpacity={0.7}
            >
              <View style={[
                styles.roleRadio,
                selectedRole === 'land-owner' && styles.roleRadioActive
              ]}>
                {selectedRole === 'land-owner' && (
                  <View style={styles.roleRadioInner} />
                )}
              </View>
              <Text style={[
                styles.roleButtonText,
                selectedRole === 'land-owner' && styles.roleButtonTextActive
              ]}>
                Land owner
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign Up Button */}
        <TouchableOpacity
          style={[
            styles.signUpButton,
            isLoading && styles.signUpButtonDisabled
          ]}
          onPress={handleSignUp}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.signUpButtonText}>SIGN UP</Text>
          )}
        </TouchableOpacity>

        {/* Login Link */}
        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Already have account? </Text>
          <TouchableOpacity
            onPress={handleLoginNavigation}
            disabled={isLoading}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.loginLink}>Log In</Text>
          </TouchableOpacity>
        </View>
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
  createText: {
    color: '#22C55E',
  },
  accountText: {
    color: '#1F2937',
  },
  inputContainer: {
    marginBottom: 16,
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
  eyeIcon: {
    padding: 4,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 6,
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
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
    fontWeight: '400',
  },
  roleContainer: {
    marginTop: 8,
    marginBottom: 32,
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 12,
  },
  roleButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  roleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  roleButtonActive: {
    borderColor: '#22C55E',
    backgroundColor: '#F0FDF4',
  },
  roleRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleRadioActive: {
    borderColor: '#22C55E',
  },
  roleRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22C55E',
  },
  roleButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  roleButtonTextActive: {
    color: '#22C55E',
  },
  signUpButton: {
    backgroundColor: '#22C55E',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#22C55E',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  signUpButtonDisabled: {
    opacity: 0.6,
  },
  signUpButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  loginText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '400',
  },
  loginLink: {
    color: '#22C55E',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default SignUp;