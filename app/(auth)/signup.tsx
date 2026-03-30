import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../../lib/supabase';

const { width } = Dimensions.get('window');

type UserRole = 'user' | 'parking_owner' | 'land_owner';

interface RoleOption {
  key: UserRole;
  label: string;
}

const ROLES: RoleOption[] = [
  { key: 'user', label: 'User' },
  { key: 'parking_owner', label: 'Parking owner' },
  { key: 'land_owner', label: 'Land owner' },
];

const SignUp = () => {
  // ─── Form State ───
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('user');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // ─── Error State ───
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');

  // ─── Validation Helpers ───
  const validateEmail = (text: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(text);
  };

  const validatePassword = (text: string): string | null => {
    if (text.length < 6) return 'Password must be at least 6 characters';
    if (!/[A-Z]/.test(text)) return 'Must include an uppercase letter';
    if (!/[0-9]/.test(text)) return 'Must include a number';
    return null;
  };

  // ─── Real-time Field Validation ───
  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (emailError) setEmailError('');
    if (generalError) setGeneralError('');
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (passwordError) setPasswordError('');
    if (generalError) setGeneralError('');
  };

  const handleConfirmPasswordChange = (text: string) => {
    setConfirmPassword(text);
    if (confirmPasswordError) setConfirmPasswordError('');
    if (generalError) setGeneralError('');
  };

  // ─── On-blur Validation ───
  const validateEmailOnBlur = () => {
    if (email.trim() === '') {
      setEmailError('Email is required');
    } else if (!validateEmail(email.trim())) {
      setEmailError('Enter a valid email address');
    }
  };

  const validatePasswordOnBlur = () => {
    if (password === '') {
      setPasswordError('Password is required');
    } else {
      const error = validatePassword(password);
      if (error) setPasswordError(error);
    }
  };

  const validateConfirmPasswordOnBlur = () => {
    if (confirmPassword === '') {
      setConfirmPasswordError('Please confirm your password');
    } else if (confirmPassword !== password) {
      setConfirmPasswordError('Passwords do not match');
    }
  };

  // ─── Full Form Validation ───
  const validateForm = (): boolean => {
    let isValid = true;

    if (email.trim() === '') {
      setEmailError('Email is required');
      isValid = false;
    } else if (!validateEmail(email.trim())) {
      setEmailError('Enter a valid email address');
      isValid = false;
    }

    if (password === '') {
      setPasswordError('Password is required');
      isValid = false;
    } else {
      const pwError = validatePassword(password);
      if (pwError) {
        setPasswordError(pwError);
        isValid = false;
      }
    }

    if (confirmPassword === '') {
      setConfirmPasswordError('Please confirm your password');
      isValid = false;
    } else if (confirmPassword !== password) {
      setConfirmPasswordError('Passwords do not match');
      isValid = false;
    }

    return isValid;
  };

  // ─── Sign Up Handler (LIVE SUPABASE) ───
  const handleSignUp = async () => {
    setGeneralError('');

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // 1. Create auth user in Supabase
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: password,
        options: {
          data: {
            role: selectedRole,
          },
        },
      });

      if (error) {
        if (error.message.includes('already registered') || error.message.includes('already been registered')) {
          setEmailError('This email is already registered');
        } else if (error.message.includes('rate limit') || error.message.includes('too many requests')) {
          setGeneralError('Too many attempts. Please try again later.');
        } else if (error.message.includes('valid email')) {
          setEmailError('Please enter a valid email address');
        } else if (error.message.includes('password')) {
          setPasswordError(error.message);
        } else {
          setGeneralError(error.message);
        }
        return;
      }

      if (data.user) {
        // 2. Insert into profiles table
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            full_name: '',
            phone: '',
            email: email.trim().toLowerCase(),
            role: selectedRole,
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
          // Ignore duplicate errors (profile may already exist via DB trigger)
          if (!profileError.message.includes('duplicate') && !profileError.message.includes('already exists')) {
            setGeneralError('Account created but profile setup failed. Please contact support.');
            return;
          }
        }

        // 3. Check if email confirmation is required
        if (data.session) {
          // Auto-confirmed (email confirmation disabled in Supabase dashboard)
          Alert.alert(
            'Account Created!',
            'Your account is ready. You can now log in.',
            [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
          );
        } else {
          // Email confirmation required
          Alert.alert(
            'Account Created!',
            'Please check your email to verify your account before logging in.',
            [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
          );
        }
      }
    } catch (err: any) {
      setGeneralError('Something went wrong. Please try again.');
      console.error('Signup error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // ─── UI ───
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
        {/* Hero Image */}
        <Image
          source={require('../../assets/images/park.png')}
          style={styles.heroImage}
          resizeMode="cover"
        />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerText}>
            <Text style={styles.greenText}>Create</Text>
            <Text style={styles.darkText}> your account</Text>
          </Text>
        </View>

        {/* General Error */}
        {generalError ? (
          <View style={styles.generalErrorBox}>
            <Ionicons name="alert-circle" size={18} color="#DC2626" />
            <Text style={styles.generalErrorText}>{generalError}</Text>
          </View>
        ) : null}

        {/* Email Input */}
        <View style={styles.fieldContainer}>
          <View style={[styles.inputWrapper, emailError && styles.inputError]}>
            <Ionicons name="mail-outline" size={20} color="#999" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#999"
              value={email}
              onChangeText={handleEmailChange}
              onBlur={validateEmailOnBlur}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
            {email.length > 0 && !emailError && validateEmail(email) && (
              <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
            )}
          </View>
          {emailError ? (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle" size={14} color="#DC2626" />
              <Text style={styles.errorText}>{emailError}</Text>
            </View>
          ) : null}
        </View>

        {/* Password Input */}
        <View style={styles.fieldContainer}>
          <View style={[styles.inputWrapper, passwordError && styles.inputError]}>
            <Ionicons name="lock-closed-outline" size={20} color="#999" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#999"
              value={password}
              onChangeText={handlePasswordChange}
              onBlur={validatePasswordOnBlur}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              disabled={isLoading}
            >
              <Ionicons
                name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                size={20}
                color="#999"
              />
            </TouchableOpacity>
          </View>
          {passwordError ? (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle" size={14} color="#DC2626" />
              <Text style={styles.errorText}>{passwordError}</Text>
            </View>
          ) : null}
        </View>

        {/* Confirm Password Input */}
        <View style={styles.fieldContainer}>
          <View style={[styles.inputWrapper, confirmPasswordError && styles.inputError]}>
            <Ionicons name="lock-closed-outline" size={20} color="#999" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Confirm password"
              placeholderTextColor="#999"
              value={confirmPassword}
              onChangeText={handleConfirmPasswordChange}
              onBlur={validateConfirmPasswordOnBlur}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              disabled={isLoading}
            >
              <Ionicons
                name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                size={20}
                color="#999"
              />
            </TouchableOpacity>
          </View>
          {confirmPasswordError ? (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle" size={14} color="#DC2626" />
              <Text style={styles.errorText}>{confirmPasswordError}</Text>
            </View>
          ) : null}
        </View>

        {/* Role Selection */}
        <View style={styles.roleContainer}>
          {ROLES.map((role) => (
            <TouchableOpacity
              key={role.key}
              style={styles.roleOption}
              onPress={() => setSelectedRole(role.key)}
              activeOpacity={0.7}
              disabled={isLoading}
            >
              <View
                style={[
                  styles.radioOuter,
                  selectedRole === role.key && styles.radioOuterSelected,
                ]}
              >
                {selectedRole === role.key && <View style={styles.radioInner} />}
              </View>
              <Text
                style={[
                  styles.roleLabel,
                  selectedRole === role.key && styles.roleLabelSelected,
                ]}
              >
                {role.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Sign Up Button */}
        <TouchableOpacity
          style={[styles.signUpButton, isLoading && styles.signUpButtonDisabled]}
          onPress={handleSignUp}
          activeOpacity={0.8}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.signUpButtonText}>SIGN UP</Text>
          )}
        </TouchableOpacity>

        {/* Login Link */}
        <View style={styles.loginRow}>
          <Text style={styles.loginText}>Already have account? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')} disabled={isLoading}>
            <Text style={styles.loginLink}>Log In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default SignUp;

// ─── Styles ───
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  heroImage: {
    width: width,
    height: 200,
  },
  header: {
    paddingHorizontal: 24,
    marginTop: 24,
    marginBottom: 24,
  },
  headerText: {
    fontSize: 28,
    fontWeight: '700',
  },
  greenText: {
    color: '#22C55E',
  },
  darkText: {
    color: '#1a1a1a',
  },
  generalErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginHorizontal: 24,
    marginBottom: 16,
    gap: 8,
  },
  generalErrorText: {
    color: '#DC2626',
    fontSize: 13,
    flex: 1,
  },
  fieldContainer: {
    marginHorizontal: 24,
    marginBottom: 14,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
    backgroundColor: '#FAFAFA',
  },
  inputError: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1a1a1a',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingLeft: 4,
    gap: 5,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: 4,
    marginBottom: 24,
    gap: 20,
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: '#22C55E',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22C55E',
  },
  roleLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  roleLabelSelected: {
    color: '#1a1a1a',
    fontWeight: '500',
  },
  signUpButton: {
    backgroundColor: '#22C55E',
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 24,
    marginBottom: 20,
  },
  signUpButtonDisabled: {
    opacity: 0.7,
  },
  signUpButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    color: '#6B7280',
    fontSize: 14,
  },
  loginLink: {
    color: '#1a1a1a',
    fontSize: 14,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});